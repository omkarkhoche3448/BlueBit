import React, { createContext, useContext } from 'react';
import useProStatus from '../hooks/useProStatus';

// Create the context
const ProStatusContext = createContext(null);

// Provider component
export const ProStatusProvider = ({ children }) => {
  const proStatus = useProStatus();
  
  return (
    <ProStatusContext.Provider value={proStatus}>
      {children}
    </ProStatusContext.Provider>
  );
};

// Custom hook to use the context
export const useProStatusContext = () => {
  const context = useContext(ProStatusContext);
  if (context === null) {
    throw new Error('useProStatusContext must be used within a ProStatusProvider');
  }
  return context;
};