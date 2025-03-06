const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import game world
const GameWorld = require('./models/GameWorld');

// Create express app, HTTP server, and Socket.io instance
const app = express();
const server = http.createServer(app);

// Configure Socket.io with very permissive CORS
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000, // How long to wait for pong response
  pingInterval: 10000  // How often to ping clients
});

// Store a reference to active clients for cleanup
let activeClients = {};

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for HTTP requests too
  credentials: true
}));
app.use(express.json());

// Initialize game world
console.log("Initializing game world...");
const gameWorld = new GameWorld();
gameWorld.initialize();

// Log world state
console.log(`Created ${gameWorld.resources.length} resources`);

// Import socket handlers with client tracking
const initSocketHandlers = require('./socket/socketHandlers');

// Initialize socket handlers
console.log("Setting up socket handlers...");
initSocketHandlers(io, gameWorld);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Basic route to test server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// API route to get game state (for debugging)
app.get('/api/gamestate', (req, res) => {
  res.json({
    resources: gameWorld.getResources().length,
    players: Object.keys(gameWorld.getPlayers()).length,
    time: gameWorld.getFormattedTime()
  });
});

// API route to force cleanup of all connections (for debugging)
app.get('/api/reset-connections', (req, res) => {
  const playersBefore = Object.keys(gameWorld.getPlayers()).length;
  const socketsBefore = io.sockets.sockets.size;
  
  // Force disconnect all sockets
  io.sockets.sockets.forEach((socket) => {
    console.log(`Forcing disconnect for socket ${socket.id}`);
    socket.disconnect(true);
  });
  
  // Clear all players from game world
  Object.keys(gameWorld.getPlayers()).forEach(id => {
    gameWorld.removePlayer(id);
  });
  
  const playersAfter = Object.keys(gameWorld.getPlayers()).length;
  const socketsAfter = io.sockets.sockets.size;
  
  res.json({
    success: true,
    message: "Forced cleanup of all connections",
    stats: {
      playersBefore,
      playersAfter,
      socketsBefore,
      socketsAfter
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Idleverse server running on port ${PORT}`);
  console.log(`Open http://localhost:3000 in your browser to play`);
  console.log(`Server health check: http://localhost:${PORT}/api/health`);
  console.log(`Server game state: http://localhost:${PORT}/api/gamestate`);
  console.log(`Reset connections: http://localhost:${PORT}/api/reset-connections`);
});

// Export for testing
module.exports = server;
