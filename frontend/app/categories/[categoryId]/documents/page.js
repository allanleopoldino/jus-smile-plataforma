'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, } from 'next/navigation';
import Link from 'next/link';

export default function DocumentListPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchDocuments = async () => {
      if (!categoryId) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/categories/${categoryId}/documents`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        } else {
          console.error('Falha ao buscar documentos');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Erro de rede:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [categoryId, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Carregando documentos...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-brand-brown">Documentos</h1>
          <Link href="/dashboard" className="text-brand-brown hover:underline">
            &larr; Voltar para o Dashboard
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Documentos da Categoria
        </h2>
        <div className="space-y-4">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-bold text-lg text-gray-800">{doc.title}</h3>
                <p className="text-gray-600 mt-2">{doc.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhum documento encontrado nesta categoria.</p>
          )}
        </div>
      </main>
    </div>
  );
}