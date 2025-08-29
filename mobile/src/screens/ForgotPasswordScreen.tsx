import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { requestPasswordReset } from '../utils/api';
import Toast from 'react-native-toast-message';

export const ForgotPasswordScreen: React.FC<{ navigation:any }> = ({ navigation }) => {
  const [email,setEmail]=useState('');
  const [sent,setSent]=useState(false);
  const submit = async () => {
    if(!email) return; try { await requestPasswordReset(email); setSent(true); Toast.show({ type:'success', text1:'If the email exists a reset link was sent'});} catch { Toast.show({ type:'error', text1:'Failed to send' }); }
  };
  return <View style={styles.container}>
    <Text style={styles.title}>Forgot Password</Text>
    {sent? <Text style={styles.info}>Check your email for a reset link.</Text> : <>
      <TextInput style={styles.input} placeholder='Email' value={email} onChangeText={setEmail} autoCapitalize='none' keyboardType='email-address' />
      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Send Reset Link</Text>
      </TouchableOpacity>
    </>}
  </View>;
};
const styles=StyleSheet.create({
  container:{ flex:1, padding:24, justifyContent:'center' },
  title:{ fontSize:24, fontWeight:'700', marginBottom:16 },
  info:{ fontSize:16, color:'#065F46' },
  input:{ borderWidth:1, borderColor:'#D1D5DB', borderRadius:12, padding:14, marginBottom:16 },
  btn:{ backgroundColor:'#2563EB', padding:16, borderRadius:14, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'600', fontSize:16 }
});
