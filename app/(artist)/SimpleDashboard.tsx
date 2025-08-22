import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SimpleDashboard() {
  const router = useRouter();
  
  console.log('Simple Dashboard rendering');

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6a0dad" barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Artist Dashboard</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, Artist!</Text>
          <Text style={styles.welcomeSubtext}>This is a simplified dashboard to help debug the rendering issue.</Text>
        </View>
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => console.log('Orders pressed')}
          >
            <Ionicons name="calendar" size={24} color="#6a0dad" />
            <Text style={styles.menuItemText}>Manage Orders</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => console.log('Tickets pressed')}
          >
            <Ionicons name="ticket" size={24} color="#6a0dad" />
            <Text style={styles.menuItemText}>Create Tickets</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => console.log('Profile pressed')}
          >
            <Ionicons name="person" size={24} color="#6a0dad" />
            <Text style={styles.menuItemText}>Update Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => console.log('Settings pressed')}
          >
            <Ionicons name="settings" size={24} color="#6a0dad" />
            <Text style={styles.menuItemText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.dangerItem]}
            onPress={() => router.replace('/auth')}
          >
            <Ionicons name="log-out" size={24} color="#d32f2f" />
            <Text style={[styles.menuItemText, styles.dangerText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>inEvents Artist Platform v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6a0dad',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
  },
  menuSection: {
    backgroundColor: 'white',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  dangerItem: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  dangerText: {
    color: '#d32f2f',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
});
