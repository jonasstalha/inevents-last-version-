import { Card } from '@/src/components/common/Card';
import { Theme } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getUserRewards, getUserTransactions, REWARDS_CONFIG, RewardTransaction, UserRewards } from '@/src/firebase/rewardsService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RewardsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRewardsData = async () => {
    if (!user?.uid) return;
    
    try {
      const [rewardsData, transactionsData] = await Promise.all([
        getUserRewards(user.uid),
        getUserTransactions(user.uid, 10)
      ]);
      
      setRewards(rewardsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRewardsData();
  };

  const getPointsIcon = (type: RewardTransaction['type']) => {
    switch (type) {
      case 'ticket':
        return 'ticket-alt';
      case 'order':
        return 'shopping-bag';
      case 'service_order':
        return 'tools';
      case 'custom_order':
        return 'star';
      case 'review':
        return 'comment';
      case 'referral':
        return 'user-friends';
      default:
        return 'gift';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getProgressPercentage = () => {
    if (!rewards || rewards.nextLevelPoints === 0) return 100;
    const currentLevelPoints = rewards.totalPoints - (rewards.level - 1) * 500;
    const levelRange = 500;
    return Math.min((currentLevelPoints / levelRange) * 100, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome5 name="arrow-left" size={18} color={Theme.colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Points System</Text>

      {/* Header Stats */}
      <Card variant="elevated" style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {rewards?.level || 1}</Text>
          </View>
          <Text style={styles.levelName}>{rewards?.levelName || 'Bronze Explorer'}</Text>
          <View style={styles.pointsContainer}>
            <FontAwesome5 name="coins" size={24} color={Theme.colors.primary} />
            <Text style={styles.totalPoints}>{rewards?.totalPoints || 0} Points</Text>
          </View>
          
          {rewards && rewards.nextLevelPoints > 0 && (
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>
                {rewards.nextLevelPoints} points to next level
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getProgressPercentage()}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      </Card>

      {/* How to Earn Points */}
      <Card variant="elevated" style={styles.earningCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="chart-line" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
        </View>
        
        <View style={styles.earningList}>
          <View style={styles.earningItem}>
            <FontAwesome5 name="ticket-alt" size={18} color={Theme.colors.textDark} style={styles.earningIcon} />
            <Text style={styles.earningAction}>Buy tickets</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.TICKET_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <FontAwesome5 name="shopping-bag" size={18} color={Theme.colors.textDark} style={styles.earningIcon} />
            <Text style={styles.earningAction}>Place orders</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.ORDER_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <FontAwesome5 name="tools" size={18} color={Theme.colors.textDark} style={styles.earningIcon} />
            <Text style={styles.earningAction}>Service orders</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.SERVICE_ORDER_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <FontAwesome5 name="star" size={18} color={Theme.colors.textDark} style={styles.earningIcon} />
            <Text style={styles.earningAction}>Custom orders</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.CUSTOM_ORDER_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <FontAwesome5 name="comment" size={18} color={Theme.colors.textDark} style={styles.earningIcon} />
            <Text style={styles.earningAction}>Write reviews</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.REVIEW_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <FontAwesome5 name="user-friends" size={18} color={Theme.colors.textDark} style={styles.earningIcon} />
            <Text style={styles.earningAction}>Refer friends</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.REFERRAL_POINTS} pts</Text>
          </View>
        </View>
      </Card>

      {/* Recent Activity */}
      <Card variant="elevated" style={styles.activityCard}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="history" size={18} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        
        {transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {transactions.map((transaction, index) => (
              <View key={transaction.id || index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <FontAwesome5 name={getPointsIcon(transaction.type)} size={18} color={Theme.colors.primary} style={styles.transactionIcon} />
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.timestamp)}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionPoints,
                  transaction.points > 0 ? styles.pointsPositive : styles.pointsNegative
                ]}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="inbox" size={40} color={Theme.colors.textLight} />
            <Text style={styles.emptyStateText}>No activity yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start earning points by placing orders and buying tickets!
            </Text>
          </View>
        )}
      </Card>

      <Text style={styles.disclaimer}>
        * Points are awarded after successful transactions and may take a few minutes to appear.
      </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  backText: {
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  pageTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.lg,
  },
  
  headerCard: {
    marginBottom: Theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  levelBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
  },
  levelText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.secondary,
  },
  levelName: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.md,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  totalPoints: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.primary,
    marginLeft: Theme.spacing.sm,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 4,
  },
  
  earningCard: {
    marginBottom: Theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  sectionTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginLeft: Theme.spacing.sm,
  },
  earningList: {
    padding: Theme.spacing.lg,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  earningIcon: {
    width: 24,
    marginRight: Theme.spacing.md,
  },
  earningAction: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  earningPoints: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  
  activityCard: {
    marginBottom: Theme.spacing.lg,
  },
  transactionsList: {
    padding: Theme.spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 24,
    marginRight: Theme.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginBottom: 2,
  },
  transactionDate: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  transactionPoints: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
  },
  pointsPositive: {
    color: Theme.colors.success || '#059669',
  },
  pointsNegative: {
    color: Theme.colors.error,
  },
  
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyStateText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  disclaimer: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});