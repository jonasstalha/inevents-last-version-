import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../src/firebase/artistServices';
import { fetchArtistById } from '../src/firebase/artistsService';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  bg: '#F7F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE9',
  border: '#E8E5DF',
  accent: '#1A0A2E',
  accentMid: '#3D1A6E',
  accentLight: '#EDE8F7',
  accentGlow: '#7C3AED',
  green: '#16A34A',
  yellow: '#F59E0B',
  text: '#111018',
  textMid: '#4B4860',
  textMuted: '#9590A8',
  radius: 16,
  radiusSm: 10,
  radiusXs: 6,
};

// ─── Service Card ─────────────────────────────────────────────────────────────
type ServiceCardProps = { service: any; onPress: (id: string) => void };

const ServiceCard = React.memo(({ service, onPress }: ServiceCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const imageUri =
    service.cover ||
    (Array.isArray(service.images) && service.images.length > 0 ? service.images[0] : null);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => onPress(service.id)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Top row */}
        <View style={styles.serviceTopRow}>
          <View style={styles.serviceTextGroup}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>
                {service.category || 'General'}
              </Text>
            </View>
            <Text style={styles.serviceTitle} numberOfLines={1}>
              {service.title || 'Untitled service'}
            </Text>
          </View>
          {service.basePrice != null && (
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>from</Text>
              <Text style={styles.priceValue}>${service.basePrice}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {service.description ? (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}

        {/* Image */}
        {imageUri ? (
          <View style={styles.serviceImageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.serviceImage} />
            {Array.isArray(service.images) && service.images.length > 1 && (
              <View style={styles.moreImagesBadge}>
                <Text style={styles.moreImagesText}>+{service.images.length - 1}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.serviceFooter}>
          <View style={styles.serviceMetaLeft}>
            <Ionicons name="star" size={13} color={T.yellow} />
            <Text style={styles.metaRating}>{service.rating || 'New'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaOrders}>{service.reviewCount || 0} reviews</Text>
          </View>
          <View style={styles.arrowChip}>
            <Ionicons name="arrow-forward" size={13} color={T.accentGlow} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ArtistProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const handleBackPress = useCallback(() => {
    if ((router as any).canGoBack?.()) { router.back(); return; }
    router.replace('/(client)');
  }, [router]);

  const handleEditProfile = useCallback(() => {
    router.push('/(artist)/settings');
  }, [router]);

  const handleServicePress = (serviceId: string) => {
    router.push(`/(client)/(hidden)/gig/${serviceId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const targetId = params.id ? (params.id as string) : currentUser?.uid;
      if (!targetId) { setLoading(false); return; }
      setIsOwnProfile(currentUser?.uid === targetId);
      try {
        const artist = await fetchArtistById(targetId);
        if (artist) {
          setArtistProfile({
            id: targetId,
            name: artist.name,
            avatar: artist.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name || 'A')}&background=EDE8F7&color=3D1A6E&bold=true`,
            description: artist.bio || '',
            rating: artist.rating || 0,
            location: artist.location || '',
            categories: artist.categories || [],
            specialization: artist.specialization || '',
          });
          setServices(await fetchServicesByArtistId(targetId));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]).start();
      }
    };
    fetchData();
  }, [params.id]);

  const renderServiceItem = useCallback(
    ({ item }: { item: any }) => <ServiceCard service={item} onPress={handleServicePress} />,
    [handleServicePress]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cube-outline" size={28} color={T.accentGlow} />
        </View>
        <Text style={styles.emptyTitle}>No services yet</Text>
        <Text style={styles.emptySubtitle}>
          {isOwnProfile ? 'Add your first service to get started' : 'Check back later'}
        </Text>
      </View>
    ),
    [isOwnProfile]
  );

  const renderHeader = useCallback(
    () => (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar + Name */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: artistProfile?.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.name}>{artistProfile?.name}</Text>
              {artistProfile?.specialization ? (
                <Text style={styles.specialization}>{artistProfile.specialization}</Text>
              ) : null}
              {artistProfile?.location ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color={T.textMuted} />
                  <Text style={styles.locationText}>{artistProfile.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {artistProfile?.rating ? artistProfile.rating.toFixed(1) : '—'}
              </Text>
              <View style={styles.statLabelRow}>
                <Ionicons name="star" size={11} color={T.yellow} />
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {services.reduce((acc, s) => acc + (s.reviewCount || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Bio */}
          {artistProfile?.description ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.bio}>{artistProfile.description}</Text>
            </>
          ) : null}

          {/* Categories */}
          {artistProfile?.categories?.length > 0 && (
            <>
              <View style={styles.divider} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsRow}
              >
                {artistProfile.categories.map((cat: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{cat}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isOwnProfile ? 'My Services' : 'Services'}
          </Text>
          <Text style={styles.sectionCount}>{services.length}</Text>
        </View>
      </Animated.View>
    ),
    [artistProfile, isOwnProfile, services, fadeAnim, slideAnim]
  );

  return (
    <View style={[styles.root, { paddingTop: 0 }]}>
      {/* Nav Bar */}
      <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={20} color={T.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profile</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={handleEditProfile} style={styles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="settings-outline" size={20} color={T.accent} />
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={T.accentGlow} />
          <Text style={styles.loaderText}>Loading profile…</Text>
        </View>
      ) : artistProfile ? (
        <FlatList
          data={services}
          keyExtractor={(item, i) => item.id || i.toString()}
          renderItem={renderServiceItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={6}
          removeClippedSubviews
        />
      ) : (
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="person-outline" size={32} color={T.accentGlow} />
          </View>
          <Text style={styles.notFoundTitle}>Profile not found</Text>
          <Text style={styles.notFoundSub}>This artist profile doesn't exist or was removed.</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },

  // Navbar
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    letterSpacing: 0.2,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
  },

  // Profile card
  profileCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  avatarRing: {
    borderRadius: 36,
    padding: 2,
    backgroundColor: T.accentLight,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.surfaceAlt,
  },
  avatarInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: T.text,
    letterSpacing: -0.4,
  },
  specialization: {
    fontSize: 13,
    fontWeight: '600',
    color: T.accentGlow,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: T.textMuted,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: T.text,
    letterSpacing: -0.5,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    fontSize: 11,
    color: T.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: T.border,
    marginVertical: 4,
  },

  // Bio
  bio: {
    fontSize: 14,
    color: T.textMid,
    lineHeight: 22,
    padding: 20,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  tag: {
    backgroundColor: T.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.accentGlow,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: T.textMuted,
    backgroundColor: T.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: T.border,
  },

  // Service card
  serviceCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 12,
    padding: 16,
  },
  serviceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  serviceTextGroup: {
    flex: 1,
    gap: 6,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: T.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: T.accentGlow,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    letterSpacing: -0.2,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: T.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: T.green,
    letterSpacing: -0.4,
  },
  serviceDescription: {
    fontSize: 13,
    color: T.textMid,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceImageWrapper: {
    borderRadius: T.radiusSm,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: 140,
    backgroundColor: T.surfaceAlt,
  },
  moreImagesBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaRating: {
    fontSize: 13,
    fontWeight: '700',
    color: T.text,
  },
  metaDot: {
    fontSize: 13,
    color: T.textMuted,
  },
  metaOrders: {
    fontSize: 13,
    color: T.textMuted,
  },
  arrowChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: T.textMuted,
    textAlign: 'center',
  },

  // Loader
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: T.textMuted,
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.text,
  },
  notFoundSub: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ArtistProfileScreen;