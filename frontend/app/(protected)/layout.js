'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/SideBar';

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen pl-64"> {/* pl-64 compensa a sidebar fixa */}
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50 w-full">{children}</main>
    </div>
  );
}