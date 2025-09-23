import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import { Award, ChevronRight, CreditCard, Heart, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/src/components/common/Card';
import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { getUserStatistics, UserStats } from '@/src/firebase/userStatsService';

export default function ProfileScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const { getOrdersByClientId } = useApp();
  const router = useRouter();

  // Debug and force clear function
  const clearAllAuthData = async () => {
    try {
      console.log('Profile Screen - Clearing all auth data...');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('All AsyncStorage keys:', allKeys);
      await AsyncStorage.clear();
      console.log('All data cleared');
    } catch (error) {
      console.log('Error clearing data:', error);
    }
  };

  // Immediate redirect for unauthenticated users (before any state initialization)
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('Profile Screen - Checking authentication...');
      console.log('Profile Screen - authLoading:', authLoading);
      console.log('Profile Screen - user:', user);
      console.log('Profile Screen - user?.id:', user?.id);
      
      if (!authLoading) {
        // Check if user exists and has a valid ID
        if (!user || !user.id || user.id.trim() === '') {
          console.log('Profile Screen - No valid user found, redirecting to auth');
          
          // Clear any potential cached auth data
          await clearAllAuthData();
          
          router.replace('/auth');
          return;
        }
        console.log('Profile Screen - User authenticated:', user.id);
      }
    };
    
    checkAuthentication();
  }, [authLoading, user, router]);

  // Debug logging
  console.log('Profile Screen - User:', user);
  console.log('Profile Screen - Auth Loading:', authLoading);
  console.log('Profile Screen - User ID:', user?.id);

  // Add state for profile image URI and real statistics
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showSavedArtists, setShowSavedArtists] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    orders: 0,
    tickets: 0,
    points: 0,
    totalSpent: 0
  });

  // Check authentication whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkAuthOnFocus = async () => {
        console.log('Profile Screen - Focus check - authLoading:', authLoading, 'user:', !!user);
        
        if (!authLoading) {
          // Strict authentication check
          if (!user || !user.id || user.id.trim() === '') {
            console.log('Profile Screen - Focus check failed, redirecting');
            
            // Clear cache and redirect
            await clearAllAuthData();
            router.replace('/auth');
          }
        }
      };
      
      checkAuthOnFocus();
    }, [user, authLoading, router])
  );

  // Check if user is authenticated on component mount
  useEffect(() => {
    if (!authLoading && !user) {
      // User is not authenticated, redirect immediately
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  // Continuous authentication monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (!authLoading && (!user || !user.id)) {
        console.log('Profile Screen - Continuous check: User session lost, redirecting');
        clearInterval(interval);
        router.replace('/auth');
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [user, authLoading, router]);

  // Fetch real user statistics from Firebase
  useEffect(() => {
    if (user?.id) {
      fetchUserStatistics();
    } else {
      setStatsLoading(false);
    }
  }, [user?.id]);

  const fetchUserStatistics = async () => {
    if (!user?.id) return;
    
    try {
      setStatsLoading(true);
      const userStats = await getUserStatistics(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      // Keep default stats on error
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('Starting logout process...');
              
              // Step 1: Clear Firebase Auth and context user
              if (typeof logout === 'function') {
                console.log('Calling logout function...');
                await logout();
              }
              
              // Step 2: Clear all AsyncStorage data
              try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                const keysToRemove = [
                  'userToken', 
                  'userData', 
                  'isLoggedIn', 
                  'userRole',
                  'authToken',
                  'user',
                  'firebase:authUser:AIzaSyAx8Q8X8X8X8X8X8X8X8X8X8X8X8X8X8X8:[DEFAULT]' // Firebase auth cache
                ];
                await AsyncStorage.multiRemove(keysToRemove);
                console.log('AsyncStorage cleared successfully');
              } catch (storageError) {
                console.log('AsyncStorage clear error:', storageError);
              }
              
              // Step 3: Clear web localStorage if available
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
                console.log('localStorage cleared');
              }
              
              // Step 4: Clear any other potential storage
              if (typeof window !== 'undefined' && window.sessionStorage) {
                window.sessionStorage.clear();
                console.log('sessionStorage cleared');
              }
              
              console.log('Logout completed, redirecting...');
              
              // Step 5: Force redirect to auth page
              router.replace('/auth');
              
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'An error occurred during logout. Forcing sign out...');
              // Force redirect even if logout fails
              router.replace('/auth');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Add handler for picking an image
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const menuItems = [
    {
      title: 'Payment Services',
      icon: <CreditCard size={20} color={Theme.colors.textDark} />,
      onPress: () => {
        Alert.alert(
          '🚀 Coming Soon!',
          'We\'re working hard to bring you secure payment options including:\n\n💳 Credit/Debit Cards\n📱 Mobile Payments\n🏦 Bank Transfers\n\nStay tuned for updates!',
          [
            { 
              text: 'Notify Me', 
              style: 'default',
              onPress: () => {
                Alert.alert(
                  '🔔 Notifications Enabled',
                  'You\'ll be notified when payment services are available!',
                  [{ text: 'Great!', style: 'default' }]
                );
              }
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      },
    },
    {
      title: 'Rewards Program',
      icon: <Award size={20} color={Theme.colors.primary} />,
      badge: `${stats.points} pts`,
      onPress: () => setShowRewards(true),
    },
    {
      title: 'Saved Artists',
      icon: <Heart size={20} color={Theme.colors.textDark} />,
      onPress: () => setShowSavedArtists(true),
    },
    {
      title: 'Help & Support',
      icon: <HelpCircle size={20} color={Theme.colors.textDark} />,
      onPress: () => {
        const phone = '+212701186390'; // Remove spaces and dashes for URL
        const message = 'Hello, I need help with InEvent app.';
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(url);
      },
    },
    {
      title: 'Logout',
      icon: <LogOut size={20} color={Theme.colors.error} />,
      textColor: Theme.colors.error,
      onPress: handleLogout,
    },
  ];

  // Only show name and email from user, and allow user to add a profile image later
  const displayName = user?.name || user?.email || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const displayImage = profileImage;

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <View style={styles.authCheckContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.authCheckText}>Checking authentication...</Text>
      </View>
    );
  }

  // Strict authentication check - block access if no valid user
  if (!user || !user.id || user.id.trim() === '') {
    console.log('Profile Screen - Render guard: No valid user, blocking access');
    // Force redirect and return null
    router.replace('/auth');
    return null;
  }

  if (showRewards) {
    const RewardsScreen = require('./(hidden)/rewards').default;
    return (
      <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <TouchableOpacity onPress={() => setShowRewards(false)} style={{ padding: 16 }}>
          <Text style={{ color: Theme.colors.primary, fontSize: 16 }}>{'< Back'}</Text>
        </TouchableOpacity>
        <RewardsScreen />
      </View>
    );
  }
  if (showSavedArtists) {
    const SavedArtistsScreen = require('./(hidden)/saved-artists').default;
    return (
      <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <TouchableOpacity onPress={() => setShowSavedArtists(false)} style={{ padding: 16 }}>
          <Text style={{ color: Theme.colors.primary, fontSize: 16 }}>{'< Back'}</Text>
        </TouchableOpacity>
        <SavedArtistsScreen />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>

      </View>   

      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.profileImageWrapper} onPress={handlePickImage}>
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
          <Text style={styles.name}>👋 {displayName}</Text>
          <Text style={styles.email}>📧 {displayEmail}</Text>
          <View style={styles.membershipBadge}>
      
          </View>
        </View>
      </View>

      <Card variant="elevated" style={styles.statsCard}>
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>📊 Your Activity</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>🛍️</Text>
                </View>
                <Text style={styles.statValue}>{stats.orders}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={[styles.statItem, styles.statDivider]}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>🎫</Text>
                </View>
                <Text style={styles.statValue}>{stats.tickets}</Text>
                <Text style={styles.statLabel}>Tickets</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>⭐</Text>
                </View>
                <Text style={styles.statValue}>{stats.points}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
            {stats.totalSpent > 0 && (
              <View style={styles.totalSpentContainer}>
                <Text style={styles.totalSpentLabel}>💰 Total Spent: </Text>
                <Text style={styles.totalSpentValue}>{stats.totalSpent} MAD</Text>
              </View>
            )}
          </>
        )}
      </Card>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuIconContainer}>{item.icon}</View>
            <Text
              style={[
                styles.menuText,
                item.textColor ? { color: item.textColor } : null,
              ]}
            >
              {item.title}
            </Text>
            <View style={styles.menuRight}>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              <ChevronRight size={18} color={Theme.colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

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
    paddingBottom: Theme.spacing.lg,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
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
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Theme.spacing.lg,
    overflow: 'visible',
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
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.xs,
  },
  email: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.xs,
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
    fontSize: 12,
  },
  membershipBadge: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  membershipText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
  },
  role: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
  },
  statsCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  statsHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  statsTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    textAlign: 'center',
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
  statIconContainer: {
    marginBottom: Theme.spacing.xs,
  },
  statIcon: {
    fontSize: 24,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Theme.colors.border,
  },
  statValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
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
  },
  totalSpentValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  menuContainer: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.card,
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
    marginTop: Theme.spacing.xl,
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
  // Authentication required styles
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
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.xl,
  },
  authRequiredContent: {
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    ...Theme.shadows.md,
  },
  authRequiredIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.lg,
  },
  authRequiredTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  authRequiredMessage: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing.xl,
  },
  authButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    minWidth: 150,
  },
  authButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.secondary,
    textAlign: 'center',
  },
});