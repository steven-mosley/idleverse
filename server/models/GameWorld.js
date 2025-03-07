// Game world model for server-side game state management

class GameWorld {
  constructor() {
    this.players = {};
    this.resources = [];
    this.time = 0; // in seconds
    this.resourceIdCounter = 0;
    this.initialized = false;
    this.lastUpdateTime = Date.now();
    
    // Constants for game balance
    this.gatheringSpeed = 2.0;    // Higher = faster gathering
    this.movementSpeed = 8.0;     // Higher = faster movement
  }
  
  initialize() {
    // Generate initial resources
    this.generateResources(20);
    this.initialized = true;
    
    // Set up resource regeneration
    setInterval(() => this.regenerateResources(), 30000); // Every 30 seconds
  }
  
  update(deltaTime) {
    // Update world time
    this.time += deltaTime;
    
    // Record real time for accurate delta calculations
    const now = Date.now();
    const realDeltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
    
    // Update players
    for (const id in this.players) {
      const player = this.players[id];
      
      // Handle player actions based on state
      if (player.state === 'moving' && player.targetResource !== null) {
        const resource = this.resources.find(r => r.id === player.targetResource);
        
        if (resource && !resource.depleted) {
          // Calculate distance to target
          const dx = resource.position.x - player.position.x;
          const dy = resource.position.y - player.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 0.5) {
            // Reached target
            player.state = 'gathering';
            player.actionProgress = 0;
          } else {
            // Move towards target - faster movement
            const moveSpeed = (player.moveSpeed || this.movementSpeed);
            const moveAmount = moveSpeed * realDeltaTime;
            const ratio = Math.min(moveAmount / distance, 1);
            
            player.position.x += dx * ratio;
            player.position.y += dy * ratio;
          }
        } else {
          // Target resource is depleted or doesn't exist
          player.targetResource = null;
          player.state = 'idle';
          player.actionProgress = 0;
        }
      } else if (player.state === 'gathering' && player.targetResource !== null) {
        const resource = this.resources.find(r => r.id === player.targetResource);
        
        if (resource && !resource.depleted) {
          // Progress gathering action - faster gathering
          const gatherSpeed = (player.gatherSpeed || this.gatheringSpeed);
          
          // Use real deltaTime for more accurate progress even if server is lagging
          player.actionProgress += gatherSpeed * realDeltaTime;
          
          if (player.actionProgress >= 1) {
            // Gather success - handle resource collection immediately
            const amountGathered = Math.min(1, resource.amount);
            resource.amount -= amountGathered;
            
            // Add to player inventory
            if (!player.inventory[resource.type]) {
              player.inventory[resource.type] = 0;
            }
            player.inventory[resource.type] += amountGathered;
            
            // Check if resource depleted
            if (resource.amount <= 0) {
              resource.depleted = true;
              player.targetResource = null;
              player.state = 'idle';
              player.actionProgress = 0;
              
              // Log resource depletion
              console.log(`Resource ${resource.id} (${resource.type}) depleted by player ${player.name}`);
            }
            
            // Reset progress for next gathering cycle
            player.actionProgress = 0;
          }
        } else {
          // Resource is already depleted or doesn't exist
          player.targetResource = null;
          player.state = 'idle';
          player.actionProgress = 0;
        }
      }
    }
  }
  
  addPlayer(id) {
    this.players[id] = {
      id,
      name: `Player ${id.substring(0, 4)}`,
      position: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 },
      state: 'idle',
      inventory: {},
      targetResource: null,
      actionProgress: 0,
      moveSpeed: this.movementSpeed,
      gatherSpeed: this.gatheringSpeed
    };
    
    return this.players[id];
  }
  
  getPlayer(id) {
    return this.players[id];
  }
  
  getPlayers() {
    return this.players;
  }
  
  updatePlayer(id, update) {
    if (this.players[id]) {
      Object.assign(this.players[id], update);
    }
  }
  
  removePlayer(id) {
    delete this.players[id];
  }
  
  getResources() {
    // Only return non-depleted resources when explicitly filtering for active resources
    return this.resources;
  }
  
  getActiveResources() {
    // Only return non-depleted resources when explicitly filtering for active resources
    return this.resources.filter(r => !r.depleted);
  }
  
  generateResources(count) {
    const resourceTypes = ['wood', 'stone', 'food', 'iron', 'herbs'];
    
    for (let i = 0; i < count; i++) {
      const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const position = {
        x: Math.random() * 60 - 30,
        y: Math.random() * 60 - 30
      };
      const amount = 30 + Math.floor(Math.random() * 50);
      
      this.resources.push({
        id: this.resourceIdCounter++,
        type,
        position,
        amount,
        depleted: false
      });
    }
  }
  
  regenerateResources() {
    // Count active resources
    const activeResourceCount = this.resources.filter(r => !r.depleted).length;
    
    // If we have fewer than 10 active resources, spawn new ones
    if (activeResourceCount < 10) {
      const resourceTypes = ['wood', 'stone', 'food', 'iron', 'herbs'];
      const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      
      const newResource = {
        id: this.resourceIdCounter++,
        type,
        position: {
          x: Math.random() * 60 - 30,
          y: Math.random() * 60 - 30
        },
        amount: 30 + Math.floor(Math.random() * 50),
        depleted: false
      };
      
      this.resources.push(newResource);
      
      return newResource;
    }
    
    return null;
  }
  
  gatherResource(playerId, resourceId, amount) {
    const player = this.players[playerId];
    const resource = this.resources.find(r => r.id === resourceId);
    
    if (player && resource && !resource.depleted) {
      // Update resource amount
      resource.amount -= amount;
      
      // Add to player inventory
      if (!player.inventory[resource.type]) {
        player.inventory[resource.type] = 0;
      }
      player.inventory[resource.type] += amount;
      
      // Check if resource is depleted
      if (resource.amount <= 0) {
        resource.depleted = true;
        
        // If this player was targeting this resource, clear their target
        if (player.targetResource === resourceId) {
          player.targetResource = null;
          player.state = 'idle';
          player.actionProgress = 0;
        }
      }
      
      return resource;
    }
    
    return null;
  }
  
  getFormattedTime() {
    const totalMinutes = Math.floor(this.time / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Get all game world state for the dashboard
  getDashboardState() {
    return {
      time: this.time,
      formattedTime: this.getFormattedTime(),
      playerCount: Object.keys(this.players).length,
      resourceCount: this.resources.length,
      activeResourceCount: this.resources.filter(r => !r.depleted).length,
      players: this.players,
      resources: this.resources
    };
  }
}

module.exports = GameWorld;
