import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if token is valid and load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Check if token is expired
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expired
          logout();
          setLoading(false);
          return;
        }

        // Token is valid, load user data
        const response = await axios.get('/api/users/me');
        setCurrentUser(response.data.user);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        logout();
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/login', { email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage and state
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/register', { name, email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage and state
      localStorage.setItem('token', token);
      setToken(token);
      setCurrentUser(user);
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setError(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put('/api/users/profile', userData);
      setCurrentUser(response.data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  const value = {
    currentUser,
    isAuthenticated: !!token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
