// app/_layout.tsx
import 'react-native-reanimated';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/src/context/AppContext';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_PENDING_REDIRECT_KEY } from '@/src/utils/requireAuth';
import { ArtistStoreProvider } from '../src/components/artist/ArtistStore';
import '../src/firebase/firebaseConfig';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Inner layout component that has access to auth context
function RootLayoutInner() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  const { user, loading } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });
  const [hasHandledInitialRoute, setHasHandledInitialRoute] = useState(false);

  // Handle initial routing based on auth state
  useEffect(() => {
    if (hasHandledInitialRoute || !fontsLoaded || loading) {
      return;
    }

    const resolveInitialRoute = async () => {
      if (segments.includes('auth')) {
        // Let auth flow finish without redirecting away from the auth page.
        setHasHandledInitialRoute(true);
        return;
      }

      try {
        const pendingRedirect = await AsyncStorage.getItem(AUTH_PENDING_REDIRECT_KEY);
        if (pendingRedirect) {
          // Let the auth page restore the pending redirect after login.
          setHasHandledInitialRoute(true);
          return;
        }
      } catch (error) {
        console.warn('Failed to read pending auth redirect:', error);
      }

      if (user && user.isEmailVerified) {
        console.log(`🔄 App restarted: User logged in as ${user.role}`);
        if (user.role === 'admin') {
          router.replace('/(admin)');
        } else if (user.role === 'artist') {
          router.replace('/(artist)');
        } else if (user.role === 'client') {
          router.replace('/(client)');
        }
        // If role is null/unknown, stay on welcome screen — don't default
      }

      setHasHandledInitialRoute(true);
    };

    resolveInitialRoute();
    // If no user, the Stack will show the welcome/auth screens
  }, [user, loading, fontsLoaded, router, segments, hasHandledInitialRoute]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    // Show enhanced splash screen while loading
    const EnhancedSplash = require('../components/EnhancedSplash').default;
    return <EnhancedSplash />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <ArtistStoreProvider>
          <RootLayoutInner />
        </ArtistStoreProvider>
      </AppProvider>
    </AuthProvider>
  );
}
