import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const SimpleOrderManagementPage = () => {
  console.log('SimpleOrderManagementPage rendering');
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Management</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.emptyMessage}>No orders yet.</Text>
        <Text style={styles.emptySubtext}>Orders will appear here when customers purchase your services or tickets.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SimpleOrderManagementPage;
