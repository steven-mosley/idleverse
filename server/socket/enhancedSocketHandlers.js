// Enhanced Socket.io event handlers with authentication support
const { verifyToken } = require('../utils/jwt');

// Map to store last activity time for each client
const clientActivity = new Map();

// Clean up interval in milliseconds (30 seconds)
const CLEANUP_INTERVAL = 30000;

// Inactivity timeout in milliseconds (60 seconds)
const INACTIVITY_TIMEOUT = 60000;

// Game update interval in milliseconds (33ms = 30 updates per second)
const UPDATE_INTERVAL = 33;

const initEnhancedSocketHandlers = (io, gameWorld) => {
  // Set up periodic cleanup of inactive connections
  setInterval(() => cleanupInactiveConnections(io, gameWorld), CLEANUP_INTERVAL);

  // Handle socket connections
  io.on('connection', async (socket) => {
    console.log('New connection established:', socket.id);
    
    // Record activity time
    updateClientActivity(socket.id);
    
    // Handle authentication
    socket.on('authenticate', async (authData) => {
      try {
        // Verify token
        const decoded = verifyToken(authData.token);
        const userId = decoded.userId;
        
        console.log(`Player ${socket.id} authenticated as user ${userId}`);
        
        // Create authenticated player with database loading
        const player = await gameWorld.addAuthenticatedPlayer(socket.id, userId);
        
        // Acknowledge successful authentication
        socket.emit('authSuccess', {
          playerId: socket.id,
          playerName: player.name
        });
        
        // Send game state
        sendGameState(socket, gameWorld);
        
        // Tell everyone about the new player
        socket.broadcast.emit('playerJoined', gameWorld.getPlayer(socket.id));
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authError', { message: 'Authentication failed' });
        
        // Create non-authenticated player as fallback
        fallbackPlayerCreation(socket, gameWorld);
      }
    });
    
    // For compatibility with clients that don't authenticate, create a player without authentication
    // Also triggered if authentication fails
    socket.on('joinAsGuest', (data) => {
      fallbackPlayerCreation(socket, gameWorld, data?.name);
    });
    
    // Create a default player if no auth attempt within 5 seconds
    const authTimeout = setTimeout(() => {
      // Only create guest player if not already authenticated
      if (!gameWorld.getPlayer(socket.id)) {
        console.log(`Socket ${socket.id} did not authenticate, creating guest player`);
        fallbackPlayerCreation(socket, gameWorld);
      }
    }, 5000);
    
    // Clear timeout if socket disconnects or is authenticated
    socket.on('disconnect', () => {
      clearTimeout(authTimeout);
    });
    
    // Handle request for game state
    socket.on('requestGameState', () => {
      updateClientActivity(socket.id);
      sendGameState(socket, gameWorld);
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
    
    // Handle auto-gather setting
    socket.on('setAutoGather', (enabled) => {
      updateClientActivity(socket.id);
      
      console.log('Player', socket.id, 'set auto-gather to', enabled);
      
      // Update player preferences
      const player = gameWorld.getPlayer(socket.id);
      if (player) {
        if (!player.preferences) {
          player.preferences = {};
        }
        player.preferences.autoGatherEnabled = enabled;
        gameWorld.updatePlayer(socket.id, { preferences: player.preferences });
      }
      
      socket.emit('autoGatherUpdated', enabled);
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

// Helper function to create a non-authenticated player
const fallbackPlayerCreation = (socket, gameWorld, guestName = null) => {
  // Only create player if one doesn't already exist for this socket
  if (!gameWorld.getPlayer(socket.id)) {
    // Create new player
    const player = gameWorld.addPlayer(socket.id);
    
    // Set custom name if provided
    if (guestName) {
      player.name = guestName;
    }
    
    console.log(`Created guest player for socket ${socket.id}: ${player.name}`);
    
    // Send game state
    sendGameState(socket, gameWorld);
    
    // Tell everyone about the new player
    socket.broadcast.emit('playerJoined', player);
  }
};

// Helper function to send game state to a client
const sendGameState = (socket, gameWorld) => {
  const gameState = {
    players: gameWorld.getPlayers(),
    resources: gameWorld.getResources(),
    worldTime: gameWorld.getFormattedTime()
  };
  
  console.log(`Sending game state to ${socket.id}:`, {
    playerCount: Object.keys(gameState.players).length,
    resourceCount: gameState.resources.length,
    worldTime: gameState.worldTime
  });
  
  socket.emit('gameState', gameState);
};

// Helper to update client activity timestamp
function updateClientActivity(socketId) {
  clientActivity.set(socketId, Date.now());
}

// Helper to handle player disconnect
function handlePlayerDisconnect(socketId, gameWorld, io) {
  // Remove player from clientActivity tracking
  clientActivity.delete(socketId);
  
  // Remove player from game world (which now saves to DB if authenticated)
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

module.exports = initEnhancedSocketHandlers;
