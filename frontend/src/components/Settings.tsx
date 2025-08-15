import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Globe, 
  MessageSquare, 
  Trash2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

import { apiCall } from '../utils/api';
import toast from 'react-hot-toast';
import { usePreferences } from '../contexts/PreferencesContext';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { preferences, setPreferences } = usePreferences();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiCall('GET', '/user/profile') as { firstName: string; lastName: string; email: string };
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || ''
        });
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [currency, setCurrency] = useState(preferences.currency || 'USD');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await apiCall('PUT', '/user/profile', profile) as { firstName: string; lastName: string; email: string };
      setProfile({
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        email: updated.email || ''
      });
      // Update preferences (locale, currency) in backend and context
      await apiCall('POST', '/user/preferences', { ...preferences, locale: "en-US", currency });
      setPreferences({ ...preferences, locale: "en-US", currency });
      toast.success('Profile and preferences updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile or preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    try {
      setLoading(true);
      await apiCall('POST', '/feedback', { email: profile.email, message: feedback });
      toast.success('Thank you for your feedback!');
      setFeedback('');
    } catch (error: any) {
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  // Delete account functionality (confirmation handled by UI, not window.confirm)
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await apiCall('DELETE', '/user/account');
      toast.success('Account deleted successfully');
      logout();
    } catch (error: any) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                className="input-field"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                className="input-field"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                className="input-field pl-10"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <div className="relative">
              <select
                className="input-field"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                {/* Add more as needed */}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? <LoadingSpinner size="sm" className="text-white" /> : <User className="w-4 h-4" />}
            <span>{loading ? 'Updating...' : 'Update Profile & Preferences'}</span>
          </button>
        </form>
      </div>

      {/* Support & Feedback */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Support & Feedback</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Send us feedback</h3>
            <p className="text-sm text-gray-600 mb-3">
              Help us improve by sharing your thoughts, reporting bugs, or suggesting new features.
            </p>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <textarea
                className="input-field"
                rows={4}
                placeholder="Tell us what's working well, what could be better, or what features you'd like to see..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !feedback.trim()}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? <LoadingSpinner size="sm" className="text-white" /> : <MessageSquare className="w-4 h-4" />}
                <span>{loading ? 'Sending...' : 'Send Feedback'}</span>
              </button>
            </form>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600 mb-3">
              Need help? Have questions? We're here to assist you.
            </p>
            <a
              href="mailto:support@expensemonitor.com"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Email Support</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger-200 bg-danger-50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger-600" />
          </div>
          <h2 className="text-lg font-semibold text-danger-900">Danger Zone</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-danger-900 mb-2">Delete Account</h3>
            <p className="text-sm text-danger-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-danger-100 border border-danger-200 rounded-lg">
                  <p className="text-sm text-danger-800 font-medium">
                    Are you absolutely sure? This will permanently delete your account and all data.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="btn-danger flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="sm" className="text-white" /> : <Trash2 className="w-4 h-4" />}
                    <span>{loading ? 'Deleting...' : 'Yes, Delete My Account'}</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};