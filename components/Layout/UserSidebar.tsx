'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiHome, FiFileText, FiBarChart2, FiLogOut , FiCreditCard, FiUsers,

} from 'react-icons/fi';
import {
  FaMoneyBillWave,
  FaWallet,
  FaCoins,
} from "react-icons/fa";

export default function UserSidebar() {
   const { user } = useAuth();
  const { logout } = useAuth();
  const pathname = usePathname();

  // ❌ Hide sidebar on login page
  if (pathname === '/login') return null;

  if (user?.role === 'hod') {
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={logout}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        <FiLogOut className="text-lg" />
        Logout
      </button>
    </div>
  );
}

  const menuItems = [
    { href: '/user', label: 'Dashboard', icon: FiHome },
    { href: '/user/transactions', label: 'Transactions', icon: FiFileText },
    { href: '/user/reports', label: 'Reports', icon: FiBarChart2 },
    { href: '/user/onAccount', label: 'On Account Balance', icon: FaMoneyBillWave },
    { href: '/user/Activitylog', label: 'Activity Log', icon: FiUsers },
    

  ];

  return (
    <aside className="w-64 bg-indigo-900 text-white min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold">Accounts System</h1>
        <p className="text-sm text-indigo-300 mt-1">User Dashboard</p>
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