import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useArtistStore } from '../../../src/components/artist/ArtistStore';

const LanguagePage = () => {
  const router = useRouter();
  const { settings, updateLanguage } = useArtistStore();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const { width: screenWidth } = Dimensions.get('window');

  const handleBack = () => {
    router.back();
  };

  const showComingSoonPrompt = () => {
    setShowComingSoonModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideComingSoonModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowComingSoonModal(false);
    });
  };

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  return (
    <>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Language Settings</Text>
        </LinearGradient>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={showComingSoonPrompt}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.quickActionGradient}>
              <Ionicons name="language-outline" size={24} color="#ffffff" />
              <Text style={styles.quickActionText}>Change Language</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={showComingSoonPrompt}>
            <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.quickActionGradient}>
              <Ionicons name="globe-outline" size={24} color="#ffffff" />
              <Text style={styles.quickActionText}>Auto Detect</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.sectionHeader}>
            <Ionicons name="language" size={20} color="#ffffff" />
            <Text style={styles.sectionTitle}>Available Languages</Text>
          </LinearGradient>
          <View style={styles.sectionContent}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.languageItem}
                onPress={showComingSoonPrompt}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.nativeName}</Text>
                  <Text style={styles.languageCode}>{language.name}</Text>
                </View>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <LinearGradient colors={['#a8edea', '#fed6e3']} style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#333" />
            <Text style={[styles.sectionTitle, { color: '#333' }]}>Coming Soon Features</Text>
          </LinearGradient>
          <View style={styles.sectionContent}>
            <Text style={styles.description}>
              We're working on bringing you multi-language support with:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Real-time language switching</Text>
              <Text style={styles.featureItem}>• Auto-detection based on region</Text>
              <Text style={styles.featureItem}>• Full app localization</Text>
              <Text style={styles.featureItem}>• Cultural date & currency formats</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideComingSoonModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalHeader}>
              <Ionicons name="language" size={48} color="#ffffff" />
              <Text style={styles.modalTitle}>Language Settings</Text>
              <Text style={styles.modalSubtitle}>Coming Soon</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                We're developing comprehensive language support to make your experience truly global.
              </Text>
              <View style={styles.featureGrid}>
                <View style={styles.featureCard}>
                  <Ionicons name="globe" size={24} color="#667eea" />
                  <Text style={styles.featureTitle}>Global Reach</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="flash" size={24} color="#f093fb" />
                  <Text style={styles.featureTitle}>Instant Switch</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="location" size={24} color="#4facfe" />
                  <Text style={styles.featureTitle}>Auto Detection</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="star" size={24} color="#f6d365" />
                  <Text style={styles.featureTitle}>Native Feel</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseButton} onPress={hideComingSoonModal}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalCloseGradient}>
                <Text style={styles.modalCloseText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  quickActionGradient: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionContent: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  languageCode: {
    fontSize: 14,
    color: '#718096',
  },
  comingSoonBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modalBody: {
    padding: 24,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  modalCloseButton: {
    margin: 24,
    marginTop: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalCloseGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LanguagePage; 