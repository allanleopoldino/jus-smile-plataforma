'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]); // State para armazenar as categorias
  const [loading, setLoading] = useState(true); // State para indicar carregamento

  // useEffect é executado depois que o componente é renderizado na tela
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return; // Para a execução do código
    }

    const fetchCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/categories`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data); // Armazena as categorias no state
        } else {
          // Se o token for inválido, a API retornará um erro (ex: 401)
          console.error('Falha ao buscar categorias, token inválido?');
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Erro de rede ao buscar categorias:', error);
      } finally {
        setLoading(false); // Finaliza o carregamento, independentemente do resultado
      }
    };

    fetchCategories();
  }, [router]); // O array vazio [] faz com que o useEffect rode apenas uma vez

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove o token
    router.push('/login'); // Redireciona para o login
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-brand-brown">Jus Smile Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Categorias de Documentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link href={`/categories/${category.id}/documents`} key={category.id}>
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg hover:ring-2 hover:ring-brand-brown transition-all cursor-pointer h-full">
                <h3 className="font-bold text-lg text-brand-brown">{category.name}</h3>
                <p className="text-gray-600 mt-2">{category.description}</p>
                </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}