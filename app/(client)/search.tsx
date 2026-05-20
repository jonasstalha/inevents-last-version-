import { faFacebook, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowRight,
  faAward,
  faBriefcase,
  faCamera,
  faCoffee,
  faFileText,
  faFilm,
  faFilter,
  faGift,
  faHeart,
  faMapPin,
  faMusic,
  faQuestionCircle,
  faSearch,
  faShare,
  faShield,
  faSmile,
  faStar,
  faTh,
  faUser,
  faUsers,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { captureRef } from 'react-native-view-shot';

import { ArtistCard } from '@/src/components/artist/ArtistCard';
import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';
import { fetchArtistsFromFirebase } from '@/src/firebase/artistsService';
import { fetchServicesWithPaginationFromFirebase } from '@/src/firebase/fetchServicesWithPagination';
import { Artist } from '@/src/models/types';
import { useMarketplaceStore } from '../../stores/useMarketplaceStore';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  icon: string;
}
interface FeaturedService {
  id: number;
  title: string;
  icon: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const INITIAL_PAGE_SIZE = 7;
const NEXT_PAGE_SIZE = 5;

const categories: Category[] = [
  { id: 'mariage', name: 'Mariage', icon: 'heart' },
  { id: 'anniversaire', name: 'Anniversaire', icon: 'gift' },
  { id: 'traiteur', name: 'Traiteur', icon: 'coffee' },
  { id: 'musique', name: 'Musique', icon: 'music' },
  { id: 'neggafa', name: 'Neggafa', icon: 'user' },
  { id: 'conference', name: 'Conference', icon: 'briefcase' },
  { id: 'evenement', name: "Evenement d'entreprise", icon: 'users' },
  { id: 'kermesse', name: 'Kermesse', icon: 'smile' },
  { id: 'henna', name: 'Henna', icon: 'award' },
  { id: 'photographie', name: 'Photographie', icon: 'camera' },
  { id: 'animation', name: 'Animation', icon: 'film' },
  { id: 'decoration', name: 'Decoration', icon: 'award' },
  { id: 'buffet', name: 'Buffet', icon: 'coffee' },
];

const CARD_ACCENT_COLORS = [
  '#4f46e5',
  '#059669',
  '#d946ef',
  '#0ea5e9',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const getIconByName = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    heart: faHeart,
    gift: faGift,
    coffee: faCoffee,
    music: faMusic,
    user: faUser,
    briefcase: faBriefcase,
    users: faUsers,
    smile: faSmile,
    award: faAward,
    camera: faCamera,
    film: faFilm,
    grid: faTh,
    shield: faShield,
    'help-circle': faQuestionCircle,
    'file-text': faFileText,
  };
  return iconMap[iconName] || faHeart;
};

// ─── Transform helper ────────────────────────────────────────────────────────
const transformGigData = (gig: any) => {
  const totalRating = gig.totalRating || 0;
  const totalRaters = gig.totalRaters || 0;
  const rating = totalRaters > 0 ? totalRating / totalRaters : 0;
  return {
    id: gig.id,
    title: gig.title,
    description: gig.description || gig.location || '',
    image:
      gig.cover ||
      gig.image ||
      (Array.isArray(gig.images) && gig.images.length > 0
        ? gig.images[0]
        : null),
    category: gig.category || '',
    providerName:
      gig.artistName || gig.userName || gig.providerName || 'Service Provider',
    city: gig.city || gig.location || '',
    location: gig.location || gig.city || '',
    basePrice: gig.basePrice || gig.price || 500,
    rating,
    totalRating,
    totalRaters,
    ordersCount: gig.ordersCount || 0,
  };
};

// ─── Skeleton Card ──────────────────────────────────────────────────────────
const SkeletonCard = React.memo(() => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });
  return (
    <View style={skeletonStyles.card}>
      <Animated.View style={[skeletonStyles.image, { opacity }]} />
      <View style={skeletonStyles.body}>
        <Animated.View style={[skeletonStyles.line, skeletonStyles.lineTitle, { opacity }]} />
        <Animated.View style={[skeletonStyles.line, skeletonStyles.lineMid, { opacity }]} />
        <Animated.View style={[skeletonStyles.line, skeletonStyles.lineShort, { opacity }]} />
        <View style={skeletonStyles.footer}>
          <Animated.View style={[skeletonStyles.badge, { opacity }]} />
          <Animated.View style={[skeletonStyles.btn, { opacity }]} />
        </View>
      </View>
    </View>
  );
});

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  image: { width: '100%', height: 140, backgroundColor: '#e2e8f0' },
  body: { padding: 16 },
  line: { borderRadius: 6, backgroundColor: '#e2e8f0', marginBottom: 10 },
  lineTitle: { height: 18, width: '75%' },
  lineMid: { height: 13, width: '90%' },
  lineShort: { height: 13, width: '55%' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    height: 28,
    width: 80,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  btn: {
    height: 34,
    width: 110,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
});

// ─── Service Card ────────────────────────────────────────────────────────────
interface ServiceCardProps {
  service: ReturnType<typeof transformGigData>;
  onPress: () => void;
  onShare: () => void;
  index: number;
}

const ServiceCard = React.memo(
  ({ service, onPress, onShare, index }: ServiceCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const accentColor = CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length];
    const totalRaters = service.totalRaters || 0;
    const ratingText =
      totalRaters > 0
        ? (service.totalRating / totalRaters).toFixed(1)
        : 'New';
    const ordersCount = service.ordersCount || 0;

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }, [scaleAnim]);

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Image / Cover */}
          <View
            style={[
              styles.serviceImageContainer,
              { backgroundColor: accentColor },
            ]}
          >
            {service.image &&
            typeof service.image === 'string' &&
            service.image.startsWith('http') ? (
              <Image
                source={{ uri: service.image }}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.serviceImagePlaceholder}>
                <FontAwesomeIcon
                  icon={faBriefcase}
                  size={40}
                  color="rgba(255,255,255,0.45)"
                />
              </View>
            )}
            {/* Dark gradient overlay on image */}
            <View style={styles.imageGradientOverlay} />

            {/* Category badge top-left */}
            {service.category ? (
              <View
                style={[styles.categoryBadge, { backgroundColor: accentColor }]}
              >
                <Text style={styles.categoryBadgeText}>
                  {service.category}
                </Text>
              </View>
            ) : null}

            {/* Price badge top-right */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>
                {service.basePrice} MAD
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle} numberOfLines={1}>
              {service.title || 'Service disponible'}
            </Text>

            {service.city ? (
              <View style={styles.locationRow}>
                <FontAwesomeIcon
                  icon={faMapPin}
                  size={11}
                  color="#94a3b8"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {service.city}
                </Text>
              </View>
            ) : null}

            <Text style={styles.serviceDescription} numberOfLines={2}>
              {service.description || 'Contactez ce prestataire pour en savoir plus.'}
            </Text>

            {/* Footer row */}
            <View style={styles.cardFooter}>
              {/* Rating pill */}
              <View style={styles.ratingPill}>
                <FontAwesomeIcon
                  icon={faStar}
                  size={11}
                  color="#f59e0b"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.ratingPillText}>{ratingText}</Text>
                {ordersCount > 0 ? (
                  <Text style={styles.ordersText}> · {ordersCount} cmd</Text>
                ) : null}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.shareIconBtn}
                  onPress={onShare}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <FontAwesomeIcon
                    icon={faShare}
                    size={14}
                    color="#64748b"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewButton, { backgroundColor: accentColor }]}
                  onPress={onPress}
                >
                  <Text style={styles.viewButtonText}>Voir</Text>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    size={12}
                    color="#fff"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

// ─── Story Image Template ────────────────────────────────────────────────────
const StoryImageTemplate = React.memo(
  ({
    service,
    storyRef,
  }: {
    service: any;
    storyRef: React.RefObject<View>;
  }) => {
    const totalRating = service.totalRating || 0;
    const totalRaters = service.totalRaters || 0;
    const rating =
      totalRaters > 0
        ? (totalRating / totalRaters).toFixed(1)
        : 'N/A';
    const price = service.basePrice || service.price || 500;
    const category = service.category || 'Service';
    const providerName =
      service.providerName || service.artistName || 'Service Provider';
    const serviceLocation = service.city || service.location || '';
    const initials = providerName
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();

    return (
      <View
        ref={storyRef}
        style={storyStyles.canvas}
        collapsable={false}
      >
        {/* Background */}
        <View style={storyStyles.bg} />

        {/* Decorative orbs */}
        <View style={[storyStyles.orb, storyStyles.orbTopLeft]} />
        <View style={[storyStyles.orb, storyStyles.orbTopRight]} />
        <View style={[storyStyles.orb, storyStyles.orbBottom]} />

        {/* Diagonal accent stripe */}
        <View style={storyStyles.diagonalStripe} />

        {/* Cover image */}
        <View style={storyStyles.coverWrapper}>
          {service.image || service.cover ? (
            <Image
              source={{ uri: service.image || service.cover }}
              style={storyStyles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[storyStyles.coverImage, { backgroundColor: '#4f46e5' }]}
            />
          )}
          <View style={storyStyles.coverBottomFade} />
        </View>

        {/* Content area */}
        <View style={storyStyles.content}>
          {/* Provider row */}
          <View style={storyStyles.providerRow}>
            <View style={storyStyles.avatarCircle}>
              <Text style={storyStyles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={storyStyles.providerName} numberOfLines={1}>
                {providerName}
              </Text>
              {serviceLocation ? (
                <Text style={storyStyles.providerLocation} numberOfLines={1}>
                  📍 {serviceLocation}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Category pill */}
          <View style={storyStyles.catPill}>
            <Text style={storyStyles.catText}>{category.toUpperCase()}</Text>
          </View>

          {/* Title */}
          <Text style={storyStyles.title} numberOfLines={2}>
            {service.title || 'Service Exceptionnel'}
          </Text>

          {/* Description */}
          <Text style={storyStyles.desc} numberOfLines={3}>
            {service.description ||
              'Découvrez ce service unique et contactez le prestataire dès maintenant.'}
          </Text>

          {/* Metrics row */}
          <View style={storyStyles.metricsRow}>
            <View style={storyStyles.priceChip}>
              <Text style={storyStyles.priceLabel}>À PARTIR DE</Text>
              <Text style={storyStyles.priceValue}>{price} MAD</Text>
            </View>
            <View style={storyStyles.ratingChip}>
              <Text style={storyStyles.ratingIcon}>★</Text>
              <Text style={storyStyles.ratingValue}>{rating}</Text>
              <Text style={storyStyles.ratingCount}>({totalRaters})</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={storyStyles.divider} />

          {/* CTA */}
          <View style={storyStyles.ctaRow}>
            <View style={storyStyles.ctaBtn}>
              <Text style={storyStyles.ctaText}>Réserver Maintenant →</Text>
            </View>
          </View>
        </View>

        {/* Footer branding */}
        <View style={storyStyles.footer}>
          <View style={storyStyles.footerDot} />
          <Text style={storyStyles.footerBrand}>InEvent</Text>
          <View style={storyStyles.footerDot} />
        </View>
      </View>
    );
  }
);

const storyStyles = StyleSheet.create({
  canvas: {
    width: 1080,
    height: 1920,
    backgroundColor: '#0a0f1e',
    overflow: 'hidden',
    position: 'relative',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0f1e',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopLeft: {
    width: 600,
    height: 600,
    top: -200,
    left: -200,
    backgroundColor: 'rgba(79,70,229,0.18)',
  },
  orbTopRight: {
    width: 400,
    height: 400,
    top: 100,
    right: -150,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  orbBottom: {
    width: 500,
    height: 500,
    bottom: 100,
    left: -100,
    backgroundColor: 'rgba(217,70,239,0.1)',
  },
  diagonalStripe: {
    position: 'absolute',
    width: 1400,
    height: 3,
    backgroundColor: 'rgba(79,70,229,0.3)',
    top: 680,
    left: -150,
    transform: [{ rotate: '-8deg' }],
  },
  coverWrapper: {
    width: '100%',
    height: 640,
    position: 'relative',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(10,15,30,0.75)',
  },
  content: {
    paddingHorizontal: 72,
    paddingTop: 52,
    flex: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    gap: 24,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  providerName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  providerLocation: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
  },
  catPill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(79,70,229,0.7)',
    backgroundColor: 'rgba(79,70,229,0.18)',
    borderRadius: 99,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 28,
  },
  catText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#a5b4fc',
    letterSpacing: 3,
  },
  title: {
    fontSize: 54,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 64,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 30,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 44,
    marginBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  priceChip: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingHorizontal: 36,
    paddingVertical: 20,
    flex: 1,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 20,
    gap: 10,
  },
  ratingIcon: {
    fontSize: 30,
    color: '#fbbf24',
  },
  ratingValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fbbf24',
  },
  ratingCount: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 40,
  },
  ctaRow: {
    alignItems: 'flex-start',
  },
  ctaBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 56,
  },
  ctaText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(79,70,229,0.6)',
  },
  footerBrand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 4,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const { saveArtist, unsaveArtist, isArtistSaved } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setServices } = useMarketplaceStore();

  // Artists state
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);

  // Services state
  const [services, setLocalServices] = useState<any[]>([]);

  // Pagination refs — never cause re-renders
  const lastDocRef = useRef<any>(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const prefetchLock = useRef(false);

  // Pagination visible state (only used for footer/UI)
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreDisplay, setHasMoreDisplay] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('services');
  const [filteredGigs, setFilteredGigs] = useState<any[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedCity, setSelectedCity] = useState('');

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedServiceForShare, setSelectedServiceForShare] =
    useState<any>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const storyTemplateRef = useRef<View>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Build filter object ───────────────────────────────────────────────────
  const activeFilters = useMemo(
    () => ({
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      region: selectedCity || undefined,
      category:
        selectedCategory !== 'All' ? selectedCategory : undefined,
    }),
    [priceMin, priceMax, minRating, selectedCity, selectedCategory]
  );

  // ── Fetch artists once ────────────────────────────────────────────────────
  useEffect(() => {
    setArtistsLoading(true);
    fetchArtistsFromFirebase()
      .then(setArtists)
      .catch(() => setArtists([]))
      .finally(() => setArtistsLoading(false));
  }, []);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const result = await fetchServicesWithPaginationFromFirebase(
          INITIAL_PAGE_SIZE,
          null,
          activeFilters
        );
        lastDocRef.current = result.lastDoc;
        hasMoreRef.current = result.hasMore;
        setHasMoreDisplay(result.hasMore);
        setLocalServices(result.services);
        setServices(result.services);
      } catch (e) {
        console.error('Init fetch error:', e);
        hasMoreRef.current = false;
        setHasMoreDisplay(false);
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // Only re-run when filters actually change
  }, [activeFilters]);

  // ── Filter side-effect on artists + gigs ─────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Artist filtering (client-side)
      let artistResults = [...artists];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        artistResults = artistResults.filter(
          a =>
            (a.name && a.name.toLowerCase().includes(q)) ||
            (a.bio && a.bio.toLowerCase().includes(q))
        );
      } else if (selectedCategory !== 'All') {
        artistResults = artistResults.filter(a =>
          a.categories?.some(
            c => c.toLowerCase() === selectedCategory.toLowerCase()
          )
        );
      }
      setFilteredArtists(artistResults);
      setFilteredGigs(services);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, artists, services]);

  // ── Load more (used by both prefetch + onEndReached) ────────────────────
  const loadMore = useCallback(async () => {
    if (
      loadingMoreRef.current ||
      !hasMoreRef.current ||
      !lastDocRef.current
    )
      return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const result = await fetchServicesWithPaginationFromFirebase(
        NEXT_PAGE_SIZE,
        lastDocRef.current,
        activeFilters
      );

      if (result.services.length > 0) {
        lastDocRef.current = result.lastDoc;
        hasMoreRef.current = result.hasMore;
        setHasMoreDisplay(result.hasMore);
        setLocalServices(prev => {
          const merged = [...prev, ...result.services];
          setServices(merged);
          return merged;
        });
      } else {
        hasMoreRef.current = false;
        setHasMoreDisplay(false);
      }
    } catch (e) {
      console.error('Load more error:', e);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [activeFilters, setServices]);

  // ── Scroll handler with 50% prefetch ────────────────────────────────────
  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: false,
          listener: (event: any) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            if (!contentSize.height) return;
            const pct =
              (contentOffset.y + layoutMeasurement.height) /
              contentSize.height;
            if (
              pct > 0.5 &&
              !prefetchLock.current &&
              hasMoreRef.current &&
              !loadingMoreRef.current
            ) {
              prefetchLock.current = true;
              loadMore().finally(() => {
                setTimeout(() => {
                  prefetchLock.current = false;
                }, 1000);
              });
            }
          },
        }
      ),
    [loadMore, scrollY]
  );

  // ── Pull to refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadingMoreRef.current = false;
    prefetchLock.current = false;
    try {
      const result = await fetchServicesWithPaginationFromFirebase(
        INITIAL_PAGE_SIZE,
        null,
        activeFilters
      );
      lastDocRef.current = result.lastDoc;
      hasMoreRef.current = result.hasMore;
      setHasMoreDisplay(result.hasMore);
      setLocalServices(result.services);
      setServices(result.services);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [activeFilters, setServices]);

  // ── URL params ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (params.query) {
      setSearchInput(params.query as string);
      setSearchQuery(params.query as string);
    }
    if (params.category) {
      setSelectedCategory(params.category as string);
    }
  }, [params]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
    router.setParams({
      query: searchInput || undefined,
      category:
        selectedCategory !== 'All' ? selectedCategory : undefined,
    });
  }, [searchInput, selectedCategory, router]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    router.setParams({ query: undefined });
  }, [router]);

  const handleArtistPress = useCallback(
    (artistId: string) => router.push(`/artist-profile?id=${artistId}`),
    [router]
  );

  const handleGigPress = useCallback(
    (gigId: string) =>
      router.push(`/(client)/(hidden)/gig/${gigId}`),
    [router]
  );

  const handleSaveArtist = useCallback(
    (artistId: string) => {
      if (!user) {
        Alert.alert(
          'Login Required',
          'You need to be logged in to save artists. Would you like to log in now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/auth') },
          ]
        );
        return;
      }
      
      if (isArtistSaved(artistId)) unsaveArtist(artistId);
      else saveArtist(artistId);
    },
    [isArtistSaved, saveArtist, unsaveArtist, user, router]
  );

  const handleShareService = useCallback((service: any) => {
    setSelectedServiceForShare(service);
    setShowShareModal(true);
  }, []);

  const applyFilters = useCallback(() => {
    setShowFilterModal(false);
    setSearchQuery(searchInput);
  }, [searchInput]);

  const handleClearFilters = useCallback(() => {
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setSelectedCity('');
    setSelectedCategory('All');
    setShowFilterModal(false);
  }, []);

  // ── Share helpers ─────────────────────────────────────────────────────────
  const generateStoryUri = async (): Promise<string | null> => {
    if (!storyTemplateRef.current || !selectedServiceForShare) return null;
    setIsGeneratingImage(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const uri = await captureRef(storyTemplateRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      return uri;
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de générer l\'image.');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    setSelectedServiceForShare(null);
  }, []);

  const shareToInstagram = async () => {
    const uri = await generateStoryUri();
    if (!uri) return;
    try {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Ajouter à la Story Instagram',
      });
      closeShareModal();
    } catch {}
  };

  const shareToFacebook = async () => {
    const uri = await generateStoryUri();
    if (!uri) return;
    try {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Ajouter à la Story Facebook',
      });
      closeShareModal();
    } catch {}
  };

  const shareToWhatsApp = async () => {
    const uri = await generateStoryUri();
    if (!uri) return;
    try {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager via WhatsApp',
      });
      closeShareModal();
    } catch {}
  };

  const copyLink = async () => {
    if (!selectedServiceForShare) return;
    try {
      const url = Linking.createURL(
        `/(client)/(hidden)/gig/${selectedServiceForShare.id}`
      );
      await Share.share({
        message: url,
        title: selectedServiceForShare.title,
      });
      closeShareModal();
    } catch {
      Alert.alert('Erreur', 'Impossible de copier le lien.');
    }
  };

  // ── Memoized renderItem ───────────────────────────────────────────────────
  const renderServiceItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <Animatable.View
        animation="fadeInUp"
        duration={350}
        delay={index < 7 ? index * 60 : 0}
        useNativeDriver
      >
        <ServiceCard
          service={transformGigData(item)}
          onPress={() => handleGigPress(item.id)}
          onShare={() => handleShareService(transformGigData(item))}
          index={index}
        />
      </Animatable.View>
    ),
    [handleGigPress, handleShareService]
  );

  const renderArtistItem = useCallback(
    ({ item }: { item: Artist }) => (
      <Animatable.View animation="fadeInUp" duration={350} useNativeDriver>
        <ArtistCard
          artist={item}
          onPress={handleArtistPress}
          onSave={handleSaveArtist}
          isSaved={isArtistSaved(item.id)}
        />
      </Animatable.View>
    ),
    [handleArtistPress, handleSaveArtist, isArtistSaved]
  );

  const keyExtractorService = useCallback(
    (item: any) => `svc-${item.userId || 'u'}-${item.id}`,
    []
  );

  const keyExtractorArtist = useCallback(
    (item: Artist) => `art-${item.id}`,
    []
  );

  const ListFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        </View>
      );
    }
    if (!hasMoreDisplay && filteredGigs.length > 0) {
      return (
        <View style={styles.listEndContainer}>
          <View style={styles.listEndLine} />
          <Text style={styles.listEndText}>Fin des résultats</Text>
          <View style={styles.listEndLine} />
        </View>
      );
    }
    return null;
  }, [loadingMore, hasMoreDisplay, filteredGigs.length]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Subtle background decoration */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      {/* Search Row */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBarContainer}>
          <FontAwesomeIcon
            icon={faSearch}
            size={17}
            color="#94a3b8"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher services, prestataires..."
            placeholderTextColor="#94a3b8"
            value={searchInput}
            onChangeText={text => {
              setSearchInput(text);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput ? (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesomeIcon icon={faXmark} size={15} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            (priceMin || priceMax || minRating > 0 || selectedCity) &&
              styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <FontAwesomeIcon
            icon={faFilter}
            size={17}
            color={
              priceMin || priceMax || minRating > 0 || selectedCity
                ? '#ffffff'
                : Theme.colors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'All' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'All' && styles.categoryChipTextActive,
              ]}
            >
              Tout
            </Text>
          </TouchableOpacity>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <FontAwesomeIcon
                  icon={getIconByName(cat.icon)}
                  size={13}
                  color={isSelected ? '#ffffff' : '#64748b'}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'services' && styles.activeTabText,
            ]}
          >
            Services
            <Text style={styles.tabCount}> {filteredGigs.length}</Text>
          </Text>
        </TouchableOpacity>
        <View style={styles.tabSpacer} />
        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.activeTab]}
          onPress={() => setActiveTab('artists')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'artists' && styles.activeTabText,
            ]}
          >
            Prestataires
            <Text style={styles.tabCount}> {filteredArtists.length}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lists */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : activeTab === 'services' ? (
        <View style={styles.listContainer}>
          {filteredGigs.length > 0 ? (
            <FlatList
              data={filteredGigs}
              keyExtractor={keyExtractorService}
              renderItem={renderServiceItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              removeClippedSubviews
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={40}
              initialNumToRender={7}
              windowSize={7}
              ListFooterComponent={ListFooter}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Theme.colors.primary}
                  colors={[Theme.colors.primary]}
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Animatable.View animation="fadeInUp" duration={400}>
                <View style={styles.emptyIconWrap}>
                  <FontAwesomeIcon
                    icon={faSearch}
                    size={28}
                    color="#c4c4c6"
                  />
                </View>
                <Text style={styles.emptyTitle}>Aucun service trouvé</Text>
                <Text style={styles.emptyText}>
                  Essayez d'ajuster vos filtres ou votre recherche.
                </Text>
              </Animatable.View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredArtists.length > 0 ? (
            <FlatList
              data={filteredArtists}
              keyExtractor={keyExtractorArtist}
              renderItem={renderArtistItem}
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
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Animatable.View animation="fadeInUp" duration={400}>
                <View style={styles.emptyIconWrap}>
                  <FontAwesomeIcon icon={faUser} size={28} color="#c4c4c6" />
                </View>
                <Text style={styles.emptyTitle}>Aucun prestataire trouvé</Text>
                <Text style={styles.emptyText}>
                  Essayez d'ajuster vos filtres ou votre recherche.
                </Text>
              </Animatable.View>
            </View>
          )}
        </View>
      )}

      {/* ── Filter Modal ──────────────────────────────────────────────────── */}
      {showFilterModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHandle} />
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <View style={styles.modalCloseBtn}>
                  <FontAwesomeIcon icon={faXmark} size={18} color="#475569" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Fourchette de prix (MAD)</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={priceMin}
                onChangeText={setPriceMin}
              />
              <View style={styles.priceDivider}>
                <Text style={styles.priceSeparator}>–</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={priceMax}
                onChangeText={setPriceMax}
              />
            </View>

            <Text style={styles.filterLabel}>Note minimale</Text>
            <View style={styles.ratingOptions}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() =>
                    setMinRating(r => (r === star ? 0 : star))
                  }
                  style={styles.ratingStar}
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    size={28}
                    color={star === minRating ? '#f59e0b' : '#e2e8f0'}
                  />
                </TouchableOpacity>
              ))}
              {minRating > 0 && (
                <Text style={styles.ratingLabel}>{minRating}★</Text>
              )}
            </View>

            <Text style={styles.filterLabel}>Région</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cityScroll}
            >
              {[
                'Tanger-Tétouan-Al Hoceïma',
                "L'Oriental",
                'Fès-Meknès',
                'Rabat-Salé-Kénitra',
                'Béni Mellal-Khénifra',
                'Casablanca-Settat',
                'Marrakech-Safi',
                'Drâa-Tafilalet',
                'Souss-Massa',
                'Guelmim-Oued Noun',
                'Laâyoune-Sakia El Hamra',
                'Dakhla-Oued Ed-Dahab',
              ].map(region => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.cityChip,
                    selectedCity === region && styles.cityChipActive,
                  ]}
                  onPress={() =>
                    setSelectedCity(c => (c === region ? '' : region))
                  }
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      selectedCity === region && styles.cityChipTextActive,
                    ]}
                  >
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyFilterText}>Appliquer les filtres</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearFilterText}>Tout effacer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Share Modal ───────────────────────────────────────────────────── */}
      {showShareModal && selectedServiceForShare && (
        <Animatable.View
          animation="fadeIn"
          duration={250}
          style={styles.modalBackdrop}
        >
          <Animatable.View
            animation="slideInUp"
            duration={350}
            style={styles.shareModalContent}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Header */}
              <View style={styles.filterModalHandle} />
              <View style={styles.filterModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.shareModalIconBg}>
                    <FontAwesomeIcon
                      icon={faShare}
                      size={16}
                      color={Theme.colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.filterModalTitle}>Partager</Text>
                    <Text style={styles.shareModalSubtitle}>
                      Partagez ce service avec vos proches
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={closeShareModal}
                >
                  <FontAwesomeIcon icon={faXmark} size={18} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Share options */}
              <Text style={styles.shareOptionsLabel}>Partager vers</Text>
              <View style={styles.shareOptions}>
                {[
                  {
                    label: 'Facebook',
                    icon: faFacebook,
                    color: '#1877F2',
                    onPress: shareToFacebook,
                  },
                  {
                    label: 'Instagram',
                    icon: faInstagram,
                    color: '#E4405F',
                    onPress: shareToInstagram,
                  },
                  {
                    label: 'WhatsApp',
                    icon: faWhatsapp,
                    color: '#25D366',
                    onPress: shareToWhatsApp,
                  },
                  {
                    label: 'Copier lien',
                    icon: faShare,
                    color: '#475569',
                    onPress: copyLink,
                  },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    style={styles.shareOption}
                    onPress={opt.onPress}
                    disabled={isGeneratingImage}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.shareIconCircle,
                        { backgroundColor: opt.color },
                      ]}
                    >
                      <FontAwesomeIcon
                        icon={opt.icon}
                        size={24}
                        color="#fff"
                      />
                    </View>
                    <Text style={styles.shareOptionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Story preview */}
              <View style={styles.previewWrapper}>
                <Text style={styles.shareOptionsLabel}>Aperçu story</Text>
                <View style={styles.storyPreviewOuter}>
                  <View style={styles.storyPreviewScaled}>
                    <StoryImageTemplate
                      service={selectedServiceForShare}
                      storyRef={storyTemplateRef}
                    />
                  </View>
                  {isGeneratingImage && (
                    <View style={styles.previewGenOverlay}>
                      <ActivityIndicator
                        size="large"
                        color="#ffffff"
                      />
                      <Text style={styles.previewGenText}>
                        Génération en cours...
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </Animatable.View>
        </Animatable.View>
      )}

      {/* Offscreen capture container */}
      {showShareModal && selectedServiceForShare && (
        <View style={styles.offscreenCapture} pointerEvents="none">
          <StoryImageTemplate
            service={selectedServiceForShare}
            storyRef={storyTemplateRef}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // Background decoration
  bgDecor1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(79,70,229,0.045)',
    top: -80,
    right: -80,
    zIndex: 0,
  },
  bgDecor2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16,185,129,0.04)',
    bottom: 200,
    left: -60,
    zIndex: 0,
  },

  // Search Row
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 2,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: 'transparent',
  },
  clearButton: { padding: 2 },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },

  // Categories
  categoryContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 10,
    zIndex: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  categoryChipTextActive: { color: '#ffffff' },
  categoryIcon: { marginRight: 5 },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 2,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: Theme.colors.primary },
  tabSpacer: { flex: 1 },
  tabText: { fontSize: 14, fontWeight: '500', color: '#94a3b8' },
  activeTabText: { color: Theme.colors.primary, fontWeight: '700' },
  tabCount: { fontSize: 12, fontWeight: '400' },

  // Lists
  listContainer: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 110 },

  // Service Card
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
  },
  serviceImageContainer: {
    width: '100%',
    height: 148,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  priceBadgeText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  serviceContent: { padding: 14 },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: { fontSize: 12, color: '#94a3b8' },
  serviceDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingPillText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  ordersText: { fontSize: 11, color: '#b45309' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 34,
  },
  viewButtonText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
  },

  // List end
  listEndContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  listEndLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  listEndText: { fontSize: 12, color: '#cbd5e1', letterSpacing: 1 },

  // Modal shared
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  filterModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
    maxHeight: '90%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 18,
  },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceDivider: {
    width: 24,
    alignItems: 'center',
  },
  priceSeparator: { fontSize: 16, color: '#94a3b8' },
  ratingOptions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStar: { padding: 2 },
  ratingLabel: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 8,
  },
  cityScroll: { marginBottom: 4 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  cityChipText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  cityChipTextActive: { color: '#ffffff' },
  applyFilterButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  applyFilterText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  clearFilterButton: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  clearFilterText: { fontSize: 14, fontWeight: '500', color: '#94a3b8' },

  // Share Modal
  shareModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
    maxHeight: '92%',
  },
  shareModalIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79,70,229,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModalSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  shareOptionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  shareOption: { alignItems: 'center', width: 72 },
  shareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  shareOptionText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  previewWrapper: { marginBottom: 16 },
  storyPreviewOuter: {
    width: 180,
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: '#0a0f1e',
    position: 'relative',
  },
  storyPreviewScaled: {
    width: 1080,
    height: 1920,
    transform: [{ scale: 180 / 1080 }],
    transformOrigin: 'top left',
  },
  previewGenOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  previewGenText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },

  // Offscreen capture
  offscreenCapture: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 1080,
    height: 1920,
  },
});