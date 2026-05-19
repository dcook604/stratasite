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
import { Lock, ArrowLeft, Mail, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { adminUser, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
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
        <div className="max-w-md mx-auto mt-16 mb-16 px-gutter">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="flex spectrum-logo-bars gap-1 items-end h-10">
                <div className="w-2.5 h-5 bg-spectrum-red rounded-sm"></div>
                <div className="w-2.5 h-7 bg-spectrum-green rounded-sm"></div>
                <div className="w-2.5 h-10 bg-spectrum-blue rounded-sm"></div>
                <div className="w-2.5 h-7 bg-spectrum-yellow rounded-sm"></div>
              </div>
            </div>

            {showForgotPassword ? (
              <>
                <h1 className="text-headline-md text-center mb-2 text-on-surface">Reset Password</h1>
                <p className="text-body-md text-center text-on-surface-variant mb-8">
                  Enter your admin email and we'll send a reset link.
                </p>

                {forgotMessage && (
                  <Alert className="mb-6 border border-spectrum-green/20 bg-spectrum-green/5">
                    <AlertCircle className="h-4 w-4 text-spectrum-green" />
                    <AlertDescription className="text-on-surface">{forgotMessage}</AlertDescription>
                  </Alert>
                )}
                {forgotError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}

                {!forgotMessage && (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-xs font-semibold text-on-surface">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="border-outline-variant"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary-container text-on-primary hover:brightness-110" disabled={forgotLoading}>
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                )}

                <div className="text-center mt-6">
                  <button
                    type="button"
                    className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotMessage('');
                      setForgotError('');
                      setForgotEmail('');
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-headline-md text-center mb-2 text-on-surface">Admin Login</h1>
                <p className="text-body-md text-center text-on-surface-variant mb-8">
                  Sign in to manage your strata site.
                </p>

                {errorMessage && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-on-surface">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="border-outline-variant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-semibold text-on-surface">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="border-outline-variant"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary-container text-on-primary hover:brightness-110"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    className="text-sm text-secondary hover:underline"
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
