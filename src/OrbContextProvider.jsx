import React, { createContext, useContext, useState } from 'react';

// Create a context for Orb styling and functionality
const OrbContext = createContext({
  gradientColors: {
    start: '#7B42F6',
    end: '#00ffc6'
  }
});

// Custom hook for accessing the Orb context
export const useOrbContext = () => useContext(OrbContext);

// Provider component that wraps app and provides the Orb context value
export default function OrbContextProvider({ children }) {
  // Default gradient colors
  const [gradientColors, setGradientColors] = useState({
    start: '#7B42F6',
    end: '#00ffc6'
  });

  // Context value
  const contextValue = {
    gradientColors,
    setGradientColors
  };

  return (
    <OrbContext.Provider value={contextValue}>
      {children}
    </OrbContext.Provider>
  );
}
