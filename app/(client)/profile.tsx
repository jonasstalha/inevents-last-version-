import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, RefreshCw } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Card } from '@/src/components/common/Card';
import { ProfileEditModal } from '@/src/components/profile/ProfileEditModal';
import { Theme } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { updateProfileWithImage } from '@/src/firebase/profileService';
import {
  doc,
  onSnapshot,
  db,
} from '@/src/firebase/firebaseConfig';
import { recalculateUserStatistics, UserStats } from '@/src/firebase/userStatsService';

export default function ProfileScreen() {
  const { user, logout, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [stats, setStats] = useState<UserStats>({
    orders: 0,
    tickets: 0,
    points: 0,
    totalSpent: 0,
  });

  // ── helpers ──────────────────────────────────────────────────────────────
  const refreshUserStats = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setStatsLoading(true);
      const updated = await recalculateUserStatistics(user.uid);
      setStats(updated);
    } catch (e) {
      console.error('Error refreshing stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.uid]);

  const syncLiveStats = () => {
    if (!user?.uid) return () => {};
    // Watch userStatistics/{uid}
    const statsUnsub = onSnapshot(
      doc(db, 'userStatistics', user.uid),
      (snap: any) => {
        if (snap.exists()) {
          const d = snap.data();
          setStats((prev) => ({
            ...prev,
            orders: d.orders ?? prev.orders,
            tickets: d.tickets ?? prev.tickets,
            points: d.points ?? prev.points,
            totalSpent: d.totalSpent ?? prev.totalSpent,
          }));
        }
      },
      (err: any) => console.log('userStatistics listener not accessible:', err.message),
    );

    return () => {
      statsUnsub();
    };
  };

  // ── auth redirect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.uid || user.uid.trim() === '') {
      router.replace('/auth');
      return;
    }
  }, [authLoading, user]);

  // ── live data sync (runs once per mount for this user) ────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    setSyncing(true);
    setStatsLoading(true);

    // refresh AuthContext user from Firestore so name/image stay current
    refreshUser().finally(() => setSyncing(false));

    // Load initial statistics
    refreshUserStats().finally(() => {
      // Set up live listeners after initial load
      if (user.uid) {

        const unsubStats = syncLiveStats();

        return () => {
          if (typeof unsubStats === 'function') unsubStats();
        };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ── refresh every time profile tab gains focus ────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      // Quick refetch — live listeners will already show the latest values,
      // this is a safety net to force a full recalculation
      refreshUser().catch(console.error);
    }, [user?.uid, refreshUser]),
  );

  // ── logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      '🚪 Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              if (typeof logout === 'function') {
                await logout();
              }
              try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.multiRemove([
                  'userToken',
                  'userData',
                  'isLoggedIn',
                  'userRole',
                  'authToken',
                  'user',
                ]);
              } catch { /* ignore */ }
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
              }
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
              router.replace('/auth');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  // ── image picker ──────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);

      try {
        await updateProfileWithImage({}, imageUri);
        Alert.alert('Success!', 'Profile image updated successfully');
        // Firestore live listener will pick up the new photoURL automatically
        // but also refresh AuthContext user immediately
        refreshUser().catch(console.error);
      } catch (error) {
        console.error('Error updating profile image:', error);
        Alert.alert('Error', 'Failed to update profile image. Please try again.');
      }
    }
  };

  const handleEditProfile = () => setShowEditProfile(true);

  const handleProfileUpdateSuccess = async () => {
    // Refresh AuthContext user (name/image/phonenumber)
    await refreshUser();
    // Full recalculation; live listeners will keep state in sync from here
    await refreshUserStats();
  };

  // ── activity点点点 helpers ────────────────────────────────────────────────
  const displayName = user?.name || (user as any)?.displayName || user?.email || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const displayImage = profileImage || (user as any)?.profileImage || (user as any)?.photoURL || null;

  // ── auth guard ────────────────────────────────────────────────────────────
  if (authLoading || syncing) {
    return (
      <View style={styles.authCheckContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.authCheckText}>
          {authLoading ? 'Checking authentication…' : 'Loading profile…'}
        </Text>
      </View>
    );
  }

  if (!user || !user.uid || user.uid.trim() === '') return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Edit Profile Modal */}
      <ProfileEditModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        currentUser={{
          name: displayName,
          email: displayEmail,
          phone: (user as any)?.phone || user?.phoneNumber || '',
          photoURL: displayImage || null,
        }}
        userRole="client"
        onSuccess={handleProfileUpdateSuccess}
      />


      {/* ── Profile Card ── */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handlePickImage} style={styles.profileImageWrapper}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.emptyProfileImage]}>
              <Text style={styles.emptyProfileText}>📷</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✏️</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <FontAwesome5 name="hand-peace" size={20} color={Theme.colors.primary} style={styles.waveIcon} />
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <View style={styles.emailRow}>
            <FontAwesome5 name="envelope" size={16} color={Theme.colors.textLight} style={styles.emailIcon} />
            <Text style={styles.email}>{displayEmail}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="user-edit" size={14} color={Theme.colors.primary} />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Activity Stats Card ── */}
      <Card variant="elevated" style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View style={styles.statsTitleRow}>
            <FontAwesome5 name="chart-bar" size={18} color={Theme.colors.primary} />
            <Text style={styles.statsTitle}>Your Activity</Text>
          </View>
          <TouchableOpacity
            onPress={refreshUserStats}
            style={styles.refreshButton}
            disabled={statsLoading}
          >
            <RefreshCw
              size={16}
              color={statsLoading ? Theme.colors.textLight : Theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading stats…</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatBox icon="shopping-bag" value={stats.orders} label="Orders" />
              <StatBox icon="ticket-alt" value={stats.tickets} label="Tickets" divider />
              <StatBox icon="coins" value={stats.points} label="Points" divider />
            </View>

            {stats.totalSpent > 0 && (
              <View style={styles.totalSpentContainer}>
                <FontAwesome5 name="money-bill-wave" size={16} color={Theme.colors.textLight} />
                <Text style={styles.totalSpentLabel}>Total Spent: </Text>
                <Text style={styles.totalSpentValue}>{stats.totalSpent} MAD</Text>
              </View>
            )}
          </>
        )}
      </Card>



      {/* ── Menu Items ── */}
      <Card variant="elevated" style={styles.menuCard}>
        <MenuItem
          icon="user-edit"
          title="Edit Profile"
          onPress={handleEditProfile}
        />
        <MenuItem
          icon="credit-card"
          title="Payment Services"
          onPress={() =>
            Alert.alert(
              'Coming Soon!',
              'We\'re working hard to bring you secure payment options.\n\nStay tuned for updates!',
              [{ text: 'OK', style: 'cancel' }],
            )
          }
        />
        <MenuItem
          icon="question-circle"
          title="Help & Support"
          onPress={() => {
            const uri = `https://wa.me/+212701186390?text=${encodeURIComponent('Hello, I need help with InEvent app.')}`;
            Linking.openURL(uri);
          }}
        />
        <MenuItem
          icon="sign-out-alt"
          title="Logout"
          textColor={Theme.colors.error}
          onPress={handleLogout}
          last
        />
      </Card>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

/* ── small sub-components ─────────────────────────────────────────────────── */

function StatBox({
  icon,
  value,
  label,
  divider,
}: {
  icon: string;
  value: number;
  label: string;
  divider?: boolean;
}) {
  return (
    <View
      style={[
        styles.statItem,
        divider && {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: Theme.colors.border,
        },
      ]}
    >
      <FontAwesome5 name={icon as any} size={20} color={Theme.colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  badge,
  textColor,
  onPress,
  last,
}: {
  icon: string;
  title: string;
  badge?: string;
  textColor?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !last && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuIconContainer}>
        <FontAwesome5 name={icon as any} size={18} color={textColor || Theme.colors.textDark} />
      </View>
      <Text style={[styles.menuText, textColor && { color: textColor }]}>{title}</Text>
      <View style={styles.menuRight}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <ChevronRight size={18} color={Theme.colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

/* ── styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    paddingBottom: Theme.spacing.xl * 2,
  },
  header: {
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  headerTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xxl,
    color: Theme.colors.textDark,
  },
  headerSubtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginTop: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
  },
  profileImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.border,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  emptyProfileImage: {
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
  },
  emptyProfileText: {
    fontSize: 24,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.card,
  },
  editBadgeText: {
    fontSize: 10,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  waveIcon: {
    marginRight: Theme.spacing.sm,
  },
  name: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  emailIcon: {
    marginRight: Theme.spacing.sm,
  },
  email: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    flexShrink: 1,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  editProfileButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
    marginLeft: 4,
  },

  // ── Stats Card ──
  statsCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginLeft: Theme.spacing.sm,
  },
  refreshButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.primary,
    marginVertical: Theme.spacing.xs,
  },
  statLabel: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  totalSpentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  totalSpentLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginLeft: Theme.spacing.sm,
  },
  totalSpentValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  loadingText: {
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },

  // ── Activity Card ──
   activityCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  pointsConfigCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  pointsConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pointsConfigTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  pointsRefreshBtn: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  pointsConfigGrid: {
    paddingVertical: Theme.spacing.sm,
  },
  pointsConfigItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  pointsConfigDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pointsConfigIcon: { fontSize: 18 },
  pointsConfigLabel: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    flex: 1,
  },
  pointsConfigValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },



  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  activityTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginLeft: Theme.spacing.sm,
  },
  activityList: {
    paddingVertical: Theme.spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  activityDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  activityBody: {
    flex: 1,
  },
  activityDescription: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activityTime: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginLeft: 4,
  },
  activityPointsBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  activityPointsPositive: {
    backgroundColor: `${Theme.colors.success}18`,
  },
  activityPointsNegative: {
    backgroundColor: `${Theme.colors.error}18`,
  },
  activityPointsText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xs,
  },
  activityPointsTextPositive: {
    color: Theme.colors.success,
  },
  activityPointsTextNegative: {
    color: Theme.colors.error,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl * 2,
  },
  emptyActivityText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.sm,
  },
  emptyActivitySubtext: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginTop: 4,
  },

  // ── Points Quicklink ──
  pointsQuicklink: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
  },
  pointsQuicklinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsQuicklinkLabel: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginLeft: Theme.spacing.sm,
  },
  pointsQuicklinkValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },

  // ── Menu ──
  menuCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  menuIconContainer: {
    width: 24,
    marginRight: Theme.spacing.md,
  },
  menuText: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    marginRight: Theme.spacing.sm,
  },
  badgeText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.secondary,
  },
  version: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
  },

  // ── auth guards ──
  authCheckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  authCheckText: {
    marginTop: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
  },
});
