'use client';

import React from 'react';

export default function ErrorModal({ message, isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-red-600 mb-4">Ocorreu um Erro</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-brand-brown text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90"
        >
          Ok
        </button>
      </div>
    </div>
  );
}