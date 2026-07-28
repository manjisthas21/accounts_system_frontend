'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiFileText, FiBarChart2, FiPlusCircle } from 'react-icons/fi';

export default function UserDashboard() {
  const { user } = useAuth();

  if (!user || user.role === 'admin') {
    return null;
  }

  const menuItems = [
    {
      title: 'Transactions',
      description: 'Add and manage your billing transactions',
      icon: FiFileText,
      href: '/user/transactions',
      color: 'bg-blue-500',
    },
    {
      title: 'Reports',
      description: 'View billing and collection reports',
      icon: FiBarChart2,
      href: '/user/reports',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user.name || user.username}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
              <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <item.icon className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}