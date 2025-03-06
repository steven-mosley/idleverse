import React, { useState, useEffect } from 'react';

const InventoryPanel = ({ character, receivedGameState }) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log("InventoryPanel: Rendered with character:", character);
    
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
      <div className="panel inventory-panel">
        <div className="panel-header">Inventory</div>
        <div>Loading inventory...</div>
      </div>
    );
  }

  const inventory = character?.inventory || {};
  const hasItems = Object.keys(inventory).length > 0;

  return (
    <div className="panel inventory-panel">
      <div className="panel-header">Inventory</div>
      
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {!hasItems && (
          <li style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '14px' }}>
            Your backpack is empty
          </li>
        )}
        
        {hasItems && Object.entries(inventory).map(([type, amount]) => (
          <li key={type} style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: '14px' }}>
            <span>
              <span 
                style={{ 
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  marginRight: '5px',
                  backgroundColor: getResourceColor(type)
                }}
              />
              <span style={{ color: getResourceColor(type) }}>{type}</span>
            </span>
            <span>{Math.floor(amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to get resource colors
const getResourceColor = (type) => {
  switch(type) {
    case 'wood': return '#CD853F';
    case 'stone': return '#A9A9A9';
    case 'food': return '#FF6347';
    case 'iron': return '#B0C4DE';
    case 'herbs': return '#90EE90';
    default: return '#FFC107';
  }
};

export default InventoryPanel;
