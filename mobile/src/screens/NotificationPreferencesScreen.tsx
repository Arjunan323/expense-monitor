import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { listNotificationPrefs, upsertNotificationPref, MobileNotificationPreferenceDto, fetchLowBalanceThreshold, updateLowBalanceThreshold } from '../utils/api';
import Toast from 'react-native-toast-message';

const NOTIF_LABELS: Record<string,string> = {
  SPENDING_ALERT: 'Spending Alerts',
  WEEKLY_SUMMARY: 'Weekly Summary',
  GOAL_PROGRESS: 'Goal Progress',
  FORECAST_ALERT: 'Forecast Alerts',
  LOW_BALANCE: 'Low Balance',
};

export const NotificationPreferencesScreen: React.FC = () => {
  const [prefs,setPrefs]=useState<MobileNotificationPreferenceDto[]>([]);
  const [loading,setLoading]=useState(false);
  const [threshold,setThreshold]=useState<number|undefined>();
  const load = async() => {
    setLoading(true);
    const p = await listNotificationPrefs();
    setPrefs(p);
    const th = await fetchLowBalanceThreshold();
    if(th!==null) setThreshold(th);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  const toggle = async (p: MobileNotificationPreferenceDto) => {
    const optimistic = prefs.map(x=> x.id===p.id? { ...x, emailEnabled: !x.emailEnabled }: x);
    setPrefs(optimistic);
    const res = await upsertNotificationPref(p.type, !p.emailEnabled);
    if(!res){ Toast.show({ type:'error', text1:'Update failed'}); load(); } else { Toast.show({ type:'success', text1:'Preference saved'}); }
  };
  const renderItem = ({ item }: { item: MobileNotificationPreferenceDto }) => (
    <View style={styles.prefRow}>
      <View style={styles.prefTextWrap}>
        <Text style={styles.prefTitle}>{NOTIF_LABELS[item.type] || item.type}</Text>
        <Text style={styles.prefDesc}>Email notifications</Text>
      </View>
      <Switch value={item.emailEnabled} onValueChange={()=> toggle(item)} trackColor={{ false:'#d1d5db', true:'#34d399'}} thumbColor={item.emailEnabled? '#059669':'#f4f4f5'} />
    </View>
  );
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notification Preferences</Text>
      <FlatList
        data={prefs}
        keyExtractor={i=> String(i.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
      <View style={styles.thresholdCard}>
        <Text style={styles.thresholdTitle}>Low Balance Threshold</Text>
        {threshold===undefined? <Text style={styles.thresholdValue}>Loading...</Text>: <Text style={styles.thresholdValue}>${threshold}</Text>}
        <TouchableOpacity style={styles.thresholdBtn} onPress={async()=>{ if(threshold===undefined) return; const newVal = Math.max(0, threshold - 50); const ok = await updateLowBalanceThreshold(newVal); if(ok){ setThreshold(newVal); Toast.show({ type:'success', text1:'Threshold updated'});} else { Toast.show({ type:'error', text1:'Failed to update'});} }}>
          <Text style={styles.thresholdBtnText}>Lower by $50 (demo)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, backgroundColor:'#F8FAFC' },
  header:{ fontSize:22, fontWeight:'700', marginBottom:16, color:'#111827' },
  prefRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#FFFFFF', padding:16, borderRadius:16, marginBottom:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, shadowOffset:{ width:0, height:3 }, elevation:3 },
  prefTextWrap:{ flex:1, paddingRight:12 },
  prefTitle:{ fontSize:16, fontWeight:'600', color:'#1F2937' },
  prefDesc:{ fontSize:12, color:'#6B7280', marginTop:4 },
  footerSpace:{ height:40 },
  thresholdCard:{ backgroundColor:'#ECFDF5', borderRadius:20, padding:20, marginTop:8 },
  thresholdTitle:{ fontSize:16, fontWeight:'600', color:'#065F46', marginBottom:4 },
  thresholdValue:{ fontSize:28, fontWeight:'700', color:'#047857', marginBottom:12 },
  thresholdBtn:{ backgroundColor:'#059669', paddingVertical:10, borderRadius:12, alignItems:'center' },
  thresholdBtnText:{ color:'#FFFFFF', fontWeight:'600' }
});
