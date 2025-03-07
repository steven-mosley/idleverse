const Player = require('../models/db/Player');
const Resource = require('../models/db/Resource');
const WorldState = require('../models/db/WorldState');

// Player operations
const playerService = {
  // Load player data by userId
  async loadPlayer(userId) {
    try {
      const player = await Player.findOne({ userId });
      return player;
    } catch (error) {
      console.error('Error loading player:', error);
      throw error;
    }
  },
  
  // Save player data
  async savePlayer(userId, playerData) {
    try {
      const player = await Player.findOneAndUpdate(
        { userId },
        playerData,
        { upsert: true, new: true }
      );
      return player;
    } catch (error) {
      console.error('Error saving player:', error);
      throw error;
    }
  },
  
  // Update player stats during gameplay
  async updatePlayerStats(userId, statsUpdate) {
    try {
      const player = await Player.findOneAndUpdate(
        { userId },
        { $inc: statsUpdate },
        { new: true }
      );
      return player;
    } catch (error) {
      console.error('Error updating player stats:', error);
      throw error;
    }
  }
};

// Resource operations
const resourceService = {
  // Save a resource to the database
  async saveResource(resourceData) {
    try {
      const resource = await Resource.findOneAndUpdate(
        { gameResourceId: resourceData.gameResourceId },
        resourceData,
        { upsert: true, new: true }
      );
      return resource;
    } catch (error) {
      console.error('Error saving resource:', error);
      throw error;
    }
  },
  
  // Update resource when depleted
  async depleteResource(gameResourceId) {
    try {
      const resource = await Resource.findOneAndUpdate(
        { gameResourceId },
        {
          depleted: true,
          depletedAt: new Date()
        },
        { new: true }
      );
      return resource;
    } catch (error) {
      console.error('Error depleting resource:', error);
      throw error;
    }
  },
  
  // Get all active resources
  async getActiveResources() {
    try {
      const resources = await Resource.find({ depleted: false });
      return resources;
    } catch (error) {
      console.error('Error getting active resources:', error);
      throw error;
    }
  }
};

// World state operations
const worldService = {
  // Save world state
  async saveWorldState(worldData) {
    try {
      const worldState = await WorldState.findOneAndUpdate(
        { _id: 'main' },
        {
          ...worldData,
          lastSaved: new Date()
        },
        { upsert: true, new: true }
      );
      return worldState;
    } catch (error) {
      console.error('Error saving world state:', error);
      throw error;
    }
  },
  
  // Load world state
  async loadWorldState() {
    try {
      let worldState = await WorldState.findById('main');
      
      // If no world state exists, create a default one
      if (!worldState) {
        worldState = await WorldState.create({
          _id: 'main',
          time: 0,
          resourceIdCounter: 0,
          lastSaved: new Date()
        });
      }
      
      return worldState;
    } catch (error) {
      console.error('Error loading world state:', error);
      throw error;
    }
  }
};

module.exports = {
  playerService,
  resourceService,
  worldService
};
