import React, { useState, useEffect } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
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
import { useNavigation } from '@react-navigation/native';
import { usePreferences } from '../contexts/PreferencesContext';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const { preferences, setPreferences } = usePreferences();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currency, setCurrency] = useState(preferences.currency || 'USD');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencyItems, setCurrencyItems] = useState([
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'INR - Indian Rupee', value: 'INR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'JPY - Japanese Yen', value: 'JPY' },
    { label: 'CNY - Chinese Yuan', value: 'CNY' },
    // Add more as needed
  ]);

  useEffect(() => {
    fetchProfile();
  fetchPreferences();
  }, []);

  type PreferencesResponse = { currency?: string };
  const fetchPreferences = async () => {
    try {
      const data = await apiCall('GET', '/user/preferences') as PreferencesResponse;
      if (data && data.currency) {
        setCurrency(data.currency);
        setPreferences({ ...preferences, currency: data.currency });
      }
    } catch (e) {
      // silent
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiCall('GET', '/user/profile') as { firstName: string; lastName: string; email: string };
      setProfile({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || ''
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to load profile');
    } finally { setLoading(false); }
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
  const newPrefs = { ...preferences, currency, locale: preferences.locale || 'en-US' };
  await apiCall('POST', '/user/preferences', newPrefs);
  setPreferences(newPrefs);
      Alert.alert('Success', 'Profile and preferences updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile or preferences');
    } finally { setLoading(false); }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) { Alert.alert('Error', 'Please enter your feedback'); return; }
    try {
      setLoading(true);
      await apiCall('POST', '/feedback', { email: profile.email, message: feedback });
      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedback('');
    } catch (e) { Alert.alert('Error', 'Failed to submit feedback'); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await apiCall('DELETE', '/user/account');
      Alert.alert('Success', 'Account deleted successfully');
      logout();
    } catch (e) { Alert.alert('Error', 'Failed to delete account'); }
    finally { setLoading(false); }
  };

  const handleEmailSupport = () => Linking.openURL('mailto:support@expensemonitor.com');
  const handleLogout = () => {
    Alert.alert('Sign Out','Are you sure you want to sign out?',[
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account settings and preferences</Text>
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
              <TextInput style={styles.input} value={profile.firstName} onChangeText={(text) => setProfile(p => ({ ...p, firstName: text }))} placeholder="Enter your first name" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput style={styles.input} value={profile.lastName} onChangeText={(text) => setProfile(p => ({ ...p, lastName: text }))} placeholder="Enter your last name" />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput style={[styles.input, styles.inputWithIconText]} value={profile.email} onChangeText={(text) => setProfile(p => ({ ...p, email: text }))} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
      <View style={[styles.inputContainer, { zIndex: 2000 }]}> 
            <Text style={styles.inputLabel}>Currency</Text>
            <DropDownPicker
              open={currencyOpen}
              value={currency}
              items={currencyItems}
              setOpen={setCurrencyOpen}
              setValue={setCurrency}
              setItems={setCurrencyItems}
              listMode="MODAL"
              modalTitle="Select Currency"
              modalAnimationType="slide"
              containerStyle={{ marginTop: 4, marginBottom: 8 }}
              style={{ borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' }}
              dropDownContainerStyle={{ borderColor: '#d1d5db', borderRadius: 8 }}
              textStyle={{ color: '#111827', fontSize: 16 }}
              placeholder="Select currency"
              onChangeValue={(val) => { if (val) setCurrency(val); }}
            />
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={handleProfileUpdate} disabled={loading}>
            {loading ? <LoadingSpinner size="small" color="#ffffff" /> : <Ionicons name="person-outline" size={16} color="#ffffff" />}
            <Text style={styles.updateButtonText}>{loading ? 'Updating...' : 'Update Profile'}</Text>
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
          <Text style={styles.feedbackDescription}>Help us improve by sharing your thoughts, reporting bugs, or suggesting new features.</Text>
          <TextInput style={styles.feedbackInput} multiline numberOfLines={4} placeholder="Tell us what's working well, what could be better, or what features you'd like to see..." value={feedback} onChangeText={setFeedback} textAlignVertical="top" />
          <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedbackSubmit} disabled={loading || !feedback.trim()}>
            {loading ? <LoadingSpinner size="small" color="#ffffff" /> : <Ionicons name="chatbubble-outline" size={16} color="#ffffff" />}
            <Text style={styles.feedbackButtonText}>{loading ? 'Sending...' : 'Send Feedback'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Contact Support</Text>
          <Text style={styles.supportDescription}>Need help? Have questions? We're here to assist you.</Text>
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
        <TouchableOpacity style={styles.actionButton} onPress={()=> navigation.navigate('NotificationPrefs')}>
          <Ionicons name="notifications-outline" size={20} color="#6b7280" />
          <Text style={styles.actionButtonText}>Notification Preferences</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
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
          <Text style={styles.dangerDescription}>Permanently delete your account and all associated data. This action cannot be undone.</Text>
          {!showDeleteConfirm ? (
            <TouchableOpacity style={styles.dangerButton} onPress={() => setShowDeleteConfirm(true)}>
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteConfirm}>
              <View style={styles.deleteWarning}>
                <Text style={styles.deleteWarningText}>Are you absolutely sure? This will permanently delete your account and all data.</Text>
              </View>
              <View style={styles.deleteActions}>
                <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount} disabled={loading}>
                  {loading ? <LoadingSpinner size="small" color="#ffffff" /> : <Ionicons name="trash-outline" size={16} color="#ffffff" />}
                  <Text style={styles.dangerButtonText}>{loading ? 'Deleting...' : 'Yes, Delete My Account'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeleteConfirm(false)}>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    width: '100%',
    color: '#111827',
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