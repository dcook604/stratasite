
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';

export const RequireAdminAuth = ({ children }: { children: React.ReactNode }) => {
  const { adminUser, isLoading } = useAdminAuth();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !adminUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to access this page",
        variant: "destructive",
      });
    }
  }, [isLoading, adminUser, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    console.log('No admin user found, redirecting to login');
    // Redirect to login page but save the current location so we can redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('Admin user authenticated:', adminUser.email);
  return <>{children}</>;
};
