import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiCall, spendingAlertsApi } from '../../utils/api';
import Toast from 'react-native-toast-message';

interface SpendingAlertDto {
  id: number;
  type: 'large_transaction' | 'new_merchant' | 'frequency' | 'category_spike' | string;
  severity: 'moderate' | 'critical' | string;
  title: string;
  description?: string;
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string;
  reason?: string;
  acknowledged: boolean;
  acknowledgedAt?: string | null;
  dismissed: boolean;
  dismissedAt?: string | null;
  createdAt: string;
  txnId?: number | null;
  metadata?: string | null;
}

interface SpendingAlertSummaryDto {
  criticalOpen: number;
  moderateOpen: number;
  acknowledged: number;
  total: number;
  generated?: number | null;
  lastGeneratedAt?: string | null;
}

interface SpendingAlertSettingsDto {
  largeMultiplier: number;
  largeMinAmount: number;
  freqWindowHours: number;
  freqMaxTxn: number;
  freqMinAmount: number;
  catSpikeMultiplier: number;
  catSpikeLookbackMonths: number;
  catSpikeMinAmount: number;
  newMerchantMinAmount: number;
  criticalLargeAbsolute?: number | null;
  criticalCategorySpikeMultiplier?: number | null;
  criticalFrequencyCount?: number | null;
  criticalNewMerchantAbsolute?: number | null;
}

interface RecommendationDto {
  id: number;
  type: string;
  priority: number;
  title: string;
  message: string;
  icon?: string;
  category?: string;
  currentMonthlyAvg?: number;
  suggestedCap?: number;
  rationale?: string;
}

export const SpendingAlertsScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<SpendingAlertDto[]>([]);
  const [summary, setSummary] = useState<SpendingAlertSummaryDto | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SpendingAlertSettingsDto | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [tips, setTips] = useState<RecommendationDto[]>([]);
  const [suggestedLimits, setSuggestedLimits] = useState<RecommendationDto[]>([]);

  const month = new Date().toISOString().slice(0, 7);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const ackParam = showAcknowledged ? 'all' : 'false';
      const [listResp, settingsData, whitelistData, recommendations] = await Promise.all([
        spendingAlertsApi.list({ month, type: filterType, acknowledged: ackParam, page: 0, size: 50 }),
        spendingAlertsApi.settings().catch(() => null),
        spendingAlertsApi.whitelist().catch(() => []),
        spendingAlertsApi.recommendations(month).catch(() => ({ tips: [], suggestedLimits: [] }))
      ]);
      
      setAlerts(listResp.content || []);
      setSummary(listResp.summary || null);
      setSettings(settingsData);
      setWhitelist(whitelistData);
      setTips(recommendations.tips || []);
      setSuggestedLimits(recommendations.suggestedLimits || []);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to load alerts' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, showAcknowledged, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? 'warning' : 'notifications';
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'critical' ? '#EF4444' : '#F59E0B';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'large_transaction': return 'card';
      case 'new_merchant': return 'location';
      case 'frequency': return 'trending-up';
      case 'category_spike': return 'bar-chart';
      default: return 'notifications';
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      await spendingAlertsApi.acknowledge(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      Toast.show({ type: 'success', text1: 'Alert acknowledged' });
      fetchData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to acknowledge alert' });
    }
  };

  const dismissAlert = async (id: number) => {
    try {
      await spendingAlertsApi.dismiss(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      Toast.show({ type: 'success', text1: 'Alert dismissed' });
      fetchData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to dismiss alert' });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      await spendingAlertsApi.updateSettings(settings);
      Toast.show({ type: 'success', text1: 'Settings saved' });
      setShowSettings(false);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to save settings' });
    }
  };

  const addToWhitelist = async () => {
    if (!newMerchant.trim()) return;
    try {
      await spendingAlertsApi.addWhitelist(newMerchant.trim());
      setWhitelist(prev => [...prev, newMerchant.trim()]);
      setNewMerchant('');
      Toast.show({ type: 'success', text1: 'Merchant whitelisted' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to add merchant' });
    }
  };

  const removeFromWhitelist = async (merchant: string) => {
    try {
      await spendingAlertsApi.removeWhitelist(merchant);
      setWhitelist(prev => prev.filter(m => m !== merchant));
      Toast.show({ type: 'success', text1: 'Merchant removed' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to remove merchant' });
    }
  };

  const recompute = async () => {
    try {
      await spendingAlertsApi.recompute(month);
      fetchData();
      Toast.show({ type: 'success', text1: 'Alerts recomputed' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to recompute' });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filterType === 'all') return true;
    return alert.type === filterType;
  });

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Spending Alerts</Text>
        <Text style={styles.headerSubtitle}>Monitor unusual spending patterns and get notified of anomalies</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Critical</Text>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {summary?.criticalOpen ?? 0}
          </Text>
          <Text style={styles.summarySubtext}>Need attention</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="notifications" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Moderate</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {summary?.moderateOpen ?? 0}
          </Text>
          <Text style={styles.summarySubtext}>Worth reviewing</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#00B77D' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Resolved</Text>
          <Text style={[styles.summaryValue, { color: '#00B77D' }]}>
            {summary?.acknowledged ?? 0}
          </Text>
          <Text style={styles.summarySubtext}>This month</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#0077B6' }]}>
            <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={[styles.summaryValue, { color: '#0077B6' }]}>
            {summary?.total ?? 0}
          </Text>
          <Text style={styles.summarySubtext}>Generated</Text>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter Alerts</Text>
        <View style={styles.filterButtons}>
          {[
            { key: 'all', label: 'All', icon: '🔔' },
            { key: 'large_transaction', label: 'Large', icon: '💳' },
            { key: 'new_merchant', label: 'New Merchant', icon: '🏪' },
            { key: 'frequency', label: 'Frequent', icon: '⚡' },
            { key: 'category_spike', label: 'Spike', icon: '📈' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setFilterType(filter.key)}
              style={[
                styles.filterButton,
                filterType === filter.key && styles.filterButtonActive
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.filterEmoji}>{filter.icon}</Text>
              <Text style={[
                styles.filterButtonText,
                filterType === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show acknowledged alerts</Text>
          <Switch
            value={showAcknowledged}
            onValueChange={setShowAcknowledged}
            trackColor={{ false: '#D1D5DB', true: '#00B77D' }}
            thumbColor={showAcknowledged ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="settings" size={16} color="#0077B6" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.recomputeButton}
          onPress={recompute}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.recomputeButtonText}>Recompute</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      <View style={styles.alertsSection}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#00B77D" />
            <Text style={styles.emptyTitle}>No alerts to show</Text>
            <Text style={styles.emptyText}>Your spending patterns look normal. Keep up the good work!</Text>
          </View>
        ) : (
          filteredAlerts.map(alert => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                alert.acknowledged && styles.alertCardAcknowledged,
                { borderLeftColor: getSeverityColor(alert.severity) }
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertInfo}>
                  <View style={styles.alertTitleRow}>
                    <Ionicons 
                      name={getSeverityIcon(alert.severity) as any} 
                      size={20} 
                      color={getSeverityColor(alert.severity)} 
                    />
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                  </View>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                  
                  <View style={styles.alertDetails}>
                    <View style={styles.alertDetailItem}>
                      <Text style={styles.alertDetailLabel}>Amount:</Text>
                      <Text style={styles.alertDetailValue}>
                        {formatCurrency(alert.amount || 0, preferences)}
                      </Text>
                    </View>
                    {alert.merchant && (
                      <View style={styles.alertDetailItem}>
                        <Text style={styles.alertDetailLabel}>Merchant:</Text>
                        <Text style={styles.alertDetailValue}>{alert.merchant}</Text>
                      </View>
                    )}
                    {alert.category && (
                      <View style={styles.alertDetailItem}>
                        <Text style={styles.alertDetailLabel}>Category:</Text>
                        <Text style={styles.alertDetailValue}>{alert.category}</Text>
                      </View>
                    )}
                    {alert.date && (
                      <View style={styles.alertDetailItem}>
                        <Text style={styles.alertDetailLabel}>Date:</Text>
                        <Text style={styles.alertDetailValue}>{formatDate(alert.date)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {!alert.acknowledged && (
                <View style={styles.alertActions}>
                  <TouchableOpacity
                    style={styles.acknowledgeButton}
                    onPress={() => acknowledgeAlert(alert.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => dismissAlert(alert.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={16} color="#6B7280" />
                    <Text style={styles.dismissButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}

              {alert.acknowledged && (
                <View style={styles.acknowledgedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#00B77D" />
                  <Text style={styles.acknowledgedText}>Acknowledged</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.recommendationsTitle}>💡 Smart Recommendations</Text>
        <View style={styles.recommendationsList}>
          {tips.map(tip => (
            <View key={tip.id} style={styles.recommendationCard}>
              <Text style={styles.recommendationEmoji}>💡</Text>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{tip.title}</Text>
                <Text style={styles.recommendationMessage}>{tip.message}</Text>
                {tip.category && (
                  <Text style={styles.recommendationCategory}>Category: {tip.category}</Text>
                )}
              </View>
            </View>
          ))}
          
          {suggestedLimits.map(limit => (
            <View key={limit.id} style={[styles.recommendationCard, styles.limitCard]}>
              <Text style={styles.recommendationEmoji}>🎯</Text>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{limit.title}</Text>
                <Text style={styles.recommendationMessage}>{limit.message}</Text>
                {limit.currentMonthlyAvg && limit.suggestedCap && (
                  <Text style={styles.limitDetails}>
                    Avg: {formatCurrency(limit.currentMonthlyAvg, preferences)} → 
                    Suggested: {formatCurrency(limit.suggestedCap, preferences)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Alert Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.settingsContent}>
              {settings && (
                <>
                  <View style={styles.settingsSection}>
                    <Text style={styles.settingsSectionTitle}>Detection Thresholds</Text>
                    
                    <View style={styles.settingItem}>
                      <Text style={styles.settingLabel}>Large Transaction Multiplier</Text>
                      <TextInput
                        style={styles.settingInput}
                        value={settings.largeMultiplier.toString()}
                        onChangeText={(text) => setSettings({
                          ...settings,
                          largeMultiplier: parseFloat(text) || 0
                        })}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.settingItem}>
                      <Text style={styles.settingLabel}>Large Transaction Min Amount</Text>
                      <TextInput
                        style={styles.settingInput}
                        value={settings.largeMinAmount.toString()}
                        onChangeText={(text) => setSettings({
                          ...settings,
                          largeMinAmount: parseFloat(text) || 0
                        })}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.settingItem}>
                      <Text style={styles.settingLabel}>Frequency Window (Hours)</Text>
                      <TextInput
                        style={styles.settingInput}
                        value={settings.freqWindowHours.toString()}
                        onChangeText={(text) => setSettings({
                          ...settings,
                          freqWindowHours: parseInt(text) || 0
                        })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.settingsSection}>
                    <Text style={styles.settingsSectionTitle}>Merchant Whitelist</Text>
                    
                    <View style={styles.whitelistInput}>
                      <TextInput
                        style={styles.merchantInput}
                        value={newMerchant}
                        onChangeText={setNewMerchant}
                        placeholder="Enter merchant name"
                        placeholderTextColor="#9CA3AF"
                      />
                      <TouchableOpacity
                        style={styles.addMerchantButton}
                        onPress={addToWhitelist}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.whitelistTags}>
                      {whitelist.map(merchant => (
                        <View key={merchant} style={styles.whitelistTag}>
                          <Text style={styles.whitelistTagText}>{merchant}</Text>
                          <TouchableOpacity
                            onPress={() => removeFromWhitelist(merchant)}
                            style={styles.removeTagButton}
                          >
                            <Ionicons name="close" size={12} color="#6B7280" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.settingsActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSettings(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSettings}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    backgroundColor: '#F59E0B',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 24,
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
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#00B77D',
    borderColor: '#00B77D',
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  controlButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077B6',
  },
  recomputeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B77D',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  recomputeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertsSection: {
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertCardAcknowledged: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  alertHeader: {
    marginBottom: 12,
  },
  alertInfo: {
    gap: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  alertDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  alertDetails: {
    gap: 4,
  },
  alertDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertDetailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  alertDetailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B77D',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  acknowledgedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B77D',
  },
  recommendationsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#CCFBEF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  limitCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  recommendationEmoji: {
    fontSize: 24,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recommendationMessage: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  recommendationCategory: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  limitDetails: {
    fontSize: 10,
    color: '#0077B6',
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  settingsContent: {
    padding: 24,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  whitelistInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  merchantInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  addMerchantButton: {
    backgroundColor: '#00B77D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whitelistTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  whitelistTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  whitelistTagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  removeTagButton: {
    padding: 2,
  },
  settingsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#00B77D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SpendingAlertsScreen;