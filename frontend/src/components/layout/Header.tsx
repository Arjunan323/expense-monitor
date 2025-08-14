import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, CreditCard, Scissors } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-brand-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.png" 
                alt="CutTheSpend" 
                className="w-8 h-8"
                onError={(e) => {
                  // Fallback to scissors icon if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Scissors className="w-6 h-6 text-white hidden" />
            </div>
            <div>
              <h1 className="logo-text">CutTheSpend</h1>
              <p className="text-xs text-brand-gray-500 font-medium">See it. Cut it. Save more.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {(user?.isPremium || user?.isSubscribed) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-funky text-white shadow-glow-green animate-pulse-slow">
                <CreditCard className="w-3 h-3 mr-1" />
                {user?.isPremium ? 'Premium' : 'Pro'}
              </span>
            )}
            
            <div className="relative group">
              <button className="flex items-center space-x-3 text-brand-gray-700 hover:text-brand-green-600 focus:outline-none transition-colors duration-300">
                <div className="w-10 h-10 bg-gradient-green rounded-2xl flex items-center justify-center shadow-glow-green">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-semibold">
                  {user?.firstName || user?.email}
                </span>
              </button>
              
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-funky-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-brand-gray-100">
                <div className="px-4 py-3 border-b border-brand-gray-100">
                  <p className="text-sm font-semibold text-brand-gray-900">{user?.firstName || 'User'}</p>
                  <p className="text-sm text-brand-gray-500">{user?.email}</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/settings'}
                  className="flex items-center w-full px-4 py-3 text-sm text-brand-gray-700 hover:bg-brand-green-50 hover:text-brand-green-700 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-3 text-sm text-brand-gray-700 hover:bg-danger-50 hover:text-danger-700 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};