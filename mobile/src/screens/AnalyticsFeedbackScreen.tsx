import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export const AnalyticsFeedbackScreen: React.FC = () => {
  const { user } = useAuth();
  const featureOptions = [
    'Monthly spending trends and comparisons',
    'Budget setting and tracking by category',
    'Unusual spending pattern alerts',
    'Cash flow forecasting',
    'Goal tracking (savings, debt reduction)',
    'Tax-related expense categorization'
  ];

  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type:'success'|'error'; text:string}|null>(null);

  const toggle = (label: string) => {
    setSelected(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const submitFeedback = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const meta = {
        features: selected,
        other: otherText.trim() || undefined,
        platform: 'mobile'
      };
      const body = {
        email: user?.email,
        message: otherText.trim() || 'Analytics feature feedback',
        type: 'ANALYTICS',
        meta: JSON.stringify(meta)
      };
      const { apiCall } = await import('../utils/api');
      await apiCall('POST', '/feedback/analytics', body);
      setStatusMsg({type:'success', text:'Thanks! Feedback submitted.'});
      setSelected([]);
      setOtherText('');
    } catch (e:any) {
      setStatusMsg({type:'error', text: e.message || 'Failed to submit'});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: Platform.OS === 'ios' ? 120 : 100}}>
      <Text style={styles.title}>Analytics Feedback</Text>
      <Text style={styles.subtitle}>Help us prioritize the analytics features that matter most to you.</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select desired features</Text>
        <View style={styles.checkboxList}>
          {featureOptions.map(opt => {
            const active = selected.includes(opt);
            return (
              <TouchableOpacity key={opt} style={styles.checkboxItem} onPress={() => toggle(opt)} activeOpacity={0.7}>
                <Ionicons name={active ? 'checkbox' : 'square-outline'} size={20} color={active ? '#0ea5e9' : '#6b7280'} />
                <Text style={[styles.checkboxText, active && {color:'#0f172a', fontWeight:'600'}]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.textAreaWrapper}>
          <Text style={styles.textAreaLabel}>Additional analytics ideas</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any other analytics features you'd like to see?"
              placeholderTextColor="#64748b"
              multiline
              value={otherText}
              onChangeText={setOtherText}
              textAlignVertical="top"
              maxLength={500}
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={styles.charCount}>{otherText.length}/500</Text>
        </View>
        {statusMsg && (
          <Text style={{marginBottom:12, color: statusMsg.type==='success' ? '#047857' : '#b91c1c', fontSize:13}}>{statusMsg.text}</Text>
        )}
        <TouchableOpacity style={[styles.submitButton, submitting && {opacity:0.6}]} disabled={submitting} onPress={submitFeedback}>
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f1f5f9', paddingHorizontal:24, paddingTop:24 },
  title: { fontSize:24, fontWeight:'700', color:'#0f172a', marginBottom:4 },
  subtitle: { fontSize:14, color:'#475569', marginBottom:20, lineHeight:20 },
  card: { backgroundColor:'#ffffff', borderRadius:16, padding:20, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:6, elevation:3 },
  sectionTitle: { fontSize:16, fontWeight:'600', color:'#0f172a', marginBottom:12 },
  checkboxList: { marginBottom:16 },
  checkboxItem: { flexDirection:'row', alignItems:'center', marginBottom:12, gap:12 },
  checkboxText: { flex:1, fontSize:14, color:'#374151', lineHeight:20 },
  textAreaWrapper: { marginBottom:16 },
  textAreaLabel: { fontSize:12, fontWeight:'600', color:'#475569', marginBottom:4, textTransform:'uppercase' },
  textArea: { borderWidth:1, borderColor:'#99f6e4', backgroundColor:'#ecfeff', minHeight:100, borderRadius:12, padding:12, fontSize:14, color:'#0f172a' },
  charCount: { position:'absolute', right:8, bottom:8, fontSize:10, color:'#64748b' },
  submitButton: { backgroundColor:'#0ea5e9', paddingVertical:12, paddingHorizontal:24, borderRadius:8, alignItems:'center' },
  submitButtonText: { color:'#ffffff', fontSize:16, fontWeight:'600' },
});

export default AnalyticsFeedbackScreen;
