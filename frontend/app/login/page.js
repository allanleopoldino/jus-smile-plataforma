'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter(); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); 

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                alert('Login realizado com sucesso!');
                localStorage.setItem('token', data.token); // Salva o token no navegador
                router.push('/dashboard'); // Redireciona para a página de dashboard
            } else {
                // Erro de login vindo da API (ex: senha errada)
                setError(data.error || 'Ocorreu um erro no login.');
            }
        } catch (err) {
            // Erro de rede (ex: back-end não está rodando)
            setError('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <Image
                        src="/logo-jussmile.svg"
                        alt="Logo Jus Smile"
                        width={180}
                        height={60}
                        className="mx-auto"
                    />
                    <h1 className="text-3xl font-bold text-brand-brown">Jus Smile</h1>
                    <p className="text-gray-500">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Mostra a mensagem de erro, se houver */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Campos de e-mail e senha (sem alterações) */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-brown focus:border-brand-brown" required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-brown focus:border-brand-brown" required />
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-brown hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-brown">Entrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}