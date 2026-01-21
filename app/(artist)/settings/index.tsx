import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Animated, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useArtistStore } from '../../../src/components/artist/ArtistStore';

const SettingsPage = () => {
  const router = useRouter();
  const { settings, resetStore } = useArtistStore();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

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

  const handleEditProfile = () => {
    router.push('/(artist)/settings/profile');
  };



  const handlePaymentMethods = () => {
    router.push('/(artist)/settings/payment');
  };

  const handleNotifications = () => {
    router.push('/(artist)/settings/notifications');
  };

  const handleLanguage = () => {
    showComingSoonPrompt();
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout? This will clear all your cached data and you'll need to login again.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('🔄 Starting complete logout process...');
              
              // Step 1: Clear Artist Store state
              console.log('🧹 Clearing Artist Store state...');
              resetStore();
              
              // Step 2: Perform complete logout with cache clearing
              const performCompleteLogout = (await import('../../../src/utils/logoutUtil')).default;
              const result = await performCompleteLogout({
                clearAllStorage: true,
                showSuccessMessage: false
              });
              
              if (result.success) {
                console.log('✅ Logout completed successfully - redirecting to client side');
                
                // Step 3: Redirect to client side immediately
                router.replace('/(client)');
              } else {
                console.error('❌ Logout failed:', result.error);
                
                // Still try to redirect even if logout had issues
                router.replace('/(client)');
                Alert.alert("Logout Notice", "You have been logged out, but some data may not have been cleared completely.");
              }
              
            } catch (error) {
              console.error('❌ Logout process failed:', error);
              
              // Emergency logout as fallback - always redirect
              try {
                const { emergencyLogout } = await import('../../../src/utils/logoutUtil');
                await emergencyLogout();
              } catch (emergencyError) {
                console.error('❌ Emergency logout failed:', emergencyError);
              } finally {
                // Always redirect regardless of errors
                router.replace('/(client)');
              }
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <Ionicons name="person" size={24} color="#6a0dad" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Text style={styles.settingDescription}>Update your profile information</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleNotifications}>
          <Ionicons name="notifications" size={24} color="#6a0dad" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDescription}>
              {settings.notificationsEnabled ? 'Notifications are enabled' : 'Notifications are disabled'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handlePaymentMethods}>
          <Ionicons name="card" size={24} color="#6a0dad" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Payment Methods</Text>
            <Text style={styles.settingDescription}>
              {settings.paymentMethods.length} payment methods added
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleLanguage}>
          <Ionicons name="language" size={24} color="#6a0dad" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingDescription}>Coming Soon</Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

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
                  <Text style={styles.featureTitle}>Multi-Language</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="flash" size={24} color="#f093fb" />
                  <Text style={styles.featureTitle}>Real-Time Switch</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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

export default SettingsPage;