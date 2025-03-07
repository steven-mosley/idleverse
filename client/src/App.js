import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import StartOverlay from './components/StartOverlay';
import { useGameStore } from './game/store';
import socket, { requestGameState, cleanupSocket } from './socket';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [localWorldTime, setLocalWorldTime] = useState('00:00');
  const [receivedGameState, setReceivedGameState] = useState(false);
  const [connected, setConnected] = useState(socket ? socket.connected : false);
  
  // Get store methods directly
  const storeSetSocket = useGameStore(state => state.setSocket);
  const setWorldTime = useGameStore(state => state.setWorldTime);
  const setResources = useGameStore(state => state.setResources);
  const setCharacters = useGameStore(state => state.setCharacters);
  const setOtherPlayers = useGameStore(state => state.setOtherPlayers);
  const worldTime = useGameStore(state => state.worldTime);

  // Set up socket event handlers
  useEffect(() => {
    console.log("App: Setting up socket event handlers");
    
    // Setup connection status tracking
    const handleConnect = () => {
      console.log('App: Socket connected event triggered');
      setConnected(true);
      storeSetSocket(socket);
      requestGameState();
    };
    
    const handleDisconnect = () => {
      console.log('App: Socket disconnected event triggered');
      setConnected(false);
    };
    
    const handleGameState = (data) => {
      console.log('App: Received game state');
      setReceivedGameState(true);
      
      // Update store with received data
      if (data.worldTime) {
        setWorldTime(data.worldTime);
        setLocalWorldTime(data.worldTime);
      }
      
      if (data.resources) {
        console.log('App: Setting resources:', data.resources.length);
        setResources(data.resources);
      }
      
      if (data.players && data.players[socket.id]) {
        console.log('App: Setting character data for', socket.id);
        setCharacters([data.players[socket.id]]);
        
        // Set other players
        const others = {};
        Object.keys(data.players).forEach(id => {
          if (id !== socket.id) {
            others[id] = data.players[id];
          }
        });
        setOtherPlayers(others);
      }
    };
    
    // Initial connection status
    if (socket.connected) {
      console.log('App: Socket already connected on mount');
      setConnected(true);
      storeSetSocket(socket);
    }
    
    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect); 
    socket.on('gameState', handleGameState);
    
    // Request initial game state if connected
    if (socket.connected) {
      requestGameState();
    }
    
    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('gameState', handleGameState);
    };
  }, [storeSetSocket, setWorldTime, setResources, setCharacters, setOtherPlayers]);

  // Add event listener for page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("App: Page unloading, cleaning up socket");
      cleanupSocket();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Poll for game state updates much more frequently (10Hz)
  useEffect(() => {
    if (connected && gameStarted) {
      console.log("App: Setting up polling interval");
      const intervalId = setInterval(() => {
        requestGameState();
      }, 100); // Poll every 100ms for more frequent updates
      
      return () => clearInterval(intervalId);
    }
  }, [connected, gameStarted]);

  const handleStartGame = (name) => {
    console.log("App: Starting game with name:", name);
    setPlayerName(name);
    setGameStarted(true);
    
    if (connected) {
      console.log("App: Changing name to", name);
      socket.emit('changeName', name);
      
      // Request game state again
      console.log("App: Requesting game state after start");
      requestGameState();
    } else {
      console.warn("App: Socket not connected when starting game");
    }
  };

  return (
    <div className="game-container">
      <GameCanvas active={gameStarted} />
      
      {gameStarted ? (
        <GameUI 
          playerName={playerName} 
          worldTime={localWorldTime} 
          storeTime={worldTime}
          receivedGameState={receivedGameState}
          connected={connected}
        />
      ) : (
        <StartOverlay onStartGame={handleStartGame} />
      )}
      
      {/* Connection status indicator */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '5px 10px',
        backgroundColor: connected ? 'rgba(0, 128, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        {connected ? 'Connected' : 'Disconnected'} 
        {socket ? ` (${socket.id || 'no id'})` : ' (no socket)'}
      </div>
      
      {/* Debug overlay */}
      {gameStarted && (
        <div style={{ 
          position: 'absolute', 
          top: '80px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px',
          zIndex: 100
        }}>
          Time: {localWorldTime}
        </div>
      )}
    </div>
  );
}

export default App;
