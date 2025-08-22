import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SimpleDashboard = () => {
  console.log('Simple Dashboard rendering');
  const [activeTab, setActiveTab] = useState('home');
  const insets = useSafeAreaInsets();

  const renderContent = () => {
    try {
      console.log(`Rendering tab: ${activeTab}`);
      switch (activeTab) {
        case 'home':
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.heading}>Artist Dashboard</Text>
              <Text style={styles.subheading}>Welcome back!</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Active Services</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>5</Text>
                  <Text style={styles.statLabel}>Pending Orders</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>4.8</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            </View>
          );
        case 'orders':
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.heading}>Orders</Text>
              <Text style={styles.message}>You have no pending orders.</Text>
            </View>
          );
        case 'tickets':
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.heading}>Tickets</Text>
              <Text style={styles.message}>No tickets created yet.</Text>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Create a Ticket</Text>
              </TouchableOpacity>
            </View>
          );
        case 'profile':
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.heading}>Profile</Text>
              <Text style={styles.message}>Update your profile information.</Text>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          );
        default:
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.heading}>Artist Dashboard</Text>
              <Text style={styles.message}>Welcome back!</Text>
            </View>
          );
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{String(error)}</Text>
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar backgroundColor="#6a0dad" barStyle="light-content" />

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            console.log('Home pressed');
            setActiveTab('home');
          }}
        >
          <Ionicons name="home" size={24} color={activeTab === 'home' ? '#6a0dad' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            console.log('Orders pressed');
            setActiveTab('orders');
          }}
        >
          <Ionicons name="list" size={24} color={activeTab === 'orders' ? '#6a0dad' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            console.log('Tickets pressed');
            setActiveTab('tickets');
          }}
        >
          <Ionicons name="ticket" size={24} color={activeTab === 'tickets' ? '#6a0dad' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            console.log('Profile pressed');
            setActiveTab('profile');
          }}
        >
          <Ionicons name="person" size={24} color={activeTab === 'profile' ? '#6a0dad' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6a0dad',
  },
  subheading: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6a0dad',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: '#6a0dad',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SimpleDashboard;
