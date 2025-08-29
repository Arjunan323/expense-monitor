import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { LineChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../utils/formatters';
import { apiCall } from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';

const { width } = Dimensions.get('window');

export const MonthlyTrendsScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewMode, setViewMode] = useState<'category' | 'bank' | 'previous'>('category');

  const [chartData, setChartData] = useState({ labels: [] as string[], datasets: [{ data: [] as number[], color: (o=1)=>`rgba(0,183,125,${o})`, strokeWidth:3 }]});
  const [summaryStats, setSummaryStats] = useState({
    highestMonth: { month: '', amount: 0 },
    lowestMonth: { month: '', amount: 0 },
    averageSpending: 0,
    momChange: 0
  });
  const [error, setError] = useState<string|null>(null);

  const computeRange = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = new Date(end.getFullYear(), end.getMonth()-5, 1);
    const fmt = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { from: fmt(start), to: fmt(end) };
  };

  const load = useCallback(async ()=>{
    setLoading(true); setError(null);
    try {
      const r = await apiCall<any>('GET', `/analytics/trends/spending/monthly-series?from=${computeRange().from}&to=${computeRange().to}&includePrevYear=${viewMode==='previous'}&includeBanks=${viewMode==='bank'}`);
      const labels = r.monthly.map((m:any)=>{ const [y,mo]=m.month.split('-'); return new Date(Number(y), Number(mo)-1,1).toLocaleString(undefined,{month:'short'}); });
      const data = r.monthly.map((m:any)=> Number(m.totalOutflow));
      setChartData({ labels, datasets:[{ data, color:(o=1)=>`rgba(0,183,125,${o})`, strokeWidth:3 }]});
      setSummaryStats({
        highestMonth: { month: r.summary.highest.month, amount: Number(r.summary.highest.amount) },
        lowestMonth: { month: r.summary.lowest.month, amount: Number(r.summary.lowest.amount) },
        averageSpending: Number(r.summary.averageOutflow),
        momChange: r.summary.momChangePct? Number(r.summary.momChangePct):0
      });
    } catch(e:any){ setError(e.message||'Failed'); }
    finally { setLoading(false); }
  }, [viewMode]);

  useEffect(()=>{ load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if(error){
    return <View style={{ padding:24 }}><Text style={{ color:'#dc2626', marginBottom:12 }}>{error}</Text><TouchableOpacity onPress={load} style={{ backgroundColor:'#00B77D', padding:12, borderRadius:10 }}><Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Retry</Text></TouchableOpacity></View>;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Spending Trends</Text>
        <Text style={styles.headerSubtitle}>Track and compare your spending patterns over time</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.highestCard]}>
          <View style={styles.statHeader}>
            <View style={styles.statIcon}>
              <Ionicons name="trending-up" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statBadge}>HIGHEST</Text>
          </View>
          <Text style={styles.statLabel}>Highest Spend Month</Text>
          <Text style={styles.statValue}>{formatCurrency(summaryStats.highestMonth.amount, preferences)}</Text>
          <Text style={styles.statSubtext}>{summaryStats.highestMonth.month}</Text>
        </View>

        <View style={[styles.statCard, styles.lowestCard]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#00B77D' }]}>
              <Ionicons name="trending-down" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.statBadge, { backgroundColor: '#CCFBEF', color: '#00B77D' }]}>LOWEST</Text>
          </View>
          <Text style={styles.statLabel}>Lowest Spend Month</Text>
          <Text style={styles.statValue}>{formatCurrency(summaryStats.lowestMonth.amount, preferences)}</Text>
          <Text style={styles.statSubtext}>{summaryStats.lowestMonth.month}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.averageCard]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: '#0077B6' }]}>
              <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.statBadge, { backgroundColor: '#E0F2FE', color: '#0077B6' }]}>AVERAGE</Text>
          </View>
          <Text style={styles.statLabel}>Average Monthly</Text>
          <Text style={styles.statValue}>{formatCurrency(summaryStats.averageSpending, preferences)}</Text>
          <Text style={styles.statSubtext}>Last 6 months</Text>
        </View>

        <View style={[styles.statCard, summaryStats.momChange >= 0 ? styles.increaseCard : styles.decreaseCard]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: summaryStats.momChange >= 0 ? '#EF4444' : '#00B77D' }]}>
              <Ionicons name={summaryStats.momChange >= 0 ? "trending-up" : "trending-down"} size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.statBadge, { 
              backgroundColor: summaryStats.momChange >= 0 ? '#FEE2E2' : '#CCFBEF',
              color: summaryStats.momChange >= 0 ? '#EF4444' : '#00B77D'
            }]}>
              {summaryStats.momChange >= 0 ? 'INCREASE' : 'DECREASE'}
            </Text>
          </View>
          <Text style={styles.statLabel}>Month-over-Month</Text>
          <Text style={[styles.statValue, { color: summaryStats.momChange >= 0 ? '#EF4444' : '#00B77D' }]}>
            {summaryStats.momChange >= 0 ? '+' : ''}{summaryStats.momChange}%
          </Text>
          <Text style={styles.statSubtext}>vs last month</Text>
        </View>
      </View>

      {/* View Mode Toggles */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleTitle}>View Mode</Text>
        <View style={styles.toggleButtons}>
          {[
            { key: 'category', label: 'By Category', icon: 'pie-chart' },
            { key: 'bank', label: 'By Bank', icon: 'business' },
            { key: 'previous', label: 'Previous Year', icon: 'calendar' }
          ].map(mode => (
            <TouchableOpacity
              key={mode.key}
              onPress={() => setViewMode(mode.key as any)}
              style={[
                styles.toggleButton,
                viewMode === mode.key && styles.toggleButtonActive
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={mode.icon as any} 
                size={16} 
                color={viewMode === mode.key ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                styles.toggleButtonText,
                viewMode === mode.key && styles.toggleButtonTextActive
              ]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Spending Trends</Text>
          <Text style={styles.chartSubtitle}>Monthly expenditure patterns</Text>
        </View>
        
        <LineChart
          data={chartData}
          width={width - 48}
          height={250}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 183, 125, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#00B77D'
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: '#F3F4F6'
            }
          }}
          bezier
          style={styles.chart}
          formatYLabel={(value) => `₹${(parseInt(value)/1000).toFixed(0)}K`}
        />
      </View>

      {/* Insights */}
      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>💡 Key Insights</Text>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: '#00B77D' }]} />
            <Text style={styles.insightText}>Your spending decreased by 10.5% last month - great job cutting costs!</Text>
          </View>
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: '#0077B6' }]} />
            <Text style={styles.insightText}>Food category shows the most consistent spending pattern.</Text>
          </View>
          <View style={styles.insightItem}>
            <View style={[styles.insightDot, { backgroundColor: '#FFD60A' }]} />
            <Text style={styles.insightText}>Consider setting a budget for Travel category to control peaks.</Text>
          </View>
        </View>
      </View>
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
    backgroundColor: '#00B77D',
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
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  highestCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  lowestCard: {
    borderColor: '#CCFBEF',
    backgroundColor: '#F0FDF9',
  },
  averageCard: {
    borderColor: '#E0F2FE',
    backgroundColor: '#F0F9FF',
  },
  increaseCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  decreaseCard: {
    borderColor: '#CCFBEF',
    backgroundColor: '#F0FDF9',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  toggleContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  toggleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#00B77D',
    borderColor: '#00B77D',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chart: {
    borderRadius: 16,
  },
  insightsCard: {
    backgroundColor: '#F0FDF9',
    borderWidth: 2,
    borderColor: '#CCFBEF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});