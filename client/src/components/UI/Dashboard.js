import React, { useState } from 'react';
import { useGameStore } from '../../game/store';

const Dashboard = ({ character }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const resources = useGameStore(state => state.resources);
  const worldTime = useGameStore(state => state.worldTime);
  
  // Count total resources gathered
  const getTotalResourcesGathered = () => {
    if (!character || !character.inventory) return 0;
    
    return Object.values(character.inventory).reduce((sum, amount) => sum + amount, 0);
  };
  
  // Get resource counts by type
  const getResourceCounts = () => {
    if (!character || !character.inventory) return {};
    return character.inventory;
  };
  
  // Calculate active resources in the world
  const getActiveResourceCount = () => {
    if (!resources) return 0;
    return resources.filter(r => !r.depleted).length;
  };
  
  // Get resource distribution by type
  const getResourceDistribution = () => {
    if (!resources) return {};
    
    const distribution = {};
    resources.forEach(resource => {
      if (!resource.depleted) {
        if (!distribution[resource.type]) {
          distribution[resource.type] = 0;
        }
        distribution[resource.type]++;
      }
    });
    
    return distribution;
  };
  
  // Calculate player stats
  const getPlayerStats = () => {
    if (!character) return {};
    
    return {
      movementSpeed: character.moveSpeed || 'N/A',
      gatheringSpeed: character.gatherSpeed || 'N/A',
      totalGathered: getTotalResourcesGathered(),
      ...getResourceCounts()
    };
  };

  // Render the content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return renderStatsTab();
      case 'world':
        return renderWorldTab();
      case 'map':
        return renderMapTab();
      default:
        return renderStatsTab();
    }
  };
  
  // Render player stats tab
  const renderStatsTab = () => {
    const stats = getPlayerStats();
    const resourceCounts = getResourceCounts();
    
    return (
      <div className="tab-content">
        <h3>Player Statistics</h3>
        
        <div className="stat-group">
          <div className="stat-item">
            <span className="stat-label">Movement Speed:</span>
            <span className="stat-value">{stats.movementSpeed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Gathering Speed:</span>
            <span className="stat-value">{stats.gatheringSpeed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Items Gathered:</span>
            <span className="stat-value">{stats.totalGathered.toFixed(1)}</span>
          </div>
        </div>
        
        <h3>Resources Collected</h3>
        <div className="resource-chart">
          {Object.entries(resourceCounts).map(([type, amount]) => (
            <div key={type} className="resource-bar" style={{ marginBottom: '8px' }}>
              <div className="resource-label">
                <span style={{ 
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  marginRight: '5px',
                  backgroundColor: getResourceColor(type)
                }}></span>
                {type}:
              </div>
              <div className="resource-bar-outer" style={{ 
                width: '100%', 
                height: '12px', 
                backgroundColor: '#333', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div className="resource-bar-inner" style={{ 
                  width: `${Math.min(100, (amount / stats.totalGathered) * 100)}%`, 
                  height: '100%', 
                  backgroundColor: getResourceColor(type),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div className="resource-amount">{amount.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render world info tab
  const renderWorldTab = () => {
    const activeResources = getActiveResourceCount();
    const distribution = getResourceDistribution();
    
    return (
      <div className="tab-content">
        <h3>World Information</h3>
        
        <div className="stat-group">
          <div className="stat-item">
            <span className="stat-label">World Time:</span>
            <span className="stat-value">{worldTime}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Resources:</span>
            <span className="stat-value">{activeResources}</span>
          </div>
        </div>
        
        <h3>Resource Distribution</h3>
        <div className="resource-distribution">
          {Object.entries(distribution).map(([type, count]) => (
            <div key={type} className="dist-item">
              <div className="dist-label">
                <span style={{ 
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  marginRight: '5px',
                  backgroundColor: getResourceColor(type)
                }}></span>
                {type}:
              </div>
              <div className="dist-value">{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render mini-map tab
  const renderMapTab = () => {
    return (
      <div className="tab-content">
        <h3>World Map</h3>
        
        <div className="mini-map" style={{ 
          width: '100%', 
          height: '200px', 
          backgroundColor: '#111',
          border: '1px solid #444',
          borderRadius: '5px',
          position: 'relative'
        }}>
          {/* Draw resources on minimap */}
          {resources && resources.map(resource => !resource.depleted && (
            <div 
              key={resource.id}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: getResourceColor(resource.type),
                // Transform from game coordinates to minimap coordinates
                // Assuming game world is -30 to +30 on both axes
                left: `${((resource.position.x + 30) / 60) * 100}%`,
                top: `${((resource.position.y + 30) / 60) * 100}%`,
              }}
            />
          ))}
          
          {/* Draw player character on minimap */}
          {character && character.position && (
            <div 
              style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#1E90FF',
                border: '1px solid white',
                // Transform from game coordinates to minimap coordinates
                left: `${((character.position.x + 30) / 60) * 100}%`,
                top: `${((character.position.y + 30) / 60) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          )}
        </div>
        
        <div className="map-legend" style={{ marginTop: '10px' }}>
          <div className="legend-item">
            <span style={{ 
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#1E90FF',
              border: '1px solid white',
              marginRight: '5px'
            }}></span>
            Your Character
          </div>
          <div className="legend-item">
            <span style={{ 
              display: 'inline-block',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#8B4513',
              marginRight: '5px'
            }}></span>
            Wood
          </div>
          <div className="legend-item">
            <span style={{ 
              display: 'inline-block',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#A9A9A9',
              marginRight: '5px'
            }}></span>
            Stone
          </div>
          {/* More legend items for other resource types */}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard panel" style={{ 
      position: 'absolute',
      top: '70px',
      right: '10px',
      width: '300px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <div className="panel-header">Dashboard</div>
      
      <div className="dashboard-tabs" style={{ 
        display: 'flex', 
        borderBottom: '1px solid #444',
        marginBottom: '10px'
      }}>
        <div 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`} 
          onClick={() => setActiveTab('stats')}
          style={{ 
            padding: '5px 10px', 
            cursor: 'pointer',
            borderBottom: activeTab === 'stats' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'stats' ? '#ffd700' : 'inherit'
          }}
        >
          Stats
        </div>
        <div 
          className={`tab ${activeTab === 'world' ? 'active' : ''}`} 
          onClick={() => setActiveTab('world')}
          style={{ 
            padding: '5px 10px', 
            cursor: 'pointer',
            borderBottom: activeTab === 'world' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'world' ? '#ffd700' : 'inherit'
          }}
        >
          World
        </div>
        <div 
          className={`tab ${activeTab === 'map' ? 'active' : ''}`} 
          onClick={() => setActiveTab('map')}
          style={{ 
            padding: '5px 10px', 
            cursor: 'pointer',
            borderBottom: activeTab === 'map' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'map' ? '#ffd700' : 'inherit'
          }}
        >
          Map
        </div>
      </div>
      
      {renderTabContent()}
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

export default Dashboard;
