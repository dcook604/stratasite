
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const AdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in
    if (!adminUser) {
      navigate('/admin/login');
    }
  }, [adminUser, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!adminUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>Log Out</Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <p className="text-gray-700"><span className="font-semibold">Email:</span> {adminUser.email}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Building Management</h2>
                <p className="text-gray-600 mb-4">Manage building operations and maintenance.</p>
                <Button variant="secondary">Manage Building</Button>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Calendar Administration</h2>
                <p className="text-gray-600 mb-4">Approve and manage building events.</p>
                <Button variant="secondary">Manage Calendar</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
