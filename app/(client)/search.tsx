import { useLocalSearchParams, useRouter } from 'expo-router';
import { debounce } from 'lodash';
import { Filter, Search as SearchIcon, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

import { ArtistCard } from '@/src/components/artist/ArtistCard';
import { GigCard } from '@/src/components/artist/GigCard';
import { CategorySelector } from '@/src/components/client/CategorySelector';
import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { fetchArtistsFromFirebase } from '@/src/firebase/artistsService';
import { fetchAllServicesFromFirebase } from '@/src/firebase/fetchAllServices';
import { Artist } from '@/src/models/types';
import { useMarketplaceStore } from '../../stores/useMarketplaceStore';

const AnimatedFlatList = Animated.createAnimatedComponent<any>(FlatList);

// Transform Firebase service data to match GigCard props with enhanced information
const transformGigData = (gig: any) => ({
  id: gig.id,
  title: gig.title,
  description: gig.description || gig.location || '',
  // Don't use a default image - only use actual image if available
  image: gig.image || gig.cover || null,
  // Add empty properties to match the Gig interface
  artistId: gig.artistId || gig.userId || '',
  basePrice: 0, // Remove price by setting it to 0
  category: gig.category || '',
  // Enhanced information for UI
  providerName: gig.artistName || gig.userName || 'Service Provider',
  ordersCount: gig.ordersCount || Math.floor(Math.random() * 50) + 5, // Use real count or a placeholder
  rating: parseFloat(gig.rating || 0) || Math.floor((Math.random() * 2 + 3) * 10) / 10, // Use real rating or a reasonable placeholder
  reviewCount: gig.reviewCount || Math.floor(Math.random() * 30) + 2, // Use real count or a placeholder
  options: gig.options || [],
  createdAt: gig.createdAt || new Date(),
  // Add images array (will be empty but GigCard can handle this)
  images: gig.images || [],
});

export default function SearchScreen() {
  // Use app context for saved artists functionality
  const { saveArtist, unsaveArtist, isArtistSaved } = useApp();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  // Fetch real artists from Firebase on mount
  useEffect(() => {
    setArtistsLoading(true);
    console.log('🔍 Attempting to fetch artists from Firebase...');
    fetchArtistsFromFirebase()
      .then((firebaseArtists) => {
        console.log('✅ Successfully fetched artists:', firebaseArtists);
        setArtists(firebaseArtists);
      })
      .catch((error) => {
        console.error('❌ Error fetching artists:', error);
        setArtists([]);
      })
      .finally(() => setArtistsLoading(false));
  }, []);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setServices } = useMarketplaceStore();
  const [services, setLocalServices] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('gigs');
  const [filteredGigs, setFilteredGigs] = useState<any[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;

  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  useEffect(() => {
    // Initialize from URL params
    if (params.query) {
      setSearchInput(params.query as string);
      setSearchQuery(params.query as string);
    }

    if (params.category) {
      setSelectedCategory(params.category as string);
    }
  }, [params]);

  useEffect(() => {
    setIsLoading(true); // Start loading
    const timeout = setTimeout(() => {
      // Show all artists if no search or category filter
      let artistResults = [...artists];
      if (searchQuery) {
        artistResults = artistResults.filter(artist =>
          (artist.name && artist.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (artist.bio && artist.bio.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      } else if (selectedCategory === 'All') {
        // No search, no filter: show all
        artistResults = [...artists];
      } else {
        artistResults = artistResults.filter(artist =>
          artist.categories && artist.categories.some(category =>
            category.toLowerCase() === selectedCategory.toLowerCase()
          )
        );
      }
      setFilteredArtists(artistResults);

      // Show all services if no search or category filter
      let gigResults = [...services];
      if (searchQuery) {
        gigResults = gigResults.filter(gig => {
          const titleMatch = gig.title && gig.title.toLowerCase().includes(searchQuery.toLowerCase());
          const descMatch = (gig.description || gig.location || '').toLowerCase().includes(searchQuery.toLowerCase());
          return titleMatch || descMatch;
        });
      } else if (selectedCategory === 'All') {
        // No search, no filter: show all
        gigResults = [...services];
      } else {
        gigResults = gigResults.filter(gig => {
          if (gig.category) {
            return gig.category.toLowerCase() === selectedCategory.toLowerCase();
          }
          if (Array.isArray(gig.categories)) {
            return gig.categories.map((c) => c.toLowerCase()).includes(selectedCategory.toLowerCase());
          }
          return false;
        });
      }
      setFilteredGigs(gigResults);
      setIsLoading(false); // End loading
    }, 500); // Simulate delay

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, artists, services]);

  // Fetch and store all services globally on mount (from Firebase)
  useEffect(() => {
    const fetchAndStoreServices = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 Attempting to fetch services from Firebase...');
        const data = await fetchAllServicesFromFirebase();
        console.log('✅ Successfully fetched services:', data);
        setLocalServices(data);
        setServices(data); // Store globally if needed
      } catch (e) {
        console.error('❌ Error fetching services:', e);
        setLocalServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndStoreServices();
  }, [setServices]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    router.setParams({
      query: searchInput,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
    });
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    router.setParams({
      query: undefined,
    });
  };

  const handleArtistPress = (artistId: string) => {
    const router = useRouter();
    router.push(`/(artist)/public-profile?id=${artistId}`);
  };

  const handleGigPress = (gigId: string) => {
    const router = useRouter();
    router.push(`/(client)/(hidden)/gig/${gigId}`);
  };
  
  // Handle saving/unsaving artists
  const handleSaveArtist = (artistId: string) => {
    console.log('Save/unsave artist:', artistId);
    if (isArtistSaved(artistId)) {
      console.log('Unsaving artist:', artistId);
      unsaveArtist(artistId);
    } else {
      console.log('Saving artist:', artistId);
      saveArtist(artistId);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate a refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>


      <Animatable.View
        animation="slideInDown"
        duration={500}
        style={styles.searchContainer}
      >
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={Theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for artists, services..."
            placeholderTextColor={Theme.colors.textLight}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearButton}
            >
              <Animatable.View animation="fadeIn" duration={200}>
                <X size={18} color={Theme.colors.textLight} />
              </Animatable.View>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {/* Add filter functionality */ }}
        >
          <Filter size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
      </Animatable.View>

      <CategorySelector onSelectCategory={handleCategorySelect} selectedCategory={selectedCategory} />

      <Animatable.View
        animation="fadeIn"
        duration={300}
        style={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gigs' && styles.activeTab]}
          onPress={() => setActiveTab('gigs')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'gigs' && styles.activeTabText
            ]}
          >
            Services ({filteredGigs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.activeTab]}
          onPress={() => setActiveTab('artists')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'artists' && styles.activeTabText
            ]}
          >
            Artists ({filteredArtists.length})
          </Text>
        </TouchableOpacity>
      </Animatable.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : activeTab === 'gigs' ? (
        <Animatable.View animation="fadeIn" duration={300} style={styles.listContainer}>
          {filteredGigs.length > 0 ? (
            <AnimatedFlatList
              data={filteredGigs}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Animatable.View
                  animation="fadeInUp"
                  duration={300}
                  style={styles.gigCardContainer}
                >
                  <GigCard
                    gig={transformGigData(item)}
                    onPress={handleGigPress}
                    onBuy={handleGigPress}
                  />
                </Animatable.View>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Theme.colors.primary}
                  colors={[Theme.colors.primary]}
                />
              }
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Animatable.View animation="fadeIn" duration={300}>
                <Text style={styles.emptyTitle}>No Services Found</Text>
                <Text style={styles.emptyText}>
                  We couldn't find any services matching your search criteria. Try adjusting your filters or search term.
                </Text>
              </Animatable.View>
            </View>
          )}
        </Animatable.View>
      ) : (
        <Animatable.View animation="fadeIn" duration={300} style={styles.listContainer}>
          {filteredArtists.length > 0 ? (
            <AnimatedFlatList
              data={filteredArtists}
              keyExtractor={(item: Artist) => item.id}
              renderItem={({ item }: { item: Artist }) => (
                <Animatable.View
                  animation="fadeInUp"
                  duration={300}
                  style={styles.artistCardContainer}
                >
                  <ArtistCard 
                    artist={item} 
                    onPress={handleArtistPress} 
                    onSave={handleSaveArtist}
                    isSaved={isArtistSaved(item.id)}
                  />
                </Animatable.View>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Theme.colors.primary}
                  colors={[Theme.colors.primary]}
                />
              }
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Animatable.View animation="fadeIn" duration={300}>
                <Text style={styles.emptyTitle}>No Artists Found</Text>
                <Text style={styles.emptyText}>
                  We couldn't find any artists matching your search criteria. Try adjusting your filters or search term.
                </Text>
              </Animatable.View>
            </View>
          )}
        </Animatable.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  filterButton: {
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    marginLeft: Theme.spacing.sm,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    zIndex: 1,
  },
  backButton: {
    padding: Theme.spacing.sm,
    marginRight: Theme.spacing.md,
  },
  headerTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    height: 45,
    marginRight: Theme.spacing.sm,
    shadowColor: Theme.colors.textDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  clearButton: {
    padding: Theme.spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.card,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
  },
  activeTabText: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl * 2,
  },
  gigCardContainer: {
    marginBottom: Theme.spacing.md,
  },
  artistCardContainer: {
    marginBottom: Theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.md,
  },
});