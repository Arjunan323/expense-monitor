import React, { useState } from 'react';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../../api/authExtras';
import BrandLogo from '../ui/BrandLogo';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const result = await resetPassword(token, password);
      if (result) {
        setSuccess(true);
        toast.success('Password updated successfully! 🎉');
      } else {
        toast.error('Invalid or expired reset link');
      }
    } catch (error: any) {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-brand-green-200 rounded-full opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-bounce-gentle">
            <BrandLogo className="w-14 h-14" size={56} />
          </div>
          <h1 className="text-3xl font-heading font-bold gradient-text mb-2">
            CutTheSpend
          </h1>
          <p className="text-sm text-brand-gray-500 font-medium mb-6">See it. Cut it. Save more.</p>
        </div>

        <div className="card-funky">
          {!token ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-heading font-bold text-brand-gray-900 mb-2">
                Invalid Reset Link 🚫
              </h2>
              <p className="text-brand-gray-600 mb-6">
                The reset link is missing or invalid. Please request a new password reset.
              </p>
              <Link to="/forgot-password" className="btn-primary">
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-2">
                  Reset Password 🔐
                </h2>
                <p className="text-brand-gray-600">
                  Enter your new password below to secure your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-brand-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-brand-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="input-field pl-12 pr-12"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-brand-green-600 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-brand-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-brand-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-brand-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-brand-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="input-field pl-12 pr-12"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-brand-green-600 transition-colors duration-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-brand-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-brand-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-brand-blue-800 mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-brand-blue-700 space-y-1">
                    <li className={`flex items-center space-x-2 ${password.length >= 6 ? 'text-brand-green-700' : ''}`}>
                      <CheckCircle className={`w-3 h-3 ${password.length >= 6 ? 'text-brand-green-600' : 'text-brand-gray-400'}`} />
                      <span>At least 6 characters</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${password === confirmPassword && password ? 'text-brand-green-700' : ''}`}>
                      <CheckCircle className={`w-3 h-3 ${password === confirmPassword && password ? 'text-brand-green-600' : 'text-brand-gray-400'}`} />
                      <span>Passwords match</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                  className="group relative w-full btn-primary flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span className="font-bold">Update Password</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center space-x-2 text-sm text-brand-gray-600 hover:text-brand-green-600 font-semibold transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};