# Idleverse Database Integration

This document describes the MongoDB database integration for the Idleverse game. It provides data persistence for players, resources, and world state.

## Features

- **Player Data Persistence:** Save player inventory, position, and stats across sessions
- **World State Persistence:** Maintain game world state between server restarts
- **Resource Tracking:** Save and restore resource locations and states
- **User Authentication:** Register and login to maintain persistent characters
- **Guest Mode:** Continue to support unauthenticated play for quick access

## Setup Instructions

### Prerequisites

- Docker and Docker Compose (for MongoDB container)
- Node.js 14+ and npm

### Installation

1. Install the required dependencies:
   ```bash
   npm run install-db
   ```

2. Create a `.env` file based on the provided `sample.env`:
   ```bash
   cp sample.env .env
   ```

3. Configure your MongoDB connection and JWT secret in the `.env` file:
   ```
   MONGO_URI=mongodb://localhost:27017/idleverse
   JWT_SECRET=your_secret_key_here
   ```

4. Start the MongoDB Docker container:
   ```bash
   npm run mongodb:start
   ```

5. Run the enhanced server:
   ```bash
   npm run server:db
   ```

### Using MongoDB in Docker

The project includes Docker integration for MongoDB. Use these commands to manage the MongoDB container:

```bash
# Start MongoDB container
npm run mongodb:start

# Check MongoDB container status
npm run mongodb:status

# Stop MongoDB container
npm run mongodb:stop

# Reset MongoDB data (CAUTION: Deletes all data)
npm run mongodb:reset

# Open MongoDB shell
npm run mongodb:shell
```

The database files are stored in a Docker volume named `idleverse-mongodb-data` for persistence.

### Running for Development

During development, you can use the following command to start both the server and client:

```bash
npm run dev
```

## Database Schema

### User Collection
- Authentication and account information
- Relates to Player data via userId

### Player Collection
- Character attributes, inventory, and position
- Statistics and preferences

### Resource Collection
- Resource locations, types, and amounts
- Tracks depletion status

### WorldState Collection
- Global game world state
- Tracks game time and counters

## Architecture

### Enhanced Game World
The `EnhancedGameWorld` extends the original `GameWorld` to add:
- Database loading and saving
- User authentication handling
- Periodic auto-save functionality

### Authentication Flow
1. User registers or logs in to receive a JWT token
2. Token is stored in localStorage
3. Socket connections authenticate using this token
4. Authenticated players have persistent data across sessions

### Guest Mode
For users who prefer not to register:
- Guest mode still available via the "Play as Guest" option
- Data persists only for the current session
- Can convert to a registered account later

## File Structure

```
server/
├── config/        # Database configuration
├── controllers/   # API route controllers
├── middleware/    # Auth middleware
├── models/        # Data models
│   ├── db/        # Database schemas
│   ├── GameWorld.js      # Original in-memory model
│   └── EnhancedGameWorld.js # Database-enabled model
├── routes/        # API routes
├── services/      # Database service layer
├── socket/        # Socket.io handlers
└── utils/         # Utility functions
```

## Customization

### Game Balance Settings
You can adjust game balance settings in the `.env` file:
```
GATHERING_SPEED=2.0
MOVEMENT_SPEED=8.0
```

### Auto-Save Interval
The world state is automatically saved every 5 minutes by default. To change this, modify the `autoSaveInterval` in `EnhancedGameWorld.js`.

## Troubleshooting

### Database Connection Issues
- Check your MongoDB connection string in `.env`
- Ensure MongoDB is running: `mongod --version`
- Check the server logs for connection errors

### Authentication Problems
- JWT tokens expire after 30 days
- Check that your JWT_SECRET is consistent
- Clear localStorage if experiencing persistent issues

## Future Improvements

- Friends list and social features
- Player-to-player trading
- Leaderboards and achievements
- Clan/guild system
- Player versus player combat
