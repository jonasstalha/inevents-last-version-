import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Theme } from '../../constants/theme';

// Import both service and ticket categories
import { SERVICE_CATEGORIES } from '../artist/ServiceCategorySelector';
import { TICKET_CATEGORIES } from '../artist/TicketCategorySelector';

// Combine both category types and map to the format needed by this component
const CATEGORIES = [
  ...SERVICE_CATEGORIES.map(cat => ({
    name: cat.id, // Use id for consistency with search.tsx which compares with service.category
    displayName: cat.name, // The human-readable name for display
    icon: mapIconName(cat.icon), // Map Ionicons names to Feather icon names
    type: 'service'
  })),
  ...TICKET_CATEGORIES.map(cat => ({
    name: cat.id,
    displayName: cat.name,
    icon: mapIconName(cat.icon),
    type: 'ticket'
  }))
];

// Helper function to map Ionicons names to Feather icon names
function mapIconName(ioniconsName: string): string {
  const iconMap: Record<string, string> = {
    'heart': 'heart',
    'gift': 'gift',
    'restaurant': 'coffee',
    'musical-notes': 'music',
    'person': 'user',
    'business': 'briefcase',
    'people': 'users',
    'happy': 'smile',
    'flower': 'award', // No direct equivalent in Feather
    'camera': 'camera',
    'film': 'film',
    'color-palette': 'award', // No direct equivalent in Feather
    // Add more mappings as needed
  };
  
  return iconMap[ioniconsName] || 'circle'; // Default to 'circle' if no mapping exists
}

interface CategorySelectorProps {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onSelectCategory,
  selectedCategory
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Add 'All' category at the start */}
        <TouchableOpacity
          key="All"
          style={[
            styles.categoryButton,
            selectedCategory === 'All' && styles.selectedCategory,
          ]}
          onPress={() => onSelectCategory('All')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            <Icon
              name="grid"
              size={16}
              color={selectedCategory === 'All' ? Theme.colors.secondary : Theme.colors.primary}
            />
          </View>
          <Text
            style={[
              styles.categoryText,
              selectedCategory === 'All' && styles.selectedCategoryText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryButton,
              selectedCategory === category.name && styles.selectedCategory,
            ]}
            onPress={() => onSelectCategory(category.name)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon
                name={category.icon}
                size={16}
                color={selectedCategory === category.name ? Theme.colors.secondary : Theme.colors.primary}
              />
            </View>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.name && styles.selectedCategoryText,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.md,
  },
  scrollContainer: {
    paddingHorizontal: Theme.spacing.md,
  },
  categoryButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.background,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectedCategory: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
  },
  selectedCategoryText: {
    color: Theme.colors.secondary,
  },
  iconWrapper: {
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});