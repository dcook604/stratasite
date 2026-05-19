import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const AdminResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reset-password-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({ title: 'Password Reset', description: 'Your password has been reset successfully.' });
        setTimeout(() => navigate('/admin/login'), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to reset password.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
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

            <h1 className="text-headline-md text-center mb-2 text-on-surface">Reset Password</h1>
            <p className="text-body-md text-center text-on-surface-variant mb-8">Choose a new password for your admin account.</p>

            {success ? (
              <Alert className="border border-spectrum-green/20 bg-spectrum-green/5">
                <CheckCircle className="h-4 w-4 text-spectrum-green" />
                <AlertDescription className="text-on-surface">
                  Your password has been reset. Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {errorMessage && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                {token ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-body-md text-on-surface-variant">
                      Enter a new password. It must be at least 8 characters and include an uppercase letter,
                      lowercase letter, number, and special character.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs font-semibold text-on-surface">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="border-outline-variant"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-xs font-semibold text-on-surface">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="border-outline-variant"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary-container text-on-primary hover:brightness-110" disabled={isLoading}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        className="text-body-md text-secondary hover:underline inline-flex items-center gap-1"
                        onClick={() => navigate('/admin/login')}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <Button onClick={() => navigate('/admin/login')} className="bg-primary-container text-on-primary hover:brightness-110">
                      Back to Login
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminResetPassword;
