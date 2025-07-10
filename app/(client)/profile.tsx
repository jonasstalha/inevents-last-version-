import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Award, ChevronRight, CreditCard, Heart, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/src/components/common/Card';
import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { getOrdersByClientId } = useApp();
  const router = useRouter();

  // Add state for profile image URI
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showSavedArtists, setShowSavedArtists] = useState(false);

  // Get real orders and tickets for the logged-in user
  const orders = user ? getOrdersByClientId(user.id) : [];
  // For demo: assume each order = 1 ticket (customize if you have real ticket logic)
  const tickets = orders.filter(order => order.status === 'confirmed');

  // Reward system: 10 points per order, 5 per ticket (customize as needed)
  const points = orders.length * 10 + tickets.length * 5;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
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
              // Clear Firebase Auth and context user
              if (typeof logout === 'function') {
                await logout();
              }
              
              // Clear any stored authentication data
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.clear();
              }
              
              // Clear AsyncStorage for any persisted auth data
              try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.multiRemove(['userToken', 'userData', 'isLoggedIn']);
              } catch (storageError) {
                console.log('AsyncStorage clear error:', storageError);
              }
              
              // Redirect to tickets page after logout
              router.replace('/(client)/tickets');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'An error occurred during logout. Please try again.');
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
      onPress: () => router.push('./payment-methods'),
    },
    {
      title: 'Rewards Program',
      icon: <Award size={20} color={Theme.colors.primary} />,
      badge: `${points} pts`,
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
        const phone = '+212 701-186390'; // Replace with your support number
        const url = `https://wa.me/${phone}`;
        router.push(url);
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
              <Text style={styles.emptyProfileText}>+</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>
      </View>

      <Card variant="elevated" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{tickets.length}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>
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
    marginBottom: Theme.spacing.lg,
  },
  profileImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Theme.spacing.lg,
    overflow: 'hidden',
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
    fontSize: 36,
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 80,
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
  role: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
  },
  statsCard: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
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
  menuContainer: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
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
    marginTop: Theme.spacing.xl,
  },
});