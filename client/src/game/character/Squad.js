/**
 * Squad class for managing groups of characters
 */
class Squad {
  constructor(name) {
    this.name = name;
    this.members = [];
    this.leader = null;
    this.formationSpacing = 2; // Units of distance between members
  }
  
  addMember(character) {
    this.members.push(character);
    
    // If this is the first member or has higher leadership, make leader
    if (!this.leader || this.getLeadershipScore(character) > this.getLeadershipScore(this.leader)) {
      this.setLeader(character);
    }
  }
  
  removeMember(character) {
    this.members = this.members.filter(member => member !== character);
    
    // If leader was removed, select a new one
    if (this.leader === character && this.members.length > 0) {
      this.selectBestLeader();
    }
  }
  
  setLeader(character) {
    if (!this.members.includes(character)) {
      this.addMember(character);
    }
    this.leader = character;
  }
  
  getLeadershipScore(character) {
    // Calculate leadership score based on attributes and traits
    let score = character.attributes.charisma.value * 2 + 
                character.attributes.wisdom.value + 
                character.attributes.intelligence.value * 0.5;
                
    // Bonus for certain traits
    character.traits.forEach(trait => {
      if (trait.name === 'Natural Leader') score += 10;
      if (trait.name === 'Inspiring') score += 5;
      if (trait.name === 'Decisive') score += 3;
    });
    
    return score;
  }
  
  selectBestLeader() {
    if (this.members.length === 0) {
      this.leader = null;
      return;
    }
    
    let bestLeader = this.members[0];
    let bestScore = this.getLeadershipScore(bestLeader);
    
    for (let i = 1; i < this.members.length; i++) {
      const score = this.getLeadershipScore(this.members[i]);
      if (score > bestScore) {
        bestScore = score;
        bestLeader = this.members[i];
      }
    }
    
    this.leader = bestLeader;
  }
  
  updateFormation() {
    if (!this.leader || this.members.length <= 1) return;
    
    // Set formation positions relative to leader
    const leaderPos = this.leader.position;
    const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
    
    let angleIndex = 0;
    for (const member of this.members) {
      if (member === this.leader) continue;
      
      // Set destination in formation
      const angle = angles[angleIndex % angles.length];
      member.destination = {
        x: leaderPos.x + Math.cos(angle) * this.formationSpacing,
        y: leaderPos.y + Math.sin(angle) * this.formationSpacing
      };
      
      angleIndex++;
    }
  }
  
  moveTo(destination) {
    if (!this.leader) return;
    
    // Set leader's destination
    this.leader.destination = {...destination};
    
    // Update formation positions
    this.updateFormation();
  }
  
  update(deltaTime, world) {
    // Update all members
    for (const member of this.members) {
      member.update(deltaTime, world);
    }
    
    // Update formation if leader moved
    this.updateFormation();
  }
}

export default Squad;
