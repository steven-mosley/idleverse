import { io } from 'socket.io-client';
import { useGameStore } from '../store';

// Initialize socket connection
export const initializeSocketConnection = () => {
  // Create socket connection with explicit configuration
  console.log("Creating new socket.io connection to http://localhost:5000");
  const newSocket = io("http://localhost:5000", {
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 10,
    timeout: 20000,
    autoConnect: true,
    forceNew: true,
    transports: ['websocket', 'polling'],
    withCredentials: true,
    extraHeaders: {},
  });
  
  // Manual connection attempt with logging
  console.log("Socket object created:", newSocket);
  newSocket.connect();
  
  // Set up basic event handlers
  setupEventHandlers(newSocket);
  
  // Dispatch connection status events to console
  newSocket.on('connect', () => console.log('Socket CONNECTED with ID:', newSocket.id));
  newSocket.on('disconnect', () => console.log('Socket DISCONNECTED'));
  newSocket.on('connect_error', (err) => console.error('Socket CONNECT ERROR:', err.message));
  newSocket.on('connect_timeout', () => console.error('Socket CONNECT TIMEOUT'));
  newSocket.on('reconnect', (attempt) => console.log('Socket RECONNECTED after', attempt, 'attempts'));
  newSocket.on('reconnect_attempt', (attempt) => console.log('Socket RECONNECT ATTEMPT:', attempt));
  newSocket.on('reconnect_error', (err) => console.error('Socket RECONNECT ERROR:', err.message));
  newSocket.on('reconnect_failed', () => console.error('Socket RECONNECT FAILED'));
  newSocket.on('error', (err) => console.error('Socket ERROR:', err.message));
  
  return newSocket;
};

// Set up socket event handlers
const setupEventHandlers = (socket) => {
  const {
    setResources,
    setCharacters,
    updateCharacter,
    setOtherPlayers,
    updateOtherPlayer,
    removeOtherPlayer,
    updateResource,
    addResource,
    setWorldTime,
    showPopup
  } = useGameStore.getState();

  // Receive initial game state
  socket.on('gameState', (data) => {
    console.log('Received game state in socket handler:', data);
    
    // Force set a test character if none received
    if (!data.players || Object.keys(data.players).length === 0) {
      console.log("No player data received, creating test character");
      
      // Create a test character for debugging
      const testCharacter = {
        id: socket.id || 'test-id',
        name: 'Test Character',
        position: { x: 0, y: 0 },
        state: 'idle',
        inventory: { 'wood': 5, 'stone': 3 },
        targetResource: null,
        actionProgress: 0
      };
      
      setCharacters([testCharacter]);
    } else {
      // Process real player data
      if (data.players && data.players[socket.id]) {
        const playerData = data.players[socket.id];
        console.log("Setting character data:", playerData);
        setCharacters([playerData]);
      } else {
        console.warn("Player data exists but no data for this socket ID:", socket.id);
        console.log("Available player IDs:", Object.keys(data.players || {}));
      }
    }
    
    // Set resources
    if (data.resources && data.resources.length > 0) {
      console.log("Setting resources:", data.resources.length);
      setResources(data.resources);
    } else {
      console.warn("No resources received");
      // Create test resources
      const testResources = [
        {
          id: 'test-wood',
          type: 'wood',
          position: { x: 5, y: 5 },
          amount: 30,
          depleted: false
        },
        {
          id: 'test-stone',
          type: 'stone',
          position: { x: -5, y: 5 },
          amount: 30,
          depleted: false
        }
      ];
      setResources(testResources);
    }
    
    // Add other players
    const otherPlayers = {};
    if (data.players) {
      for (const id in data.players) {
        if (id !== socket.id) {
          otherPlayers[id] = data.players[id];
        }
      }
      setOtherPlayers(otherPlayers);
    }
    
    // Set world time
    if (data.worldTime) {
      setWorldTime(data.worldTime);
    }
  });
  
  // New player joined
  socket.on('playerJoined', (playerInfo) => {
    console.log('New player joined:', playerInfo);
    showPopup(`${playerInfo.name} joined the game!`);
    
    // Add to other players
    updateOtherPlayer(playerInfo.id, playerInfo);
  });
  
  // Player moved/updated
  socket.on('playerMoved', (playerInfo) => {
    updateOtherPlayer(playerInfo.id, playerInfo);
  });
  
  // Player updated
  socket.on('playerUpdated', (playerInfo) => {
    if (playerInfo.id === socket.id) {
      updateCharacter(0, playerInfo);
    } else {
      updateOtherPlayer(playerInfo.id, playerInfo);
    }
  });
  
  // Player left
  socket.on('playerLeft', (playerId) => {
    const otherPlayers = useGameStore.getState().otherPlayers;
    const playerName = otherPlayers[playerId]?.name || 'Player';
    
    showPopup(`${playerName} left the game`);
    removeOtherPlayer(playerId);
  });
  
  // Resource updated
  socket.on('resourceUpdated', (resourceInfo) => {
    updateResource(resourceInfo);
  });
  
  // New resource spawned
  socket.on('resourceSpawned', (resourceInfo) => {
    addResource(resourceInfo);
    showPopup(`New ${resourceInfo.type} spawned!`);
  });

  // Log socket connection events for debugging
  socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
    socket.emit('requestGameState');
    
    // Force test data after a delay if we don't get a response
    setTimeout(() => {
      if (useGameStore.getState().characters.length === 0) {
        console.log("No characters received, forcing test data");
        
        // Create test character
        const testCharacter = {
          id: socket.id || 'test-id',
          name: 'Test Character',
          position: { x: 0, y: 0 },
          state: 'idle',
          inventory: { 'wood': 5, 'stone': 3 },
          targetResource: null,
          actionProgress: 0
        };
        setCharacters([testCharacter]);
        
        // Create test resources
        const testResources = [
          {
            id: 'test-wood',
            type: 'wood',
            position: { x: 5, y: 5 },
            amount: 30,
            depleted: false
          },
          {
            id: 'test-stone',
            type: 'stone',
            position: { x: -5, y: 5 },
            amount: 30,
            depleted: false
          }
        ];
        setResources(testResources);
      }
    }, 2000);
  });
};

// Report gathering to server
export const reportGathering = (socket, resourceId, amount) => {
  if (socket) {
    socket.emit('gatherResource', { resourceId, amount });
  }
};

// Send chat message
export const sendChatMessage = (socket, message) => {
  if (socket && message) {
    socket.emit('chatMessage', message);
  }
};

// Change player name
export const changeName = (socket, newName) => {
  if (socket && newName) {
    socket.emit('changeName', newName);
  }
};

// Request game state
export const requestGameState = (socket) => {
  if (socket && socket.connected) {
    socket.emit('requestGameState');
  }
};
