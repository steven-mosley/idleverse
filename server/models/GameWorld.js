// Game world model for server-side game state management

class GameWorld {
  constructor() {
    this.players = {};
    this.resources = [];
    this.time = 0; // in seconds
    this.resourceIdCounter = 0;
    this.initialized = false;
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
    
    // Update players
    for (const id in this.players) {
      const player = this.players[id];
      
      // Handle player actions based on state
      if (player.state === 'moving' && player.targetResource) {
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
            // Move towards target
            const moveSpeed = player.moveSpeed || 5;
            const moveAmount = moveSpeed * deltaTime;
            const ratio = Math.min(moveAmount / distance, 1);
            
            player.position.x += dx * ratio;
            player.position.y += dy * ratio;
          }
        } else {
          // Target resource is gone
          player.targetResource = null;
          player.state = 'idle';
        }
      } else if (player.state === 'gathering' && player.targetResource) {
        const resource = this.resources.find(r => r.id === player.targetResource);
        
        if (resource && !resource.depleted) {
          // Progress gathering action
          const gatherSpeed = player.gatherSpeed || 1;
          player.actionProgress += gatherSpeed * deltaTime;
          
          if (player.actionProgress >= 1) {
            // Gather success - handled by client reports for now
            // This just resets the progress
            player.actionProgress = 0;
          }
        } else {
          // Resource depleted
          player.targetResource = null;
          player.state = 'idle';
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
      moveSpeed: 5,
      gatherSpeed: 1
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
    return this.resources;
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
}

module.exports = GameWorld;
