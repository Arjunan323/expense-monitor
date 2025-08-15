import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Upload, 
  CreditCard, 
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  Scissors
} from 'lucide-react';

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Upload Statement', href: '/upload', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Statements', href: '/statements', icon: FileText },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
      <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-lg border-r border-brand-gray-100">
        <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
          {/* Logo Section */}
          <div className="px-6 mb-8">
            <div className="logo-container">
              <div className="logo-icon">
                <img 
                  src="/logo.png" 
                  alt="CutTheSpend" 
                  className="w-8 h-8"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Scissors className="w-6 h-6 text-white hidden" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold gradient-text">CutTheSpend</h2>
                <p className="text-xs text-brand-gray-500 font-medium">See it. Cut it. Save more.</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-green text-white shadow-glow-green transform scale-105'
                      : 'text-brand-gray-600 hover:bg-brand-green-50 hover:text-brand-green-700 hover:scale-105'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-5 w-5 transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-brand-gray-400 group-hover:text-brand-green-500'
                      }`}
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Fun Footer */}
          <div className="px-6 py-4">
            <div className="bg-gradient-funky rounded-2xl p-4 text-center">
              <div className="text-white text-sm font-semibold mb-1">💰 Money Saved</div>
              <div className="text-white text-lg font-bold font-mono">₹12,450</div>
              <div className="text-white/80 text-xs">This month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};