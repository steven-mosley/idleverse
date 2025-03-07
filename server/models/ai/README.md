# Idleverse AI System

This document describes the AI Character system for the Idleverse game. The system creates and manages AI-controlled characters that behave similarly to player characters, providing a more immersive world even with few human players.

## Features

- **Persistent AI Characters**: AI characters are stored in the database and persist between server restarts
- **Various AI Types**: Different types of AI (gatherers, explorers, defenders, traders) with unique behaviors
- **Personality System**: AI characters have personality traits that affect their decision-making
- **Resource Preferences**: AIs have preferences for different resource types
- **Toggleable System**: The AI system can be enabled/disabled through the admin API
- **Configurable Population**: Set the desired number of AI characters in the world

## Architecture

### Database Models

- **AICharacter Schema**: Stores AI data including personality, preferences, and state
- **Integration with GameWorld**: AI characters exist in the same world as player characters

### Key Components

1. **AI Service**: Core service that manages AI characters
2. **AI Decision-Making**: Logic for AI behavior patterns
3. **AI Control Panel**: UI for managing the AI system
4. **API Endpoints**: Server endpoints for controlling the AI system

## AI Types

1. **Gatherer (60%)**: Focuses on efficient resource gathering
2. **Explorer (20%)**: Travels farther, explores more of the map
3. **Defender (10%)**: Stays in central areas, focuses on defense (combat will be added later)
4. **Trader (10%)**: Gathers resources and moves between areas (trading will be added later)

## Personality System

AI characters have personality traits on a scale of 0-100:

- **Bravery**: Willingness to take risks
- **Sociability**: Preference for being near other characters
- **Curiosity**: Exploration range and variety of activities
- **Industriousness**: Focus on resource gathering

These traits affect AI decision-making, such as:
- How far they're willing to travel
- What resources they prioritize
- How they respond to other characters (future feature)

## Usage

### Admin Controls

The AI system can be controlled through API endpoints:

```
GET /api/ai/status         - Get current AI status
POST /api/ai/toggle        - Enable/disable AI system
POST /api/ai/config        - Update AI configuration
```

Example configuration:
```json
{
  "defaultPopulation": 10,
  "maxPopulation": 20,
  "aiTypeDistribution": {
    "gatherer": 60,
    "explorer": 20,
    "defender": 10,
    "trader": 10
  }
}
```

### In-Game UI

The game includes an AI Control Panel that allows:
- Toggling the AI system on/off
- Adjusting the AI population density
- Viewing current AI statistics

## Future Enhancements

- **Enhanced AI Decision-Making**: More sophisticated behavior patterns
- **Combat System Integration**: AI defenders will engage in combat
- **Trading System**: AI traders will buy/sell resources
- **Social Interactions**: AIs will interact with players and each other
- **Faction System**: AIs will form groups with allegiances
- **Advanced Pathfinding**: Improved movement patterns and terrain awareness

## Technical Details

AI characters update every second, making decisions based on:
- Current state (idle, moving, gathering)
- Personality traits and preferences
- Nearby resources and other characters
- World state and time of day (future feature)

The system is designed to be lightweight, with AI updates batched for efficiency.

## Performance Considerations

- AI updates are throttled to maintain performance
- AI characters only update when in proximity to players (future optimization)
- Database operations are batched to reduce load
- AI population is capped to prevent performance issues
