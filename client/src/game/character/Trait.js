/**
 * Base Trait class for character traits
 */
class Trait {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }
  
  applyEffect(character) {
    // Override in subclasses
  }
  
  suggestAction(character) {
    // Override in subclasses
    return null;
  }
}

/**
 * Brave trait - More likely to engage in combat and less affected by morale loss
 */
export class BraveTrait extends Trait {
  constructor() {
    super('Brave', 'More likely to engage in combat and less affected by morale loss');
  }
  
  applyEffect(character) {
    character.attributes.constitution.addModifier('brave', 1);
  }
  
  suggestAction(character) {
    if (character.health.current > character.health.max * 0.3) {
      return { action: 'seek_combat', priority: 70 };
    }
    return null;
  }
}

/**
 * Cautious trait - Avoids danger and prefers safe options
 */
export class CautiousTrait extends Trait {
  constructor() {
    super('Cautious', 'Avoids danger and prefers safe options');
  }
  
  applyEffect(character) {
    character.attributes.wisdom.addModifier('cautious', 1);
  }
  
  suggestAction(character) {
    if (character.health.current < character.health.max * 0.7) {
      return { action: 'retreat', priority: 80 };
    }
    return { action: 'avoid_danger', priority: 65 };
  }
}

/**
 * Industrious trait - Works harder and longer without rest
 */
export class IndustriousTrait extends Trait {
  constructor() {
    super('Industrious', 'Works harder and longer without rest');
  }
  
  applyEffect(character) {
    character.attributes.constitution.addModifier('industrious', 1);
    character.attributes.strength.addModifier('industrious', 1);
  }
  
  suggestAction(character) {
    if (character.needs.rest > 30) {
      return { action: 'gather_resources', priority: 75 };
    }
    return null;
  }
}

/**
 * Curious trait - More likely to explore and learn
 */
export class CuriousTrait extends Trait {
  constructor() {
    super('Curious', 'More likely to explore and discover new things');
  }
  
  applyEffect(character) {
    character.attributes.intelligence.addModifier('curious', 1);
    character.attributes.wisdom.addModifier('curious', 1);
  }
  
  suggestAction(character) {
    return { action: 'explore', priority: 70 };
  }
}

/**
 * Resourceful trait - Better at finding and utilizing resources
 */
export class ResourcefulTrait extends Trait {
  constructor() {
    super('Resourceful', 'Better at finding and utilizing resources');
  }
  
  applyEffect(character) {
    character.gatherSpeed += 0.3; // 30% faster gathering
  }
  
  suggestAction(character) {
    return { action: 'gather_resources', priority: 65 };
  }
}

export default Trait;
