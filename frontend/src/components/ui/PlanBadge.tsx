import React from 'react';
import { Crown, Star, Zap } from 'lucide-react';

interface PlanBadgeProps {
  planType: 'FREE' | 'PRO' | 'PREMIUM';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ 
  planType, 
  size = 'md', 
  showIcon = true 
}) => {
  const getConfig = () => {
    switch (planType) {
      case 'PREMIUM':
        return {
          label: 'Premium',
          icon: Crown,
          className: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
        };
      case 'PRO':
        return {
          label: 'Pro',
          icon: Star,
          className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
        };
      default:
        return {
          label: 'Free',
          icon: Zap,
          className: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-2.5 py-1 text-xs';
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${getSizeClasses()}`}>
      {showIcon && <Icon className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />}
      {config.label}
    </span>
  );
};