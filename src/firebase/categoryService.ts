import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { Category, SERVICE_CATEGORIES } from '../components/artist/ServiceCategorySelector';
import { TICKET_CATEGORIES } from '../components/artist/TicketCategorySelector';

/**
 * CategoryService 
 * Centralized service to manage all categories (services and tickets)
 * Can fetch from Firestore or provide fallback to local data
 */

// Type definitions
export type CategoryType = 'service' | 'ticket';

/**
 * Fetch categories from Firestore
 * Falls back to local data if Firestore fetch fails
 */
export const fetchCategories = async (type: CategoryType): Promise<Category[]> => {
  try {
    // Try to get from Firestore first
    const db = getFirestore();
    const categoriesCollection = collection(db, `categories/${type}s`);
    const snapshot = await getDocs(categoriesCollection);
    
    if (!snapshot.empty) {
      // If data exists in Firestore, use it
      const fetchedCategories: Category[] = [];
      snapshot.forEach(doc => {
        // Always ensure icon is a string (never undefined)
        const iconName = doc.data().icon || 'help-circle';
        fetchedCategories.push({
          id: doc.id,
          name: doc.data().name || doc.id,
          icon: iconName
        });
      });
      return fetchedCategories;
    } else {
      // No data in Firestore, use local fallback
      return getFallbackCategories(type);
    }
  } catch (error) {
    console.warn(`Error fetching ${type} categories from Firestore:`, error);
    // Return local fallback data on error
    return getFallbackCategories(type);
  }
};

/**
 * Get local fallback categories
 */
export const getFallbackCategories = (type: CategoryType): Category[] => {
  if (type === 'service') {
    return SERVICE_CATEGORIES;
  } else if (type === 'ticket') {
    return TICKET_CATEGORIES;
  }
  return [];
};

/**
 * Get category name from category ID
 */
export const getCategoryNameById = (type: CategoryType, id: string): string => {
  const categories = type === 'service' ? SERVICE_CATEGORIES : TICKET_CATEGORIES;
  const found = categories.find((cat) => cat.id === id);
  return found ? found.name : id;
};

/**
 * Validate category
 */
export const validateCategory = (type: CategoryType, categoryId: string): boolean => {
  if (!categoryId || typeof categoryId !== 'string' || categoryId.trim() === '') {
    return false;
  }
  
  const categories = type === 'service' ? SERVICE_CATEGORIES : TICKET_CATEGORIES;
  return categories.some(cat => cat.id === categoryId);
};
