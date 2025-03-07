const mongoose = require('mongoose');

const WorldStateSchema = new mongoose.Schema({
  // We'll just have one document with _id: 'main'
  _id: {
    type: String,
    default: 'main'
  },
  time: {
    type: Number,
    default: 0
  },
  resourceIdCounter: {
    type: Number,
    default: 0
  },
  lastSaved: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WorldState', WorldStateSchema);
