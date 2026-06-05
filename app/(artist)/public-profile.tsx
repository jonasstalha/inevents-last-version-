
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../../src/firebase/artistServices';
import { fetchArtistById } from '../../src/firebase/artistsService';

type ServiceCardProps = {
  service: any;
  isOwnProfile: boolean;
  onEdit: (serviceId: string) => void;
  onStats: (serviceId: string) => void;
  onViewDetails: (serviceId: string) => void;
};

const ServiceCard = React.memo(({ service, isOwnProfile, onEdit, onStats, onViewDetails }: ServiceCardProps) => {
  const imageUri = service.cover || (Array.isArray(service.images) && service.images.length > 0 ? service.images[0] : null);
  const remainingImages = Array.isArray(service.images) ? Math.max(0, service.images.length - (service.cover ? 0 : 1)) : 0;

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceCardHeader}>
        <View style={styles.serviceTitleGroup}>
          <Text style={styles.serviceTitle} numberOfLines={2}>{service.title || 'Untitled Service'}</Text>
          <Text style={styles.serviceCategory}>{service.category || 'Uncategorized'}</Text>
        </View>
        <View style={styles.serviceStatusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.serviceStatusText}>Active</Text>
        </View>
      </View>

      <Text style={styles.serviceDesc} numberOfLines={3}>{service.description || 'No description provided.'}</Text>
      {service.basePrice ? <Text style={styles.servicePrice}>Starting at ${service.basePrice}</Text> : null}

      <View style={styles.serviceStatsRow}>
        <View style={styles.serviceStatItem}>
          <Ionicons name="star" size={16} color="#ffc107" />
          <Text style={styles.serviceStatText}>{service.rating || 'No rating'}</Text>
        </View>
        <View style={styles.serviceStatItem}>
          <Ionicons name="eye" size={16} color="#999" />
          <Text style={styles.serviceStatText}>{service.reviewCount || 0} orders</Text>
        </View>
      </View>

      {imageUri ? (
        <View style={styles.imageRow}>
          <Image source={{ uri: imageUri }} style={styles.serviceImage} />
          {remainingImages > 0 ? (
            <View style={styles.moreImagesBadge}>
              <Text style={styles.moreImagesText}>+{remainingImages}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {isOwnProfile ? (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={styles.cardButtonPrimary} onPress={() => onEdit(service.id)}>
            <Text style={styles.cardButtonPrimaryText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardButtonSecondary} onPress={() => onStats(service.id)}>
            <Text style={styles.cardButtonSecondaryText}>Stats</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={styles.cardButtonSecondary} onPress={() => onViewDetails(service.id)}>
            <Text style={styles.cardButtonSecondaryText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => prevProps.service.id === nextProps.service.id && prevProps.isOwnProfile === nextProps.isOwnProfile);

const PublicProfile = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

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

      // Check if this is the current user's own profile
      const isOwn = !!(currentUser && currentUser.uid === targetArtistId);
      setIsOwnProfile(isOwn);
      
      setLoading(true);
      try {
        const artist = await fetchArtistById(targetArtistId);
        if (artist) {
          setArtistProfile({
            name: artist.name,
            avatar: artist.profileImage || 'https://ui-avatars.com/api/?name=Artist',
            description: artist.bio || '',
            rating: artist.rating || 0,
          });
          const gigs = await fetchServicesByArtistId(targetArtistId);
          setServices(gigs);
        }
      } catch (e) {
        console.error('Error fetching artist profile:', e);
        // fallback: keep null
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndServices();
  }, [params.id]);

  // Service management functions
  const handleEditService = (serviceId: string) => {
    // Navigate to artist dashboard with editing parameters
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { 
        tab: 'ticket',
        editMode: 'true',
        serviceId: serviceId 
      }
    });
  };

  const handleViewServiceStats = (serviceId: string) => {
    // Navigate to analytics tab with specific service
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { 
        tab: 'analytics',
        serviceId: serviceId 
      }
    });
  };

  const handleCreateNewService = () => {
    // Navigate to service creation (Add tab)
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { tab: 'ticket' }
    });
  };

  const handleManageAllServices = () => {
    // Navigate to orders/services management tab
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { tab: 'calendar' }
    });
  };

  const handleViewDetails = useCallback((serviceId: string) => {
    router.push(`/(client)/(hidden)/gig/${serviceId}`);
  }, [router]);

  const renderServiceItem = useCallback(({ item }: { item: any }) => (
    <ServiceCard
      service={item}
      isOwnProfile={isOwnProfile}
      onEdit={handleEditService}
      onStats={handleViewServiceStats}
      onViewDetails={handleViewDetails}
    />
  ), [handleEditService, handleViewDetails, handleViewServiceStats, isOwnProfile]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: artistProfile?.avatar }} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{artistProfile?.name}</Text>
        <Text style={styles.description}>{artistProfile?.description}</Text>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={styles.starText}>
              {artistProfile?.rating >= i + 1 ? '★' : artistProfile?.rating >= i + 0.5 ? '⯨' : '☆'}
            </Text>
          ))}
          <Text style={styles.ratingValue}>{artistProfile?.rating?.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isOwnProfile ? 'My Published Services' : 'Published Services'}
        </Text>
        {isOwnProfile && (
          <TouchableOpacity style={styles.manageButton} onPress={handleManageAllServices}>
            <Ionicons name="settings-outline" size={16} color="#fff" style={styles.manageIcon} />
            <Text style={styles.manageButtonText}>Manage All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="add-circle-outline" size={48} color="#ccc" style={styles.emptyIcon} />
      <Text style={styles.emptyText}>
        {isOwnProfile ? 'No services published yet.' : 'This artist has no published services yet.'}
      </Text>
      {isOwnProfile && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNewService}>
          <Text style={styles.createButtonText}>Create Your First Service</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}> 
        <View style={[styles.backButtonWrapper, { top: insets.top + 10 }]}>
          <Ionicons
            name="arrow-back"
            size={28}
            color="#6a0dad"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
        <ActivityIndicator size="large" color="#6a0dad" style={styles.loadingIndicator} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.backButtonWrapper, { top: insets.top + 10 }]}> 
        <Ionicons
          name="arrow-back"
          size={28}
          color="#6a0dad"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderServiceItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.listContent, services.length === 0 && styles.listEmptyContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {isOwnProfile && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateNewService}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 8,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#222',
  },
  title: {
    fontSize: 15,
    color: '#6a0dad',
    fontWeight: '600',
    marginTop: 2,
  },
  slogan: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  categoryBox: {
    backgroundColor: '#f7f3fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#6a0dad',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6a0dad',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
  },
  backButtonWrapper: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingIndicator: {
    marginTop: 60,
  },
  listContent: {
    paddingTop: 80,
    paddingHorizontal: 12,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerSection: {
    paddingBottom: 20,
  },
  profileHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 40,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#6a0dad',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#6a0dad',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingRow: {
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  starText: {
    fontSize: 18,
    color: '#FFD700',
    marginRight: 2,
  },
  ratingValue: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#6a0dad',
  },
  manageButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageIcon: {
    marginRight: 4,
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitleGroup: {
    flex: 1,
    paddingRight: 8,
  },
  serviceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  serviceCategory: {
    color: '#666',
    marginTop: 4,
  },
  serviceStatusBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceStatusText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 6,
    height: 6,
    backgroundColor: '#4caf50',
    borderRadius: 3,
    marginRight: 4,
  },
  servicePrice: {
    color: '#6a0dad',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  serviceStatsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  serviceStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceStatText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  moreImagesBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eef4ff',
  },
  moreImagesText: {
    color: '#6a0dad',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cardButtonPrimary: {
    flex: 1,
    backgroundColor: '#6a0dad',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cardButtonPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardButtonSecondary: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#6a0dad',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonSecondaryText: {
    color: '#6a0dad',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
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
  noProfileText: {
    marginTop: 60,
    textAlign: 'center',
    color: '#888',
  },
});

export default PublicProfile;
