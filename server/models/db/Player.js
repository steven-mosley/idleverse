const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
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
    enum: ['idle', 'moving', 'gathering'],
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
    }
  },
  preferences: {
    autoGatherEnabled: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', PlayerSchema);
