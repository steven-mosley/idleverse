import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Socket connection
  socket: null,
  setSocket: (socket) => {
    console.log("Setting socket in store:", socket?.id);
    set({ socket });
  },
  
  // World state
  worldTime: '00:00',
  setWorldTime: (time) => {
    console.log("Setting world time:", time);
    set({ worldTime: time });
  },
  
  // Player character and others
  characters: [],
  setCharacters: (characters) => {
    console.log("Setting characters:", characters);
    set({ characters });
  },
  updateCharacter: (index, update) => {
    console.log("Updating character at index", index, "with", update);
    set(state => {
      const newCharacters = [...state.characters];
      if (newCharacters[index]) {
        newCharacters[index] = { ...newCharacters[index], ...update };
      } else {
        console.warn("Character index out of bounds:", index, "length:", newCharacters.length);
      }
      return { characters: newCharacters };
    });
  },
  
  // Resources
  resources: [],
  setResources: (resources) => {
    console.log("Setting resources:", resources);
    set({ resources });
  },
  updateResource: (update) => {
    console.log("Updating resource:", update);
    set(state => {
      const newResources = [...state.resources];
      const index = newResources.findIndex(r => r.id === update.id);
      
      if (index !== -1) {
        newResources[index] = { ...newResources[index], ...update };
      } else {
        console.warn("Resource not found:", update.id);
      }
      
      return { resources: newResources };
    });
  },
  addResource: (resource) => {
    console.log("Adding resource:", resource);
    set(state => ({
      resources: [...state.resources, resource]
    }));
  },
  
  // Other players
  otherPlayers: {},
  setOtherPlayers: (otherPlayers) => {
    console.log("Setting other players:", otherPlayers);
    set({ otherPlayers });
  },
  updateOtherPlayer: (id, update) => {
    console.log("Updating other player:", id, update);
    set(state => ({
      otherPlayers: {
        ...state.otherPlayers,
        [id]: { ...state.otherPlayers[id], ...update }
      }
    }));
  },
  removeOtherPlayer: (id) => {
    console.log("Removing other player:", id);
    set(state => {
      const newOtherPlayers = { ...state.otherPlayers };
      delete newOtherPlayers[id];
      return { otherPlayers: newOtherPlayers };
    });
  },
  
  // Resource targeting
  setTargetResource: (resource) => {
    console.log("Setting target resource:", resource);
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
    } else {
      console.warn("No characters available to set target resource");
    }
  },
  
  // UI helpers
  showPopup: (message) => {
    console.log('Popup:', message);
  }
}));
