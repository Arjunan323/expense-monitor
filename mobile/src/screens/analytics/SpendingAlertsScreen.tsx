import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../contexts/PreferencesContext';
import { apiCall } from '../../utils/api';

interface SpendingAlertDto {
  id: number;
  type: string;
  severity: 'critical' | 'moderate';
  title: string;
  description?: string;
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string;
  acknowledged: boolean;
  dismissed: boolean;
  createdAt: string;
}

interface SpendingAlertSummaryDto {
  criticalOpen: number;
  moderateOpen: number;
  acknowledged: number;
  total: number;
}

export const SpendingAlertsScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<SpendingAlertDto[]>([]);
  const [summary, setSummary] = useState<SpendingAlertSummaryDto | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Settings state
  const [settings, setSettings] = useState<any>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [mutedCategories, setMutedCategories] = useState<any[]>([]);

  const fetchData = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }
      
      const currentPage = reset ? 0 : page;
      const response = await apiCall<any>('GET', `/analytics/spending-alerts`, {
        params: {
          page: currentPage,
          size: 20,
          type: filterType === 'all' ? undefined : filterType,
          acknowledged: showAcknowledged ? 'all' : 'false'
        }
      });
      
      if (reset) {
        setAlerts(response.content);
      } else {
        setAlerts(prev => [...prev, ...response.content]);
      }
      
      setSummary(response.summary);
      setHasMore(response.content.length === 20);
      setPage(currentPage + 1);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, showAcknowledged, page]);

  useEffect(() => {
    fetchData(true);
  }, [filterType, showAcknowledged]);

  const loadSettings = async () => {
    try {
      const [settingsData, whitelistData, mutedData] = await Promise.all([
        apiCall('GET', '/analytics/spending-alerts/settings'),
        apiCall('GET', '/analytics/spending-alerts/whitelist'),
        apiCall('GET', '/analytics/spending-alerts/mute-category')
      ]);
      setSettings(settingsData);
      setWhitelist(whitelistData);
      setMutedCategories(mutedData);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to load settings');
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      await apiCall('POST', `/analytics/spending-alerts/${id}/acknowledge`, {});
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      fetchData(true);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const dismissAlert = async (id: number) => {
    try {
      await apiCall('DELETE', `/analytics/spending-alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
      fetchData(true);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to dismiss alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? 'warning' : 'notifications';
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'critical' ? '#EF4444' : '#F59E0B';
  };

  const renderAlert = ({ item }: { item: SpendingAlertDto }) => (
    <View style={[
      styles.alertCard,
      item.acknowledged && styles.alertCardAcknowledged,
      { borderLeftColor: getSeverityColor(item.severity) }
    ]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <View style={styles.alertTitleRow}>
            <Ionicons 
              name={getSeverityIcon(item.severity) as any} 
              size={20} 
              color={getSeverityColor(item.severity)} 
            />
            <Text style={styles.alertTitle}>{item.title}</Text>
            <View style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(item.severity) + '20' }
            ]}>
              <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
                {item.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {item.description && (
            <Text style={styles.alertDescription}>{item.description}</Text>
          )}
          
          <View style={styles.alertMeta}>
            {item.amount && (
              <Text style={styles.alertAmount}>
                {formatCurrency(item.amount, preferences)}
              </Text>
            )}
            {item.merchant && (
              <Text style={styles.alertMerchant}>• {item.merchant}</Text>
            )}
            {item.category && (
              <Text style={styles.alertCategory}>• {item.category}</Text>
            )}
          </View>
          
          <Text style={styles.alertDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <View style={styles.alertActions}>
          <TouchableOpacity
            onPress={() => {
              setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
              });
            }}
            style={[
              styles.selectButton,
              selectedIds.has(item.id) && styles.selectButtonActive
            ]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={selectedIds.has(item.id) ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={selectedIds.has(item.id) ? "#00B77D" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {!item.acknowledged && (
        <View style={styles.alertActionButtons}>
          <TouchableOpacity
            onPress={() => acknowledgeAlert(item.id)}
            style={styles.acknowledgeButton}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => dismissAlert(item.id)}
            style={styles.dismissButton}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={16} color="#6B7280" />
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spending Alerts</Text>
        <Text style={styles.headerSubtitle}>Monitor unusual spending patterns</Text>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => { setShowSettings(true); loadSettings(); }}
          activeOpacity={0.8}
        >
          <Ionicons name="settings" size={20} color="#FFFFFF" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Summary Cards */}
      {summary && (
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="warning" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryLabel}>Critical</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {summary.criticalOpen}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryLabel}>Moderate</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {summary.moderateOpen}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#00B77D' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryLabel}>Resolved</Text>
            <Text style={[styles.summaryValue, { color: '#00B77D' }]}>
              {summary.acknowledged}
            </Text>
          </View>
        </View>
      )}

      {/* Enhanced Filter Controls */}
      <View style={styles.filterControls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Alerts', icon: 'notifications' },
            { key: 'large_transaction', label: 'Large Transactions', icon: 'card' },
            { key: 'new_merchant', label: 'New Merchants', icon: 'business' },
            { key: 'frequency', label: 'Frequency', icon: 'trending-up' },
            { key: 'category_spike', label: 'Category Spikes', icon: 'bar-chart' }
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
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={filterType === filter.key ? "#FFFFFF" : "#6B7280"} 
              />
              <Text style={[
                styles.filterButtonText,
                filterType === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.toggleControls}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Acknowledged</Text>
            <Switch
              value={showAcknowledged}
              onValueChange={setShowAcknowledged}
              trackColor={{ false: '#D1D5DB', true: '#00B77D' }}
              thumbColor={showAcknowledged ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>
      </View>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>{selectedIds.size} selected</Text>
          <View style={styles.bulkActionButtons}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await apiCall('POST', '/analytics/spending-alerts/acknowledge', { ids: Array.from(selectedIds) });
                  setSelectedIds(new Set());
                  fetchData(true);
                } catch {
                  Alert.alert('Error', 'Failed to acknowledge alerts');
                }
              }}
              style={styles.bulkAcknowledgeButton}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.bulkAcknowledgeText}>Acknowledge</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={async () => {
                try {
                  await apiCall('POST', '/analytics/spending-alerts/dismiss', { ids: Array.from(selectedIds) });
                  setSelectedIds(new Set());
                  fetchData(true);
                } catch {
                  Alert.alert('Error', 'Failed to dismiss alerts');
                }
              }}
              style={styles.bulkDismissButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={16} color="#6B7280" />
              <Text style={styles.bulkDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Enhanced Alerts List */}
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
        onEndReached={() => {
          if (hasMore && !loading) fetchData(false);
        }}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#00B77D" />
            <Text style={styles.emptyStateTitle}>No alerts to show</Text>
            <Text style={styles.emptyStateText}>
              Your spending patterns look normal. Keep up the good work!
            </Text>
          </View>
        }
        ListFooterComponent={
          loading && alerts.length > 0 ? (
            <View style={styles.loadingFooter}>
              <LoadingSpinner size="small" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />

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
              {/* Threshold Settings */}
              {settings && (
                <View style={styles.settingsSection}>
                  <Text style={styles.settingsSectionTitle}>Detection Thresholds</Text>
                  <View style={styles.settingsGrid}>
                    <View style={styles.settingsItem}>
                      <Text style={styles.settingsLabel}>Large Transaction Multiplier</Text>
                      <TextInput
                        style={styles.settingsInput}
                        value={settings.largeMultiplier?.toString()}
                        onChangeText={(text) => setSettings({...settings, largeMultiplier: parseFloat(text)})}
                        keyboardType="numeric"
                        placeholder="1.5"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Whitelist Management */}
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Merchant Whitelist</Text>
                <View style={styles.whitelistInput}>
                  <TextInput
                    style={styles.merchantInput}
                    value={newMerchant}
                    onChangeText={setNewMerchant}
                    placeholder="Enter merchant name"
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      if (!newMerchant.trim()) return;
                      try {
                        await apiCall('POST', '/analytics/spending-alerts/whitelist', { merchant: newMerchant });
                        setWhitelist(prev => [...prev, newMerchant]);
                        setNewMerchant('');
                      } catch {
                        Alert.alert('Error', 'Failed to add merchant');
                      }
                    }}
                    style={styles.addMerchantButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.whitelistItems}>
                  {whitelist.map(merchant => (
                    <View key={merchant} style={styles.whitelistItem}>
                      <Text style={styles.whitelistMerchant}>{merchant}</Text>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await apiCall('DELETE', `/analytics/spending-alerts/whitelist/${encodeURIComponent(merchant)}`);
                            setWhitelist(prev => prev.filter(m => m !== merchant));
                          } catch {
                            Alert.alert('Error', 'Failed to remove merchant');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#F59E0B',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 24,
    position: 'relative',
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
    marginBottom: 16,
  },
  settingsButton: {
    position: 'absolute',
    top: 70,
    right: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterControls: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#00B77D',
    borderColor: '#00B77D',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleControls: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  bulkActions: {
    backgroundColor: '#00B77D',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkActionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkAcknowledgeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  bulkAcknowledgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bulkDismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  bulkDismissText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  alertCardAcknowledged: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  alertAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertMerchant: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  alertCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  alertDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  alertActions: {
    alignItems: 'center',
  },
  selectButton: {
    padding: 8,
  },
  selectButtonActive: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  alertActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#00B77D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
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
    marginBottom: 12,
  },
  settingsGrid: {
    gap: 12,
  },
  settingsItem: {
    gap: 8,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  settingsInput: {
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
    marginBottom: 12,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whitelistItems: {
    gap: 8,
  },
  whitelistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  whitelistMerchant: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});