import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleOrderManagementPage from './SimpleOrderManagementPage';

const BasicArtistDashboard = () => {
  console.log('BasicArtistDashboard rendering');
  const [activeTab, setActiveTab] = useState('home');
  const insets = useSafeAreaInsets();

  const renderContent = () => {
    console.log('Rendering tab:', activeTab);
    switch (activeTab) {
      case 'home':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Home</Text>
            <Text style={styles.contentText}>Welcome to your artist dashboard!</Text>
          </View>
        );
      case 'calendar':
        return <SimpleOrderManagementPage />;
      case 'ticket':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Tickets</Text>
            <Text style={styles.contentText}>Create and manage tickets here.</Text>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Settings</Text>
            <Text style={styles.contentText}>Adjust your settings here.</Text>
          </View>
        );
      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Home</Text>
            <Text style={styles.contentText}>Welcome to your artist dashboard!</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Main Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'home' && styles.activeTab]} 
          onPress={() => setActiveTab('home')}
        >
          <Ionicons name="home" size={24} color={activeTab === 'home' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'calendar' && styles.activeTab]} 
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons name="calendar" size={24} color={activeTab === 'calendar' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'ticket' && styles.activeTab]} 
          onPress={() => setActiveTab('ticket')}
        >
          <Ionicons name="ticket" size={24} color={activeTab === 'ticket' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'ticket' && styles.activeTabText]}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'settings' && styles.activeTab]} 
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons name="settings" size={24} color={activeTab === 'settings' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    flex: 1,
    paddingBottom: 60, // Space for tab bar
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6a0dad',
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 13, 173, 0.05)',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeTabText: {
    color: '#6a0dad',
    fontWeight: '500',
  },
});

export default BasicArtistDashboard;
