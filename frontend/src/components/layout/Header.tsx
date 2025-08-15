import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, CreditCard, Scissors, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigation } from './Sidebar';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileOpen]);

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
            {/* Mobile Hamburger */}
            <button
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-brand-gray-200 text-brand-gray-600 hover:text-brand-green-600 hover:border-brand-green-400 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
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

      {/* Mobile Slide-over */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Fullscreen Panel */}
          <div className="relative flex flex-col w-full max-w-xs  ml-0 bg-white border-r border-brand-gray-100 shadow-2xl animate-[slideIn_.25s_ease-out] h-fit">
            <div className="flex items-center justify-between px-5 h-16 border-b border-brand-gray-100"> 
              <div className="flex items-center space-x-2">
                <div className="logo-icon">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <span className="font-heading font-bold text-lg bg-gradient-to-r from-brand-green-600 to-brand-blue-600 bg-clip-text text-transparent">CutTheSpend</span>
              </div>
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-brand-gray-200 text-brand-gray-600 hover:text-danger-600 hover:border-danger-400"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navigation.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      isActive ? 'bg-gradient-green text-white shadow-glow-green' : 'text-brand-gray-600 hover:bg-brand-green-50 hover:text-brand-green-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-brand-gray-100">
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex w-full items-center justify-center px-4 py-3 rounded-2xl text-sm font-semibold bg-danger-50 text-danger-700 hover:bg-danger-100"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};