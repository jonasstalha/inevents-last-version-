import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // Animation refs
  const logoAnim = useRef(new Animated.Value(0)).current;
  const sloganAnim = useRef(new Animated.Value(0)).current;

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
  }, []);

  const handlePress = () => {
    router.replace({ pathname: '/(admin)' }); // Go directly to admin panel, bypassing client and authentication
  };

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
        <TouchableOpacity style={styles.button} onPress={() => router.replace({ pathname: '/(client)' })}>
          <Text style={styles.buttonText}>Enter App</Text>
        </TouchableOpacity>
        {/* Admin Button restored: goes directly to admin panel, no authentication */}
        <TouchableOpacity
          style={[styles.button, { marginTop: 16, backgroundColor: '#22223b' }]}
          onPress={() => router.replace({ pathname: '/(admin)' })}
        >
          <Text style={styles.buttonText}>Admin Panel</Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#6a0dad', // vibrant violet
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
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
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1.2,
  },

});
