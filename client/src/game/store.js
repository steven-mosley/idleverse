import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Socket connection
  socket: null,
  setSocket: (socket) => set({ socket }),
  
  // World state
  worldTime: '00:00',
  setWorldTime: (time) => set({ worldTime: time }),
  
  // Player character and others
  characters: [],
  setCharacters: (characters) => set({ characters }),
  updateCharacter: (index, update) => set(state => {
    const newCharacters = [...state.characters];
    if (newCharacters[index]) {
      newCharacters[index] = { ...newCharacters[index], ...update };
    } else {
      console.warn("Character index out of bounds:", index, "length:", newCharacters.length);
    }
    return { characters: newCharacters };
  }),
  
  // Resources
  resources: [],
  setResources: (resources) => set({ resources }),
  updateResource: (update) => set(state => {
    const newResources = [...state.resources];
    const index = newResources.findIndex(r => r.id === update.id);
    
    if (index !== -1) {
      const oldResource = newResources[index];
      
      // Add visual effect for depleted resources
      if (!oldResource.depleted && update.depleted) {
        // Trigger resource depletion effect
        console.log("Resource depleted:", update.type, "at position", oldResource.position);
        
        // Show popup for depleted resource
        const { showPopup } = get();
        showPopup(`${update.type.charAt(0).toUpperCase() + update.type.slice(1)} resource depleted!`);
      }
      
      newResources[index] = { ...oldResource, ...update };
    } else {
      console.warn("Resource not found:", update.id);
    }
    
    return { resources: newResources };
  }),
  addResource: (resource) => set(state => ({
    resources: [...state.resources, resource]
  })),
  
  // Other players
  otherPlayers: {},
  setOtherPlayers: (otherPlayers) => set({ otherPlayers }),
  updateOtherPlayer: (id, update) => set(state => ({
    otherPlayers: {
      ...state.otherPlayers,
      [id]: { ...state.otherPlayers[id], ...update }
    }
  })),
  removeOtherPlayer: (id) => set(state => {
    const newOtherPlayers = { ...state.otherPlayers };
    delete newOtherPlayers[id];
    return { otherPlayers: newOtherPlayers };
  }),
  
  // Resource targeting
  setTargetResource: (resource) => {
    const { socket, characters, updateCharacter } = get();
    
    if (characters.length > 0) {
      // Update local character state
      updateCharacter(0, { 
        targetResource: resource,
        state: 'moving'
      });
      
      // Notify server of target change
      if (socket) {
        socket.emit('playerUpdate', {
          state: 'moving',
          targetResource: resource.id
        });
      }
    }
  },
  
  // UI helpers
  showPopup: (message) => {
    console.log('Popup:', message);
    
    // Create a temporary popup element
    const popup = document.createElement('div');
    popup.className = 'game-popup';
    popup.textContent = message;
    popup.style.position = 'absolute';
    popup.style.bottom = '80px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.color = 'white';
    popup.style.padding = '10px 20px';
    popup.style.borderRadius = '5px';
    popup.style.fontWeight = 'bold';
    popup.style.zIndex = '1000';
    popup.style.transition = 'opacity 0.3s, transform 0.3s';
    popup.style.opacity = '0';
    popup.style.transform = 'translateX(-50%) translateY(20px)';
    
    // Add to document
    document.body.appendChild(popup);
    
    // Trigger animation
    setTimeout(() => {
      popup.style.opacity = '1';
      popup.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform = 'translateX(-50%) translateY(-20px)';
      
      // Remove from DOM after fade out
      setTimeout(() => {
        document.body.removeChild(popup);
      }, 300);
    }, 3000);
  }
}));
