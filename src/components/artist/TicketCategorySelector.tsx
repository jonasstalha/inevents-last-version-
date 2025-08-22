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

// Ticket categories - different from service categories
export const TICKET_CATEGORIES: Category[] = [
  { id: 'musique', name: 'Musique', icon: 'musical-notes' },
  { id: 'theatre', name: 'Theatre', icon: 'film' },
  { id: 'comedie', name: 'Comedie', icon: 'happy' },
  { id: 'sport', name: 'Sport', icon: 'basketball' },
  { id: 'concert', name: 'Concert', icon: 'mic' },
  { id: 'festival', name: 'Festival', icon: 'star' },
  { id: 'formation', name: 'Formation', icon: 'school' },
  { id: 'famille', name: 'Famille & Loisirs', icon: 'people' },
  { id: 'conference', name: 'Conference', icon: 'business' },
  { id: 'exposition', name: 'Exposition', icon: 'easel' },
  { id: 'soiree', name: 'Soirée', icon: 'moon' },
  { id: 'autre', name: 'Autre', icon: 'ellipsis-horizontal' },
];

interface TicketCategorySelectorProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  isLoading?: boolean;
  error?: string;
}

const TicketCategorySelector: React.FC<TicketCategorySelectorProps> = ({
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
        <Ionicons name="alert-circle" size={18} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Event Category *</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {TICKET_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategoryId === category.id && styles.selectedCategory
            ]}
            onPress={() => onSelectCategory(category.id)}
          >
            <View style={[
              styles.iconContainer,
              selectedCategoryId === category.id && styles.selectedIconContainer
            ]}>
              <Ionicons
                name={category.icon as any}
                size={20}
                color={selectedCategoryId === category.id ? '#fff' : Theme.colors.primary || '#667eea'}
              />
            </View>
            <Text style={[
              styles.categoryName,
              selectedCategoryId === category.id && styles.selectedCategoryName
            ]}>
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#374151',
  },
  categoriesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedIconContainer: {
    backgroundColor: Theme.colors.primary || '#667eea',
    borderColor: Theme.colors.primary || '#667eea',
  },
  categoryName: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 4,
  },
  selectedCategory: {
    transform: [{ scale: 1.05 }],
  },
  selectedCategoryName: {
    color: Theme.colors.primary || '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#4b5563',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    color: '#ef4444',
  }
});

export default TicketCategorySelector;
