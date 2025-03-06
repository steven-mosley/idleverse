import React, { useState, useEffect } from 'react';

const StatusPanel = ({ character, receivedGameState }) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log("StatusPanel: Rendered with character:", character);
    
    // If we've received game state or have character data, stop showing loading
    if (character || receivedGameState) {
      // Set a small delay to ensure data is processed
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [character, receivedGameState]);

  if (loading && !character) {
    // Render a placeholder if still loading
    return (
      <div className="status-panel panel">
        <div className="panel-header">Character Status</div>
        <div>Loading character data...</div>
      </div>
    );
  }

  // Create a simple character display if no data available
  if (!character) {
    return (
      <div className="status-panel panel">
        <div className="panel-header">Character Status</div>
        <div className="character-status">
          <div className="character-avatar" style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1E90FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            marginRight: '10px'
          }}>
            ?
          </div>
          <div className="character-info">
            <div className="character-name">Unknown Player</div>
            <div className="status-text">Idle</div>
          </div>
        </div>
        <div className="status-text">Position: (0.0, 0.0)</div>
      </div>
    );
  }

  const getStateText = () => {
    let statusText = character.state || 'idle';
    if (character.targetResource) {
      statusText += ` ${character.targetResource.type || 'resource'}`;
    }
    return statusText.charAt(0).toUpperCase() + statusText.slice(1);
  };

  return (
    <div className="status-panel panel">
      <div className="panel-header">Character Status</div>
      
      <div className="character-status">
        <div 
          className="character-avatar" 
          style={{ 
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: character.state === 'gathering' ? '#32CD32' : 
                            character.state === 'moving' ? '#FFA500' : '#1E90FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            marginRight: '10px'
          }}
        >
          {character.name ? character.name.charAt(0) : '?'}
        </div>
        
        <div className="character-info">
          <div className="character-name">{character.name || 'Unknown'}</div>
          <div className="status-text">{getStateText()}</div>
        </div>
      </div>
      
      <div className="status-text">
        Position: ({character.position ? character.position.x.toFixed(1) : '0.0'}, {character.position ? character.position.y.toFixed(1) : '0.0'})
      </div>
      
      {character.attributes && (
        <div className="attributes">
          <div className="panel-header">Attributes</div>
          <div className="attribute">STR: {character.attributes.strength?.value || 0}</div>
          <div className="attribute">DEX: {character.attributes.dexterity?.value || 0}</div>
          <div className="attribute">CON: {character.attributes.constitution?.value || 0}</div>
          <div className="attribute">INT: {character.attributes.intelligence?.value || 0}</div>
          <div className="attribute">WIS: {character.attributes.wisdom?.value || 0}</div>
          <div className="attribute">CHA: {character.attributes.charisma?.value || 0}</div>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;
