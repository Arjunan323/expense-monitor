import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail, ArrowLeft, RefreshCcw, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyEmailToken, resendVerification } from '../../api/authExtras';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../ui/BrandLogo';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [resending, setResending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const success = await verifyEmailToken(token);
        setStatus(success ? 'success' : 'error');
        if (success) {
          toast.success('Email verified successfully! 🎉');
        } else {
          toast.error('Invalid or expired verification link');
        }
      } catch (error) {
        setStatus('error');
        toast.error('Verification failed');
      }
    };

    verify();
  }, [token]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      setResending(true);
      await resendVerification(user.email);
      toast.success('Verification email sent! Check your inbox 📧');
    } catch (error) {
      toast.error('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-brand-green-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6">
            <BrandLogo className="w-14 h-14" size={56} />
          </div>
          <h1 className="text-3xl font-heading font-bold gradient-text mb-4">CutTheSpend</h1>
          <div className="card-funky max-w-md mx-auto">
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <h2 className="text-xl font-heading font-bold text-brand-gray-900 mt-4 mb-2">
                Verifying Your Email... ✨
              </h2>
              <p className="text-brand-gray-600">Please wait while we verify your email address</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-brand-green-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6">
              <BrandLogo className="w-14 h-14" size={56} />
            </div>
            <h1 className="text-3xl font-heading font-bold gradient-text mb-2">CutTheSpend</h1>
            <p className="text-sm text-brand-gray-500 font-medium">See it. Cut it. Save more.</p>
          </div>

          <div className="card-funky">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-green animate-bounce-gentle">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-4">
                Email Verified! 🎉
              </h2>
              <p className="text-brand-gray-600 mb-6">
                Your email has been successfully verified. You can now access all features of CutTheSpend!
              </p>
              <div className="bg-brand-green-50 border border-brand-green-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-brand-green-800">Account Activated</p>
                    <p className="text-xs text-brand-green-700">You now have full access to all features</p>
                  </div>
                </div>
              </div>
              <Link
                to={user ? "/dashboard" : "/login"}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-brand-green-200 rounded-full opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6">
            <BrandLogo className="w-14 h-14" size={56} />
          </div>
          <h1 className="text-3xl font-heading font-bold gradient-text mb-2">CutTheSpend</h1>
          <p className="text-sm text-brand-gray-500 font-medium">See it. Cut it. Save more.</p>
        </div>

        <div className="card-funky">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-red animate-bounce-gentle">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-4">
              Verification Failed 😞
            </h2>
            <p className="text-brand-gray-600 mb-6">
              The verification link is invalid or has expired. Don't worry, we can send you a new one!
            </p>
            
            {user?.email && (
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-brand-blue-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-brand-blue-800 mb-1">Need a new link?</p>
                    <p className="text-xs text-brand-blue-700">We can send a fresh verification email to {user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {user?.email && (
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {resending ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <RefreshCcw className="w-4 h-4" />
                  )}
                  <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
                </button>
              )}
              
              <Link
                to="/login"
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};