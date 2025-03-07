import React, { useState, useEffect } from 'react';
import DraggablePanel from './common/DraggablePanel';
import { useGameStore } from '../../game/store';

// Icons (either use Lucide React if installed or create custom icons)
const IconComponent = ({ type }) => {
  switch (type) {
    case 'stats':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7"/>
          <path d="M17 12V3"/>
          <path d="M13 12v3"/>
          <path d="M13 21v-2"/>
          <path d="M9 21v-6"/>
          <path d="M9 9V3"/>
          <path d="M5 21v-4"/>
          <path d="M5 11V3"/>
        </svg>
      );
    case 'character':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      );
    case 'world':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
          <path d="M2 12h20"/>
        </svg>
      );
    case 'map':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <path d="M9 3v15"/>
          <path d="M15 6v15"/>
        </svg>
      );
    case 'settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      );
    default:
      return null;
  }
};

const EnhancedDashboard = ({ character }) => {
  const [activeTab, setActiveTab] = useState('character');
  const [showDashboard, setShowDashboard] = useState(true);
  const [autoGatherEnabled, setAutoGatherEnabled] = useState(true);
  const [selectedAttribute, setSelectedAttribute] = useState('strength');
  const [gatheringHistory, setGatheringHistory] = useState([]);

  const resources = useGameStore(state => state.resources);
  const worldTime = useGameStore(state => state.worldTime);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const socket = useGameStore(state => state.socket);
  
  // Add resource gathered to history (for tracking over time)
  useEffect(() => {
    if (character && character.inventory) {
      const totalGathered = Object.values(character.inventory).reduce((sum, amount) => sum + amount, 0);
      
      setGatheringHistory(prev => {
        const newHistory = [...prev, { 
          time: worldTime, 
          total: totalGathered,
          ...character.inventory
        }];
        
        // Keep last 20 data points
        if (newHistory.length > 20) {
          return newHistory.slice(newHistory.length - 20);
        }
        return newHistory;
      });
    }
  }, [character?.inventory, worldTime]);

  // Toggle auto-gathering behavior
  const toggleAutoGather = () => {
    const newState = !autoGatherEnabled;
    setAutoGatherEnabled(newState);
    
    // Send the auto-gather preference to the server
    if (socket) {
      socket.emit('setAutoGather', newState);
    }
    
    // Show a popup notification
    useGameStore.getState().showPopup(`Auto-gathering ${newState ? 'enabled' : 'disabled'}`);
  };

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
  
  // Calculate nearest resources
  const getNearestResources = () => {
    if (!character || !resources) return [];
    
    const playerPos = character.position;
    if (!playerPos) return [];
    
    return resources
      .filter(r => !r.depleted)
      .map(resource => {
        const dx = resource.position.x - playerPos.x;
        const dy = resource.position.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { ...resource, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Get 5 nearest resources
  };
  
  // Format character attributes for visualization
  const getAttributeData = () => {
    if (!character || !character.attributes) return [];
    
    return Object.entries(character.attributes).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === 'object' ? value.value || value.baseValue || 0 : value,
      fullName: attributeFullNames[key] || key
    }));
  };
  
  // Prepare gathering history data for the chart
  const getGatheringHistoryData = () => {
    // Return only every nth item to prevent chart overcrowding
    const stride = Math.max(1, Math.floor(gatheringHistory.length / 10));
    return gatheringHistory.filter((_, index) => index % stride === 0);
  };
  
  // Prepare inventory data for charts
  const getInventoryChartData = () => {
    if (!character || !character.inventory) return [];
    
    return Object.entries(character.inventory).map(([type, amount]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: amount,
      color: getResourceColor(type)
    }));
  };

  // Render the character tab content
  const renderCharacterTab = () => {
    if (!character) return <div>Character data unavailable</div>;
    
    const attributes = getAttributeData();
    
    return (
      <div className="tab-content">
        <h3 className="section-header">Character Overview</h3>
        
        <div className="character-header">
          <div className="character-avatar" style={{ 
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: character.state === 'gathering' ? '#32CD32' : 
                            character.state === 'moving' ? '#FFA500' : '#1E90FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            fontSize: '20px'
          }}>
            {character.name ? character.name.charAt(0) : '?'}
          </div>
          
          <div className="character-summary">
            <div className="character-name">{character.name}</div>
            <div className="character-status">
              {character.state?.charAt(0).toUpperCase() + character.state?.slice(1) || 'Idle'}
              {character.targetResource && ` (${character.targetResource.type})`}
            </div>
            <div className="character-position">
              Position: ({character.position?.x.toFixed(1)}, {character.position?.y.toFixed(1)})
            </div>
          </div>
        </div>
        
        <h3 className="section-header">Attributes</h3>
        <div className="attributes-grid">
          {attributes.map(attr => (
            <div 
              key={attr.name} 
              className={`attribute-item ${selectedAttribute === attr.name.toLowerCase() ? 'selected' : ''}`}
              onClick={() => setSelectedAttribute(attr.name.toLowerCase())}
              style={{
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '3px',
                margin: '2px',
                backgroundColor: selectedAttribute === attr.name.toLowerCase() ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                border: `1px solid ${selectedAttribute === attr.name.toLowerCase() ? '#ffd700' : '#444'}`
              }}
            >
              <div className="attribute-name">{attr.fullName}</div>
              <div className="attribute-value">
                <div className="attribute-bar-bg" style={{ 
                  width: '100%', 
                  height: '6px', 
                  backgroundColor: '#444',
                  borderRadius: '3px'
                }}>
                  <div className="attribute-bar-fill" style={{ 
                    width: `${Math.min(100, (attr.value / 20) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#ffd700',
                    borderRadius: '3px'
                  }}></div>
                </div>
                <div className="attribute-number">{attr.value}</div>
              </div>
            </div>
          ))}
        </div>
        
        <h3 className="section-header">Status</h3>
        <div className="status-bars">
          {character.health && (
            <div className="status-item">
              <div className="status-label">Health</div>
              <div className="status-bar-container" style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#444',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div className="status-bar-fill" style={{
                  width: `${(character.health.current / character.health.max) * 100}%`,
                  height: '100%',
                  backgroundColor: '#e74c3c',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div className="status-values">{Math.floor(character.health.current)} / {character.health.max}</div>
            </div>
          )}
          
          {character.stamina && (
            <div className="status-item">
              <div className="status-label">Stamina</div>
              <div className="status-bar-container" style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#444',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div className="status-bar-fill" style={{
                  width: `${(character.stamina.current / character.stamina.max) * 100}%`,
                  height: '100%',
                  backgroundColor: '#3498db',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div className="status-values">{Math.floor(character.stamina.current)} / {character.stamina.max}</div>
            </div>
          )}
          
          {character.needs && (
            <>
              {character.needs.hunger !== undefined && (
                <div className="status-item">
                  <div className="status-label">Hunger</div>
                  <div className="status-bar-container" style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#444',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div className="status-bar-fill" style={{
                      width: `${character.needs.hunger}%`,
                      height: '100%',
                      backgroundColor: '#f39c12',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div className="status-values">{Math.floor(character.needs.hunger)} / 100</div>
                </div>
              )}
              
              {character.needs.rest !== undefined && (
                <div className="status-item">
                  <div className="status-label">Rest</div>
                  <div className="status-bar-container" style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#444',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div className="status-bar-fill" style={{
                      width: `${character.needs.rest}%`,
                      height: '100%',
                      backgroundColor: '#9b59b6',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div className="status-values">{Math.floor(character.needs.rest)} / 100</div>
                </div>
              )}
              
              {character.needs.morale !== undefined && (
                <div className="status-item">
                  <div className="status-label">Morale</div>
                  <div className="status-bar-container" style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#444',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div className="status-bar-fill" style={{
                      width: `${character.needs.morale}%`,
                      height: '100%',
                      backgroundColor: '#2ecc71',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div className="status-values">{Math.floor(character.needs.morale)} / 100</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Render the stats tab content
  const renderStatsTab = () => {
    const inventoryData = getInventoryChartData();
    const resourceCounts = getResourceCounts();
    const gatheringData = getGatheringHistoryData();
    
    return (
      <div className="tab-content">
        <h3 className="section-header">Resources Collected</h3>
        
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-value">{Math.floor(getTotalResourcesGathered())}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Object.keys(resourceCounts).length}</div>
            <div className="stat-label">Resource Types</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{character?.moveSpeed?.toFixed(1) || '?'}</div>
            <div className="stat-label">Move Speed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{character?.gatherSpeed?.toFixed(1) || '?'}</div>
            <div className="stat-label">Gather Speed</div>
          </div>
        </div>
        
        <h3 className="section-header">Inventory Breakdown</h3>
        
        {inventoryData.length > 0 ? (
          <div className="resource-chart">
            {Object.entries(resourceCounts).map(([type, amount]) => (
              <div key={type} className="resource-bar-container" style={{ marginBottom: '8px' }}>
                <div className="resource-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    <span style={{ 
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      marginRight: '5px',
                      backgroundColor: getResourceColor(type)
                    }}></span>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  <span>{Math.floor(amount)}</span>
                </div>
                <div className="resource-bar-outer" style={{ 
                  width: '100%', 
                  height: '12px', 
                  backgroundColor: '#333', 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div className="resource-bar-inner" style={{ 
                    width: `${Math.min(100, (amount / getTotalResourcesGathered()) * 100)}%`, 
                    height: '100%', 
                    backgroundColor: getResourceColor(type),
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">You haven't collected any resources yet.</div>
        )}
        
        <h3 className="section-header">Gathering Progress</h3>
        {gatheringData.length > 1 ? (
          <div className="gathering-chart" style={{ 
            height: '150px', 
            marginTop: '10px',
            color: '#ccc'
          }}>
            {/* Simple line chart visualization */}
            <div className="chart-placeholder" style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px dashed #444',
              borderRadius: '5px',
              color: '#888'
            }}>
              [Gathering Progress Chart]
            </div>
          </div>
        ) : (
          <div className="empty-state">Not enough data to display chart yet.</div>
        )}
      </div>
    );
  };
  
  // Render the world tab content
  const renderWorldTab = () => {
    const activeResources = getActiveResourceCount();
    const distribution = getResourceDistribution();
    const nearestResources = getNearestResources();
    
    return (
      <div className="tab-content">
        <h3 className="section-header">World Information</h3>
        
        <div className="world-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div className="stat-card">
            <div className="stat-value">{worldTime}</div>
            <div className="stat-label">World Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeResources}</div>
            <div className="stat-label">Available Resources</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Object.keys(otherPlayers || {}).length}</div>
            <div className="stat-label">Other Players</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Object.keys(distribution).length}</div>
            <div className="stat-label">Resource Types</div>
          </div>
        </div>
        
        <h3 className="section-header">Resource Distribution</h3>
        <div className="resource-distribution" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
          gap: '10px',
          marginBottom: '15px'
        }}>
          {Object.entries(distribution).map(([type, count]) => (
            <div key={type} className="dist-item" style={{
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <div className="dist-circle" style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: getResourceColor(type),
                margin: '0 auto 5px'
              }}></div>
              <div className="dist-type" style={{ fontWeight: 'bold' }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              <div className="dist-count">{count}</div>
            </div>
          ))}
        </div>
        
        <h3 className="section-header">Nearby Resources</h3>
        {nearestResources.length > 0 ? (
          <div className="nearby-resources">
            {nearestResources.map(resource => (
              <div key={resource.id} className="nearby-resource" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px 0',
                borderBottom: '1px solid #333'
              }}>
                <div className="resource-type-indicator" style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getResourceColor(resource.type),
                  marginRight: '8px'
                }}></div>
                <div className="resource-info" style={{ flex: 1 }}>
                  <div className="resource-name">
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </div>
                  <div className="resource-amount" style={{ fontSize: '12px', opacity: 0.7 }}>
                    Amount: {Math.floor(resource.amount)}
                  </div>
                </div>
                <div className="resource-distance" style={{ textAlign: 'right' }}>
                  {resource.distance.toFixed(1)} units
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No resources nearby.</div>
        )}
      </div>
    );
  };
  
  // Render the map tab content
  const renderMapTab = () => {
    return (
      <div className="tab-content">
        <h3 className="section-header">World Map</h3>
        
        <div className="mini-map" style={{ 
          width: '100%', 
          height: '200px', 
          backgroundColor: '#111',
          border: '1px solid #444',
          borderRadius: '5px',
          position: 'relative',
          marginBottom: '10px'
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
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            />
          )}
          
          {/* Draw other players on minimap */}
          {otherPlayers && Object.values(otherPlayers).map(player => player.position && (
            <div 
              key={player.id}
              style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#FF69B4',
                // Transform from game coordinates to minimap coordinates
                left: `${((player.position.x + 30) / 60) * 100}%`,
                top: `${((player.position.y + 30) / 60) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
        
        <div className="map-legend" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '5px'
        }}>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
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
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#FF69B4',
              marginRight: '5px'
            }}></span>
            Other Players
          </div>
          {Object.entries(resourceTypeNames).map(([type, name]) => (
            <div key={type} className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                display: 'inline-block',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: getResourceColor(type),
                marginRight: '5px'
              }}></span>
              {name}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render the settings tab content
  const renderSettingsTab = () => {
    return (
      <div className="tab-content">
        <h3 className="section-header">Game Settings</h3>
        
        <div className="settings-list">
          <div className="setting-item" style={{
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '5px',
            marginBottom: '10px'
          }}>
            <div className="setting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="setting-name">Auto-Gathering</div>
              <div 
                className="setting-toggle" 
                onClick={toggleAutoGather}
                style={{
                  width: '40px',
                  height: '20px',
                  backgroundColor: autoGatherEnabled ? '#2ecc71' : '#333',
                  borderRadius: '10px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
              >
                <div className="toggle-handle" style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: '2px',
                  left: autoGatherEnabled ? '22px' : '2px',
                  transition: 'left 0.3s'
                }}></div>
              </div>
            </div>
            <div className="setting-description" style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
              When enabled, your character will automatically find and gather resources when idle.
            </div>
          </div>
          
          <div className="setting-item" style={{
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '5px',
            marginBottom: '10px'
          }}>
            <div className="setting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="setting-name">Sound Effects</div>
              <div 
                className="setting-toggle"
                style={{
                  width: '40px',
                  height: '20px',
                  backgroundColor: '#2ecc71',
                  borderRadius: '10px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <div className="toggle-handle" style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: '2px',
                  left: '22px'
                }}></div>
              </div>
            </div>
            <div className="setting-description" style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
              Play sound effects for game events (resource gathering, depleted resources, etc).
            </div>
          </div>
          
          <div className="setting-item" style={{
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '5px',
            marginBottom: '10px'
          }}>
            <div className="setting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="setting-name">Display Name</div>
              <div className="setting-value" style={{ fontSize: '14px' }}>
                {character?.name || 'Unknown'}
              </div>
            </div>
            <div className="setting-input" style={{ marginTop: '5px' }}>
              <input 
                type="text" 
                placeholder="Enter new name" 
                style={{
                  width: '100%',
                  padding: '5px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid #444',
                  borderRadius: '3px',
                  color: '#fff'
                }}
              />
            </div>
            <button 
              style={{
                padding: '5px 10px',
                backgroundColor: '#3498db',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
                cursor: 'pointer',
                marginTop: '5px'
              }}
            >
              Change Name
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Determine which tab content to display
  const renderTabContent = () => {
    switch (activeTab) {
      case 'character':
        return renderCharacterTab();
      case 'stats':
        return renderStatsTab();
      case 'world':
        return renderWorldTab();
      case 'map':
        return renderMapTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderCharacterTab();
    }
  };

  if (!showDashboard) {
    // Show only the toggle button when dashboard is collapsed
    return (
      <div 
        className="dashboard-toggle"
        onClick={() => setShowDashboard(true)}
        style={{
          position: 'absolute',
          top: '70px',
          right: '10px',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid #444',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 3
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </div>
    );
  }

  return (
    <DraggablePanel
      id="enhanced-dashboard"
      title="Idleverse Dashboard"
      defaultPosition={{ x: window.innerWidth - 330, y: 70 }}
      onClose={() => setShowDashboard(false)}
      style={{ width: '320px', maxHeight: '500px' }}
    >
      
      <div className="dashboard-tabs" style={{ 
        display: 'flex', 
        borderBottom: '1px solid #444',
        overflow: 'auto',
        scrollbarWidth: 'none', // Hide scrollbar for Firefox
        msOverflowStyle: 'none', // Hide scrollbar for IE
        whiteSpace: 'nowrap'
      }}>
        <div 
          className={`tab ${activeTab === 'character' ? 'active' : ''}`} 
          onClick={() => setActiveTab('character')}
          style={{ 
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'character' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'character' ? '#ffd700' : 'inherit',
            transition: 'color 0.3s'
          }}
        >
          <IconComponent type="character" />
          <span>Character</span>
        </div>
        <div 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`} 
          onClick={() => setActiveTab('stats')}
          style={{ 
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'stats' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'stats' ? '#ffd700' : 'inherit',
            transition: 'color 0.3s'
          }}
        >
          <IconComponent type="stats" />
          <span>Stats</span>
        </div>
        <div 
          className={`tab ${activeTab === 'world' ? 'active' : ''}`} 
          onClick={() => setActiveTab('world')}
          style={{ 
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'world' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'world' ? '#ffd700' : 'inherit',
            transition: 'color 0.3s'
          }}
        >
          <IconComponent type="world" />
          <span>World</span>
        </div>
        <div 
          className={`tab ${activeTab === 'map' ? 'active' : ''}`} 
          onClick={() => setActiveTab('map')}
          style={{ 
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'map' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'map' ? '#ffd700' : 'inherit',
            transition: 'color 0.3s'
          }}
        >
          <IconComponent type="map" />
          <span>Map</span>
        </div>
        <div 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('settings')}
          style={{ 
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            borderBottom: activeTab === 'settings' ? '2px solid #ffd700' : 'none',
            color: activeTab === 'settings' ? '#ffd700' : 'inherit',
            transition: 'color 0.3s'
          }}
        >
          <IconComponent type="settings" />
          <span>Settings</span>
        </div>
      </div>
      
      <div className="dashboard-content" style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '10px'
      }}>
        {renderTabContent()}
      </div>
    </DraggablePanel>
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

// Resource type display names
const resourceTypeNames = {
  'wood': 'Wood',
  'stone': 'Stone',
  'food': 'Food',
  'iron': 'Iron',
  'herbs': 'Herbs'
};

// Attribute full names
const attributeFullNames = {
  'strength': 'Strength',
  'dexterity': 'Dexterity',
  'constitution': 'Constitution',
  'intelligence': 'Intelligence',
  'wisdom': 'Wisdom',
  'charisma': 'Charisma'
};

export default EnhancedDashboard;