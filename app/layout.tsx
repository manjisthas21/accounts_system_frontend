'use client';

import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import AdminSidebar from '@/components/Layout/AdminSidebar';
import UserSidebar from '@/components/Layout/UserSidebar';

// Sidebar
function SidebarWrapper() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === 'admin' ? <AdminSidebar /> : <UserSidebar />;
}

// Layout wrapper
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // 🔥 NOT LOGGED IN → no sidebar, no margin
  if (!user) {
    return <>{children}</>;
  }

  // 🔥 LOGGED IN → sidebar + proper layout
  return (
    <div className="flex min-h-screen">
      <SidebarWrapper />

      <main className="flex-1 ml-64 p-6 overflow-x-auto">
        {children}
      </main>
    </div>
  );
}

// Root Layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Toaster position="top-right" />
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}