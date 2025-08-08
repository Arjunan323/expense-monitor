import React from 'react';
import { Crown, ArrowRight, X } from 'lucide-react';

interface UpgradePromptProps {
  title: string;
  description: string;
  features?: string[];
  onUpgrade: () => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'modal' | 'card';
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title,
  description,
  features = [],
  onUpgrade,
  onDismiss,
  variant = 'card'
}) => {
  const baseClasses = "relative overflow-hidden";
  
  const variantClasses = {
    banner: "bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-4",
    modal: "bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-md mx-auto",
    card: "bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 border border-primary-200 rounded-xl p-6"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-blue-600" />
      </div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onUpgrade}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Crown className="w-4 h-4" />
          <span>Upgrade Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};