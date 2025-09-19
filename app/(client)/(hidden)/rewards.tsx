import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '@/src/constants/theme';
import { Award } from 'lucide-react-native';

export default function RewardsScreen() {
  // Example: You can fetch real reward actions and points from backend or context
  const rewardActions = [
    { action: 'Order a service', points: 10 },
    { action: 'Buy a ticket', points: 5 },
    { action: 'Refer a friend', points: 20 },
    { action: 'Leave a review', points: 3 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Award size={40} color={Theme.colors.primary} />
        <Text style={styles.title}>Rewards Program</Text>
        <Text style={styles.subtitle}>Earn points for every action you take!</Text>
      </View>
      <View style={styles.list}>
        {rewardActions.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <Text style={styles.action}>{item.action}</Text>
            <Text style={styles.points}>+{item.points} pts</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>* Points system and rewards are subject to change.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  list: {
    marginTop: Theme.spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  action: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  points: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  note: {
    marginTop: Theme.spacing.xl,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
});
