/**
 * Attribute class for character attributes
 */
class Attribute {
  constructor(name, value, description) {
    this.name = name;
    this.baseValue = value;
    this.modifiers = [];
    this.description = description;
  }

  get value() {
    return this.baseValue + this.modifiers.reduce((sum, mod) => sum + mod.value, 0);
  }

  addModifier(source, value, duration = null) {
    this.modifiers.push({
      source,
      value,
      duration,
      createdAt: Date.now()
    });
  }

  removeModifier(source) {
    this.modifiers = this.modifiers.filter(mod => mod.source !== source);
  }

  updateModifiers() {
    const now = Date.now();
    this.modifiers = this.modifiers.filter(mod => {
      if (!mod.duration) return true;
      return now < mod.createdAt + mod.duration;
    });
  }
}

export default Attribute;
