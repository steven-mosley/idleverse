const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import enhanced game world
const EnhancedGameWorld = require('./models/EnhancedGameWorld');

// Import AI Service
const AIService = require('./services/aiService');

// Import dashboard controller
const dashboardController = require('./controllers/dashboardController');

// Import routes
const authRoutes = require('./routes/authRoutes');

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

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for HTTP requests too
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB
connectDB()
  .then(async (dbConnected) => {
    console.log("MongoDB connection status:", dbConnected ? "Connected" : "Failed");
    
    // Initialize game world
    console.log("Initializing game world...");
    const gameWorld = new EnhancedGameWorld();
    
    if (dbConnected) {
      // Initialize with database if connected
      await gameWorld.initializeWithDb();
    } else {
      // Initialize without database if connection failed
      gameWorld.initialize();
    }
    
    // Log world state
    console.log(`Created ${gameWorld.resources.length} resources`);
    
    // Initialize AI service
    const aiService = new AIService(gameWorld);
    await aiService.initialize();
    
    // Enable AI by default
    aiService.enable();
    console.log('AI Service enabled with default settings');
    
    // Import enhanced socket handlers
    const initEnhancedSocketHandlers = require('./socket/enhancedSocketHandlers');
    
    // Initialize socket handlers
    console.log("Setting up socket handlers...");
    initEnhancedSocketHandlers(io, gameWorld);
    
    // Clean up resources on shutdown
    process.on('SIGINT', async () => {
      console.log('Saving world state before shutdown...');
      
      if (dbConnected) {
        try {
          // Disable AI service to prevent new updates
          aiService.disable();
          console.log('AI service disabled');
          
          // Save AI state
          await aiService.saveAIStateToDB();
          console.log('AI state saved');
          
          // Save world state
          await gameWorld.saveWorldState();
          
          // Save all player data
          const playerIds = Object.keys(gameWorld.getPlayers());
          console.log(`Saving data for ${playerIds.length} players...`);
          
          // Filter out AI players
          const humanPlayerIds = playerIds.filter(id => !gameWorld.isAIPlayer(id));
          console.log(`Found ${humanPlayerIds.length} human players to save...`);
          
          // We're using removePlayer to trigger data saving
          for (const socketId of humanPlayerIds) {
            await gameWorld.removePlayer(socketId);
          }
          
          console.log('Data saved successfully, shutting down.');
          process.exit(0);
        } catch (error) {
          console.error('Error saving data:', error);
          process.exit(1);
        }
      } else {
        console.log('Database not connected, skipping data save.');
        process.exit(0);
      }
    });
    
    // Basic route to test server health
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        message: 'Server is running', 
        timestamp: new Date().toISOString(),
        databaseConnected: dbConnected
      });
    });
    
    // API route to get game state (for debugging)
    app.get('/api/gamestate', (req, res) => {
      res.json({
        resources: gameWorld.getResources().length,
        players: Object.keys(gameWorld.getPlayers()).length,
        time: gameWorld.getFormattedTime(),
        databaseConnected: dbConnected
      });
    });
    
    // API route for dashboard data
    app.get('/api/dashboard', (req, res) => {
      const dashboardData = dashboardController.getDashboardData(gameWorld);
      res.json(dashboardData);
    });
    
    // AI System API routes
    app.get('/api/ai/status', (req, res) => {
      res.json({
        status: 'ok',
        ai: aiService.getStatus()
      });
    });
    
    app.post('/api/ai/toggle', (req, res) => {
      const { enabled } = req.body;
      if (enabled) {
        aiService.enable();
      } else {
        aiService.disable();
      }
      res.json({
        status: 'ok',
        message: `AI system ${enabled ? 'enabled' : 'disabled'}`,
        ai: aiService.getStatus()
      });
    });
    
    app.post('/api/ai/config', (req, res) => {
      aiService.setConfig(req.body);
      res.json({
        status: 'ok',
        message: 'AI configuration updated',
        ai: aiService.getStatus()
      });
    });
    
    // Serve static files from the React app in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../client/build')));
      
      // Handle React routing, return all requests to React app
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
      });
    }
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Idleverse server running on port ${PORT}`);
      console.log(`Open http://localhost:3000 in your browser to play`);
      console.log(`Server health check: http://localhost:${PORT}/api/health`);
      console.log(`Server game state: http://localhost:${PORT}/api/gamestate`);
      console.log(`Server dashboard: http://localhost:${PORT}/dashboard`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  });

// Export for testing
module.exports = server;
