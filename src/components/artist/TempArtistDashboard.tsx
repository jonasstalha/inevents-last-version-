import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// This is a temporary component to replace the broken ArtistDashboard
const TempArtistDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const insets = useSafeAreaInsets();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.heading}>Artist Dashboard</Text>
            <Text style={styles.subheading}>Welcome back!</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                This is a temporary dashboard while we fix the original one.
              </Text>
              <Text style={styles.infoText}>
                Please check back later for the full dashboard functionality.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('View Profile pressed')}
            >
              <Text style={styles.buttonText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        );
      case 'services':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.heading}>My Services</Text>
            <Text style={styles.subheading}>Manage your services</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('Add Service pressed')}
            >
              <Text style={styles.buttonText}>Add New Service</Text>
            </TouchableOpacity>
          </View>
        );
      case 'orders':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.heading}>Orders</Text>
            <Text style={styles.subheading}>Track your orders</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                No orders at the moment.
              </Text>
            </View>
          </View>
        );
      case 'profile':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.heading}>My Profile</Text>
            <Text style={styles.subheading}>Manage your account</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('Edit Profile pressed')}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => console.log('Logout pressed')}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.heading}>Artist Dashboard</Text>
            <Text style={styles.subheading}>Welcome back!</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeTab === 'home' ? '#6a0dad' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('services')}
        >
          <Ionicons
            name="briefcase"
            size={24}
            color={activeTab === 'services' ? '#6a0dad' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Services
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons
            name="list"
            size={24}
            color={activeTab === 'orders' ? '#6a0dad' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Orders
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person"
            size={24}
            color={activeTab === 'profile' ? '#6a0dad' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
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
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6a0dad',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#e53935',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 60,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: '#6a0dad',
    fontWeight: '500',
  },
});

export default TempArtistDashboard;
