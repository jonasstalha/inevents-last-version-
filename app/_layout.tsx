// app/_layout.tsx
import 'react-native-reanimated';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/src/context/AppContext';
import { AuthProvider } from '@/src/context/AuthContext';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ArtistStoreProvider } from '../src/components/artist/ArtistStore';
import '../src/firebase/firebaseConfig';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

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
    <AuthProvider>
      <AppProvider>
        <ArtistStoreProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </ArtistStoreProvider>
      </AppProvider>
    </AuthProvider>
  );
}
