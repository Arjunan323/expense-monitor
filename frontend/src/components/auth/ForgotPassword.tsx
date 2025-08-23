import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { requestPasswordReset } from '../../api/authExtras';
import BrandLogo from '../ui/BrandLogo';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email);
      setSent(true);
      toast.success('If the email exists, a reset link was sent');
    } catch (error: any) {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-blue rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-2">
                  Forgot Password? 🔐
                </h2>
                <p className="text-brand-gray-600">
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-brand-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brand-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="input-field pl-12"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full btn-primary flex justify-center items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span className="font-bold">Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-green animate-bounce-gentle">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-4">
                Check Your Email! 📧
              </h2>
              <p className="text-brand-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-brand-blue-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-brand-blue-800 mb-1">Didn't receive the email?</p>
                    <ul className="text-xs text-brand-blue-700 space-y-1">
                      <li>• Check your spam/junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Wait a few minutes for delivery</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="btn-secondary w-full"
              >
                Try Different Email
              </button>
            </div>
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