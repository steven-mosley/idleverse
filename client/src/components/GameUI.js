import React, { useState, useEffect } from 'react';
import StatusPanel from './UI/StatusPanel';
import InventoryPanel from './UI/InventoryPanel';
import ChatPanel from './UI/ChatPanel';
import EnhancedDashboard from './UI/EnhancedDashboard';
import AIControlPanel from './UI/AIControlPanel';
import { useGameStore } from '../game/store';
import socket from '../socket';

const GameUI = ({ playerName, worldTime, storeTime, receivedGameState, connected }) => {
  const [character, setCharacter] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [displayTime, setDisplayTime] = useState(worldTime || '00:00');
  const [showDashboard, setShowDashboard] = useState(false);
  
  const characters = useGameStore(state => state.characters);
  
  // Update display time when either source changes
  useEffect(() => {
    if (worldTime) {
      console.log("GameUI: Setting display time from prop:", worldTime);
      setDisplayTime(worldTime);
    } else if (storeTime) {
      console.log("GameUI: Setting display time from store:", storeTime);
      setDisplayTime(storeTime);
    }
  }, [worldTime, storeTime]);
  
  // Get character data directly from the store
  useEffect(() => {
    console.log("GameUI: characters in store:", characters);
    if (characters && characters.length > 0) {
      console.log("GameUI: Setting character from store:", characters[0]);
      setCharacter(characters[0]);
    }
  }, [characters]);
  
  // Setup chat message handling
  useEffect(() => {
    if (socket && connected) {
      console.log("GameUI: Setting up chat message handler");
      
      const handleChatMessage = (message) => {
        console.log("GameUI: Received chat message:", message);
        setChatMessages(prev => [...prev, message]);
      };
      
      socket.on('chatMessage', handleChatMessage);
      
      // Add welcome message
      setChatMessages([{
        playerId: 'system',
        playerName: 'System',
        message: 'Welcome to Idleverse!'
      }]);
      
      return () => {
        socket.off('chatMessage', handleChatMessage);
      };
    }
  }, [connected]);

  // Toggle dashboard visibility
  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  return (
    <div className="game-ui">
      <div className="top-bar">
        <div className="game-title">Idleverse</div>
        <div id="world-info">World time: {displayTime}</div>
        <button 
          onClick={toggleDashboard}
          style={{
            marginLeft: 'auto',
            background: showDashboard ? '#ffd700' : 'rgba(255,255,255,0.2)',
            border: 'none',
            color: showDashboard ? '#000' : '#fff',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
        </button>
      </div>

      <StatusPanel 
        character={character} 
        receivedGameState={receivedGameState}
      />
      <InventoryPanel 
        character={character} 
        receivedGameState={receivedGameState}
      />
      <ChatPanel 
        playerName={playerName} 
        messages={chatMessages}
        setMessages={setChatMessages}
        connected={connected}
      />
      
      {showDashboard && (
        <EnhancedDashboard character={character} />
      )}
      
      <AIControlPanel />
    </div>
  );
};

export default GameUI;
