import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { resetPassword } from '../utils/api';
import Toast from 'react-native-toast-message';

export const ResetPasswordScreen: React.FC<{ route:any; navigation:any }> = ({ route, navigation }) => {
  const token = route?.params?.token as string | undefined;
  const [pw,setPw]=useState('');
  const [pw2,setPw2]=useState('');
  const submit = async () => {
    if(!token){ Toast.show({ type:'error', text1:'Missing token'}); return; }
    if(pw!==pw2){ Toast.show({ type:'error', text1:'Passwords do not match'}); return; }
    const ok = await resetPassword(token, pw);
    if(ok){ Toast.show({ type:'success', text1:'Password updated'}); navigation.replace('Auth'); } else { Toast.show({ type:'error', text1:'Reset failed'}); }
  };
  return <View style={styles.container}>
    <Text style={styles.title}>Reset Password</Text>
    {!token && <Text style={styles.missing}>Missing token parameter.</Text>}
    <TextInput style={styles.input} secureTextEntry value={pw} onChangeText={setPw} placeholder='New Password' />
    <TextInput style={styles.input} secureTextEntry value={pw2} onChangeText={setPw2} placeholder='Confirm Password' />
    <TouchableOpacity style={[styles.btn,!token&&{opacity:0.5}]} disabled={!token} onPress={submit}>
      <Text style={styles.btnText}>Update Password</Text>
    </TouchableOpacity>
  </View>;
};
const styles=StyleSheet.create({
  container:{ flex:1, padding:24, justifyContent:'center' },
  title:{ fontSize:24, fontWeight:'700', marginBottom:16 },
  missing:{ color:'#DC2626', marginBottom:8 },
  input:{ borderWidth:1, borderColor:'#D1D5DB', borderRadius:12, padding:14, marginBottom:16 },
  btn:{ backgroundColor:'#10B981', padding:16, borderRadius:14, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'600', fontSize:16 }
});
