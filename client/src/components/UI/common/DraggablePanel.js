import React, { useState, useRef, useEffect } from 'react';

/**
 * A draggable and resizable panel component that can be used to wrap any content
 * Props:
 * - id: Unique identifier for the panel (used for position storage)
 * - defaultPosition: { x, y } - Default position if none saved
 * - defaultSize: { width, height } - Default size if none saved
 * - minSize: { width, height } - Minimum size constraints
 * - maxSize: { width, height } - Maximum size constraints
 * - resizable: Boolean or array of sides to make resizable ['top', 'right', 'bottom', 'left']
 * - title: Panel title
 * - className: Additional CSS classes
 * - style: Additional inline styles
 * - children: Panel content
 * - onClose: Close button handler
 */
const DraggablePanel = ({
  id,
  defaultPosition = { x: 10, y: 10 },
  title,
  className = '',
  style = {},
  children,
  onClose = null,
}) => {
  // Get saved position from localStorage or use default
  const getSavedPosition = () => {
    try {
      const savedPositions = JSON.parse(localStorage.getItem('idleverse_panel_positions') || '{}');
      return savedPositions[id] || defaultPosition;
    } catch (err) {
      console.error('Error getting saved position:', err);
      return defaultPosition;
    }
  };

  // State for panel position
  const [position, setPosition] = useState(getSavedPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Ref for the panel
  const panelRef = useRef(null);

  // Save position to localStorage
  const savePosition = (pos) => {
    try {
      const savedPositions = JSON.parse(localStorage.getItem('idleverse_panel_positions') || '{}');
      savedPositions[id] = pos;
      localStorage.setItem('idleverse_panel_positions', JSON.stringify(savedPositions));
    } catch (err) {
      console.error('Error saving position:', err);
    }
  };

  // Start dragging
  const handleDragStart = (e) => {
    if (e.target.closest('.panel-content')) return; // Don't drag when clicking content
    if (e.target.closest('.action-button')) return; // Don't drag when clicking buttons
    
    setIsDragging(true);
    
    const boundingRect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - boundingRect.left,
      y: e.clientY - boundingRect.top
    });
    
    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    // Keep panel within window bounds
    if (newPosition.x < 0) newPosition.x = 0;
    if (newPosition.y < 0) newPosition.y = 0;
    if (newPosition.x > window.innerWidth - 100) newPosition.x = window.innerWidth - 100;
    if (newPosition.y > window.innerHeight - 40) newPosition.y = window.innerHeight - 40;
    
    setPosition(newPosition);
  };

  // Stop dragging
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position);
    }
  };

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset]);

  // Handle window resize to keep panels in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prevPos => {
        const newPos = { ...prevPos };
        
        if (newPos.x > window.innerWidth - 100) newPos.x = window.innerWidth - 100;
        if (newPos.y > window.innerHeight - 40) newPos.y = window.innerHeight - 40;
        
        savePosition(newPos);
        return newPos;
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={panelRef}
      className={`draggable-panel panel ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '1px solid #444',
        borderRadius: '5px',
        color: '#fff',
        zIndex: isDragging ? 1000 : 3,
        boxShadow: isDragging ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
        ...style
      }}
    >
      {/* Panel header - draggable area */}
      <div
        className="panel-header"
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #444',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ffd700',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          userSelect: 'none'
        }}
        onMouseDown={handleDragStart}
      >
        <span>{title}</span>
        
        <div className="panel-controls">
          {onClose && (
            <button
              className="action-button close-button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0 5px',
                marginLeft: '5px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Panel content */}
      <div className="panel-content" style={{ padding: '10px' }}>
        {children}
      </div>
    </div>
  );
};

// Static method to reset all panel positions
DraggablePanel.resetAllPositions = () => {
  localStorage.removeItem('idleverse_panel_positions');
  window.location.reload();
};

export default DraggablePanel;
