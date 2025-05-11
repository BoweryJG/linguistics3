import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Always set isAuthenticated to true and provide default user data
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState({
    id: 'default-user-id',
    name: 'Default User',
    email: 'user@example.com'
  });
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState({
    tier: 'premium',
    quota: 1000,
    usage: 0,
    resetDate: null
  });
  const [usageData, setUsageData] = useState({
    tier: 'premium',
    quota: 1000,
    usage: 0,
    reset_date: null
  });
  const [session, setSession] = useState({ access_token: 'mock-token' });
  const [error, setError] = useState(null);
  
  // Initialize with default values
  useEffect(() => {
    setLoading(false);
  }, []);
  
  // Mock function that returns default usage data
  const fetchUsageData = async () => {
    console.log('Mock fetchUsageData called');
    // No actual API call, just use default values
    const data = {
      tier: 'premium',
      quota: 1000,
      usage: 0,
      reset_date: null
    };
    
    setUsageData(data);
    setSubscription({
      tier: data.tier,
      quota: data.quota,
      usage: data.usage,
      resetDate: data.reset_date
    });
    
    return data;
  };
  
  // Mock login function that always succeeds
  const login = async (credentials) => {
    console.log('Mock login called with:', credentials);
    // No actual authentication, just return success
    return { 
      success: true,
      user: {
        id: 'default-user-id',
        name: 'Default User',
        email: credentials.email || 'user@example.com'
      },
      session: { access_token: 'mock-token' }
    };
  };
  
  // Mock signup function that always succeeds
  const signup = async (userData) => {
    console.log('Mock signup called with:', userData);
    // No actual registration, just return success
    return { 
      success: true,
      user: {
        id: 'default-user-id',
        name: userData.name || 'Default User',
        email: userData.email || 'user@example.com'
      }
    };
  };
  
  // Mock logout function that does nothing
  const logout = async () => {
    console.log('Mock logout called');
    // No actual logout, just return success
    return { success: true };
  };
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading,
      subscription,
      usageData,
      session,
      error,
      fetchUsageData,
      login,
      signup,
      logout,
      getInitials: (name) => {
        return name
          ?.split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
          .substring(0, 2) || 'JS';
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
