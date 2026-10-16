'use client';

import Link from 'next/link';
import { FiTag, FiBriefcase, FiUsers, FiPhone } from 'react-icons/fi';

export default function AdminDashboard() {
  const menuItems = [
    {
      title: 'Business Types',
      description: 'Manage business types',
      icon: FiTag,
      href: '/admin/business-types',
      color: 'bg-blue-500',
    },
    {
      title: 'Companies',
      description: 'Manage companies and their business types',
      icon: FiBriefcase,
      href: '/admin/companies',
      color: 'bg-green-500',
    },
    {
      title: 'Clients',
      description: 'Manage clients and company',
      icon: FiUsers,
      href: '/admin/clients',
      color: 'bg-purple-500',
    },
    {
      title: 'Responsible Persons',
      description: 'Manage responsible persons',
      icon: FiPhone,
      href: '/admin/responsible-management',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome to Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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