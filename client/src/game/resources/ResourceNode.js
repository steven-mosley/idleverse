/**
 * ResourceNode class for interactive resource entities in the game world
 */
class ResourceNode {
  constructor(id, resourceType, position, amount) {
    this.id = id;
    this.type = resourceType;
    this.position = { ...position };
    this.amount = amount;
    this.maxAmount = amount;
    this.depleted = false;
    this.interactionRadius = 2;
  }
  
  canInteractWith(character) {
    const dx = this.position.x - character.position.x;
    const dy = this.position.y - character.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.interactionRadius;
  }
  
  harvest(character, deltaTime) {
    if (!this.canInteractWith(character) || this.depleted) return 0;
    
    const harvestSkill = character.skills.harvesting || 0;
    const harvestAmount = Math.min(
      this.amount,
      character.gatherSpeed * (1 + harvestSkill / 100) * (deltaTime / 1000)
    );
    
    this.amount -= harvestAmount;
    
    // Check if depleted
    if (this.amount <= 0) {
      this.depleted = true;
    }
    
    return harvestAmount;
  }
  
  // Serialize for network transmission
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      amount: this.amount,
      depleted: this.depleted
    };
  }
  
  // Deserialize from network data
  static deserialize(data) {
    const node = new ResourceNode(
      data.id,
      data.type,
      data.position,
      data.amount
    );
    
    node.depleted = data.depleted;
    
    return node;
  }
}

export default ResourceNode;
