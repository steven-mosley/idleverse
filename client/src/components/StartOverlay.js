import React, { useState } from 'react';

const StartOverlay = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('Player ' + Math.floor(Math.random() * 1000));

  const handleStart = () => {
    onStartGame(playerName || 'Player');
  };

  return (
    <div className="start-overlay">
      <div className="start-title">Idleverse</div>
      <div className="start-subtitle">
        Explore a procedurally generated world where your character autonomously gathers resources.
        Guide them by selecting specific targets, or sit back and watch them work!
      </div>
      
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter your name"
        style={{
          padding: '10px',
          fontSize: '18px',
          borderRadius: '5px',
          border: 'none',
          marginBottom: '20px',
          width: '300px',
          textAlign: 'center'
        }}
      />
      
      <button className="start-button" onClick={handleStart}>
        Begin Adventure
      </button>
    </div>
  );
};

export default StartOverlay;
