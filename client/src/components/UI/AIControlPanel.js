import React, { useState, useEffect } from 'react';
import DraggablePanel from './common/DraggablePanel';

const AIControlPanel = () => {
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch AI status on mount
  useEffect(() => {
    fetchAIStatus();
  }, []);
  
  // Fetch current AI status
  const fetchAIStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setAiStatus(data.ai);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI status:', err);
      setError('Failed to load AI status');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle AI system
  const toggleAI = async () => {
    try {
      setLoading(true);
      const newEnabledState = !aiStatus.enabled;
      
      const response = await fetch('/api/ai/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newEnabledState })
      });
      
      const data = await response.json();
      setAiStatus(data.ai);
      setError(null);
    } catch (err) {
      console.error('Error toggling AI system:', err);
      setError('Failed to toggle AI system');
    } finally {
      setLoading(false);
    }
  };
  
  // Update AI configuration
  const updateAIConfig = async (config) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      setAiStatus(data.ai);
      setError(null);
    } catch (err) {
      console.error('Error updating AI config:', err);
      setError('Failed to update AI configuration');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle population slider change
  const handlePopulationChange = (e) => {
    const value = parseInt(e.target.value, 10);
    updateAIConfig({
      defaultPopulation: value
    });
  };
  
  if (loading && !aiStatus) {
    return (
      <DraggablePanel
        id="ai-control-panel"
        title="AI Controls"
        defaultPosition={{ x: window.innerWidth - 320, y: window.innerHeight - 300 }}
      >
        <div>Loading AI status...</div>
      </DraggablePanel>
    );
  }
  
  if (error && !aiStatus) {
    return (
      <DraggablePanel
        id="ai-control-panel"
        title="AI Controls"
        defaultPosition={{ x: window.innerWidth - 320, y: window.innerHeight - 300 }}
      >
        <div style={{ color: 'red' }}>{error}</div>
        <button 
          onClick={fetchAIStatus} 
          style={{
            padding: '5px 10px',
            marginTop: '10px',
            background: '#1E90FF',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </DraggablePanel>
    );
  }
  
  if (!aiStatus) return null;
  
  return (
    <DraggablePanel
      id="ai-control-panel"
      title="AI Controls"
      defaultPosition={{ x: window.innerWidth - 320, y: window.innerHeight - 300 }}
    >
      <div className="ai-status-info" style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>AI System:</div>
          <div 
            style={{
              padding: '3px 8px',
              borderRadius: '3px',
              backgroundColor: aiStatus.enabled ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)',
              color: aiStatus.enabled ? '#2ecc71' : '#e74c3c'
            }}
          >
            {aiStatus.enabled ? 'ENABLED' : 'DISABLED'}
          </div>
        </div>
        
        <div 
          className="toggle-button" 
          onClick={toggleAI}
          style={{
            width: '100%',
            padding: '8px',
            textAlign: 'center',
            backgroundColor: aiStatus.enabled ? '#e74c3c' : '#2ecc71',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px',
            fontWeight: 'bold'
          }}
        >
          {aiStatus.enabled ? 'DISABLE AI' : 'ENABLE AI'}
        </div>
      </div>
      
      <div className="ai-population" style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '5px' }}>AI Population: {aiStatus.population.total} characters</div>
        
        <input 
          type="range" 
          min="0" 
          max="20" 
          value={aiStatus.config.defaultPopulation} 
          onChange={handlePopulationChange}
          style={{ width: '100%' }}
          disabled={loading}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '12px',
          opacity: 0.7,
          marginTop: '2px'
        }}>
          <span>0</span>
          <span>10</span>
          <span>20</span>
        </div>
      </div>
      
      {aiStatus.population.total > 0 && (
        <div className="ai-breakdown">
          <div style={{ marginBottom: '5px' }}>AI Type Breakdown:</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <div>Gatherers: {aiStatus.population.gatherer || 0}</div>
            <div>Explorers: {aiStatus.population.explorer || 0}</div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <div>Defenders: {aiStatus.population.defender || 0}</div>
            <div>Traders: {aiStatus.population.trader || 0}</div>
          </div>
        </div>
      )}
    </DraggablePanel>
  );
};

export default AIControlPanel;
