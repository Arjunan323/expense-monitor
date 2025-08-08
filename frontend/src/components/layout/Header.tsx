import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, CreditCard } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary-600">Expense Monitor</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {(user?.isPremium || user?.isSubscribed) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <CreditCard className="w-3 h-3 mr-1" />
                {user?.isPremium ? 'Premium' : 'Pro'}
              </span>
            )}
            
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.firstName || user?.email}
                </span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
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