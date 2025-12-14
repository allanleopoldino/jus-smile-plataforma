'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useApi() {
  const router = useRouter();

  const apiFetch = useCallback(async (urlPath, options = {}) => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}${urlPath}`, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
      throw new Error('Sua sessão expirou.');
    }
    return response;
  }, [router]);

  return apiFetch;
}