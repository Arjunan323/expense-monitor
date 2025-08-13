import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { apiCall } from '../utils/api';
import { formatDateTime } from '../utils/formatters';

interface RawStatement {
  id: number;
  fileName: string;
  uploadDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  bankName?: string;
  transactionCount?: number;
  parseWarnings?: string[];
}

export const StatementsScreen: React.FC = () => {
  const [statements, setStatements] = useState<RawStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const data = await apiCall<RawStatement[]>('GET', '/statements');
      setStatements(data);
    } catch (error: any) {
      console.error('Statements error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatements();
    setRefreshing(false);
  };

  const handleDelete = async (id: number, fileName: string) => {
    Alert.alert(
      'Delete Statement',
      `Are you sure you want to delete "${fileName}"? This will also remove all associated transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall('DELETE', `/statements/${id}`);
              setStatements(prev => prev.filter(s => s.id !== id));
              Alert.alert('Success', 'Statement deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete statement');
            }
          },
        },
      ]
    );
  };

  const handleReparse = async (id: number) => {
    try {
      setProcessingIds(prev => new Set(prev).add(id));
      await apiCall('POST', `/statements/${id}/reparse`);
      Alert.alert('Success', 'Statement is being re-parsed');
      setTimeout(fetchStatements, 2000);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to re-parse statement');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Ionicons name="checkmark-circle" size={20} color="#22c55e" />;
      case 'FAILED':
        return <Ionicons name="alert-circle" size={20} color="#ef4444" />;
      case 'PROCESSING':
        return <LoadingSpinner size="small" color="#0ea5e9" />;
      default:
        return <Ionicons name="time-outline" size={20} color="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'PROCESSING':
        return 'Processing';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  };

  const renderStatement = ({ item }: { item: RawStatement }) => (
    <View style={styles.statementItem}>
      <View style={styles.statementHeader}>
        <View style={styles.fileInfo}>
          <Ionicons name="document-text-outline" size={24} color="#6b7280" />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.fileName}
            </Text>
            <View style={styles.metaInfo}>
              <Text style={styles.uploadDate}>
                {formatDateTime(item.uploadDate)}
              </Text>
              {item.bankName && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.bankName}>{item.bankName}</Text>
                </>
              )}
            </View>
            {item.parseWarnings && item.parseWarnings.length > 0 && (
              <Text style={styles.warnings}>
                {item.parseWarnings.length} warning(s)
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReparse(item.id)}
            disabled={processingIds.has(item.id)}
          >
            {processingIds.has(item.id) ? (
              <LoadingSpinner size="small" color="#0ea5e9" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#0ea5e9" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id, item.fileName)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statementFooter}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[
            styles.statusText,
            {
              color: item.status === 'COMPLETED' ? '#22c55e' :
                     item.status === 'FAILED' ? '#ef4444' : '#6b7280'
            }
          ]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.transactionCount}>
          {item.transactionCount || 0} transactions
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (statements.length === 0) {
    return (
      <EmptyState
        icon="document-text-outline"
        title="No statements uploaded"
        description="Upload your first bank statement to see it listed here"
        action={{
          label: 'Upload Statement',
          onPress: () => {/* Navigate to upload */},
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Uploaded Statements</Text>
        <Text style={styles.headerSubtitle}>
          Manage your uploaded bank statements and re-process if needed
        </Text>
      </View>

      <FlatList
        data={statements}
        renderItem={renderStatement}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Statement Management</Text>
        <View style={styles.helpContent}>
          <Text style={styles.helpText}>
            <Text style={styles.helpBold}>Re-parse:</Text> Use this if we've improved our parsing algorithms and you want to re-process an old statement.
          </Text>
          <Text style={styles.helpText}>
            <Text style={styles.helpBold}>Delete:</Text> Permanently removes the statement and all associated transactions from your account.
          </Text>
          <Text style={styles.helpText}>
            <Text style={styles.helpBold}>Warnings:</Text> Indicate potential issues during parsing - the data may still be accurate but should be reviewed.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: Platform.OS === 'ios' ? 88 : 60,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  statementItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  bankName: {
    fontSize: 12,
    color: '#6b7280',
  },
  warnings: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  statementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  helpCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 24,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  helpContent: {
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
  },
});