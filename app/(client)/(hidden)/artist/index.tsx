import { fetchArtists } from '@/src/api';
import { ArtistCard } from '@/src/components/artist/ArtistCard';
import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { Artist } from '@/src/models/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const categories = [
  'All', 'Photography', 'Music', 'Catering', 'Wedding', 'Entertainment'
];

const dummyArtists: Artist[] = [
  {
    id: '1',
    email: 'alex@example.com',
    role: 'artist' as const,
    name: 'Alex Morgan',
    bio: 'Professional wedding & event photographer with 8+ years experience',
    storeId: 'store1',
    rating: 4.8,
    categories: ['Photography', 'Wedding'],
    location: 'Casablanca',
    featured: true,
    profileImage: 'https://via.placeholder.com/300',
    createdAt: new Date()
  },
  {
    id: '2',
    email: 'dj@example.com',
    role: 'artist' as const,
    name: 'DJ Maximus',
    bio: 'Top-rated DJ specializing in weddings and corporate events',
    storeId: 'store2',
    rating: 4.9,
    categories: ['Music', 'Entertainment'],
    location: 'Rabat',
    featured: true,
    profileImage: 'https://via.placeholder.com/300',
    createdAt: new Date()
  },
  {
    id: '3',
    email: 'catering@example.com',
    role: 'artist' as const,
    name: 'Creative Caterers',
    bio: 'Award-winning catering service with gourmet cuisine',
    storeId: 'store3',
    rating: 4.7,
    categories: ['Catering', 'Wedding'],
    location: 'Marrakech',
    featured: false,
    profileImage: 'https://via.placeholder.com/300',
    createdAt: new Date()
  }
];

export default function ArtistsScreen() {
  const router = useRouter();
  const { artists: contextArtists } = useApp();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const fetchedArtists = await fetchArtists();
      if (fetchedArtists && fetchedArtists.length > 0) {
        const mappedArtists: Artist[] = fetchedArtists.map((artist, index) => ({
          id: artist.id.toString(),
          email: `artist${artist.id}@example.com`,
          role: 'artist' as const,
          name: artist.name,
          bio: artist.description || 'Professional artist',
          storeId: `store${artist.id}`,
          rating: artist.rating,
          categories: [artist.specialty],
          location: 'Morocco',
          featured: index < 2,
          profileImage: artist.image,
          createdAt: new Date()
        }));
        setArtists(mappedArtists);
      } else {
        setArtists(contextArtists.length > 0 ? contextArtists : dummyArtists);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      setArtists(contextArtists.length > 0 ? contextArtists : dummyArtists);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return artists.filter((artist) => {
      const matchesQuery = query
        ? artist.name.toLowerCase().includes(query) ||
          artist.bio.toLowerCase().includes(query) ||
          artist.categories.some((cat) => cat.toLowerCase().includes(query))
        : true;

      const matchesCategory = selectedCategory === 'All'
        ? true
        : artist.categories.some((cat) => cat.toLowerCase() === selectedCategory.toLowerCase());

      return matchesQuery && matchesCategory;
    });
  }, [artists, searchQuery, selectedCategory]);

  const handleArtistPress = useCallback((artistId: string) => {
    router.push({
      pathname: '/(client)/(hidden)/artist',
      params: { artistId }
    });
  }, [router]);

  const handleSave = useCallback((artistId: string) => {
    console.log('Save artist:', artistId);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading artists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artists</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={Theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists..."
            placeholderTextColor={Theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Icon name="x" size={18} color={Theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Artists List */}
      <FlatList
        data={filteredArtists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArtistCard 
            artist={item} 
            onPress={handleArtistPress}
            onSave={handleSave}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="users" size={64} color={Theme.colors.textLight} />
            <Text style={styles.emptyTitle}>No Artists Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or category filters
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    padding: Theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    height: 45,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  clearButton: {
    padding: Theme.spacing.xs,
  },
  categoriesContainer: {
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  categoriesContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  categoryButton: {
    backgroundColor: Theme.colors.card,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text,
  },
  categoryButtonTextActive: {
    color: Theme.colors.background,
  },
  listContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl * 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});
