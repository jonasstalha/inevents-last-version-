import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';

// Define the categories with proper typing
export type Category = {
  id: string;
  name: string;
  icon: string; // Icon name from Ionicons
};

// These categories should match the ones in the client CategorySelector.tsx
export const SERVICE_CATEGORIES: Category[] = [
  { id: 'Mariage', name: 'Mariage', icon: 'heart' },
  { id: 'Anniversaire', name: 'Anniversaire', icon: 'gift' },
  { id: 'Traiteur', name: 'Traiteur', icon: 'restaurant' },
  { id: 'Musique', name: 'Musique', icon: 'musical-notes' },
  { id: 'Neggafa', name: 'Neggafa', icon: 'person' },
  { id: 'Conference', name: 'Conference', icon: 'business' },
  { id: 'Evenement d\'entreprise', name: 'Evenement d\'entreprise', icon: 'people' },
  { id: 'Kermesse', name: 'Kermesse', icon: 'happy' },
  { id: 'Henna', name: 'Henna', icon: 'flower' },
  { id: 'Photographie', name: 'Photographie', icon: 'camera' },
  { id: 'Animation', name: 'Animation', icon: 'film' },
  { id: 'Decoration', name: 'Decoration', icon: 'color-palette' },
  { id: 'Buffet', name: 'Buffet', icon: 'restaurant' },
];

interface ServiceCategorySelectorProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  isLoading?: boolean;
  error?: string;
}

const ServiceCategorySelector: React.FC<ServiceCategorySelectorProps> = ({
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Theme.colors.primary || '#667eea'} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Category *</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoryList}
      >
        {SERVICE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategoryId === category.id && styles.selectedCategoryButton
            ]}
            onPress={() => onSelectCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={22}
              color={selectedCategoryId === category.id ? '#ffffff' : '#667eea'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategoryId === category.id && styles.selectedCategoryText
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  categoryList: {
    paddingVertical: 10,
    flexDirection: 'row',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedCategoryButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#374151',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
  }
});

export default ServiceCategorySelector;
