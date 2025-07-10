import Constants from 'expo-constants';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export default function EnhancedSplash() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/indexpage/icon.png')} style={styles.logo} />
      <Text style={styles.appName}>InEvent</Text>
      <ActivityIndicator size="large" color="#4F8EF7" style={{ marginTop: 30 }} />
      <Text style={styles.tagline}>Experience Events Like Never Before</Text>
      <Text style={styles.version}>v{Constants.manifest?.version || '0.0.1'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F8EF7',
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    fontStyle: 'italic',
  },
  version: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: '#bbb',
  },
});
