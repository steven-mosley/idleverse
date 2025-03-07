// Enhanced Game World model with database persistence
const GameWorld = require('./GameWorld');
const { playerService, resourceService, worldService } = require('../services/dbService');

class EnhancedGameWorld extends GameWorld {
  constructor() {
    super();
    
    // Player mapping from socketId to userId
    this.playerUserMap = {};
    
    // AI characters tracking
    this.aiPlayers = new Set();
    
    // Add auto-save interval
    this.autoSaveInterval = null;
  }
  
  async initializeWithDb() {
    try {
      console.log('Initializing game world with database...');
      
      // Load world state from database
      const worldState = await worldService.loadWorldState();
      if (worldState) {
        this.time = worldState.time || 0;
        this.resourceIdCounter = worldState.resourceIdCounter || 0;
        console.log(`Loaded world state: Time=${this.time}, ResourceIdCounter=${this.resourceIdCounter}`);
      }
      
      // Load active resources from database
      const dbResources = await resourceService.getActiveResources();
      
      if (dbResources && dbResources.length > 0) {
        console.log(`Loaded ${dbResources.length} resources from database`);
        
        // Convert database resources to game resources
        this.resources = dbResources.map(dbResource => ({
          id: dbResource.gameResourceId,
          type: dbResource.type,
          position: dbResource.position,
          amount: dbResource.amount,
          depleted: dbResource.depleted
        }));
      } else {
        // Generate initial resources if none exist
        console.log('No resources found in database, generating new ones');
        this.generateResources(20);
        
        // Save generated resources to database
        await Promise.all(this.resources.map(resource => 
          resourceService.saveResource({
            gameResourceId: resource.id,
            type: resource.type,
            position: resource.position,
            amount: resource.amount,
            depleted: resource.depleted
          })
        ));
      }
      
      this.initialized = true;
      
      // Set up resource regeneration and auto-save
      setInterval(() => this.regenerateResources(), 30000); // Every 30 seconds
      this.autoSaveInterval = setInterval(() => this.saveWorldState(), 300000); // Every 5 minutes
      
      console.log('Game world initialized with database.');
      return true;
    } catch (error) {
      console.error('Failed to initialize game world with database:', error);
      
      // Fall back to memory-only initialization if database fails
      console.log('Falling back to memory-only initialization...');
      super.initialize();
      return false;
    }
  }
  
  // Override resource regeneration to save to database
  regenerateResources() {
    const newResource = super.regenerateResources();
    
    if (newResource) {
      // Save new resource to database
      resourceService.saveResource({
        gameResourceId: newResource.id,
        type: newResource.type,
        position: newResource.position,
        amount: newResource.amount,
        depleted: newResource.depleted
      }).catch(error => {
        console.error('Error saving new resource to database:', error);
      });
    }
    
    return newResource;
  }
  
  // Override gather resource to update database
  gatherResource(playerId, resourceId, amount) {
    const result = super.gatherResource(playerId, resourceId, amount);
    
    if (result) {
      // Update resource in database
      resourceService.saveResource({
        gameResourceId: result.id,
        type: result.type,
        position: result.position,
        amount: result.amount,
        depleted: result.depleted
      }).catch(error => {
        console.error('Error saving resource state to database:', error);
      });
      
      // Update player stats if the player has a userId
      const userId = this.playerUserMap[playerId];
      if (userId) {
        const statsUpdate = {
          'stats.resourcesGathered': amount
        };
        
        playerService.updatePlayerStats(userId, statsUpdate).catch(error => {
          console.error('Error updating player stats:', error);
        });
      }
    }
    
    return result;
  }
  
  // Save world state to database
  async saveWorldState() {
    try {
      await worldService.saveWorldState({
        time: this.time,
        resourceIdCounter: this.resourceIdCounter
      });
      console.log('World state saved to database.');
      return true;
    } catch (error) {
      console.error('Error saving world state to database:', error);
      return false;
    }
  }
  
  // Add authenticated player with database loading
  async addAuthenticatedPlayer(socketId, userId) {
    try {
      // Load player from database
      const dbPlayer = await playerService.loadPlayer(userId);
      
      // Create player in memory
      if (dbPlayer) {
        console.log(`Loaded player ${dbPlayer.name} from database for socket ${socketId}`);
        
        // Create player with data from database
        this.players[socketId] = {
          id: socketId,
          userId: userId,
          name: dbPlayer.name,
          position: dbPlayer.position || { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 },
          state: 'idle',
          inventory: dbPlayer.inventory || {},
          targetResource: null,
          actionProgress: 0,
          moveSpeed: this.movementSpeed,
          gatherSpeed: this.gatheringSpeed,
          attributes: dbPlayer.attributes || {},
          preferences: dbPlayer.preferences || { autoGatherEnabled: true }
        };
      } else {
        // Create new player
        console.log(`Creating new player for userId ${userId} with socket ${socketId}`);
        this.players[socketId] = {
          id: socketId,
          userId: userId,
          name: `Player ${socketId.substring(0, 4)}`,
          position: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 },
          state: 'idle',
          inventory: {},
          targetResource: null,
          actionProgress: 0,
          moveSpeed: this.movementSpeed,
          gatherSpeed: this.gatheringSpeed,
          attributes: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
          },
          preferences: { autoGatherEnabled: true }
        };
        
        // Save new player to database
        await playerService.savePlayer(userId, {
          userId,
          name: this.players[socketId].name,
          position: this.players[socketId].position,
          inventory: this.players[socketId].inventory,
          attributes: this.players[socketId].attributes,
          preferences: this.players[socketId].preferences
        });
      }
      
      // Map socketId to userId for later reference
      this.playerUserMap[socketId] = userId;
      
      return this.players[socketId];
    } catch (error) {
      console.error(`Error adding authenticated player (socket: ${socketId}, userId: ${userId}):`, error);
      
      // Fall back to adding non-authenticated player
      return this.addPlayer(socketId);
    }
  }
  
  // Add an AI character to the game world
  addAICharacter(socketId, character) {
    // Add to players collection
    this.players[socketId] = character;
    
    // Track as AI player
    this.aiPlayers.add(socketId);
    
    return this.players[socketId];
  }
  
  // Check if a player is an AI
  isAIPlayer(socketId) {
    return this.aiPlayers.has(socketId);
  }
  
  // Override removePlayer to save data if authenticated
  async removePlayer(socketId) {
    // Get user ID if this was an authenticated player
    const userId = this.playerUserMap[socketId];
    
    if (userId && this.players[socketId]) {
      try {
        // Save player data to database
        await playerService.savePlayer(userId, {
          name: this.players[socketId].name,
          position: this.players[socketId].position,
          inventory: this.players[socketId].inventory,
          attributes: this.players[socketId].attributes,
          preferences: this.players[socketId].preferences
        });
        
        console.log(`Saved player data for ${this.players[socketId].name} (${userId}) on disconnect`);
      } catch (error) {
        console.error(`Error saving player data for ${userId} on disconnect:`, error);
      }
      
      // Remove from player-user mapping
      delete this.playerUserMap[socketId];
    }
    
    // Remove from AI tracking if applicable
    if (this.aiPlayers.has(socketId)) {
      this.aiPlayers.delete(socketId);
    }
    
    // Now remove from in-memory players
    super.removePlayer(socketId);
  }
}

module.exports = EnhancedGameWorld;
