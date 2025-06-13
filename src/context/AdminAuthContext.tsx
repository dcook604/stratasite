import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminCredentials } from '@/lib/auth';
import SessionTimeoutWarning from '@/components/shared/SessionTimeoutWarning';
import { useToast } from '@/components/ui/use-toast';

type AdminUser = {
  id: string;
  email: string;
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: (isInactive?: boolean) => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// A helper component to handle navigation since hooks can only be called in components
const NavigationHandler = ({ onNavigate }: { onNavigate: (navigate: Function) => void }) => {
  const navigate = useNavigate();
  useEffect(() => {
    onNavigate(navigate);
  }, [navigate, onNavigate]);
  return null;
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const { toast } = useToast();

  const logoutTimer = useRef<NodeJS.Timeout>();
  const warningTimer = useRef<NodeJS.Timeout>();
  const countdownTimer = useRef<NodeJS.Timeout>();
  const navigateRef = useRef<Function | null>(null);

  const logout = useCallback(async (isInactive = false) => {
    setAdminUser(null);
    localStorage.removeItem('admin_user');
    setWarningModalOpen(false);
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownTimer.current);

    if (isInactive) {
      if (navigateRef.current) {
        navigateRef.current('/', { 
          state: { message: 'You have been logged out due to inactivity.' } 
        });
      }
    } else {
      if (navigateRef.current) {
        navigateRef.current('/');
      }
    }
  }, []);

  const resetTimers = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownTimer.current);
    setWarningModalOpen(false);
    setCountdown(60);

    if (adminUser) {
      // Show warning after 29 minutes of inactivity
      warningTimer.current = setTimeout(() => {
        setWarningModalOpen(true);
        // Start countdown
        countdownTimer.current = setInterval(() => {
          setCountdown(prev => prev - 1);
        }, 1000);
      }, 29 * 60 * 1000); // 29 minutes

      // Logout after 30 minutes of inactivity
      logoutTimer.current = setTimeout(() => {
        logout(true);
      }, 30 * 60 * 1000); // 30 minutes
    }
  }, [adminUser, logout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimers();
    };

    if (adminUser) {
      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      resetTimers();
    }

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(logoutTimer.current);
      clearTimeout(warningTimer.current);
      clearInterval(countdownTimer.current);
    };
  }, [adminUser, resetTimers]);

  useEffect(() => {
    if (countdown <= 0) {
      logout(true);
    }
  }, [countdown, logout]);

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
      
      const adminUser = await validateAdminCredentials(email, password);
      
      if (adminUser) {
        console.log('Login successful, user:', adminUser);
        setAdminUser(adminUser);
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        setIsLoading(false);
        return { error: null };
      } else {
        console.log('Invalid credentials');
        setIsLoading(false);
        return { error: 'Invalid credentials' };
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      setIsLoading(false);
      return { error: error.message || 'Login failed. Please try again.' };
    }
  };

  const handleStayLoggedIn = () => {
    resetTimers();
  };
  
  const handleLogout = () => {
    logout(false);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isLoading, login, logout }}>
      <NavigationHandler onNavigate={(navigate) => { navigateRef.current = navigate; }} />
      {children}
      <SessionTimeoutWarning
        isOpen={isWarningModalOpen}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
        countdown={countdown}
      />
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
