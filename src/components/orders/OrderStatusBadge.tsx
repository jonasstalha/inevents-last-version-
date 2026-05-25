import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/src/constants/theme';

interface OrderStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
}

const STATUS_STYLES: Record<OrderStatusBadgeProps['status'], { background: string; color: string }> = {
  pending: { background: '#fef3c7', color: '#92400e' },
  confirmed: { background: '#d1fae5', color: '#0f766e' },
  rejected: { background: '#fee2e2', color: '#991b1b' },
  completed: { background: '#dbeafe', color: '#1e3a8a' },
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const style = STATUS_STYLES[status];
  return (
    <Animated.View style={[styles.badge, { backgroundColor: style.background }]}> 
      <Text style={[styles.text, { color: style.color }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.lg,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
