'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'Essencial' // Valor padrão
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Conta criada com sucesso! Faça login.');
        router.push('/login');
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-brand-brown mb-6">Crie sua Conta</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input name="name" type="text" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input name="email" type="email" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input name="password" type="password" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Plano</label>
            <select name="plan" onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md">
              <option value="Essencial">Essencial</option>
              <option value="Profissional">Profissional</option>
              <option value="Completo">Completo</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-brand-brown text-white py-2 rounded-md font-bold hover:opacity-90">
            Cadastrar
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta? <Link href="/login" className="text-brand-brown hover:underline">Faça Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}