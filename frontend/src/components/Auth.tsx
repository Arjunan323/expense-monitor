import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Scissors, Sparkles } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import BrandLogo from './ui/BrandLogo';
import toast from 'react-hot-toast';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.firstName, formData.lastName);
        setRegisteredEmail(formData.email);
      }
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-brand-green-200 rounded-full opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6  animate-bounce-gentle">
            <BrandLogo className="w-14 h-14" size={56} />
            <Scissors className="w-10 h-10 text-white hidden" />
          </div>
          <h1 className="text-3xl font-heading font-bold gradient-text mb-2">
            CutTheSpend
          </h1>
          <p className="text-sm text-brand-gray-500 font-medium mb-4">See it. Cut it. Save more.</p>
          <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-2">
            {isLogin ? 'Welcome back! 👋' : 'Start saving today! 🚀'}
          </h2>
          <p className="text-brand-gray-600">
            {isLogin 
              ? 'Sign in to continue your financial journey' 
              : 'Join thousands who are already saving more money'
            }
          </p>
        </div>

        <div className="card-funky">
          {registeredEmail && !isLogin && (
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-sm text-blue-700">
              We've sent a verification email to <strong>{registeredEmail}</strong>. Please verify your email to unlock all features.
              <div className="mt-2 text-xs">Didn't receive it? Check spam or try again after a minute.</div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="sr-only">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-brand-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      className="input-field pl-12"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="input-field"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
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
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  className="input-field pl-12 pr-12"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full btn-primary flex justify-center items-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold">{isLogin ? 'Sign in' : 'Create account'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center flex flex-col space-y-2">
              <button
                type="button"
                className="text-sm text-secondary-600 hover:text-secondary-500 font-semibold transition-colors duration-200"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Don't have an account? Sign up 🎉" 
                  : 'Already have an account? Sign in 💫'
                }
              </button>
              {isLogin && (
                <a href="/forgot-password" className="text-xs text-brand-gray-500 hover:text-brand-gray-700 underline">Forgot password?</a>
              )}
            </div>
          </form>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 text-xs text-brand-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-brand-green-500 rounded-full"></div>
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};