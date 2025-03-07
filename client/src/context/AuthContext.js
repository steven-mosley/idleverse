import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
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
          // Set auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          const res = await axios.get('/api/auth/me');
          setUser(res.data.user);
          setError(null);
        } catch (err) {
          console.error('Authentication error:', err);
          
          // Clear invalid token
          localStorage.removeItem('idleverse_token');
          setToken(null);
          setUser(null);
          
          delete axios.defaults.headers.common['Authorization'];
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
      
      const res = await axios.post('/api/auth/register', userData);
      
      if (res.data.token) {
        localStorage.setItem('idleverse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setError(null);
        
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      
      const res = await axios.post('/api/auth/login', userData);
      
      if (res.data.token) {
        localStorage.setItem('idleverse_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setError(null);
        
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
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
