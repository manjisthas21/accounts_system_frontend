'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiHome, FiTag, FiBriefcase, FiUsers, FiLogOut, FiPhone } from 'react-icons/fi';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();

  // ❌ Hide on login page
  if (pathname === '/login') return null;

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: FiHome },
    { href: '/admin/business-types', label: 'Business Types', icon: FiTag },
    { href: '/admin/companies', label: 'Companies', icon: FiBriefcase },
    { href: '/admin/clients', label: 'Clients', icon: FiUsers },
    { href: '/admin/responsible-management', label: 'Responsible Persons', icon: FiPhone}
  ];

  return (
    <aside className="w-64 bg-indigo-900 text-white min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold">Accounts System</h1>
        <p className="text-sm text-indigo-300 mt-1">Admin Panel</p>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition ${
                isActive ? 'bg-indigo-800' : 'hover:bg-indigo-800'
              }`}
            >
              <Icon className="text-lg" />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-indigo-800 transition mt-4"
        >
          <FiLogOut className="text-lg" />
          Logout
        </button>
      </nav>
    </aside>
  );
}