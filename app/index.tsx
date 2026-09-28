import { useAuth } from '@/src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Animation refs
  const logoAnim = useRef(new Animated.Value(0)).current;
  const sloganAnim = useRef(new Animated.Value(0)).current;

  // Continue to the appropriate area based on user role.
  const openApp = useCallback(() => {
    if (user?.role === 'admin') {
      router.replace('/(admin)');
    } else if (user?.role === 'artist') {
      router.replace('/(artist)');
    } else {
      router.replace('/(client)/search');
    }
  }, [router, user?.role]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(sloganAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const openAfterFirstVisit = async () => {
      await AsyncStorage.setItem('intro_seen', 'true');
      return setTimeout(openApp, 1500);
    };

    const timeoutPromise = openAfterFirstVisit();
    return () => {
      timeoutPromise.then(clearTimeout).catch(() => undefined);
    };
  }, [openApp]);



  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/indexpage/mainpic.png')} 
        style={styles.heroImage} 
        resizeMode="cover" 
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Animated.Image
          source={require('../assets/indexpage/welcomepage.png')}
          style={[
            styles.logo,
            {
              opacity: 1, // Fully visible, no animation
              transform: [
                { translateY: 0 }, // No slide animation
              ],
            },
          ]}
        />
        <Animated.Text
          style={[
            styles.slogan,
            {
              color: '#a259e6', // Vibrant violet
              textShadowColor: 'transparent', // Remove shadow
              opacity: sloganAnim,
              transform: [
                {
                  translateY: sloganAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Discover. Connect. Experience.
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logo: {
    width: 250, // Fixed width, increased for better visibility
    height: 90,
    marginBottom: 18,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  slogan: {
    color: '#a259e6', // Vibrant violet
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1.2,
  },

});