import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../utils/api';
import * as FileSystem from 'expo-file-system';
// @ts-ignore - types may be missing for expo-sharing in this template
import * as Sharing from 'expo-sharing';

// Types mirrored from web client minimal subset
interface TaxTransactionDto {
  id: number;
  taxYear: number | null;
  category: string | null;
  amount: number | null;
  paidDate: string | null;
  note: string | null;
  deductible: boolean | null;
  hasReceipt: boolean | null;
  classificationStatus?: string | null;
}
interface TaxCategoryUsageDto { code:string; description:string; annualLimit:number|null; used:number; remaining:number; percentUsed:number; overLimit:boolean; nearLimit:boolean; }
interface TaxSummaryDto { year:number|null; totalDeductible:number; estimatedTaxSavings:number; missingReceipts:number; categories:TaxCategoryUsageDto[]; }
interface TaxDeductionChecklistItem { id:number; item:string; category?:string; checked?:boolean; amount?:string; }
interface TaxSavingTip { id:number; title:string; message:string; icon?:string; }
interface ClassificationRule { id?:number; matchType:string; matchValue:string; taxCategoryCode:string; priority:number; autoMarkDeductible:boolean; active:boolean; }

const currencyFormat = (val:number|undefined|null, prefs:any) => {
  if(val==null) return '—';
  try { return new Intl.NumberFormat(prefs.locale||'en-IN',{ style:'currency', currency:prefs.currency||'INR'}).format(val); } catch { return String(val); }
};

export const TaxTrackerScreen: React.FC = () => {
  const { preferences } = usePreferences();
  const currentFY = (()=> { const now = new Date(); const y = now.getMonth()>=3? now.getFullYear(): now.getFullYear()-1; return `${y}-${(y+1).toString().slice(-2)}`; })();
  const [selectedFy, setSelectedFy] = useState(currentFY);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TaxSummaryDto|null>(null);
  const [transactions, setTransactions] = useState<TaxTransactionDto[]>([]);
  const [categories, setCategories] = useState<TaxCategoryUsageDto[]>([]);
  const [checklist, setChecklist] = useState<TaxDeductionChecklistItem[]>([]);
  const [tips, setTips] = useState<TaxSavingTip[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [showChecklist, setShowChecklist] = useState(true);
  const [uploadingId, setUploadingId] = useState<number|null>(null);
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [newRule, setNewRule] = useState<ClassificationRule>({ matchType:'DESCRIPTION_REGEX', matchValue:'', taxCategoryCode:'80C', priority:0, autoMarkDeductible:true, active:true });
  const [editingRuleId, setEditingRuleId] = useState<number|null>(null);
  const [editingRule, setEditingRule] = useState<ClassificationRule|null>(null);
  const RULE_TYPES = ['DESCRIPTION_REGEX','CATEGORY','MERCHANT','AMOUNT_RANGE'] as const;
  const fyYear = (fy:string)=> parseInt(fy.substring(0,4),10);

  const loadAll = useCallback(async ()=> {
    try {
      setLoading(true); setError(null);
      const year = fyYear(selectedFy);
      const [summaryData, txData, checklistData, tipsData] = await Promise.all([
        apiCall<TaxSummaryDto>('GET', `/analytics/taxes/summary?year=${year}`),
        apiCall<TaxTransactionDto[]>('GET', `/analytics/taxes?year=${year}`),
        apiCall<TaxDeductionChecklistItem[]>('GET', `/analytics/taxes/checklist`),
        apiCall<TaxSavingTip[]>('GET', `/analytics/taxes/tips`)
      ]);
      setSummary(summaryData);
      setCategories(summaryData.categories||[]);
      setTransactions(txData);
      setChecklist(checklistData);
      setTips(tipsData);
    } catch(e:any){ setError(e.message||'Failed to load tax data'); }
    finally { setLoading(false); }
  },[selectedFy]);

  useEffect(()=> { loadAll(); }, [loadAll]);

  const toggleDeductible = async (id:number) => {
    try {
      const updated = await apiCall<TaxTransactionDto>('POST', `/analytics/taxes/${id}/toggle-deductible`, {});
      setTransactions(prev => prev.map(t=> t.id===id? updated : t));
      loadAll();
    } catch(e:any){ Alert.alert('Error', e.message||'Toggle failed'); }
  };

  const pickAndUploadReceipt = async (id:number) => {
    try {
      const result: any = await DocumentPicker.getDocumentAsync({ type: ['application/pdf','image/*'] });
      if(result.canceled) return;
      const file = result.assets? result.assets[0] : result;
      if(!file) return;
      setUploadingId(id);
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name || `receipt-${id}.pdf`,
        type: file.mimeType || 'application/octet-stream'
      } as any);
      await api.post(`/analytics/taxes/${id}/upload-receipt`, form, { headers: { 'Content-Type':'multipart/form-data' } });
      await loadAll();
    } catch(e:any){ Alert.alert('Upload Failed', e.message||'Could not upload receipt'); }
    finally { setUploadingId(null); }
  };

  const arrayBufferToBase64 = (buffer:ArrayBuffer):string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for(let i=0;i<len;i++){ binary += String.fromCharCode(bytes[i]); }
    // @ts-ignore
    return (typeof btoa !== 'undefined'? btoa(binary) : Buffer.from(binary,'binary').toString('base64'));
  };

  const viewReceipt = async (id:number) => {
    try {
      setUploadingId(id); // reuse spinner state
      const response = await api.get(`/analytics/taxes/${id}/receipt`, { responseType:'arraybuffer' });
      const base64 = arrayBufferToBase64(response.data);
      const fileUri = FileSystem.cacheDirectory + `receipt-${id}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if(await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Receipt Saved', 'File stored at temporary location: '+fileUri);
      }
    } catch(e:any){ Alert.alert('View Failed', e.message||'Could not open receipt'); }
    finally { setUploadingId(null); }
  };

  // Rules CRUD
  const loadRules = useCallback(async ()=> {
    try {
      const data = await apiCall<ClassificationRule[]>('GET', '/analytics/taxes/rules');
      setRules(data);
      setEditingRuleId(null); setEditingRule(null);
    } catch(e:any){ /* silent */ }
  },[]);

  const createRule = async () => {
    if(!newRule.matchValue) { Alert.alert('Validation','Enter match value'); return; }
    try { await apiCall('POST','/analytics/taxes/rules', newRule); setNewRule({...newRule, matchValue:''}); loadRules(); }
    catch(e:any){ Alert.alert('Error', e.message||'Create failed'); }
  };
  const startEditRule = (r:ClassificationRule) => { setEditingRuleId(r.id!); setEditingRule({...r}); };
  const cancelEditRule = () => { setEditingRuleId(null); setEditingRule(null); };
  const saveRule = async () => { if(!editingRule) return; try { await apiCall('PUT', `/analytics/taxes/rules/${editingRule.id}`, editingRule); cancelEditRule(); loadRules(); } catch(e:any){ Alert.alert('Error', e.message||'Update failed'); } };
  const deleteRule = async (id:number) => { Alert.alert('Delete Rule','Are you sure?',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive', onPress: async()=>{ try{ await apiCall('DELETE', `/analytics/taxes/rules/${id}`); loadRules(); } catch{} }}]); };

  const categoryIcon: Record<string,string> = { '80C':'💰','80D':'🏥','80G':'❤️','24(b)':'🏠','80E':'📚','80TTA':'🏦' };

  const fyOptions = [currentFY, `${parseInt(currentFY.substring(0,4))-1}-${(parseInt(currentFY.substring(0,4)) ).toString().slice(-2)}`, `${parseInt(currentFY.substring(0,4))-2}-${(parseInt(currentFY.substring(0,4))-1 ).toString().slice(-2)}`];

  if(loading){
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1"/><Text style={styles.loadingText}>Loading Tax Data...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:40}}>
      <View style={styles.header}> 
        <Text style={styles.title}>Tax Benefit Tracker</Text>
        <Text style={styles.subtitle}>Optimize deductions & stay compliant</Text>
        <View style={styles.fySwitch}>
          {fyOptions.map(fy=> (
            <TouchableOpacity key={fy} style={[styles.fyChip, fy===selectedFy && styles.fyChipActive]} onPress={()=> setSelectedFy(fy)}>
              <Text style={[styles.fyChipText, fy===selectedFy && styles.fyChipTextActive]}>{fy}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      {/* Summary Cards */}
      {summary && (
        <View style={styles.cardsRow}>
          <View style={[styles.statCard,{backgroundColor:'#EEF2FF'}]}>
            <View style={[styles.statIconCircle,{backgroundColor:'#6366F1'}]}>
              <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Total Deductible</Text>
            <Text style={styles.cardValue}>{currencyFormat(summary.totalDeductible, preferences)}</Text>
          </View>
          <View style={[styles.statCard,{backgroundColor:'#ECFDF5'}]}>
            <View style={[styles.statIconCircle,{backgroundColor: summary.missingReceipts>0? '#DC2626':'#059669'}]}>
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Missing Receipts</Text>
            <Text style={[styles.cardValue, summary.missingReceipts>0 && {color:'#DC2626'}]}>{summary.missingReceipts}</Text>
          </View>
          <View style={[styles.statCard,{backgroundColor:'#F5F3FF'}]}>
            <View style={[styles.statIconCircle,{backgroundColor:'#8B5CF6'}]}>
              <Ionicons name="trending-down-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Est. Savings</Text>
            <Text style={styles.cardValue}>{currencyFormat(summary.estimatedTaxSavings, preferences)}</Text>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deduction Categories</Text>
        <View>
          {categories.map(c=> (
            <View key={c.code} style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{categoryIcon[c.code]||'📄'}</Text>
              <View style={{flex:1}}>
                <Text style={styles.categoryCode}>{c.code}</Text>
                <Text style={styles.categoryDesc}>{c.description}</Text>
                {c.annualLimit!=null && (
                  <View style={styles.progressBarOuter}>
                    <View style={[styles.progressBarInner,{ width: `${Math.min(100,c.percentUsed)}%`, backgroundColor: c.overLimit? '#EF4444' : c.nearLimit? '#F59E0B':'#10B981'}]} />
                  </View>
                )}
                <Text style={styles.categoryMeta}>{currencyFormat(c.used, preferences)}{c.annualLimit? ` / ${currencyFormat(c.annualLimit, preferences)}`:''}</Text>
              </View>
              {c.overLimit && <Ionicons name="warning" size={20} color="#EF4444"/>}
            </View>
          ))}
        </View>
      </View>

      {/* Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {transactions.length===0 && <Text style={styles.emptyText}>No tax transactions yet.</Text>}
        {transactions.map(t=> (
          <View key={t.id} style={styles.txRow}>
            <View style={{flex:1}}>
              <Text style={styles.txNote}>{t.note}</Text>
              <Text style={styles.txMeta}>{t.paidDate || ''} • {t.category || ''}</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={styles.txAmount}>{currencyFormat(t.amount||0, preferences)}</Text>
              <TouchableOpacity onPress={()=> toggleDeductible(t.id)} style={[styles.deductibleBadge, t.deductible? styles.deductibleOn: styles.deductibleOff]}>
                <Text style={[styles.deductibleText, t.deductible? {color:'#065F46'}:{color:'#374151'}]}>{t.deductible? 'Deductible':'Not Deductible'}</Text>
              </TouchableOpacity>
              <View style={styles.receiptBtnRow}>
                {!t.hasReceipt && (
                  <TouchableOpacity disabled={uploadingId===t.id} onPress={()=> pickAndUploadReceipt(t.id)} style={[styles.receiptBtn, styles.receiptBtnPending]}>
                    {uploadingId===t.id ? <ActivityIndicator size="small" color="#1F2937"/> : <Text style={styles.receiptBtnText}>Upload</Text>}
                  </TouchableOpacity>
                )}
                {t.hasReceipt && (
                  <TouchableOpacity disabled={uploadingId===t.id} onPress={()=> viewReceipt(t.id)} style={[styles.receiptBtn, styles.receiptBtnDone]}>
                    {uploadingId===t.id ? <ActivityIndicator size="small" color="#1F2937"/> : <Text style={styles.receiptBtnText}>View</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Checklist & Tips */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Checklist & Tips</Text>
          <TouchableOpacity onPress={()=> setShowChecklist(s=>!s)}>
            <Ionicons name={showChecklist? 'chevron-up':'chevron-down'} size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>
        {showChecklist && (
          <View>
            <Text style={styles.subheading}>Checklist</Text>
            {checklist.map(item=> (
              <View key={item.id} style={styles.checklistItem}>
                <Text style={styles.bullet}>•</Text>
                <View style={{flex:1}}>
                  <Text style={styles.checklistText}>{item.item}</Text>
                  {item.amount && <Text style={styles.checklistMeta}>{item.amount}</Text>}
                </View>
                {item.category && <Text style={styles.checklistCategory}>{item.category}</Text>}
              </View>
            ))}
            <Text style={styles.subheading}>Tips</Text>
            {tips.map(t=> (
              <View key={t.id} style={styles.tipItem}>
                <Text style={styles.tipIcon}>{t.icon || '💡'}</Text>
                <View style={{flex:1}}>
                  <Text style={styles.tipTitle}>{t.title}</Text>
                  <Text style={styles.tipMessage}>{t.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Rules Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Classification Rules</Text>
          <TouchableOpacity onPress={()=> { setShowRules(s=>!s); if(!showRules) loadRules(); }}>
            <Ionicons name={showRules? 'chevron-up':'chevron-down'} size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>
        {showRules && (
          <View>
            {rules.map(r => (
              editingRuleId===r.id && editingRule ? (
                <View key={r.id} style={styles.ruleRowEdit}>
                  <View style={styles.ruleEditLine}>
                    <Text style={styles.ruleLabel}>Type</Text>
                    <View style={styles.ruleTypePickerRow}>
                      {RULE_TYPES.map(rt=> (
                        <TouchableOpacity key={rt} onPress={()=> setEditingRule(prev=> prev? ({...prev, matchType:rt}) : prev)} style={[styles.ruleTypeChip, editingRule.matchType===rt && styles.ruleTypeChipActive]}>
                          <Text style={[styles.ruleTypeChipText, editingRule.matchType===rt && styles.ruleTypeChipTextActive]}>{rt.replace('DESCRIPTION_','DESC_')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.ruleEditLine}>
                    <Text style={styles.ruleLabel}>Value</Text>
                    <TextInput
                      style={styles.ruleTextInput}
                      placeholder="Match value"
                      value={editingRule.matchValue}
                      onChangeText={txt=> setEditingRule(prev=> prev? {...prev, matchValue:txt}:prev)}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.ruleEditLine}>
                    <Text style={styles.ruleLabel}>Category</Text>
                    <TextInput
                      style={[styles.ruleTextInput,{width:100}]}
                      placeholder="Code"
                      value={editingRule.taxCategoryCode}
                      onChangeText={txt=> setEditingRule(prev=> prev? {...prev, taxCategoryCode:txt}:prev)}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={styles.ruleEditLine}>
                    <Text style={styles.ruleLabel}>Priority</Text>
                    <TextInput
                      style={[styles.ruleTextInput,{width:60}]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={String(editingRule.priority)}
                      onChangeText={txt=> setEditingRule(prev=> prev? {...prev, priority: parseInt(txt||'0',10)}:prev)}
                    />
                  </View>
                  <View style={[styles.ruleEditActions]}> 
                    <TouchableOpacity onPress={saveRule} style={styles.ruleActionBtn}><Text style={styles.ruleActionText}>Save</Text></TouchableOpacity>
                    <TouchableOpacity onPress={cancelEditRule} style={[styles.ruleActionBtn,{backgroundColor:'#F3F4F6'}]}><Text style={[styles.ruleActionText,{color:'#374151'}]}>Cancel</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View key={r.id} style={styles.ruleRow}>
                  <Text style={styles.ruleType}>{r.matchType}</Text>
                  <Text style={styles.ruleValue} numberOfLines={1}>{r.matchValue}</Text>
                  <Text style={styles.ruleCat}>{r.taxCategoryCode}</Text>
                  <TouchableOpacity onPress={()=> startEditRule(r)}><Ionicons name="create-outline" size={18} color="#6366F1" /></TouchableOpacity>
                  <TouchableOpacity onPress={()=> r.id&& deleteRule(r.id)}><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>
                </View>
              )
            ))}
            {rules.length===0 && <Text style={styles.emptyText}>No rules yet.</Text>}
            <View style={styles.newRuleBox}>
              <Text style={styles.subheading}>Add Rule</Text>
              <View style={styles.ruleTypePickerRow}>
                {RULE_TYPES.map(rt=> (
                  <TouchableOpacity key={rt} onPress={()=> setNewRule(prev=> ({...prev, matchType:rt}))} style={[styles.ruleTypeChip, newRule.matchType===rt && styles.ruleTypeChipActive]}>
                    <Text style={[styles.ruleTypeChipText, newRule.matchType===rt && styles.ruleTypeChipTextActive]}>{rt.replace('DESCRIPTION_','DESC_')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.ruleTextInput}
                placeholder="Match value (regex/merchant/etc)"
                value={newRule.matchValue}
                onChangeText={txt=> setNewRule(prev=> ({...prev, matchValue:txt}))}
                autoCapitalize="none"
              />
              <View style={{flexDirection:'row', gap:8, marginTop:8}}>
                <TextInput
                  style={[styles.ruleTextInput,{flex:1}]}
                  placeholder="Category Code"
                  value={newRule.taxCategoryCode}
                  onChangeText={txt=> setNewRule(prev=> ({...prev, taxCategoryCode:txt}))}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.ruleTextInput,{width:70}]}
                  placeholder="Priority"
                  keyboardType="numeric"
                  value={String(newRule.priority)}
                  onChangeText={txt=> setNewRule(prev=> ({...prev, priority: parseInt(txt||'0',10)}))}
                />
              </View>
              <TouchableOpacity onPress={createRule} style={styles.addRuleBtn}><Text style={styles.addRuleBtnText}>Create Rule</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Alerts */}
      {summary && (summary.missingReceipts>0 || categories.some(c=> c.overLimit)) && (
        <View style={[styles.section,{backgroundColor:'#FEF3C7', borderColor:'#FCD34D'}]}>
          <Text style={[styles.sectionTitle,{marginBottom:8}]}>Action Required</Text>
          {summary.missingReceipts>0 && <Text style={styles.alertText}>⚠️ {summary.missingReceipts} receipt(s) missing — upload to claim deductions.</Text>}
          {categories.filter(c=>c.overLimit).map(c=> (
            <Text key={c.code} style={styles.alertText}>🚫 {c.code} limit exceeded. Extra amount not deductible.</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#F8FAFC' },
  center:{ flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  loadingText:{ marginTop:12, color:'#4B5563', fontWeight:'500' },
  header:{ paddingTop:60, paddingHorizontal:24, paddingBottom:24, backgroundColor:'#6366F1', borderBottomLeftRadius:28, borderBottomRightRadius:28 },
  title:{ fontSize:26, fontWeight:'bold', color:'#FFFFFF', marginBottom:4 },
  subtitle:{ fontSize:14, color:'rgba(255,255,255,0.85)' },
  fySwitch:{ flexDirection:'row', marginTop:16, flexWrap:'wrap', gap:8 },
  fyChip:{ paddingHorizontal:12, paddingVertical:6, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:18 },
  fyChipActive:{ backgroundColor:'#FFFFFF' },
  fyChipText:{ color:'#F3F4F6', fontWeight:'600', fontSize:12 },
  fyChipTextActive:{ color:'#4B5563' },
  errorBox:{ backgroundColor:'#FEE2E2', padding:12, margin:16, borderRadius:12 },
  errorText:{ color:'#B91C1C', fontWeight:'600' },
  cardsRow:{ flexDirection:'row', flexWrap:'wrap', gap:12, paddingHorizontal:16, marginTop:-16 },
  statCard:{ flexGrow:1, flexBasis:'30%', padding:16, borderRadius:18 },
  statIconCircle:{ width:32, height:32, borderRadius:16, justifyContent:'center', alignItems:'center', marginBottom:8 },
  cardLabel:{ fontSize:12, fontWeight:'600', color:'#4B5563', marginBottom:4 },
  cardValue:{ fontSize:18, fontWeight:'700', color:'#111827' },
  section:{ marginTop:24, padding:16, marginHorizontal:16, backgroundColor:'#FFFFFF', borderRadius:20, borderWidth:1, borderColor:'#E5E7EB' },
  sectionHeaderRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  sectionTitle:{ fontSize:18, fontWeight:'700', color:'#111827', marginBottom:12 },
  categoryRow:{ flexDirection:'row', gap:12, marginBottom:16 },
  categoryIcon:{ fontSize:28 },
  categoryCode:{ fontSize:14, fontWeight:'700', color:'#111827' },
  categoryDesc:{ fontSize:12, color:'#4B5563', marginBottom:6 },
  progressBarOuter:{ height:6, backgroundColor:'#E5E7EB', borderRadius:4, overflow:'hidden', marginBottom:4 },
  progressBarInner:{ height:6, borderRadius:4 },
  categoryMeta:{ fontSize:11, color:'#374151', fontWeight:'600' },
  txRow:{ flexDirection:'row', paddingVertical:12, borderBottomWidth:1, borderColor:'#F3F4F6' },
  txNote:{ fontSize:14, fontWeight:'600', color:'#111827' },
  txMeta:{ fontSize:11, color:'#6B7280', marginTop:2 },
  txAmount:{ fontSize:14, fontWeight:'700', color:'#111827', marginBottom:4 },
  deductibleBadge:{ paddingHorizontal:8, paddingVertical:4, borderRadius:12 },
  deductibleOn:{ backgroundColor:'#D1FAE5' },
  deductibleOff:{ backgroundColor:'#E5E7EB' },
  deductibleText:{ fontSize:10, fontWeight:'600' },
  emptyText:{ fontSize:13, color:'#6B7280', fontStyle:'italic', marginTop:4 },
  subheading:{ fontSize:14, fontWeight:'700', color:'#4B5563', marginTop:8, marginBottom:8 },
  checklistItem:{ flexDirection:'row', alignItems:'flex-start', marginBottom:10 },
  bullet:{ color:'#6366F1', fontSize:16, marginRight:8, marginTop:2 },
  checklistText:{ fontSize:13, color:'#111827', fontWeight:'500' },
  checklistMeta:{ fontSize:11, color:'#6B7280', marginTop:2 },
  checklistCategory:{ fontSize:11, fontWeight:'600', color:'#6366F1', marginLeft:8 },
  tipItem:{ flexDirection:'row', gap:12, paddingVertical:10, borderBottomWidth:1, borderColor:'#F3F4F6' },
  tipIcon:{ fontSize:22 },
  tipTitle:{ fontSize:13, fontWeight:'700', color:'#111827', marginBottom:4 },
  tipMessage:{ fontSize:12, color:'#374151', lineHeight:16 },
  alertText:{ fontSize:12, color:'#92400E', marginTop:4, fontWeight:'600' }
  ,receiptBtn:{ marginTop:4, paddingHorizontal:10, paddingVertical:6, borderRadius:10, alignItems:'center' }
  ,receiptBtnPending:{ backgroundColor:'#E0F2FE' }
  ,receiptBtnDone:{ backgroundColor:'#D1FAE5' }
  ,receiptBtnText:{ fontSize:10, fontWeight:'600', color:'#1F2937' }
  ,receiptBtnRow:{ flexDirection:'row', gap:6, marginTop:4 }
  ,ruleRow:{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:8, borderBottomWidth:1, borderColor:'#F3F4F6' }
  ,ruleType:{ flexBasis:90, fontSize:11, fontWeight:'700', color:'#1F2937' }
  ,ruleValue:{ flex:1, fontSize:11, color:'#374151' }
  ,ruleCat:{ fontSize:11, fontWeight:'600', color:'#6366F1', width:50 }
  ,ruleRowEdit:{ paddingVertical:10, borderBottomWidth:1, borderColor:'#F3F4F6' }
  ,ruleEditLine:{ flexDirection:'row', alignItems:'center', marginBottom:6 }
  ,ruleLabel:{ width:60, fontSize:11, fontWeight:'600', color:'#374151' }
  ,rulePicker:{ paddingHorizontal:10, paddingVertical:6, backgroundColor:'#EEF2FF', borderRadius:8 }
  ,rulePickerText:{ fontSize:11, fontWeight:'600', color:'#4F46E5' }
  ,ruleValueBox:{ flex:1, padding:8, backgroundColor:'#F3F4F6', borderRadius:8 }
  ,ruleTypePickerRow:{ flexDirection:'row', flexWrap:'wrap', gap:6, flex:1 }
  ,ruleTypeChip:{ paddingHorizontal:10, paddingVertical:6, backgroundColor:'#EEF2FF', borderRadius:16 }
  ,ruleTypeChipActive:{ backgroundColor:'#6366F1' }
  ,ruleTypeChipText:{ fontSize:10, fontWeight:'600', color:'#4F46E5' }
  ,ruleTypeChipTextActive:{ color:'#FFFFFF' }
  ,ruleValueInputBox:{ flex:1 }
  ,ruleValueMutable:{ fontSize:11, fontWeight:'600', color:'#1F2937' }
  ,ruleTextInput:{ flex:1, borderWidth:1, borderColor:'#E5E7EB', backgroundColor:'#FFFFFF', borderRadius:8, paddingHorizontal:10, paddingVertical:6, fontSize:12, color:'#111827' }
  ,ruleHelper:{ fontSize:10, color:'#6B7280', marginTop:8 }
  ,ruleEditActions:{ flexDirection:'row', gap:8, marginTop:8 }
  ,ruleActionBtn:{ flex:1, backgroundColor:'#6366F1', paddingVertical:8, borderRadius:10, alignItems:'center' }
  ,ruleActionText:{ fontSize:12, fontWeight:'700', color:'#FFFFFF' }
  ,newRuleBox:{ marginTop:12, padding:12, backgroundColor:'#F9FAFB', borderRadius:12, borderWidth:1, borderColor:'#E5E7EB' }
  ,newRuleRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }
  ,newRuleLabel:{ fontSize:11, fontWeight:'600', color:'#374151' }
  ,newRuleValue:{ fontSize:11, color:'#6B7280' }
  ,addRuleBtn:{ marginTop:8, backgroundColor:'#10B981', paddingVertical:8, borderRadius:10, alignItems:'center' }
  ,addRuleBtnText:{ fontSize:12, fontWeight:'700', color:'#FFFFFF' }
});

export default TaxTrackerScreen;
