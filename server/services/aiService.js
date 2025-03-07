const AICharacter = require('../models/db/AICharacter');
const nameGenerator = require('../utils/nameGenerator');

/**
 * AI Character Manager Service
 * Handles spawning, managing, and updating AI characters
 */
class AIService {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.isEnabled = false;
    this.aiCharacters = [];
    this.aiSocketIds = new Set(); // Track AI socket IDs
    this.defaultPopulation = 5;
    this.maxPopulation = 20;
    this.updateInterval = null;
    this.lastUpdateTime = Date.now();
    
    // AI Type distributions (percentage chance of spawning each type)
    this.aiTypeDistribution = {
      gatherer: 60,
      explorer: 20,
      defender: 10,
      trader: 10
    };
    
    // Name prefix/suffix pools for generating AI names
    this.nameOptions = {
      prefixes: ['Brave', 'Swift', 'Wise', 'Noble', 'Ancient', 'Wild', 'Calm', 'Fierce', 'Mighty', 'Gentle'],
      names: ['Wolf', 'Eagle', 'Bear', 'Fox', 'Owl', 'Deer', 'Hawk', 'Tiger', 'Lion', 'Dragon', 
              'Serpent', 'Raven', 'Hunter', 'Seeker', 'Walker', 'Strider', 'Warden', 'Guardian'],
      titles: ['of the Forest', 'of the Mountain', 'of the Valley', 'the Gatherer', 'the Wise',
               'the Brave', 'the Swift', 'the Strong', 'the Cunning', '']
    };
  }
  
  /**
   * Initialize the AI system
   */
  async initialize() {
    try {
      // Load AI characters from database
      const dbAICharacters = await AICharacter.find({ active: true });
      
      if (dbAICharacters.length > 0) {
        console.log(`Found ${dbAICharacters.length} AI characters in database`);
        // Transform database AI characters to game world characters
        for (const dbAI of dbAICharacters) {
          this.addAIToWorld(dbAI);
        }
      } else {
        console.log('No AI characters found in database');
      }
      
      console.log('AI Service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing AI service:', error);
      return false;
    }
  }
  
  /**
   * Enable the AI system
   */
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    console.log('AI System enabled');
    
    // Start AI update loop if not already running
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => this.updateAICharacters(), 1000);
    }
    
    // Spawn initial AI characters if none exist
    this.ensureMinimumPopulation();
  }
  
  /**
   * Disable the AI system
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    console.log('AI System disabled');
    
    // Stop AI update loop
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Remove AI characters from game world (but keep in database)
    this.removeAllAIFromWorld();
  }
  
  /**
   * Update AI character population to ensure minimum count
   */
  async ensureMinimumPopulation() {
    if (!this.isEnabled) return;
    
    try {
      const aiCount = this.aiCharacters.length;
      
      if (aiCount < this.defaultPopulation) {
        const numToSpawn = this.defaultPopulation - aiCount;
        console.log(`Spawning ${numToSpawn} new AI characters`);
        
        for (let i = 0; i < numToSpawn; i++) {
          await this.spawnRandomAI();
        }
      }
    } catch (error) {
      console.error('Error ensuring minimum AI population:', error);
    }
  }
  
  /**
   * Spawn a random AI character
   */
  async spawnRandomAI() {
    try {
      // Determine AI type based on distribution
      const aiType = this.selectRandomAIType();
      
      // Generate a name
      const name = this.generateAIName();
      
      // Create personality traits
      const personality = {
        bravery: Math.floor(Math.random() * 100),
        sociability: Math.floor(Math.random() * 100),
        curiosity: Math.floor(Math.random() * 100),
        industriousness: Math.floor(Math.random() * 100)
      };
      
      // Create resource preferences (ensuring they sum to 100)
      const resourcePrefs = {};
      let remaining = 100;
      const resources = ['wood', 'stone', 'food', 'iron', 'herbs'];
      
      for (let i = 0; i < resources.length - 1; i++) {
        const value = i === resources.length - 2 ? remaining : Math.floor(Math.random() * remaining);
        resourcePrefs[resources[i]] = value;
        remaining -= value;
      }
      resourcePrefs[resources[resources.length - 1]] = remaining;
      
      // Create random spawn position
      const position = {
        x: Math.random() * 60 - 30,
        y: Math.random() * 60 - 30
      };
      
      // Create AI character in database
      const aiCharacter = await AICharacter.create({
        name,
        aiType,
        position,
        personality,
        preferences: {
          resourcePreferences: resourcePrefs,
          explorationRange: 20 + Math.floor(Math.random() * 80),
          areaStickiness: Math.floor(Math.random() * 100)
        },
        // Adjust attributes based on AI type
        attributes: this.generateAttributesForType(aiType)
      });
      
      // Add to game world
      this.addAIToWorld(aiCharacter);
      
      return aiCharacter;
    } catch (error) {
      console.error('Error spawning random AI:', error);
      return null;
    }
  }
  
  /**
   * Add an AI character to the game world
   */
  addAIToWorld(aiCharacter) {
    // Generate a unique socket-like ID for this AI
    const aiSocketId = `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create game world character
    const gameCharacter = {
      id: aiSocketId,
      isAI: true,
      aiId: aiCharacter._id.toString(),
      name: aiCharacter.name,
      position: aiCharacter.position,
      state: aiCharacter.state || 'idle',
      inventory: aiCharacter.inventory || {},
      targetResource: aiCharacter.targetResource,
      actionProgress: aiCharacter.actionProgress || 0,
      attributes: aiCharacter.attributes,
      moveSpeed: 5 + (aiCharacter.attributes.dexterity / 5),
      gatherSpeed: 1 + (aiCharacter.attributes.dexterity / 10),
      aiType: aiCharacter.aiType,
      personality: aiCharacter.personality
    };
    
    // Add to game world
    this.gameWorld.addAICharacter(aiSocketId, gameCharacter);
    
    // Track this AI
    this.aiCharacters.push({
      socketId: aiSocketId,
      dbId: aiCharacter._id.toString(),
      character: gameCharacter
    });
    
    this.aiSocketIds.add(aiSocketId);
    
    console.log(`Added AI "${aiCharacter.name}" (${aiCharacter.aiType}) to game world`);
    return gameCharacter;
  }
  
  /**
   * Remove an AI character from the game world
   */
  removeAIFromWorld(socketId) {
    if (this.aiSocketIds.has(socketId)) {
      this.gameWorld.removePlayer(socketId);
      this.aiSocketIds.delete(socketId);
      
      // Remove from our tracking array
      this.aiCharacters = this.aiCharacters.filter(ai => ai.socketId !== socketId);
      
      console.log(`Removed AI character ${socketId} from game world`);
    }
  }
  
  /**
   * Remove all AI characters from the game world
   */
  removeAllAIFromWorld() {
    // Create a copy of the IDs to avoid modifying during iteration
    const aiIds = [...this.aiSocketIds];
    
    for (const socketId of aiIds) {
      this.removeAIFromWorld(socketId);
    }
    
    console.log(`Removed all AI characters from game world`);
  }
  
  /**
   * Update all AI characters
   */
  async updateAICharacters() {
    if (!this.isEnabled || this.aiCharacters.length === 0) return;
    
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
    
    // Update each AI character's behavior
    for (const ai of this.aiCharacters) {
      try {
        this.updateAIBehavior(ai, deltaTime);
      } catch (error) {
        console.error(`Error updating AI ${ai.character.name}:`, error);
      }
    }
    
    // Periodically save AI state to database (every 30 seconds)
    if (now % 30000 < 1000) {
      this.saveAIStateToDB();
    }
    
    // Ensure minimum population occasionally
    if (now % 60000 < 1000) {
      this.ensureMinimumPopulation();
    }
  }
  
  /**
   * Update an individual AI's behavior
   */
  updateAIBehavior(ai, deltaTime) {
    const character = ai.character;
    
    // Basic state machine for AI behavior
    switch (character.aiType) {
      case 'gatherer': 
        this.updateGathererBehavior(ai, deltaTime);
        break;
      case 'explorer':
        this.updateExplorerBehavior(ai, deltaTime);
        break;
      case 'defender':
        this.updateDefenderBehavior(ai, deltaTime);
        break;
      case 'trader':
        this.updateTraderBehavior(ai, deltaTime);
        break;
      default:
        this.updateGathererBehavior(ai, deltaTime);
    }
  }
  
  /**
   * Update gatherer AI behavior
   */
  updateGathererBehavior(ai, deltaTime) {
    const character = this.gameWorld.getPlayer(ai.socketId);
    if (!character) return;
    
    // If idle, find a resource to gather
    if (character.state === 'idle') {
      // Find resources based on preferences
      const resources = this.gameWorld.getActiveResources();
      if (resources.length > 0) {
        // Apply personality and preferences to resource selection
        const targetResource = this.selectResourceForAI(ai, resources);
        if (targetResource) {
          // Target the resource
          this.gameWorld.updatePlayer(ai.socketId, {
            targetResource: targetResource.id,
            state: 'moving'
          });
        }
      }
    }
  }
  
  /**
   * Update explorer AI behavior
   */
  updateExplorerBehavior(ai, deltaTime) {
    const character = this.gameWorld.getPlayer(ai.socketId);
    if (!character) return;
    
    // Explorers move more randomly and favor unexplored areas
    if (character.state === 'idle') {
      // 70% chance to move randomly, 30% chance to gather
      if (Math.random() < 0.7) {
        // Move to a random position
        const randomPosition = {
          x: Math.random() * 60 - 30,
          y: Math.random() * 60 - 30
        };
        
        // Apply personality to exploration range
        const range = ai.character.personality.curiosity / 100 * 60;
        randomPosition.x = character.position.x + (Math.random() * range * 2 - range);
        randomPosition.y = character.position.y + (Math.random() * range * 2 - range);
        
        // Clamp to world bounds
        randomPosition.x = Math.max(-30, Math.min(30, randomPosition.x));
        randomPosition.y = Math.max(-30, Math.min(30, randomPosition.y));
        
        // Set as target
        this.gameWorld.updatePlayer(ai.socketId, {
          targetPosition: randomPosition,
          state: 'moving'
        });
      } else {
        // Gather like a normal gatherer occasionally
        this.updateGathererBehavior(ai, deltaTime);
      }
    }
  }
  
  /**
   * Update defender AI behavior
   */
  updateDefenderBehavior(ai, deltaTime) {
    // For now, defenders just roam around central areas
    // This would be expanded with combat mechanics
    const character = this.gameWorld.getPlayer(ai.socketId);
    if (!character) return;
    
    if (character.state === 'idle') {
      // Stay closer to center areas where players might be
      const randomPosition = {
        x: (Math.random() * 20 - 10),
        y: (Math.random() * 20 - 10)
      };
      
      this.gameWorld.updatePlayer(ai.socketId, {
        targetPosition: randomPosition,
        state: 'moving'
      });
    }
  }
  
  /**
   * Update trader AI behavior
   */
  updateTraderBehavior(ai, deltaTime) {
    // For now, traders gather resources but also move between areas
    // This would be expanded with trading mechanics
    const character = this.gameWorld.getPlayer(ai.socketId);
    if (!character) return;
    
    if (character.state === 'idle') {
      // 50% chance to gather, 50% chance to move to a new area
      if (Math.random() < 0.5) {
        this.updateGathererBehavior(ai, deltaTime);
      } else {
        // Move to a populated area (simplified for now)
        const randomPosition = {
          x: Math.random() * 40 - 20,
          y: Math.random() * 40 - 20
        };
        
        this.gameWorld.updatePlayer(ai.socketId, {
          targetPosition: randomPosition,
          state: 'moving'
        });
      }
    }
  }
  
  /**
   * Select a resource based on AI preferences and personality
   */
  selectResourceForAI(ai, resources) {
    if (resources.length === 0) return null;
    
    // Get character
    const character = ai.character;
    
    // Get resource preferences
    const preferences = character.personality.preferences?.resourcePreferences || {
      wood: 20,
      stone: 20,
      food: 20,
      iron: 20,
      herbs: 20
    };
    
    // Calculate weighted scores for each resource
    const resourceScores = resources.map(resource => {
      // Distance factor - closer is better
      const dx = resource.position.x - character.position.x;
      const dy = resource.position.y - character.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const distanceScore = Math.max(0, 100 - distance);
      
      // Type preference factor
      const typePreference = preferences[resource.type] || 20;
      
      // Amount factor - more is better
      const amountScore = Math.min(100, resource.amount);
      
      // Final score is weighted combination
      let finalScore = 
        (distanceScore * 0.4) + 
        (typePreference * 0.4) + 
        (amountScore * 0.2);
        
      // Apply personality modifiers
      const industriousness = character.personality?.industriousness || 50;
      if (industriousness > 50) {
        // More industrious AIs value resource amount more
        finalScore += (amountScore * (industriousness - 50) / 100);
      }
      
      const curiosity = character.personality?.curiosity || 50;
      if (curiosity > 50) {
        // More curious AIs are willing to travel farther
        finalScore += (100 - distanceScore) * (curiosity - 50) / 100;
      }
      
      return {
        resource,
        score: finalScore
      };
    });
    
    // Sort by score and pick the best
    resourceScores.sort((a, b) => b.score - a.score);
    
    // Return the best resource, or random from top 3 to add variety
    if (resourceScores.length > 3) {
      // Pick randomly from top 3
      const randomIndex = Math.floor(Math.random() * 3);
      return resourceScores[randomIndex].resource;
    } else if (resourceScores.length > 0) {
      return resourceScores[0].resource;
    }
    
    return null;
  }
  
  /**
   * Save all AI character state to the database
   */
  async saveAIStateToDB() {
    try {
      // Skip if no AI characters
      if (this.aiCharacters.length === 0) return;
      
      let savedCount = 0;
      
      // Save each AI character state
      for (const ai of this.aiCharacters) {
        // Get game world character data
        const character = this.gameWorld.getPlayer(ai.socketId);
        if (!character) continue;
        
        // Update database
        await AICharacter.findByIdAndUpdate(ai.dbId, {
          position: character.position,
          state: character.state,
          inventory: character.inventory,
          targetResource: character.targetResource,
          actionProgress: character.actionProgress,
          lastUpdated: new Date()
        });
        
        savedCount++;
      }
      
      console.log(`Saved ${savedCount} AI characters to database`);
    } catch (error) {
      console.error('Error saving AI state to database:', error);
    }
  }
  
  /**
   * Generate attributes for a specific AI type
   */
  generateAttributesForType(aiType) {
    // Base attributes
    const attributes = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    };
    
    // Adjust based on AI type
    switch (aiType) {
      case 'gatherer':
        attributes.strength += 3;
        attributes.constitution += 2;
        break;
      case 'explorer':
        attributes.dexterity += 3;
        attributes.wisdom += 2;
        break;
      case 'defender':
        attributes.strength += 4;
        attributes.constitution += 3;
        attributes.dexterity += 2;
        break;
      case 'trader':
        attributes.charisma += 4;
        attributes.intelligence += 3;
        break;
    }
    
    // Add some randomness
    Object.keys(attributes).forEach(attr => {
      attributes[attr] += Math.floor(Math.random() * 5) - 2;
      attributes[attr] = Math.max(5, Math.min(20, attributes[attr]));
    });
    
    return attributes;
  }
  
  /**
   * Select a random AI type based on distribution
   */
  selectRandomAIType() {
    const typeChances = [
      { type: 'gatherer', chance: this.aiTypeDistribution.gatherer },
      { type: 'explorer', chance: this.aiTypeDistribution.explorer },
      { type: 'defender', chance: this.aiTypeDistribution.defender },
      { type: 'trader', chance: this.aiTypeDistribution.trader }
    ];
    
    let totalChance = 0;
    typeChances.forEach(t => totalChance += t.chance);
    
    const rand = Math.random() * totalChance;
    let cumulativeChance = 0;
    
    for (const typeInfo of typeChances) {
      cumulativeChance += typeInfo.chance;
      if (rand <= cumulativeChance) {
        return typeInfo.type;
      }
    }
    
    return 'gatherer'; // Default fallback
  }
  
  /**
   * Generate a random name for an AI
   */
  generateAIName() {
    const prefix = this.nameOptions.prefixes[Math.floor(Math.random() * this.nameOptions.prefixes.length)];
    const name = this.nameOptions.names[Math.floor(Math.random() * this.nameOptions.names.length)];
    const title = this.nameOptions.titles[Math.floor(Math.random() * this.nameOptions.titles.length)];
    
    const useTitleFormat = Math.random() > 0.5;
    
    if (useTitleFormat) {
      return name + ' ' + title;
    } else {
      return prefix + ' ' + name;
    }
  }
  
  /**
   * Set the AI system configuration
   */
  setConfig(config) {
    if (config.defaultPopulation !== undefined) {
      this.defaultPopulation = Math.max(0, Math.min(50, config.defaultPopulation));
    }
    
    if (config.maxPopulation !== undefined) {
      this.maxPopulation = Math.max(this.defaultPopulation, Math.min(100, config.maxPopulation));
    }
    
    if (config.aiTypeDistribution) {
      this.aiTypeDistribution = {
        ...this.aiTypeDistribution,
        ...config.aiTypeDistribution
      };
    }
    
    console.log('AI configuration updated:', {
      defaultPopulation: this.defaultPopulation,
      maxPopulation: this.maxPopulation,
      aiTypeDistribution: this.aiTypeDistribution
    });
  }
  
  /**
   * Get current AI status
   */
  getStatus() {
    const aiCounts = {
      total: this.aiCharacters.length,
      gatherer: 0,
      explorer: 0,
      defender: 0,
      trader: 0
    };
    
    // Count by type
    this.aiCharacters.forEach(ai => {
      const type = ai.character.aiType || 'gatherer';
      aiCounts[type] = (aiCounts[type] || 0) + 1;
    });
    
    return {
      enabled: this.isEnabled,
      population: aiCounts,
      config: {
        defaultPopulation: this.defaultPopulation,
        maxPopulation: this.maxPopulation,
        aiTypeDistribution: this.aiTypeDistribution
      }
    };
  }
}

module.exports = AIService;
