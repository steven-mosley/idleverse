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

// Import dashboard controller
const dashboardController = require('./controllers/dashboardController');

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
app.use(express.static(path.join(__dirname, 'public')));

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

// API route for dashboard data
app.get('/api/dashboard', (req, res) => {
  const dashboardData = dashboardController.getDashboardData(gameWorld);
  res.json(dashboardData);
});

// API route for game world state (for the dashboard)
app.get('/api/dashboard/gameworld', (req, res) => {
  res.json(gameWorld.getDashboardState());
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

// Serve the dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Catch all requests to the dashboard path that aren't the main HTML file
app.get('/dashboard/*', (req, res) => {
  res.redirect('/dashboard');
});

// Start the server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
server.listen(PORT, HOST, () => {
  console.log(`Idleverse server running on ${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: Use your computer's IP address with port ${PORT}`);
  console.log(`Server health check: http://localhost:${PORT}/api/health`);
  console.log(`Server game state: http://localhost:${PORT}/api/gamestate`);
  console.log(`Server dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`Reset connections: http://localhost:${PORT}/api/reset-connections`);
});

// Export for testing
module.exports = server;
