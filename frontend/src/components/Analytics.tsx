import React, { useState } from 'react';
import { BarChart3, TrendingUp, Target, AlertTriangle, DollarSign, Calculator, ArrowLeft } from 'lucide-react';
import { MonthlyTrends } from './analytics/MonthlyTrends';
import { BudgetTracking } from './analytics/BudgetTracking';
import { SpendingAlerts } from './analytics/SpendingAlerts';
import { CashFlowForecast } from './analytics/CashFlowForecast';
import { GoalTracking } from './analytics/GoalTracking';
import { TaxTracker } from './analytics/TaxTracker';

type AnalyticsView = 'overview' | 'trends' | 'budget' | 'alerts' | 'forecast' | 'goals' | 'tax';

export const Analytics: React.FC = () => {
  const [currentView, setCurrentView] = useState<AnalyticsView>('overview');

  const analyticsMenuItems = [
    {
      id: 'trends' as AnalyticsView,
      title: 'Monthly Spending Trends',
      description: 'Track and compare spending patterns over time',
      icon: TrendingUp,
      color: 'from-brand-green-400 to-brand-green-600',
      emoji: '📈'
    },
    {
      id: 'budget' as AnalyticsView,
      title: 'Budget Tracking',
      description: 'Set budgets by category and monitor progress',
      icon: Target,
      color: 'from-brand-blue-400 to-brand-blue-600',
      emoji: '🎯'
    },
    {
      id: 'alerts' as AnalyticsView,
      title: 'Spending Alerts',
      description: 'Get notified of unusual spending patterns',
      icon: AlertTriangle,
      color: 'from-yellow-400 to-yellow-600',
      emoji: '🚨'
    },
    {
      id: 'forecast' as AnalyticsView,
      title: 'Cash Flow Forecast',
      description: 'Predict future financial position',
      icon: BarChart3,
      color: 'from-purple-400 to-purple-600',
      emoji: '🔮'
    },
    {
      id: 'goals' as AnalyticsView,
      title: 'Goal Tracking',
      description: 'Track savings goals and debt reduction',
      icon: DollarSign,
      color: 'from-pink-400 to-pink-600',
      emoji: '🏆'
    },
    {
      id: 'tax' as AnalyticsView,
      title: 'Tax Benefit Tracker',
      description: 'Maximize tax savings with smart categorization',
      icon: Calculator,
      color: 'from-indigo-400 to-indigo-600',
      emoji: '📊'
    }
  ];

  if (currentView !== 'overview') {
    return (
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center space-x-2 text-brand-gray-600 hover:text-brand-green-600 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Analytics</span>
          </button>
        </div>

        {/* Render Selected View */}
        {currentView === 'trends' && <MonthlyTrends />}
        {currentView === 'budget' && <BudgetTracking />}
        {currentView === 'alerts' && <SpendingAlerts />}
        {currentView === 'forecast' && <CashFlowForecast />}
        {currentView === 'goals' && <GoalTracking />}
        {currentView === 'tax' && <TaxTracker />}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Advanced Analytics</h1>
          <p className="text-brand-gray-600 text-lg">Powerful insights to help you make smarter financial decisions</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card border-brand-green-200 bg-brand-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-green rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-green-600 bg-brand-green-100 px-2 py-1 rounded-full">TRENDS</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Spending Trend</h3>
            <p className="text-2xl font-bold text-brand-green-600">-12%</p>
            <p className="text-sm text-brand-gray-500">vs last month</p>
          </div>

          <div className="stat-card border-brand-blue-200 bg-brand-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-blue rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-100 px-2 py-1 rounded-full">BUDGET</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Budget Adherence</h3>
            <p className="text-2xl font-bold text-brand-blue-600">85%</p>
            <p className="text-sm text-brand-gray-500">This month</p>
          </div>

          <div className="stat-card border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">ALERTS</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Active Alerts</h3>
            <p className="text-2xl font-bold text-yellow-600">3</p>
            <p className="text-sm text-brand-gray-500">Need attention</p>
          </div>

          <div className="stat-card border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">GOALS</span>
            </div>
            <h3 className="text-sm font-medium text-brand-gray-600 mb-1">Goals Progress</h3>
            <p className="text-2xl font-bold text-purple-600">68%</p>
            <p className="text-sm text-brand-gray-500">Average completion</p>
          </div>
        </div>
      </div>

      {/* Analytics Menu */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-brand-gray-900 mb-2">Choose Analytics Tool</h2>
          <p className="text-brand-gray-600">Select the analysis you want to explore</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className="group text-left p-6 bg-white border-2 border-brand-gray-200 rounded-3xl hover:border-brand-green-400 hover:shadow-funky transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center group-hover:shadow-glow-green transition-all duration-300`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-3xl">{item.emoji}</span>
              </div>
              
              <h3 className="text-lg font-heading font-bold text-brand-gray-900 mb-2 group-hover:text-brand-green-700 transition-colors duration-300">
                {item.title}
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed group-hover:text-brand-gray-700 transition-colors duration-300">
                {item.description}
              </p>
              
              <div className="mt-4 flex items-center text-brand-green-600 group-hover:text-brand-green-700 transition-colors duration-300">
                <span className="text-sm font-semibold">Explore</span>
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="card bg-gradient-funky text-white">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-heading font-bold mb-4">More Analytics Coming Soon! 🚀</h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            We're working on even more powerful analytics features including AI-powered insights, 
            investment tracking, and personalized financial recommendations.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">🤖</p>
              <p className="text-white/80">AI Insights</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">📊</p>
              <p className="text-white/80">Investment Tracking</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">💡</p>
              <p className="text-white/80">Smart Recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};