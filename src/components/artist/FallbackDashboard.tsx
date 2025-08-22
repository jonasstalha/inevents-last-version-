// src/components/artist/FallbackDashboard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const FallbackDashboard = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigateToTickets = () => {
    router.push("/(artist)/ticket");
  };

  const handleNavigateToOrders = () => {
    // If orders page doesn't exist, use index as fallback
    router.push("/(artist)");
  };

  const handleNavigateToMarketplace = () => {
    router.push("/(artist)/marketplace");
  };

  const handleNavigateToChat = () => {
    // If chat page doesn't exist, use index as fallback
    router.push("/(artist)");
  };

  const handleNavigateToSettings = () => {
    router.push("/(artist)/settings");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Artist Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome to Your Artist Dashboard</Text>
        <Text style={styles.welcomeSubtext}>
          Manage your services, orders, and more from this simple dashboard.
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Open Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToMarketplace}>
          <Ionicons name="storefront-outline" size={32} color="#2E7D32" />
          <Text style={styles.actionText}>Marketplace</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToTickets}>
          <Ionicons name="ticket-outline" size={32} color="#1565C0" />
          <Text style={styles.actionText}>Tickets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToOrders}>
          <Ionicons name="list-outline" size={32} color="#C62828" />
          <Text style={styles.actionText}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color="#6A1B9A" />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToSettings}>
          <Ionicons name="settings-outline" size={32} color="#455A64" />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Dashboard Information</Text>
        <Text style={styles.infoText}>
          This is a temporary dashboard while we resolve some technical issues.
          You can still access all your important features through the quick actions above.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    width: '30%',
    margin: 5,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});

export default FallbackDashboard;
