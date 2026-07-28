'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();



  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 🔐 LOGIN
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });

      if (response.data) {

        const token = response.data.access_token;

        // ✅ decode here (INSIDE function)
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userData = {
          id: decoded.user_id,          // ✅ THIS IS THE FIX
          username: decoded.sub,
          role: decoded.role,
          name: response.data.name || decoded.sub,
          access_token: token
        };

        // ✅ Save in localStorage (for UI)
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // ✅ Save in cookies (for middleware)
        document.cookie = `token=${userData.access_token}; path=/; SameSite=Lax`;
        document.cookie = `role=${userData.role}; path=/; SameSite=Lax`;

        toast.success(`Welcome ${userData.name}!`);

        // ✅ FORCE reload so middleware works
        if (userData.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/user';
        }

        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
      return false;
    }
  };

  // 📝 REGISTER
  const register = async (userData) => {
    try {
      const payload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: 'user'
      };

      const response = await authAPI.register(payload);

      if (response.data) {
        toast.success('Registration successful! Please login.');
        router.push('/login');
        return true;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      return false;
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    // Remove localStorage
    localStorage.removeItem('user');

    // Remove cookies
    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'role=; path=/; max-age=0';

    setUser(null);

    toast.success('Logged out successfully');

    // Force reload
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}