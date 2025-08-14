import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const { width } = Dimensions.get('window');

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.firstName, formData.lastName);
      }
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Funky Background */}
      <View style={styles.backgroundDecorations}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
        <View style={[styles.floatingCircle, styles.circle4]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>✂️</Text>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.brandName}>CutTheSpend</Text>
          <Text style={styles.tagline}>See it. Cut it. Save more.</Text>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {isLogin ? 'Welcome back! 👋' : 'Start saving today! 🚀'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Sign in to continue your financial journey' 
                : 'Join thousands who are already saving more money'
              }
            </Text>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <View style={[styles.trustDot, { backgroundColor: '#00B77D' }]} />
              <Text style={styles.trustText}>Bank-level security</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustDot, { backgroundColor: '#0077B6' }]} />
              <Text style={styles.trustText}>Free forever plan</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustDot, { backgroundColor: '#FFD60A' }]} />
              <Text style={styles.trustText}>No credit card required</Text>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="person" size={20} color="#00B77D" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.firstName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    style={[styles.input, { paddingLeft: 20 }]}
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.lastName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail" size={20} color="#0077B6" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed" size={20} color="#6366F1" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <View style={styles.submitButtonContent}>
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {isLogin ? 'Sign in' : 'Create account'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </View>
              <View style={styles.buttonGlow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.7}
            >
              <Text style={styles.switchButtonText}>
                {isLogin 
                  ? "Don't have an account? Sign up 🎉" 
                  : 'Already have an account? Sign in 💫'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  circle1: {
    width: 100,
    height: 100,
    backgroundColor: '#00B77D',
    top: 100,
    left: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: '#FFD60A',
    top: 200,
    right: -10,
  },
  circle3: {
    width: 60,
    height: 60,
    backgroundColor: '#0077B6',
    bottom: 300,
    left: 50,
  },
  circle4: {
    width: 120,
    height: 120,
    backgroundColor: '#6366F1',
    bottom: 100,
    right: -30,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#00B77D',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logo: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00B77D',
    opacity: 0.2,
    top: -10,
    left: -10,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00B77D',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  trustIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trustText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  form: {
    gap: 20,
  },
  nameRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
    position: 'relative',
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 8,
  },
  submitButton: {
    borderRadius: 20,
    height: 60,
    marginTop: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  submitButtonContent: {
    backgroundColor: '#00B77D',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    shadowColor: '#00B77D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: '#00B77D',
    opacity: 0.1,
    borderRadius: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0077B6',
    borderStyle: 'dashed',
  },
  switchButtonText: {
    color: '#0077B6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});