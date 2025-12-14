'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: '+ Novo Contrato', href: '/contratos/novo', primary: true },
  { name: 'Pacientes', href: '/pacientes' },
  { name: 'Clínica', href: '/clinica' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white shadow-md h-screen flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b"><h1 className="text-2xl font-bold text-brand-brown">Jus Smile</h1></div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.name} href={item.href} className={`block rounded-md py-2 px-3 transition-colors ${item.primary ? 'bg-brand-brown text-white text-center font-bold hover:opacity-90' : pathname.startsWith(item.href) ? 'text-brand-brown font-bold bg-gray-50' : 'text-gray-700 hover:bg-gray-100'}`}>
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}