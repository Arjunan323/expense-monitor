import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { PreferencesProvider } from './src/contexts/PreferencesContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
          <Toast />
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}