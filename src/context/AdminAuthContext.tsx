
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AdminUser = {
  id: string;
  email: string;
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin user exists in localStorage on initial load
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (error) {
        console.error('Error parsing stored admin user:', error);
        localStorage.removeItem('admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', email);
      
      // Call the RPC function to verify admin credentials
      const { data, error } = await supabase.rpc('check_admin_login', {
        email_input: email,
        password_input: password,
      });
      
      console.log('Login RPC response:', { data, error });

      if (error) {
        console.error('Login RPC error:', error);
        setIsLoading(false);
        return { error: error.message };
      }

      if (data) {
        // Data will be the user ID if successful
        console.log('Login successful, user ID:', data);
        const adminUser = { id: data, email };
        setAdminUser(adminUser);
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        setIsLoading(false);
        return { error: null };
      } else {
        console.log('Invalid credentials: No user ID returned');
        setIsLoading(false);
        return { error: 'Invalid credentials' };
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      setIsLoading(false);
      return { error: error.message || 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    setAdminUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
