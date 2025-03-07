import { io } from 'socket.io-client';

// Socket.io connection singleton
let socket = null;

// Initialize the socket connection
export const initSocket = () => {
  if (socket) {
    console.log("Socket already initialized");
    return socket;
  }

  console.log("Initializing socket connection to server");
  
  // Get the current hostname or use relative URL
  // This will connect to the same host serving the client app
  const socketUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : `${window.location.protocol}//${window.location.hostname}:5000`;
  
  console.log(`Connecting to socket server at ${socketUrl}`);
  
  // Use the EXACT same configuration that worked in socket-test.html
  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    timeout: 10000
  });
  
  // Basic socket event listeners for debugging
  socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

// Get the existing socket or initialize a new one
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Clean up the socket connection
export const cleanupSocket = () => {
  if (socket) {
    console.log("Cleaning up socket connection");
    socket.disconnect();
    socket = null;
  }
};

// Request the game state
export const requestGameState = () => {
  if (socket && socket.connected) {
    socket.emit('requestGameState');
  } else {
    console.warn("Cannot request game state: socket not connected");
  }
};

// Initialize the socket immediately when this file is imported
initSocket();

// Export the socket for direct access
export default socket;
