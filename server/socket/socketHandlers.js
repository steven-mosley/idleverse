// Socket.io event handlers

// Map to store last activity time for each client
const clientActivity = new Map();

// Clean up interval in milliseconds (30 seconds)
const CLEANUP_INTERVAL = 30000;

// Inactivity timeout in milliseconds (60 seconds)
const INACTIVITY_TIMEOUT = 60000;

// Game update interval in milliseconds (50ms = 20 updates per second)
const UPDATE_INTERVAL = 50;

const initSocketHandlers = (io, gameWorld) => {
  // Set up periodic cleanup of inactive connections
  setInterval(() => cleanupInactiveConnections(io, gameWorld), CLEANUP_INTERVAL);

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);
    
    // Record activity time
    updateClientActivity(socket.id);
    
    // Create new player
    gameWorld.addPlayer(socket.id);
    console.log('Player created with position:', gameWorld.getPlayer(socket.id).position);
    
    // Log resource count
    console.log(`Resources available: ${gameWorld.getResources().filter(r => !r.depleted).length}`);
    
    // Send existing game state to the new player
    const gameState = {
      players: gameWorld.getPlayers(),
      resources: gameWorld.getResources(),
      worldTime: gameWorld.getFormattedTime()
    };
    
    console.log(`Sending initial game state to ${socket.id}:`, {
      playerCount: Object.keys(gameState.players).length,
      resourceCount: gameState.resources.length,
      worldTime: gameState.worldTime
    });
    
    socket.emit('gameState', gameState);
    
    // Tell everyone about the new player
    socket.broadcast.emit('playerJoined', gameWorld.getPlayer(socket.id));
    
    // Handle request for game state
    socket.on('requestGameState', () => {
      updateClientActivity(socket.id);
      
      const gameState = {
        players: gameWorld.getPlayers(),
        resources: gameWorld.getResources(),
        worldTime: gameWorld.getFormattedTime()
      };
      
      socket.emit('gameState', gameState);
    });
    
    // Handle heartbeat/ping
    socket.on('ping', () => {
      updateClientActivity(socket.id);
      socket.emit('pong');
    });
    
    // Handle player updates
    socket.on('playerUpdate', (playerData) => {
      updateClientActivity(socket.id);
      
      // Update player state in game world
      console.log('Player update from', socket.id, ':', playerData);
      gameWorld.updatePlayer(socket.id, playerData);
      
      // Broadcast updated player to all other clients
      socket.broadcast.emit('playerMoved', gameWorld.getPlayer(socket.id));
    });
    
    // Handle resource gathering
    socket.on('gatherResource', (data) => {
      updateClientActivity(socket.id);
      
      const { resourceId, amount } = data;
      console.log('Player', socket.id, 'gathering resource', resourceId, 'amount:', amount);
      const resourceUpdated = gameWorld.gatherResource(socket.id, resourceId, amount);
      
      if (resourceUpdated) {
        // Broadcast resource update to all clients
        io.emit('resourceUpdated', resourceUpdated);
      }
    });
    
    // Handle chat messages
    socket.on('chatMessage', (message) => {
      updateClientActivity(socket.id);
      
      const player = gameWorld.getPlayer(socket.id);
      if (!player) {
        console.warn('Chat message from unknown player:', socket.id);
        return;
      }
      
      console.log('Chat message from', player.name, ':', message);
      
      io.emit('chatMessage', {
        playerId: socket.id,
        playerName: player.name,
        message: message
      });
    });
    
    // Handle player name change
    socket.on('changeName', (newName) => {
      updateClientActivity(socket.id);
      
      console.log('Player', socket.id, 'changed name to', newName);
      gameWorld.updatePlayer(socket.id, { name: newName });
      io.emit('playerUpdated', gameWorld.getPlayer(socket.id));
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      handlePlayerDisconnect(socket.id, gameWorld, io);
    });
  });
  
  // Start game world update loop - faster updates for smoother movement
  console.log(`Starting game world update loop at ${UPDATE_INTERVAL}ms intervals (${1000/UPDATE_INTERVAL} updates per second)`);
  setInterval(() => {
    gameWorld.update(UPDATE_INTERVAL / 1000);
  }, UPDATE_INTERVAL);
};

// Helper to update client activity timestamp
function updateClientActivity(socketId) {
  clientActivity.set(socketId, Date.now());
}

// Helper to handle player disconnect
function handlePlayerDisconnect(socketId, gameWorld, io) {
  // Remove player from clientActivity tracking
  clientActivity.delete(socketId);
  
  // Remove player from game world
  gameWorld.removePlayer(socketId);
  
  // Notify all clients
  io.emit('playerLeft', socketId);
  
  // Log current player count
  const playerCount = Object.keys(gameWorld.getPlayers()).length;
  console.log(`Player ${socketId} removed. Current player count: ${playerCount}`);
}

// Clean up inactive connections
function cleanupInactiveConnections(io, gameWorld) {
  const now = Date.now();
  const playersBefore = Object.keys(gameWorld.getPlayers()).length;
  
  // Check each client's last activity
  for (const [socketId, lastActivity] of clientActivity.entries()) {
    if (now - lastActivity > INACTIVITY_TIMEOUT) {
      console.log(`Client ${socketId} inactive for ${Math.floor((now - lastActivity)/1000)}s, removing`);
      
      // Attempt to disconnect the socket
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        console.log(`Forcibly disconnecting socket ${socketId}`);
        socket.disconnect(true);
      }
      
      // Clean up the player
      handlePlayerDisconnect(socketId, gameWorld, io);
    }
  }
  
  const playersAfter = Object.keys(gameWorld.getPlayers()).length;
  if (playersBefore !== playersAfter) {
    console.log(`Cleanup complete. Players: ${playersBefore} -> ${playersAfter}`);
  }
}

module.exports = initSocketHandlers;
