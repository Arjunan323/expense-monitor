import React from 'react';
import { BarChart3, TrendingUp, MessageSquare, Clock } from 'lucide-react';

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">
          Advanced financial insights and analytics are coming soon
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="card text-center py-12">
        <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-12 h-12 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Advanced Analytics Coming Soon
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          We're building powerful analytics features including budgets, spending trends, 
          anomaly detection, and personalized financial insights. Help us prioritize 
          what matters most to you.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Spending Trends</h3>
            <p className="text-sm text-gray-600">
              Month-over-month analysis and spending pattern detection
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Budget Tracking</h3>
            <p className="text-sm text-gray-600">
              Set budgets by category and track your progress
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Forecasting</h3>
            <p className="text-sm text-gray-600">
              Predict future expenses and cash flow patterns
            </p>
          </div>
        </div>

        <button className="btn-primary flex items-center space-x-2 mx-auto">
          <MessageSquare className="w-4 h-4" />
          <span>Tell us what analytics you need</span>
        </button>
      </div>

      {/* Feedback Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What analytics features would be most valuable to you?
        </h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Monthly spending trends and comparisons</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Budget setting and tracking by category</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Unusual spending pattern alerts</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Cash flow forecasting</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Goal tracking (savings, debt reduction)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Tax-related expense categorization</span>
          </label>
        </div>
        
        <div className="mt-4">
          <textarea
            className="input-field"
            rows={3}
            placeholder="Any other analytics features you'd like to see?"
          />
        </div>
        
        <button className="btn-primary mt-4">
          Submit Feedback
        </button>
      </div>
    </div>
  );
};