'use client';

import { useRouter } from 'next/navigation';

export function useApi() {
  const router = useRouter();
  const apiFetch = async (urlPath, options = {}) => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}${urlPath}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');

      throw new Error('Sua sessão expirou. Por favor, faça o login novamente.'); 
    }

    return response;
  };

  return apiFetch;
}