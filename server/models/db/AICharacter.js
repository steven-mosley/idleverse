const mongoose = require('mongoose');

const AICharacterSchema = new mongoose.Schema({
  // Basic character info
  name: {
    type: String,
    required: true
  },
  aiType: {
    type: String,
    enum: ['gatherer', 'explorer', 'defender', 'trader'],
    default: 'gatherer'
  },
  active: {
    type: Boolean,
    default: true
  },
  
  // Position and state - similar to player characters
  position: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  },
  state: {
    type: String,
    enum: ['idle', 'moving', 'gathering', 'trading', 'resting'],
    default: 'idle'
  },
  inventory: {
    type: Map,
    of: Number,
    default: {}
  },
  targetResource: {
    type: Number,
    default: null
  },
  actionProgress: {
    type: Number,
    default: 0
  },
  
  // AI behavior parameters
  personality: {
    // 0-100 scales for different traits
    bravery: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    sociability: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    curiosity: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    industriousness: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  },
  
  // AI operational parameters
  preferences: {
    // Resource type preferences (normalized to 100%)
    resourcePreferences: {
      wood: { type: Number, default: 20 },
      stone: { type: Number, default: 20 },
      food: { type: Number, default: 20 },
      iron: { type: Number, default: 20 },
      herbs: { type: Number, default: 20 }
    },
    // How far AI is willing to travel for resources
    explorationRange: {
      type: Number,
      default: 50,
      min: 10,
      max: 100
    },
    // How long to stay in one area
    areaStickiness: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  },
  
  // Basic character attributes
  attributes: {
    strength: {
      type: Number,
      default: 10
    },
    dexterity: {
      type: Number,
      default: 10
    },
    constitution: {
      type: Number,
      default: 10
    },
    intelligence: {
      type: Number,
      default: 10
    },
    wisdom: {
      type: Number,
      default: 10
    },
    charisma: {
      type: Number,
      default: 10
    }
  },
  
  // Stats tracking
  stats: {
    resourcesGathered: {
      type: Number,
      default: 0
    },
    tilesExplored: {
      type: Number,
      default: 0
    },
    playTime: {
      type: Number,
      default: 0
    },
    // Other stats as needed
  },
  
  // When this AI was last updated by the system
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // When this AI was created
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AICharacter', AICharacterSchema);
