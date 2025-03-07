import React, { createContext, useState, useEffect } from 'react';
import { useGameStore } from '../game/store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('idleverse_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const socket = useGameStore(state => state.socket);
  
  // Check if user is logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (token) {
        try {
          // Make request with auth header
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Authentication failed');
          }
          
          const data = await response.json();
          setUser(data.user);
          setError(null);
        } catch (err) {
          console.error('Authentication error:', err);
          
          // Clear invalid token
          localStorage.removeItem('idleverse_token');
          setToken(null);
          setUser(null);
          setError('Session expired. Please log in again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, [token]);
  
  // Authenticate the socket connection when logged in and socket is available
  useEffect(() => {
    if (token && socket) {
      console.log('Authenticating socket connection');
      socket.auth = { token };
      
      // If socket is already connected, emit authenticate event
      if (socket.connected) {
        socket.emit('authenticate', { token });
      }
      // Otherwise it will be authenticated on connection
    }
  }, [token, socket]);
  
  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('idleverse_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setError(null);
        
        return true;
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('idleverse_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setError(null);
        
        return true;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('idleverse_token');
    setToken(null);
    setUser(null);
    
    // Reconnect socket without authentication
    if (socket) {
      socket.disconnect().connect();
    }
  };
  
  // Join as guest
  const joinAsGuest = (name) => {
    if (socket) {
      socket.emit('joinAsGuest', { name });
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        joinAsGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
