import Attribute from './Attribute';
import { ATTRIBUTES } from '../../../shared/constants';

/**
 * Character class for player and NPC characters
 */
class Character {
  constructor(name, background = 'warrior') {
    this.id = null; // Set by server or client
    this.name = name;
    this.background = background;
    this.level = 1;
    this.experience = 0;
    this.traits = [];
    this.skills = {};
    
    // Core attributes
    this.attributes = {
      [ATTRIBUTES.STRENGTH]: new Attribute('Strength', 10, 'Physical power and carrying capacity'),
      [ATTRIBUTES.DEXTERITY]: new Attribute('Dexterity', 10, 'Agility, reflexes, and precision'),
      [ATTRIBUTES.CONSTITUTION]: new Attribute('Constitution', 10, 'Health, stamina, and endurance'),
      [ATTRIBUTES.INTELLIGENCE]: new Attribute('Intelligence', 10, 'Learning ability and knowledge'),
      [ATTRIBUTES.WISDOM]: new Attribute('Wisdom', 10, 'Perception and decision-making'),
      [ATTRIBUTES.CHARISMA]: new Attribute('Charisma', 10, 'Social influence and leadership')
    };
    
    // Derived stats
    this.health = {
      max: 50 + this.attributes[ATTRIBUTES.CONSTITUTION].value * 5,
      current: 50 + this.attributes[ATTRIBUTES.CONSTITUTION].value * 5
    };
    
    this.stamina = {
      max: 100 + this.attributes[ATTRIBUTES.CONSTITUTION].value * 3,
      current: 100 + this.attributes[ATTRIBUTES.CONSTITUTION].value * 3,
      regenRate: 5 + Math.floor(this.attributes[ATTRIBUTES.CONSTITUTION].value / 3)
    };
    
    // Needs
    this.needs = {
      hunger: 100,
      rest: 100,
      morale: 75
    };
    
    // Inventory and equipment
    this.inventory = {};
    this.equipment = {
      head: null,
      torso: null,
      legs: null,
      feet: null,
      mainHand: null,
      offHand: null
    };
    
    // Position and movement
    this.position = { x: 0, y: 0 };
    this.destination = null;
    this.targetResource = null;
    this.state = 'idle';
    this.actionProgress = 0;
    this.moveSpeed = 5 + Math.floor(this.attributes[ATTRIBUTES.DEXTERITY].value / 4);
    this.gatherSpeed = 1 + Math.floor(this.attributes[ATTRIBUTES.DEXTERITY].value / 10);
    
    this.applyBackgroundEffects();
  }
  
  applyBackgroundEffects() {
    switch(this.background) {
      case 'warrior':
        this.attributes[ATTRIBUTES.STRENGTH].baseValue += 3;
        this.attributes[ATTRIBUTES.CONSTITUTION].baseValue += 2;
        this.attributes[ATTRIBUTES.INTELLIGENCE].baseValue -= 1;
        this.skills.melee = 15;
        this.skills.blocking = 10;
        break;
      case 'scout':
        this.attributes[ATTRIBUTES.DEXTERITY].baseValue += 3;
        this.attributes[ATTRIBUTES.WISDOM].baseValue += 2;
        this.attributes[ATTRIBUTES.STRENGTH].baseValue -= 1;
        this.skills.ranged = 15;
        this.skills.stealth = 10;
        break;
      case 'scholar':
        this.attributes[ATTRIBUTES.INTELLIGENCE].baseValue += 3;
        this.attributes[ATTRIBUTES.WISDOM].baseValue += 2;
        this.attributes[ATTRIBUTES.STRENGTH].baseValue -= 1;
        this.skills.medicine = 15;
        this.skills.crafting = 10;
        break;
      case 'merchant':
        this.attributes[ATTRIBUTES.CHARISMA].baseValue += 3;
        this.attributes[ATTRIBUTES.INTELLIGENCE].baseValue += 2;
        this.attributes[ATTRIBUTES.CONSTITUTION].baseValue -= 1;
        this.skills.trading = 15;
        this.skills.persuasion = 10;
        break;
    }
    
    // Update derived stats after background modifications
    this.updateDerivedStats();
  }
  
  updateDerivedStats() {
    this.health.max = 50 + this.attributes[ATTRIBUTES.CONSTITUTION].value * 5;
    this.stamina.max = 100 + this.attributes[ATTRIBUTES.CONSTITUTION].value * 3;
    this.stamina.regenRate = 5 + Math.floor(this.attributes[ATTRIBUTES.CONSTITUTION].value / 3);
    this.moveSpeed = 5 + Math.floor(this.attributes[ATTRIBUTES.DEXTERITY].value / 4);
    this.gatherSpeed = 1 + Math.floor(this.attributes[ATTRIBUTES.DEXTERITY].value / 10);
  }
  
  addTrait(trait) {
    this.traits.push(trait);
    trait.applyEffect(this);
  }
  
  updateNeeds(deltaTime) {
    // Decrease needs over time
    const hoursPassed = deltaTime / 3600000; // Convert milliseconds to hours
    
    this.needs.hunger -= 5 * hoursPassed;
    this.needs.rest -= 8 * hoursPassed;
    
    // Clamp values between 0 and 100
    Object.keys(this.needs).forEach(need => {
      this.needs[need] = Math.max(0, Math.min(100, this.needs[need]));
    });
    
    // Apply effects of low needs
    if (this.needs.hunger < 20) {
      this.attributes[ATTRIBUTES.STRENGTH].addModifier('hunger', -2, null);
      this.attributes[ATTRIBUTES.DEXTERITY].addModifier('hunger', -2, null);
    } else {
      this.attributes[ATTRIBUTES.STRENGTH].removeModifier('hunger');
      this.attributes[ATTRIBUTES.DEXTERITY].removeModifier('hunger');
    }
    
    if (this.needs.rest < 20) {
      this.attributes[ATTRIBUTES.INTELLIGENCE].addModifier('fatigue', -2, null);
      this.attributes[ATTRIBUTES.WISDOM].addModifier('fatigue', -2, null);
    } else {
      this.attributes[ATTRIBUTES.INTELLIGENCE].removeModifier('fatigue');
      this.attributes[ATTRIBUTES.WISDOM].removeModifier('fatigue');
    }
  }
  
  decideAction() {
    // AI decision making based on needs, traits, and environment
    
    // Check for critical needs first
    if (this.needs.hunger < 30) {
      return { action: 'find_food', priority: 100 - this.needs.hunger };
    }
    
    if (this.needs.rest < 25) {
      return { action: 'rest', priority: 100 - this.needs.rest };
    }
    
    // Consider traits next
    for (const trait of this.traits) {
      const traitAction = trait.suggestAction(this);
      if (traitAction) {
        return traitAction;
      }
    }
    
    // Default behaviors based on background
    switch(this.background) {
      case 'warrior':
        return { action: 'patrol', priority: 60 };
      case 'scout':
        return { action: 'explore', priority: 60 };
      case 'scholar':
        return { action: 'research', priority: 60 };
      case 'merchant':
        return { action: 'trade', priority: 60 };
      default:
        return { action: 'idle', priority: 30 };
    }
  }
  
  update(deltaTime, world) {
    // Update timers and cooldowns
    this.updateNeeds(deltaTime);
    
    // Regenerate stamina
    if (this.stamina.current < this.stamina.max) {
      this.stamina.current += this.stamina.regenRate * (deltaTime / 1000);
      this.stamina.current = Math.min(this.stamina.current, this.stamina.max);
    }
    
    // Handle current state
    switch(this.state) {
      case 'moving':
        if (this.targetResource) {
          // Handled by server for now
        }
        break;
        
      case 'gathering':
        if (this.targetResource) {
          // Handled by server for now
        }
        break;
        
      case 'idle':
        // Decide what to do next
        const decision = this.decideAction();
        
        // Execute the decided action
        // This would connect to the action system
        break;
    }
  }
  
  // Serialize character data for network transmission
  serialize() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      state: this.state,
      targetResource: this.targetResource,
      actionProgress: this.actionProgress,
      inventory: this.inventory
    };
  }
  
  // Deserialize character data from network
  static deserialize(data) {
    const character = new Character(data.name, data.background || 'warrior');
    character.id = data.id;
    character.position = data.position;
    character.state = data.state;
    character.targetResource = data.targetResource;
    character.actionProgress = data.actionProgress;
    character.inventory = data.inventory;
    
    return character;
  }
}

export default Character;
