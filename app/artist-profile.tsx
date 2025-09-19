import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../src/firebase/artistServices';
import { fetchArtistById } from '../src/firebase/artistsService';

const ArtistProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'artist' | 'guest'>('guest');

  useEffect(() => {
    const fetchProfileAndServices = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      // Determine which artist ID to fetch
      const targetArtistId = params.id ? params.id as string : currentUser?.uid;
      
      if (!targetArtistId) {
        setLoading(false);
        return;
      }

      // Determine user role
      if (currentUser) {
        // For now, assume if current user is viewing their own profile, they're an artist
        // In a real app, you'd check user role from database
        if (currentUser.uid === targetArtistId) {
          setCurrentUserRole('artist');
        } else {
          setCurrentUserRole('client');
        }
      } else {
        setCurrentUserRole('guest');
      }
      
      setLoading(true);
      try {
        const artist = await fetchArtistById(targetArtistId);
        if (artist) {
          setArtistProfile({
            id: targetArtistId,
            name: artist.name,
            avatar: artist.profileImage || 'https://ui-avatars.com/api/?name=Artist',
            description: artist.bio || '',
            rating: artist.rating || 0,
            location: artist.location || '',
            categories: artist.categories || [],
          });
          const gigs = await fetchServicesByArtistId(targetArtistId);
          setServices(gigs);
        }
      } catch (e) {
        console.error('Error fetching artist profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndServices();
  }, [params.id]);

  const handleContactArtist = () => {
    if (!artistProfile) return;
    console.log('Contact artist:', artistProfile.id);
    // TODO: Navigate to chat or implement contact modal
    // router.push(`/(client)/chat/${artistProfile.id}`);
  };

  const handleServicePress = (serviceId: string) => {
    router.push(`/(client)/(hidden)/gig/${serviceId}`);
  };

  const handleEditProfile = () => {
    router.push('/(artist)/settings');
  };

  const isOwnProfile = currentUserRole === 'artist';

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8ff' }}>
      {/* Header with Back Button */}
      <View style={{ 
        position: 'absolute', 
        top: insets.top + 10, 
        left: 12, 
        right: 12,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ 
            backgroundColor: '#fff', 
            borderRadius: 20, 
            padding: 8, 
            shadowColor: '#000', 
            shadowOpacity: 0.1, 
            shadowRadius: 4, 
            elevation: 2 
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#6a0dad" />
        </TouchableOpacity>
        
        {isOwnProfile && (
          <TouchableOpacity
            onPress={handleEditProfile}
            style={{ 
              backgroundColor: '#fff', 
              borderRadius: 20, 
              padding: 8, 
              shadowColor: '#000', 
              shadowOpacity: 0.1, 
              shadowRadius: 4, 
              elevation: 2 
            }}
          >
            <Ionicons name="settings" size={24} color="#6a0dad" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingTop: insets.top + 60, 
          paddingBottom: insets.bottom + 24 
        }} 
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
            <ActivityIndicator size="large" color="#6a0dad" />
            <Text style={{ marginTop: 16, color: '#666' }}>Loading artist profile...</Text>
          </View>
        ) : artistProfile ? (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: artistProfile.avatar }} style={styles.avatar} />
              </View>
              <Text style={styles.name}>{artistProfile.name}</Text>
              {artistProfile.description ? (
                <Text style={styles.description}>{artistProfile.description}</Text>
              ) : null}
              
              {/* Rating */}
              <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Text key={i} style={styles.star}>
                      {artistProfile.rating >= i + 1
                        ? '★'
                        : artistProfile.rating >= i + 0.5
                        ? '⯨'
                        : '☆'}
                    </Text>
                  ))}
                  <Text style={styles.ratingText}>
                    {artistProfile.rating?.toFixed(1)} ({services.length} services)
                  </Text>
                </View>
              </View>

              {/* Categories */}
              {artistProfile.categories && artistProfile.categories.length > 0 && (
                <View style={styles.categoriesContainer}>
                  {artistProfile.categories.map((category: string, index: number) => (
                    <View key={index} style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Location */}
              {artistProfile.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>{artistProfile.location}</Text>
                </View>
              )}
            </View>

            {/* Services Section */}
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>
                {isOwnProfile ? 'My Services' : 'Services'}
              </Text>
              
              {services.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    {isOwnProfile ? 'No services published yet' : 'No services available'}
                  </Text>
                </View>
              ) : (
                services.map((service, idx) => (
                  <TouchableOpacity 
                    key={service.id || idx} 
                    style={styles.serviceCard}
                    onPress={() => handleServicePress(service.id)}
                  >
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.serviceCategory}>{service.category}</Text>
                      </View>
                      {service.basePrice && (
                        <Text style={styles.servicePrice}>
                          From ${service.basePrice}
                        </Text>
                      )}
                    </View>
                    
                    {service.description && (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    
                    {service.images && service.images.length > 0 && (
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.serviceImages}
                      >
                        {service.images.map((img: string, i: number) => (
                          <Image 
                            key={i} 
                            source={{ uri: img }} 
                            style={styles.serviceImage} 
                          />
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.serviceFooter}>
                      <View style={styles.serviceStats}>
                        <Ionicons name="star" size={14} color="#ffc107" />
                        <Text style={styles.serviceRating}>
                          {service.rating || 'New'}
                        </Text>
                        <Text style={styles.serviceOrders}>
                          • {service.reviewCount || 0} orders
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#6a0dad" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.errorState}>
            <Ionicons name="person-outline" size={64} color="#ccc" />
            <Text style={styles.errorText}>Artist profile not found</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      {!isOwnProfile && artistProfile && (
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleContactArtist}
        >
          <Ionicons name="chatbubble" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#6a0dad',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  avatarContainer: {
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#6a0dad',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#222',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 20,
    color: '#FFD700',
    marginRight: 2,
  },
  ratingText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#f0e6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  categoryText: {
    color: '#6a0dad',
    fontWeight: '600',
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 14,
  },
  servicesSection: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#6a0dad',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  emptyStateText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 12,
    fontSize: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#6a0dad',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  serviceCategory: {
    color: '#6a0dad',
    fontSize: 14,
    fontWeight: '600',
  },
  servicePrice: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  serviceDescription: {
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceImages: {
    marginBottom: 12,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceRating: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  serviceOrders: {
    color: '#666',
    fontSize: 12,
  },
  errorState: {
    alignItems: 'center',
    padding: 60,
  },
  errorText: {
    color: '#888',
    fontSize: 18,
    marginTop: 16,
  },
  contactButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#6a0dad',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6a0dad',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ArtistProfileScreen;
