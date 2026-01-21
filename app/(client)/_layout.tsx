import { useAuth } from '@/src/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import { Bell, Home, LogIn, Search, Ticket, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const Theme = {
  colors: {
    primary: '#4361EE',
    secondary: '#3F37C9',
    accent: '#4CC9F0',
    background: '#F8F9FA',
    card: '#FFFFFF',
    cardDark: '#F0F2F5',
    border: '#E1E5EA',
    text: '#1A1B25',
    textSecondary: '#4F5565',
    textLight: '#9CA3AF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      semibold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

// Header component with title and right icons
function Header({ title }) {
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();

  // Clean simple handler for auth navigation
  const handleAuthNavigation = () => {
    console.log('Navigating to auth page for login/registration');
    
    // Simple push to auth page
    router.push('/auth');
  };

  const handleNotificationsPress = () => {
    // Use router.push with a valid route
    router.push('/');
    // For a hidden route, this could be implemented properly once we know what route to use
  };
  
  return (
    <SafeAreaView edges={['top']} style={styles.headerContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity 
            onPress={handleAuthNavigation} 
            style={[styles.headerIconButton, styles.loginButton]}
            activeOpacity={0.5}
          >
            <View style={styles.iconWrapper}>
              <LogIn color={Theme.colors.primary} size={23} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNotificationsPress} 
            style={styles.headerIconButton}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Bell color={Theme.colors.textSecondary} size={22} />
              <View style={styles.notificationBadge} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabBarButton({ onPress, children, isFocused }) {
  const scale = useState(new Animated.Value(1))[0];
  const translateY = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: -4,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabButton}>
      <Animated.View 
        style={{ 
          transform: [{ scale }, { translateY }],
          opacity: isFocused ? 1 : 0.8,
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  // Get only the non-hidden routes
  const visibleRoutes = state.routes.filter((route) => !route.name.startsWith('(hidden)'));
  
  return (
    <View style={styles.tabBarContainer}>
      <SafeAreaView edges={['bottom']} style={{flex: 1}}>
        <View style={styles.tabBar}>
          {visibleRoutes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label = options.title || route.name;
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const iconProps = {
                color: isFocused ? Theme.colors.primary : Theme.colors.textLight,
                size: 24,
                strokeWidth: isFocused ? 2.5 : 2,
              };

              const Icon = options.tabBarIcon ? options.tabBarIcon(iconProps) : null;

              return (
                <TabBarButton key={`tab-${route.name}`} onPress={onPress} isFocused={isFocused}>
                  <View style={{
                    alignItems: 'center', 
                    justifyContent: 'center',
                    paddingVertical: 6
                  }}>
                    {isFocused && <View style={{
                      width: 30,
                      height: 3,
                      backgroundColor: Theme.colors.primary,
                      borderRadius: 1.5,
                      marginBottom: 4
                    }} />}
                    {Icon}
                    <Text style={[
                      styles.tabLabel, 
                      { 
                        color: iconProps.color,
                        fontWeight: isFocused ? '600' : 'normal',
                      }
                    ]}>{label}</Text>
                  </View>
                </TabBarButton>
              );
            })}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function Layout() {
  // Function to get page title based on route name
  const getPageTitle = (routeName) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'search':
        return 'Discover';
      case 'tickets':
        return 'My Tickets';
      case 'profile':
        return 'My Profile';
      default:
        return 'App';
    }
  };

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          header: () => <Header title={getPageTitle(route.name)} />,
          tabBarStyle: { display: 'none' }, // Hide default tab bar
          contentStyle: { 
            backgroundColor: Theme.colors.background,
            paddingBottom: Platform.OS === 'ios' ? 100 : 90 // Increase padding to ensure content is visible above tab bar
          },
        })}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'marketplace',
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: 'Tickets',
            tabBarIcon: ({ color, size }) => <Ticket color={color} size={size} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} />,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.text,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabBarContainer: {
    backgroundColor: Theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8, // Increased padding for iOS devices for better safe area
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999, // Ensure tab bar is above other elements
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    height: 64, // Increased height for better touch targets
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', // Make background more visible
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Theme.typography.fontFamily.medium,
    marginTop: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.error,
    borderWidth: 1,
    borderColor: '#fff',
  },
  loginButton: {
    backgroundColor: 'rgba(67, 97, 238, 0.15)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.2)',
  },
});