import { Card } from '@/src/components/common/Card';
import { Theme } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getUserRewards, getUserTransactions, REWARDS_CONFIG, RewardTransaction, UserRewards } from '@/src/firebase/rewardsService';
import { Award, Gift, Star, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRewardsData = async () => {
    if (!user?.id) return;
    
    try {
      const [rewardsData, transactionsData] = await Promise.all([
        getUserRewards(user.id),
        getUserTransactions(user.id, 10)
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
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRewardsData();
  };

  const getPointsIcon = (type: RewardTransaction['type']) => {
    switch (type) {
      case 'ticket':
        return '🎫';
      case 'order':
        return '🛍️';
      case 'service_order':
        return '🔧';
      case 'custom_order':
        return '⭐';
      case 'review':
        return '💬';
      case 'referral':
        return '👥';
      default:
        return '🎁';
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
    const currentLevelPoints = rewards.totalPoints - (rewards.level - 1) * 500; // Rough calculation
    const levelRange = 500; // Rough calculation
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
      {/* Header Stats */}
      <Card variant="elevated" style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {rewards?.level || 1}</Text>
          </View>
          <Text style={styles.levelName}>{rewards?.levelName || 'Bronze Explorer'}</Text>
          <View style={styles.pointsContainer}>
            <Award size={24} color={Theme.colors.primary} />
            <Text style={styles.totalPoints}>{rewards?.totalPoints || 0} Points</Text>
          </View>
          
          {/* Progress Bar */}
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
          <TrendingUp size={20} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
        </View>
        
        <View style={styles.earningList}>
          <View style={styles.earningItem}>
            <Text style={styles.earningIcon}>🎫</Text>
            <Text style={styles.earningAction}>Buy tickets</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.TICKET_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningIcon}>🛍️</Text>
            <Text style={styles.earningAction}>Place orders</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.ORDER_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningIcon}>🔧</Text>
            <Text style={styles.earningAction}>Service orders</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.SERVICE_ORDER_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningIcon}>⭐</Text>
            <Text style={styles.earningAction}>Custom orders</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.CUSTOM_ORDER_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningIcon}>💬</Text>
            <Text style={styles.earningAction}>Write reviews</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.REVIEW_POINTS} pts</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningIcon}>👥</Text>
            <Text style={styles.earningAction}>Refer friends</Text>
            <Text style={styles.earningPoints}>+{REWARDS_CONFIG.REFERRAL_POINTS} pts</Text>
          </View>
        </View>
      </Card>

      {/* Recent Activity */}
      <Card variant="elevated" style={styles.activityCard}>
        <View style={styles.sectionHeader}>
          <Star size={20} color={Theme.colors.primary} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        
        {transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {transactions.map((transaction, index) => (
              <View key={transaction.id || index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionIcon}>
                    {getPointsIcon(transaction.type)}
                  </Text>
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
            <Gift size={40} color={Theme.colors.textLight} />
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
  
  // Header Card
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
  
  // Earning Card
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
    fontSize: 20,
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
  
  // Activity Card
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
    fontSize: 16,
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
  
  // Empty State
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
