import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export type PlanTier = 'FREE' | 'PRO' | 'PREMIUM';

const order: PlanTier[] = ['FREE','PRO','PREMIUM'];
const meets = (current?: PlanTier, min?: PlanTier) => {
  if(!current || !min) return false;
  return order.indexOf(current) >= order.indexOf(min);
};

interface PlanGateProps {
  minPlan: PlanTier;
  children?: React.ReactNode;
  inline?: boolean;
  onUpgradePress?: ()=> void;
}

export const PlanGate: React.FC<PlanGateProps> = ({ minPlan, children, inline, onUpgradePress }) => {
  const { usage } = useAuth();
  const allowed = meets(usage?.planType as PlanTier | undefined, minPlan);
  if (allowed) return <>{children}</>;
  return inline ? (
    <View style={styles.inlineLock}>
      <Ionicons name="lock-closed" size={14} color="#6B7280" />
      <Text style={styles.inlineText}>{minPlan} plan required</Text>
      <TouchableOpacity onPress={onUpgradePress} style={styles.inlineUpgradeBtn}>
        <Text style={styles.inlineUpgradeText}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.lockContainer}>
      <Ionicons name="lock-closed" size={40} color="#6366F1" />
      <Text style={styles.lockTitle}>Unlock This Feature</Text>
      <Text style={styles.lockSubtitle}>Available on the {minPlan} plan and above.</Text>
      <TouchableOpacity onPress={onUpgradePress} style={styles.upgradeBtn}>
        <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    color: '#111827'
  },
  lockSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center'
  },
  upgradeBtn: {
    marginTop: 24,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },
  inlineLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  inlineText: {
    fontSize: 12,
    color: '#6B7280'
  },
  inlineUpgradeBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  inlineUpgradeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  }
});

export default PlanGate;
