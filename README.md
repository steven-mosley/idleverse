# Idleverse

A multiplayer idle RPG where characters autonomously explore a shared world.

## Features

- Autonomous character behavior - characters make their own decisions
- Role specialization and traits system
- Resource gathering and inventory management
- Interactive 3D world with various biomes and resource types
- Multiplayer functionality to see other players in real-time
- Squad mechanics for character recruitment and team management

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm (comes with Node.js)

### Installation

1. Clone this repository
2. Install dependencies for both server and client:

```bash
npm run install-all
```

### Running the Game

Development mode (runs both server and client):

```bash
npm run dev
```

Server only:

```bash
npm run server
```

Client only:

```bash
npm run client
```

## Gameplay Mechanics

- Characters autonomously explore and gather resources based on their traits
- Different resource types spread across various biomes
- Squad formation and management
- Character progression through attributes and skills
- Idle progression - characters continue their activities while you're away

## Technical Stack

- **Frontend**: React, Three.js
- **Backend**: Node.js, Express, Socket.io
- **Communication**: Real-time WebSockets

## Development Status

This project is currently in early development.

## License

This project is licensed under the MIT License
