import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { verifyEmailToken, resendVerification } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';

export const VerifyEmailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const token = route?.params?.token as string | undefined;
  const [status,setStatus]=useState<'checking'|'ok'|'fail'>('checking');
  const { user } = useAuth();
  useEffect(()=>{ (async()=>{ if(!token){ setStatus('fail'); return;} const ok = await verifyEmailToken(token); setStatus(ok? 'ok':'fail'); Toast.show({ type: ok? 'success':'error', text1: ok? 'Email verified':'Verification failed'}); if(ok) setTimeout(()=> navigation.replace('Dashboard'), 1200); })(); },[token]);
  if(status==='checking') return <View style={styles.center}><ActivityIndicator size="large" color="#00B77D" /><Text style={styles.msg}>Verifying...</Text></View>;
  if(status==='ok') return <View style={styles.center}><Text style={styles.success}>Email verified!</Text></View>;
  return <View style={styles.center}><Text style={styles.fail}>Link invalid or expired.</Text>{user?.email && <TouchableOpacity style={styles.resendBtn} onPress={()=>{ resendVerification(user.email!).then(()=> Toast.show({ type:'success', text1:'Verification email resent'})); }}><Text style={styles.resendText}>Resend verification</Text></TouchableOpacity>}</View>;
};

const styles = StyleSheet.create({
  center:{ flex:1, alignItems:'center', justifyContent:'center', padding:24 },
  msg:{ marginTop:12, color:'#374151' },
  success:{ fontSize:20, fontWeight:'700', color:'#059669' },
  fail:{ fontSize:18, fontWeight:'600', color:'#DC2626', marginBottom:16, textAlign:'center' },
  resendBtn:{ backgroundColor:'#2563EB', paddingHorizontal:20, paddingVertical:10, borderRadius:12 },
  resendText:{ color:'#fff', fontWeight:'600' }
});
