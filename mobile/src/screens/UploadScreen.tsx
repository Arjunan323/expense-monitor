import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { UsageStats } from '../types';
import { apiCall } from '../utils/api';
import { formatCurrency } from '../utils/formatters';

export const UploadScreen: React.FC = () => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<any | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const data = await apiCall<UsageStats>('GET', '/user/usage');
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    if (usage && !usage.canUpload) {
      Alert.alert(
        'Upload Limit Reached',
        'You have reached your monthly upload limit. Please upgrade your plan to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size (10MB limit)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert(
            'File Too Large',
            'Please select a PDF file smaller than 10MB.',
            [{ text: 'OK' }]
          );
          return;
        }

        await uploadFile(file);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async (file: any, overridePassword?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name,
      } as any);
      if (overridePassword) {
        formData.append('pdfPassword', overridePassword);
      }

      const response = await apiCall<any>('POST', '/statements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response?.passwordRequired) {
        // store file and open modal for password input
        setPendingFile(file);
        setShowPasswordModal(true);
      } else {
        Alert.alert('Success','Statement uploaded and processed successfully!',[{ text: 'OK' }]);
      }
      
      // Refresh usage stats
      fetchUsage();
  } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload statement',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'PRO': return 'Pro';
      case 'PREMIUM': return 'Premium';
      default: return 'Free';
    }
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#0ea5e9';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Bank Statement</Text>
        <Text style={styles.headerSubtitle}>
          We support most Indian banks. Upload PDF statements to automatically extract and categorize transactions using AI.
        </Text>
      </View>

      {usage && (
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <View style={styles.usageHeaderLeft}>
              <View style={styles.usageIcon}>
                <Ionicons 
                  name={usage.planType === 'PREMIUM' ? "diamond-outline" : "cloud-upload-outline"} 
                  size={20} 
                  color="#0ea5e9" 
                />
              </View>
              <View>
                <Text style={styles.usageTitle}>{getPlanName(usage.planType)} Plan Usage</Text>
                <Text style={styles.usageSubtitle}>Your current month's activity</Text>
              </View>
            </View>
            {usage.planType === 'FREE' && (
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <View style={styles.usageStatHeader}>
                <Text style={styles.usageStatLabel}>Statements</Text>
                <Text 
                  style={[
                    styles.usageStatValue,
                    { color: getUsageColor(usage.statementsThisMonth, usage.statementLimit) }
                  ]}
                >
                  {usage.statementsThisMonth} / {usage.statementLimit === -1 ? '∞' : usage.statementLimit}
                </Text>
              </View>
              {usage.statementLimit !== -1 && (
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min((usage.statementsThisMonth / usage.statementLimit) * 100, 100)}%`,
                        backgroundColor: getUsageColor(usage.statementsThisMonth, usage.statementLimit)
                      }
                    ]} 
                  />
                </View>
              )}
            </View>

            <View style={styles.usageStat}>
              <View style={styles.usageStatHeader}>
                <Text style={styles.usageStatLabel}>Pages</Text>
                <Text 
                  style={[
                    styles.usageStatValue,
                    { color: getUsageColor(usage.pagesThisMonth, usage.pageLimit) }
                  ]}
                >
                  {usage.pagesThisMonth} / {usage.pageLimit === -1 ? '∞' : usage.pageLimit}
                </Text>
              </View>
              {usage.pageLimit !== -1 && (
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min((usage.pagesThisMonth / usage.pageLimit) * 100, 100)}%`,
                        backgroundColor: getUsageColor(usage.pagesThisMonth, usage.pageLimit)
                      }
                    ]} 
                  />
                </View>
              )}
            </View>
          </View>

          {!usage.canUpload && (
            <View style={styles.limitWarning}>
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
              <Text style={styles.limitWarningText}>
                Upload limit reached. Upgrade to continue uploading statements.
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.uploadArea,
          (!usage?.canUpload || uploading) && styles.uploadAreaDisabled
        ]}
        onPress={pickDocument}
        disabled={!usage?.canUpload || uploading}
      >
        <View style={styles.uploadIcon}>
          {uploading ? (
            <LoadingSpinner size="small" color="#0ea5e9" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={48} color="#0ea5e9" />
          )}
        </View>
        <Text style={styles.uploadTitle}>
          {!usage?.canUpload 
            ? 'Upload limit reached' 
            : uploading 
            ? 'Processing...' 
            : 'Upload your bank statements'
          }
        </Text>
        <Text style={styles.uploadDescription}>
          {!usage?.canUpload
            ? 'Upgrade your plan to continue uploading statements'
            : 'Tap to select PDF files from your device'
          }
        </Text>
        <Text style={styles.uploadHint}>
          We support most Indian banks • PDF files only • Max 10MB per file
        </Text>
      </TouchableOpacity>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>How it works</Text>
        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Upload your PDF bank statements using the area above
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Our AI will extract transaction data using OCR and GPT-4
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Transactions are automatically categorized and added to your dashboard
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>4</Text>
            </View>
            <Text style={styles.instructionText}>
              View insights and analytics on your spending patterns
            </Text>
          </View>
        </View>
        
        <View style={styles.supportedBanks}>
          <Text style={styles.supportedBanksTitle}>
            Supported banks: Most major Indian banks including SBI, HDFC, ICICI, Axis, Kotak, and more.
          </Text>
        </View>
      </View>
      {/* Password Modal */}
      {showPasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>PDF Password Required</Text>
            <Text style={styles.modalSubtitle}>Enter the password to decrypt your statement.</Text>
            <View style={styles.passwordInputWrapper}>
              <Text style={styles.passwordLabel}>Password</Text>
              <TextInput
                secureTextEntry
                value={pdfPassword}
                onChangeText={setPdfPassword}
                placeholder="Enter password"
                style={styles.passwordInput}
                editable={!passwordSubmitting}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => { if(!passwordSubmitting){ setShowPasswordModal(false); setPdfPassword(''); setPendingFile(null);} }}
                disabled={passwordSubmitting}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, (!pdfPassword || passwordSubmitting) && styles.modalButtonDisabled]}
                disabled={!pdfPassword || passwordSubmitting}
                onPress={async () => {
                  if (!pendingFile) return;
                  setPasswordSubmitting(true);
                  try {
                    await uploadFile(pendingFile, pdfPassword);
                    setShowPasswordModal(false);
                    setPdfPassword('');
                    setPendingFile(null);
                  } finally {
                    setPasswordSubmitting(false);
                  }
                }}
              >
                {passwordSubmitting ? <LoadingSpinner size="small" color="#ffffff" /> : <Text style={styles.modalButtonPrimaryText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: '#FFD60A',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#1F2937',
    opacity: 0.8,
    lineHeight: 22,
  },
  usageCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usageIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#bfdbfe',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  usageSubtitle: {
    fontSize: 14,
    color: '#3730a3',
  },
  upgradeButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  usageStats: {
    gap: 16,
  },
  usageStat: {
    gap: 8,
  },
  usageStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  usageStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  limitWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  passwordInputWrapper: {
    marginBottom: 20,
  },
  passwordLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginBottom: 6,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonSecondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: '#0ea5e9',
  },
  modalButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  uploadArea: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  uploadAreaDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  uploadHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 20,
    height: 20,
    backgroundColor: '#93c5fd',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  supportedBanks: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#93c5fd',
  },
  supportedBanksTitle: {
    fontSize: 14,
    color: '#3730a3',
    fontWeight: '500',
    lineHeight: 20,
  },
});