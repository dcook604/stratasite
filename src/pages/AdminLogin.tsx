
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { adminUser, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the intended destination from location state, or default to dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';
  
  useEffect(() => {
    // If already logged in, redirect to dashboard or previous location
    if (adminUser) {
      navigate(from, { replace: true });
    }
  }, [adminUser, navigate, from]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);
    try {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotMessage(data.message);
      } else {
        setForgotError(data.error || 'Failed to send reset email.');
      }
    } catch {
      setForgotError('An unexpected error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Submitting login with:', email);
      const { error } = await login(email, password);

      if (error) {
        console.log('Login error:', error);
        setErrorMessage(error);
        toast({
          title: "Login Failed",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back, admin!",
        });
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Login submission error:', error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="max-w-md mx-auto mt-16 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-md">
            {showForgotPassword ? (
              <>
                <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

                {forgotMessage && (
                  <Alert className="mb-4">
                    <AlertDescription>{forgotMessage}</AlertDescription>
                  </Alert>
                )}
                {forgotError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}

                {!forgotMessage && (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <p className="text-sm text-gray-600">
                      Enter your admin email address and we'll send you a link to reset your password.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={forgotLoading}>
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                )}

                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotMessage('');
                      setForgotError('');
                      setForgotEmail('');
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

                {errorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLogin;
