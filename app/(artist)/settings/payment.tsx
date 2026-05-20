import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PaymentMethodsPage = () => {
  const router = useRouter();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  const showComingSoonPrompt = () => {
    setShowComingSoonModal(true);
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideComingSoonPrompt = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowComingSoonModal(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity onPress={showComingSoonPrompt} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#6a0dad" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Payment Methods Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💳 Payment Methods</Text>
          <Text style={styles.sectionDescription}>
            Manage your payment methods for receiving payments from clients
          </Text>
          
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#6a0dad20', '#4a148c10']}
              style={styles.emptyStateGradient}
            >
              <Ionicons name="card-outline" size={64} color="#6a0dad" />
              <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
              <Text style={styles.emptyStateText}>
                Add your preferred payment methods to receive payments from clients
              </Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={showComingSoonPrompt}
              >
                <LinearGradient
                  colors={['#6a0dad', '#4a148c']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={showComingSoonPrompt}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="card" size={24} color="#6a0dad" />
              </View>
              <Text style={styles.quickActionText}>Add Credit Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={showComingSoonPrompt}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="logo-paypal" size={24} color="#6a0dad" />
              </View>
              <Text style={styles.quickActionText}>Connect PayPal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={showComingSoonPrompt}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="wallet" size={24} color="#6a0dad" />
              </View>
              <Text style={styles.quickActionText}>Bank Account</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionItem}
              onPress={showComingSoonPrompt}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="phone-portrait" size={24} color="#6a0dad" />
              </View>
              <Text style={styles.quickActionText}>Mobile Money</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideComingSoonPrompt}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideComingSoonPrompt}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnimation,
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
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <LinearGradient
                colors={['#6a0dad', '#4a148c', '#2d0b4d']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="rocket" size={40} color="#fff" />
                  </View>
                  <Text style={styles.modalTitle}>🚀 Coming Soon!</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={hideComingSoonPrompt}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              
              <View style={styles.modalBody}>
                <View style={styles.featuresList}>
                  <Text style={styles.modalDescription}>
                    We're working hard to bring you secure payment processing! Here's what's coming:
                  </Text>
                  
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="shield-checkmark" size={20} color="#34c759" />
                    </View>
                    <Text style={styles.featureText}>Secure Payment Processing</Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="card" size={20} color="#34c759" />
                    </View>
                    <Text style={styles.featureText}>Credit/Debit Card Support</Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="logo-paypal" size={20} color="#34c759" />
                    </View>
                    <Text style={styles.featureText}>PayPal Integration</Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="flash" size={20} color="#34c759" />
                    </View>
                    <Text style={styles.featureText}>Instant Payments</Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="analytics" size={20} color="#34c759" />
                    </View>
                    <Text style={styles.featureText}>Payment Analytics</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={hideComingSoonPrompt}
                >
                  <LinearGradient
                    colors={['#6a0dad', '#4a148c']}
                    style={styles.modalButtonGradient}
                  >
                    <Ionicons name="thumbs-up" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Got it!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addFirstButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6a0dad20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    width: '100%',
  },
  modalGradient: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    position: 'relative',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34c75920',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PaymentMethodsPage; 