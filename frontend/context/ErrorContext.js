'use client';
import React, { createContext, useState, useContext, useCallback } from 'react';
import ErrorModal from '@/components/ErrorModal';

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const showError = useCallback((msg) => setErrorMessage(msg), []);
  const hideError = useCallback(() => setErrorMessage(null), []);

  return (
    <ErrorContext.Provider value={{ showError, hideError }}>
      {children}
      <ErrorModal isOpen={Boolean(errorMessage)} message={errorMessage} onClose={hideError} />
    </ErrorContext.Provider>
  );
}

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error('useError deve ser usado dentro de um ErrorProvider');
  return context;
};