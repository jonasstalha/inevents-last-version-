// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const Theme = {
  spacing: { sm: 8, md: 12, lg: 16 },
  typography: { fontFamily: { medium: 'System', bold: 'System' } },
};

function Header({ title }: { title: string }) {
  const router = useRouter();

  return (
    <SafeAreaView edges={[ 'top' ]} style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity
            onPress={() => router.push('/(artist)/settings')}
            style={styles.headerIconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabBarButton({ onPress, children, isFocused }: { onPress: () => void; children: React.ReactNode; isFocused: boolean }) {
  const scale = useState(new Animated.Value(1))[0];
  const translateY = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: isFocused ? 1.08 : 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: isFocused ? -4 : 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tabButton}>
      <Animated.View style={{ transform: [{ scale }, { translateY }] }}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

function ArtistTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  // Map route names we expect
  const orderIndex = state.routes.findIndex(r => r.name === 'orders');
  const homeIndex = state.routes.findIndex(r => r.name === 'index');
  const platformIndex = state.routes.findIndex(r => r.name === 'ArtistPlatform');
  const promoIndex = state.routes.findIndex(r => r.name === 'promo-codes');
  const couponsIndex = state.routes.findIndex(r => r.name === 'coupons');

    const renderTab = (routeName: string, routeIndex: number, iconName: string, label: string) => {
    if (routeIndex === -1) return null;
    const route = state.routes[routeIndex];
    const isFocused = state.index === routeIndex;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    };

    const color = isFocused ? '#5B5BD6' : '#8a8a8a';

    return (
      <TabBarButton key={routeName} onPress={onPress} isFocused={isFocused}>
        <View style={{ alignItems: 'center' }}>
          <FontAwesome5 name={iconName as any} size={20} color={color} />
          <Text style={[styles.tabLabel, { color }]}>{label}</Text>
        </View>
      </TabBarButton>
    );
  };

  // Center add button special
  const onAddPress = () => {
    router.push('/(artist)/ArtistPlatform?tab=ticket');
  };

  return (
    <View style={styles.tabBarContainer}>
      <SafeAreaView edges={[ 'bottom' ]} style={{ flex: 1 }}>
        <View style={styles.tabBarRow}>
          <View style={styles.tabGroup}>{renderTab('home', homeIndex, 'home', 'Home')}{renderTab('orders', orderIndex, 'inbox', 'Orders')}</View>

          <View style={styles.centerButtonWrapper}>
            <TouchableOpacity onPress={onAddPress} activeOpacity={0.9} style={styles.centerButton}>
              <FontAwesome5 name="plus" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabGroup}>{renderTab('promo-codes', promoIndex, 'chart-line', 'Analytics')}{renderTab('coupons', couponsIndex, 'tags', 'Coupons')}</View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function ArtistLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getPageTitle = (routeName: string) => {
    switch (routeName) {
      case 'index': return 'Dashboard';
      case 'orders': return 'Orders';
      case 'ArtistPlatform': return 'Add Service';
      case 'promo-codes': return 'Analytics';
      case 'coupons': return 'Coupons';
      default: return 'Artist';
    }
  };

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          header: () => <Header title={getPageTitle(route.name)} />,
          tabBarStyle: { display: 'none' },
          contentStyle: { backgroundColor: colors.background, paddingBottom: Platform.OS === 'ios' ? 100 : 90 },
        })}
        tabBar={(props) => <ArtistTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <FontAwesome5 name="home" color={color} size={22} /> }} />
        <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color }) => <FontAwesome5 name="ticket-alt" color={color} size={22} /> }} />
        <Tabs.Screen name="ArtistPlatform" options={{ title: 'Add Service', tabBarIcon: ({ color }) => <FontAwesome5 name="plus" color={color} size={22} /> }} />
        <Tabs.Screen name="promo-codes" options={{ title: 'Analytics', tabBarIcon: ({ color }) => <FontAwesome5 name="chart-line" color={color} size={22} /> }} />
        <Tabs.Screen name="coupons" options={{ title: 'Coupons', tabBarIcon: ({ color }) => <FontAwesome5 name="tags" color={color} size={22} /> }} />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 }, android: { elevation: 0 } }),
  },
  header: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: Platform.select({ ios: 18, default: 14 }), paddingBottom: 0, alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  headerRightIcons: { flexDirection: 'row', alignItems: 'center' },
  headerIconButton: { padding: 10, marginLeft: 8 },

  tabBarContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 10 } }),
  },
  tabBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 70 },
  tabGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabButton: { paddingHorizontal: 8, minWidth: 64, alignItems: 'center' },
  tabLabel: { fontSize: 11, marginTop: 4 },
  centerButtonWrapper: { width: 84, alignItems: 'center', justifyContent: 'center' },
  centerButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#5B5BD6', alignItems: 'center', justifyContent: 'center', marginTop: -20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 6 },
});

