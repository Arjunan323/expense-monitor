import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AnalyticsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>
          Advanced financial insights and analytics are coming soon
        </Text>
      </View>

      {/* Coming Soon Card */}
      <View style={styles.comingSoonCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#0ea5e9" />
        </View>
        <Text style={styles.comingSoonTitle}>
          Advanced Analytics Coming Soon
        </Text>
        <Text style={styles.comingSoonDescription}>
          We're building powerful analytics features including budgets, spending trends, 
          anomaly detection, and personalized financial insights. Help us prioritize 
          what matters most to you.
        </Text>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <Ionicons name="trending-up-outline" size={32} color="#0ea5e9" />
            <Text style={styles.featureTitle}>Spending Trends</Text>
            <Text style={styles.featureDescription}>
              Month-over-month analysis and spending pattern detection
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bar-chart-outline" size={32} color="#0ea5e9" />
            <Text style={styles.featureTitle}>Budget Tracking</Text>
            <Text style={styles.featureDescription}>
              Set budgets by category and track your progress
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time-outline" size={32} color="#0ea5e9" />
            <Text style={styles.featureTitle}>Forecasting</Text>
            <Text style={styles.featureDescription}>
              Predict future expenses and cash flow patterns
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.feedbackButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
          <Text style={styles.feedbackButtonText}>Tell us what analytics you need</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Form */}
      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>
          What analytics features would be most valuable to you?
        </Text>
        <View style={styles.checkboxList}>
          <View style={styles.checkboxItem}>
            <Ionicons name="square-outline" size={20} color="#6b7280" />
            <Text style={styles.checkboxText}>Monthly spending trends and comparisons</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Ionicons name="square-outline" size={20} color="#6b7280" />
            <Text style={styles.checkboxText}>Budget setting and tracking by category</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Ionicons name="square-outline" size={20} color="#6b7280" />
            <Text style={styles.checkboxText}>Unusual spending pattern alerts</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Ionicons name="square-outline" size={20} color="#6b7280" />
            <Text style={styles.checkboxText}>Cash flow forecasting</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Ionicons name="square-outline" size={20} color="#6b7280" />
            <Text style={styles.checkboxText}>Goal tracking (savings, debt reduction)</Text>
          </View>
          <View style={styles.checkboxItem}>
            <Ionicons name="square-outline" size={20} color="#6b7280" />
            <Text style={styles.checkboxText}>Tax-related expense categorization</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  comingSoonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#dbeafe',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  featuresGrid: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  feedbackButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  feedbackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  checkboxList: {
    marginBottom: 24,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});