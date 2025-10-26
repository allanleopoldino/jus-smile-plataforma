'use client';

import React, { createContext, useState, useContext, useCallback } from 'react';
import ErrorModal from '@/components/ErrorModal';


const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [errorMessage, setErrorMessage] = useState(null);

  const showError = useCallback((message) => {
    setErrorMessage(message);
  }, []);

  const hideError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const value = { showError, hideError };

  return (
    <ErrorContext.Provider value={value}>
      {children} 
      
      {/* O Modal de Erro*/}
      <ErrorModal
        isOpen={Boolean(errorMessage)}
        message={errorMessage}
        onClose={hideError}
      />
    </ErrorContext.Provider>
  );
}

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError deve ser usado dentro de um ErrorProvider');
  }
  return context;
};