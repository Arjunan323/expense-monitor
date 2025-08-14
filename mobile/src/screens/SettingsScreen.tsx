import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const updated = await apiCall('PUT', '/user/profile', profile) as { firstName: string; lastName: string; email: string };
      setProfile({
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        email: updated.email || ''
      });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }
    try {
      setLoading(true);
      await apiCall('POST', '/feedback', { email: profile.email, message: feedback });
      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedback('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await apiCall('DELETE', '/user/account');
      Alert.alert('Success', 'Account deleted successfully');
      logout();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@expensemonitor.com');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your account settings and preferences
        </Text>
      </View>

      {/* Profile Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="person-outline" size={20} color="#0ea5e9" />
          </View>
          <Text style={styles.sectionTitle}>Profile Settings</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={profile.firstName}
                onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter your first name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={profile.lastName}
                onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter your last name"
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={profile.email}
                onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleProfileUpdate}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#ffffff" />
            ) : (
              <Ionicons name="person-outline" size={16} color="#ffffff" />
            )}
            <Text style={styles.updateButtonText}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support & Feedback */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="chatbubble-outline" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Send us feedback</Text>
          <Text style={styles.feedbackDescription}>
            Help us improve by sharing your thoughts, reporting bugs, or suggesting new features.
          </Text>
          <TextInput
            style={styles.feedbackInput}
            multiline
            numberOfLines={4}
            placeholder="Tell us what's working well, what could be better, or what features you'd like to see..."
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={handleFeedbackSubmit}
            disabled={loading || !feedback.trim()}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#ffffff" />
            ) : (
              <Ionicons name="chatbubble-outline" size={16} color="#ffffff" />
            )}
            <Text style={styles.feedbackButtonText}>
              {loading ? 'Sending...' : 'Send Feedback'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Contact Support</Text>
          <Text style={styles.supportDescription}>
            Need help? Have questions? We're here to assist you.
          </Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleEmailSupport}>
            <Ionicons name="mail-outline" size={16} color="#3b82f6" />
            <Text style={styles.supportButtonText}>Email Support</Text>
            <Ionicons name="open-outline" size={12} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="settings-outline" size={20} color="#6b7280" />
          </View>
          <Text style={styles.sectionTitle}>Account</Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#6b7280" />
          <Text style={styles.actionButtonText}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, styles.dangerIcon]}>
            <Ionicons name="warning-outline" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        </View>

        <View style={styles.dangerContent}>
          <Text style={styles.dangerSubtitle}>Delete Account</Text>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
          {!showDeleteConfirm ? (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirm}>
              <View style={styles.deleteWarning}>
                <Text style={styles.deleteWarningText}>
                  Are you absolutely sure? This will permanently delete your account and all data.
                </Text>
              </View>
              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  )}
                  <Text style={styles.dangerButtonText}>
                    {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  form: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    marginLeft: 12,
  },
  inputWithIconText: {
    flex: 1,
    borderWidth: 0,
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    height: 100,
    marginBottom: 12,
  },
  feedbackButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  feedbackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  supportSection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  supportButtonText: {
    flex: 1,
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dangerSection: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  dangerIcon: {
    backgroundColor: '#fee2e2',
  },
  dangerTitle: {
    color: '#dc2626',
  },
  dangerContent: {
    gap: 12,
  },
  dangerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteConfirm: {
    gap: 12,
  },
  deleteWarning: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  deleteWarningText: {
    fontSize: 14,
    color: '#b91c1c',
    fontWeight: '500',
    lineHeight: 20,
  },
  deleteActions: {
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});