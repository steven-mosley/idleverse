const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  gameResourceId: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['wood', 'stone', 'food', 'iron', 'herbs']
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  depleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  depletedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Resource', ResourceSchema);
