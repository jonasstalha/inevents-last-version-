import { Slot, useRouter, useSegments } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { Briefcase, CreditCard, LayoutDashboard, LogOut, Ticket, Users } from 'lucide-react-native';
import { useEffect } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const navItems = [
  { label: 'Dashboard', route: '/(admin)/dashboard', icon: LayoutDashboard },
  { label: 'Users', route: '/(admin)/users', icon: Users },
  { label: 'Services', route: '/(admin)/services', icon: Briefcase },
  { label: 'Financial', route: '/(admin)/financial', icon: CreditCard },
  { label: 'Coupons', route: '/(admin)/coupons', icon: Ticket },
];

const pageTitleMap: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  services: 'Services',
  financial: 'Financial',
  coupons: 'Coupons',
};

export default function AdminLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] || 'dashboard';
  const pageTitle = pageTitleMap[currentRoute] || 'Admin';

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/auth');
    else if (!user.isEmailVerified && user.role !== 'admin') router.replace('/email-verification');
    else if (user.role !== 'admin') router.replace(user.role === 'artist' ? '/(artist)' : '/(client)');
  }, [loading, user, router]);

  useEffect(() => {
    const onBackPress = () => {
      BackHandler.exitApp();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerSafe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{pageTitle}</Text>
            <Text style={styles.subtitle}>Admin Panel</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>ADMIN</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: () => {
                    signOut(getAuth());
                    router.replace('/auth');
                  }},
                ]);
              }}
              style={styles.logoutButton}
            >
              <LogOut size={18} color="#e53e3e" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <View style={styles.content}>
        <Slot />
      </View>
      <SafeAreaView edges={['bottom']} style={styles.bottomNavSafe}>
        <View style={styles.bottomNav}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.route.replace('/(admin)/', '');
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.route}
                style={styles.navItem}
                onPress={() => router.replace(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                  <Icon size={20} color={isActive ? '#fff' : '#999'} strokeWidth={isActive ? 2.5 : 1.8} />
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  headerSafe: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 22,
    color: Theme.colors.textDark,
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 13,
    color: Theme.colors.textLight,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Theme.typography.fontFamily.bold,
    letterSpacing: 1,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  bottomNavSafe: {
    backgroundColor: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 2 : 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: Theme.colors.primary,
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  navLabelActive: {
    color: Theme.colors.primary,
  },
});
