import React, { useState, useEffect, useRef } from 'react';
import socket from '../../socket';

const ChatPanel = ({ playerName, messages = [], setMessages, connected }) => {
  const [message, setMessage] = useState('');
  const messagesRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize chat with welcome message only once
  useEffect(() => {
    if (!initialized && setMessages) {
      setMessages([{
        playerId: 'system',
        playerName: 'System',
        message: 'Welcome to Idleverse!'
      }]);
      setInitialized(true);
    }
  }, [initialized, setMessages]);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (message.trim() && socket && socket.connected) {
      console.log("ChatPanel: Sending message:", message);
      
      // Only emit to server, don't add locally
      // The server will broadcast back to all clients including sender
      socket.emit('chatMessage', message);
      
      // Clear input field
      setMessage('');
    } else if (message.trim() && (!socket || !socket.connected)) {
      // Show error message for disconnected state
      if (setMessages) {
        setMessages(prev => [...prev, {
          playerId: 'system',
          playerName: 'System',
          message: 'Unable to send message: disconnected from server'
        }]);
      }
      setMessage('');
    }
  };

  return (
    <div className="chat-container panel">
      <div className="panel-header">Chat</div>
      
      <div 
        className="chat-messages" 
        ref={messagesRef}
        style={{ 
          height: '150px',
          overflowY: 'auto',
          marginBottom: '10px',
          padding: '5px'
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <span style={{ 
              fontWeight: 'bold', 
              color: msg.playerId === 'system' ? '#ff9900' :
                     msg.playerName === playerName ? '#90EE90' : '#ADD8E6' 
            }}>
              {msg.playerName}:
            </span>{' '}
            <span style={{
              fontStyle: msg.playerId === 'system' ? 'italic' : 'normal'
            }}>
              {msg.message}
            </span>
          </div>
        ))}
        
        {!connected && (
          <div style={{ color: '#ff6666', fontStyle: 'italic' }}>
            Disconnected from chat server
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={connected ? "Press Enter to chat..." : "Reconnecting..."}
          disabled={!connected}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '3px',
            border: 'none',
            backgroundColor: connected ? 'white' : '#f0f0f0'
          }}
        />
      </form>
    </div>
  );
};

export default ChatPanel;
