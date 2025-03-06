// Shared constants between client and server

const RESOURCE_TYPES = {
  WOOD: 'wood',
  STONE: 'stone',
  FOOD: 'food',
  IRON: 'iron',
  HERBS: 'herbs'
};

const CHARACTER_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  GATHERING: 'gathering',
  RESTING: 'resting',
  FIGHTING: 'fighting'
};

const ATTRIBUTES = {
  STRENGTH: 'strength',
  DEXTERITY: 'dexterity',
  CONSTITUTION: 'constitution',
  INTELLIGENCE: 'intelligence',
  WISDOM: 'wisdom',
  CHARISMA: 'charisma'
};

const CHARACTER_BACKGROUNDS = {
  WARRIOR: 'warrior',
  SCOUT: 'scout',
  SCHOLAR: 'scholar',
  MERCHANT: 'merchant'
};

const TRAITS = {
  BRAVE: 'brave',
  CAUTIOUS: 'cautious',
  INDUSTRIOUS: 'industrious',
  CURIOUS: 'curious',
  RESOURCEFUL: 'resourceful'
};

module.exports = {
  RESOURCE_TYPES,
  CHARACTER_STATES,
  ATTRIBUTES,
  CHARACTER_BACKGROUNDS,
  TRAITS
};
