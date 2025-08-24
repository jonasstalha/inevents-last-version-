import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { dummyTickets } from './tickets';
// Update the import path below to the correct location of your api file
// Example: If api.ts is in app/src/api.ts, use '../src/api'
import { fetchArtists } from '../../src/api';
import { fetchAllServices, fetchAllTickets } from '../../src/firebase/clientTicketsService';
import { useMarketplaceStore } from '../../stores/useMarketplaceStore';

const { width, height } = Dimensions.get('window');

interface Event {
  id: number;
  name: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image: string;
  price: string;
}

// 1. Fix Service type to allow optional image
interface Service {
  id: string | number;
  title: string;
  available: string;
  location: string;
  reviews: string;
  orders: string;
  price: string;
  rating?: number | string;
  image?: string;
}

interface Artist {
  id: number;
  name: string;
  description: string;
  specialty: string;
  rating: number;
  image: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface NavigationItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colors: [string, string];
  onPress: () => void;
  badge?: boolean;
}

interface FeaturedService {
  id: number;
  title: string;
  icon: string;
}

const cardGradients: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3']
];

const categories = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'wedding', name: 'Wedding', icon: 'heart' },
  { id: 'conference', name: 'Conference', icon: 'briefcase' },
  { id: 'photography', name: 'Photography', icon: 'camera' },
  { id: 'kids', name: 'Kids', icon: 'smile' },
  { id: 'music', name: 'Music', icon: 'music' },
  { id: 'mariage', name: 'Mariage', icon: 'heart' },
  { id: 'anniversaire', name: 'Anniversaire', icon: 'gift' },
  { id: 'traiteur', name: 'Traiteur', icon: 'coffee' },
  { id: 'musique', name: 'Musique', icon: 'music' },
  { id: 'neggafa', name: 'Neggafa', icon: 'user' },
  { id: 'conference', name: 'Conference', icon: 'briefcase' },
  { id: 'evenement', name: "Evenement d'entreprise", icon: 'users' },
  { id: 'kermesse', name: 'Kermesse', icon: 'smile' },
  { id: 'henna', name: 'Henna', icon: 'award' }, // 'leaf' replaced with 'award'
  { id: 'photographie', name: 'Photographie', icon: 'camera' },
  { id: 'animation', name: 'Animation', icon: 'film' },
  { id: 'decoration', name: 'Decoration', icon: 'award' },
  { id: 'buffet', name: 'Buffet', icon: 'coffee' },
];

const dummyEvents = [
  {
    id: 1,
    name: 'Summer Wedding Expo',
    description: 'Discover the latest wedding trends and connect with top vendors',
    category: 'Wedding',
    date: 'May 25, 2025',
    location: 'Grand Hall',
    image: 'https://via.placeholder.com/300',
    price: '$45'
  },
  {
    id: 2,
    name: 'Tech Conference 2025',
    description: 'The biggest tech event of the year with industry leaders',
    category: 'Conference',
    date: 'May 30, 2025',
    location: 'Convention Center',
    image: 'https://via.placeholder.com/300',
    price: '$120'
  },
  {
    id: 3,
    name: 'Portrait Photography Masterclass',
    description: 'Learn from the best photographers in the industry',
    category: 'Photography',
    date: 'June 5, 2025',
    location: 'Art Studio',
    image: 'https://via.placeholder.com/300',
    price: '$85'
  }
];

export default function EventApp() {
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSection, setActiveSection] = useState('events');
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [popupContent, setPopupContent] = useState<'features' | 'services' | 'events' | 'artists' | 'tickets'>('features');
  const [searchQuery, setSearchQuery] = useState('');
  const [events] = useState(dummyEvents);

  const artists = [
    {
      id: 1,
      name: 'Alex Morgan',
      description: 'Professional wedding & event photographer with 8+ years experience',
      specialty: 'Photography',
      rating: 4.8,
      image: 'https://via.placeholder.com/300'
    },
    {
      id: 2,
      name: 'DJ Maximus',
      description: 'Top-rated DJ specializing in weddings and corporate events',
      specialty: 'Music',
      rating: 4.9,
      image: 'https://via.placeholder.com/300'
    },
    {
      id: 3,
      name: 'Creative Caterers',
      description: 'Award-winning catering service with gourmet cuisine',
      specialty: 'Catering',
      rating: 4.7,
      image: 'https://via.placeholder.com/300'
    }
  ];

  const [realArtists, setRealArtists] = useState<Artist[]>([]);
  const [realTickets, setRealTickets] = useState<any[]>([]);
  const [realServices, setRealServices] = useState<Service[]>([]);
  
  // Use Zustand global store:
  const { services } = useMarketplaceStore();
  
  // Animated values
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const [animatedValues] = useState(() => ({
    scale: new Animated.Value(1),
    press: new Animated.Value(1),
    navigation: new Animated.Value(0),
    cards: Array(5).fill(0).map(() => new Animated.Value(0)),
    wiggle: new Animated.Value(0),
    pulse: new Animated.Value(1),
  }));

  // Define functions first before using them in useMemo
  const handleShowPopup = (content: 'features' | 'services' | 'events' | 'artists' | 'tickets') => {
    setPopupContent(content);
    setPopupVisible(true);
  };

  const handleSectionChange = (sectionName: string) => {
    setActiveSection(sectionName);
  };

    // For top-rated services: prefer real services fetched from Firebase, fall back to store
    const topRatedServices = useMemo(() => {
      const source = (realServices && realServices.length > 0) ? realServices : services;
      return source
        .filter(s => {
          const rating = typeof (s as any).rating === 'number'
            ? (s as any).rating
            : ((s as any).reviews ? parseFloat((s as any).reviews as any) : NaN);
          return !isNaN(rating) && rating >= 4.5;
        })
        .sort((a, b) => {
          const ra = typeof (a as any).rating === 'number' ? (a as any).rating : ((a as any).reviews ? parseFloat((a as any).reviews as any) : 0);
          const rb = typeof (b as any).rating === 'number' ? (b as any).rating : ((b as any).reviews ? parseFloat((b as any).reviews as any) : 0);
          return rb - ra;
        });
    }, [services, realServices]);

    // If the filtered list is empty, fall back to top items by rating/orders/recency
    const resolvedTopServices = useMemo(() => {
      if (topRatedServices && topRatedServices.length > 0) return topRatedServices;
      const source = (realServices && realServices.length > 0) ? realServices : services;
      if (!source || source.length === 0) return [];

      // Try to sort by numeric rating first, then by parseInt(orders) if present, then by createdAt if present
      const withScore = source.map(s => {
        const rating = typeof (s as any).rating === 'number' ? (s as any).rating : ((s as any).reviews ? parseFloat((s as any).reviews as any) : NaN);
        let orders = 0;
        if ((s as any).orders) {
          const parsed = parseInt(String((s as any).orders).replace(/[^0-9]/g, ''), 10);
          orders = isNaN(parsed) ? 0 : parsed;
        }
        const createdAt = (s as any).createdAt ? new Date((s as any).createdAt).getTime() : 0;
        const score = (!isNaN(rating) ? rating * 10 : 0) + orders / 100 + createdAt / (1000 * 60 * 60 * 24 * 365);
        return { s, score };
      });

      const sorted = withScore.sort((a, b) => b.score - a.score).map(x => x.s);
      return sorted.slice(0, 8);
    }, [topRatedServices, services, realServices]);

  // Navigation items with proper hooks
  const navigationItems = useMemo(() => [
    {
      id: 'features',
      title: 'Features',
      subtitle: 'Explore all',
      icon: 'grid',
      colors: ['#4c4ec7', '#4c4ec7'] as [string, string],
      onPress: () => handleShowPopup('features'),
      badge: true,
    },
    {
      id: 'events',
      title: 'Events',
      subtitle: 'Discover amazing',
      icon: 'calendar',
      colors: ['#4c4ec7', '#4c4ec7'] as [string, string],
      onPress: () => router.push('/(client)/search'),
    },
    {
      id: 'artists',
      title: 'Artists',
      subtitle: 'Meet creators',
      icon: 'users',
      colors: ['#4c4ec7', '#4c4ec7'] as [string, string],
      onPress: () => router.push('/(client)/(hidden)/saved-artists'),
    },
    {
      id: 'tickets',
      title: 'Tickets',
      subtitle: 'Book now',
      icon: 'tag',
      colors: ['#4c4ec7', '#4c4ec7'] as [string, string],
      onPress: () => router.push('/(client)/tickets'),
    },
  ], [router]);

  // Animation setup
  useEffect(() => {
    const cardAnimations = animatedValues.cards.map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        delay: index * 100,
        damping: 15,
        mass: 0.8,
        stiffness: 100,
      })
    );

    Animated.parallel([
      Animated.spring(animatedValues.navigation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        mass: 0.9,
        stiffness: 100,
      }),
      Animated.spring(headerAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        mass: 0.8,
        stiffness: 100,
      }),
      ...cardAnimations,
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValues.pulse, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues.pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Enhanced animation values
  // const headerAnimation = useRef(new Animated.Value(0)).current;  // Initialize animated values first
  // const [animatedValues] = useState(() => {
  //   const defaultValues = {
  //     scale: new Animated.Value(1),
  //     press: new Animated.Value(1),
  //     navigation: new Animated.Value(0),
  //     wiggle: new Animated.Value(0),
  //     pulse: new Animated.Value(1),
  //   };

  //   // Add card animations later after navigation items are defined
  //   return {
  //     ...defaultValues,
  //     cards: Array(5).fill(0).map(() => new Animated.Value(0)),
  //   };
  // });

  // Enhanced animations on mount
  // useEffect(() => {
  //   const cardAnimations = animatedValues.cards.map((anim, index) =>
  //     Animated.spring(anim, {
  //       toValue: 1,
  //       useNativeDriver: true,
  //       delay: index * 100,
  //       damping: 15,
  //       mass: 0.8,
  //       stiffness: 100,
  //     })
  //   );

  //   Animated.parallel([
  //     Animated.spring(animatedValues.navigation, {
  //       toValue: 1,
  //       useNativeDriver: true,
  //       damping: 12,
  //       mass: 0.9,
  //       stiffness: 100,
  //     }),
  //     Animated.spring(headerAnimation, {
  //       toValue: 1,
  //       useNativeDriver: true,
  //       damping: 15,
  //       mass: 0.8,
  //       stiffness: 100,
  //     }),
  //     ...cardAnimations,
  //   ]).start();

  //   // Pulse animation for badges
  //   const pulseAnimation = Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(animatedValues.pulse, {
  //         toValue: 1.2,
  //         duration: 1000,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(animatedValues.pulse, {
  //         toValue: 1,
  //         duration: 1000,
  //         useNativeDriver: true,
  //       }),
  //     ])
  //   );
  //   pulseAnimation.start();

  //   return () => pulseAnimation.stop();
  // }, []);
  // Enhanced navigation item renderer with better animations
  const renderNavItem = (item: NavigationItem, index: number) => {
    const cardAnim = animatedValues.cards[index];

    const scale = cardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const opacity = cardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const translateY = cardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    const handlePress = () => {
      // Enhanced press animation with haptic feedback
      Animated.sequence([
        Animated.timing(animatedValues.press, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(animatedValues.press, {
          toValue: 1,
          useNativeDriver: true,
          damping: 8,
          mass: 0.5,
        }),
      ]).start();

      item.onPress();
    };

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.navItem,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navItemContent}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {/* Enhanced gradient background */}
          <View style={[styles.navItemGradient, {
            backgroundColor: item.colors[0],
          }]}>
            {/* Glassmorphism overlay */}
            <View style={styles.glassmorphismOverlay} />

            {/* Main icon */}
            <View style={styles.navIconContainer}>
              <Icon name={item.icon} size={28} color="#fff" />
            </View>

            {/* Enhanced badge with pulse animation */}
            {item.badge && (
              <Animated.View
                style={[
                  styles.enhancedBadge,
                  { transform: [{ scale: animatedValues.pulse }] }
                ]}
              >
                <Text style={styles.badgeText}>New</Text>
                <View style={styles.badgePulse} />
              </Animated.View>
            )}

            {/* Floating particles effect */}
            <View style={styles.particleContainer}>
              <View style={[styles.particle, styles.particle1]} />
              <View style={[styles.particle, styles.particle2]} />
              <View style={[styles.particle, styles.particle3]} />
            </View>
          </View>

          {/* Enhanced text section */}
          <View style={styles.navTextContainer}>
            <Text style={styles.navItemLabel}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Enhanced event card renderer
  const renderEventCard = (event: Event, index: number) => {
    const gradientIndex = index % cardGradients.length;

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.enhancedEventCard}
        onPress={() => { }}
        activeOpacity={0.95}
      >
        <View style={styles.eventCardHeader}>
          <View style={[styles.eventImageContainer, { backgroundColor: cardGradients[gradientIndex][0] }]}>
            <Icon name="calendar" size={24} color="#ffffff" style={styles.eventIcon} />
            <View style={styles.eventCardOverlay} />
          </View>
          <View style={styles.eventDateBadge}>
            <Text style={styles.eventDateText}>{event.date.split(',')[0]}</Text>
            <Text style={styles.eventMonthText}>{event.date.split(',')[1]}</Text>
          </View>
        </View>

        <View style={styles.enhancedEventContent}>
          <View style={styles.eventTitleSection}>
            <Text style={styles.enhancedEventTitle}>{event.name}</Text>
            <View style={styles.eventCategoryBadge}>
              <Text style={styles.eventCategoryText}>{event.category}</Text>
            </View>
          </View>

          <Text style={styles.enhancedEventDescription}>{event.description}</Text>

          <View style={styles.enhancedEventFooter}>
            <View style={styles.eventLocationContainer}>
              <View style={styles.locationIconContainer}>
                <Icon name="map-pin" size={14} color="#6b7280" />
              </View>
              <Text style={styles.eventLocationText}>{event.location}</Text>
            </View>
            <View style={styles.eventPriceContainer}>
              <Text style={styles.eventPriceLabel}>From</Text>
              <Text style={styles.enhancedEventPrice}>{event.price}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.enhancedBuyButton}>
            <Text style={styles.buyButtonText}>Book Now</Text>
            <Icon name="arrow-right" size={16} color="#fff" style={styles.buyButtonIcon} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Enhanced service card renderer
  const renderServiceCard = (service: Service, index: number) => {
    const gradientIndex = index % cardGradients.length;

    const pickImage = (s: any) => {
      const resolveCandidate = (candidate: any) => {
        if (!candidate) return null;
        if (typeof candidate === 'string') return candidate;
        if (typeof candidate === 'number') return candidate;
        if (typeof candidate === 'object') {
          return candidate.url || candidate.downloadURL || candidate.fullPath || candidate.path || candidate.fileUrl || null;
        }
        return null;
      };

      // images can be array of strings or array of objects
      let imgs = null;
      if (s?.images && Array.isArray(s.images)) imgs = s.images;
      else if (s?.image && Array.isArray(s.image)) imgs = s.image;
      else if (s?.image) imgs = [s.image];

      if (imgs && imgs.length > 0) {
        const first = resolveCandidate(imgs[0]);
        if (first) return typeof first === 'number' ? first : { uri: first };
      }

      // try other common fields
      const candidate = resolveCandidate(s?.cover) || resolveCandidate(s?.flyer) || resolveCandidate(s?.flyerUrl) || resolveCandidate(s?.file) || resolveCandidate(s?.image);
      if (candidate) return typeof candidate === 'number' ? candidate : { uri: candidate };

      return null;
    };

    const imageSource = pickImage(service as any);
    console.log(`🔧 Service ${service.title} image source:`, imageSource);

    return (
      <TouchableOpacity
        key={service.id}
        style={[styles.enhancedServiceCard, { width: 260 }]}
        onPress={() => router.push(`/(client)/(hidden)/gig/${service.id.toString()}`)}
        activeOpacity={0.95}
      >
        <View style={styles.serviceCardHeader}>
          <View style={[styles.serviceImageContainer, { backgroundColor: cardGradients[gradientIndex][0], height: 200, borderRadius: 20 }]}>
            {imageSource ? (
              <Animated.Image
                source={imageSource as any}
                style={[styles.coverImage, { borderRadius: 20 }]}
                resizeMode="cover"
                onError={() => {}}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                <Icon name="package" size={48} color="#ffffff" />
              </View>
            )}
            <View style={[styles.imageGradientOverlay, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]} />
            <View style={[styles.floatingBadge, { backgroundColor: (service as any).available === 'Available' ? '#10b981' : '#f59e0b' }]}>
              <Text style={styles.floatingBadgeText}>{(service as any).available}</Text>
            </View>
            <View style={[styles.servicePriceBadge, { top: 12, right: 12 }]}>
              <Text style={styles.servicePriceText}>{service.price}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.enhancedServiceDetails, { padding: 20 }]}>
          <Text style={[styles.enhancedServiceTitle, { fontSize: 18, marginBottom: 8 }]} numberOfLines={2}>{service.title}</Text>
          <View style={[styles.serviceMetrics, { gap: 12 }]}>
            <View style={styles.serviceMetric}>
              <Icon name="map-pin" size={14} color="#6b7280" />
              <Text style={[styles.serviceMetricText, { fontSize: 14 }]}>{service.location}</Text>
            </View>
            <View style={styles.serviceMetric}>
              <Icon name="star" size={14} color="#f59e0b" />
              <Text style={[styles.serviceMetricText, { fontSize: 14, color: '#f59e0b', fontWeight: '600' }]}>{(service as any).reviews}</Text>
              <Text style={[styles.serviceMetricText, { fontSize: 13, marginLeft: 8 }]}>({(service as any).orders} orders)</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.viewButton, { marginTop: 12, alignSelf: 'flex-start' }]}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Icon name="arrow-right" size={14} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Enhanced artist card renderer
  const renderArtistCard = (artist: Artist, index: number) => {
    const gradientIndex = index % cardGradients.length;

    return (
      <TouchableOpacity
        key={artist.id}
        style={styles.enhancedArtistCard}
  onPress={() => router.push(`/(client)/(hidden)/artist/${artist.id.toString()}`)}
        activeOpacity={0.95}
      >
        <View style={styles.artistCardHeader}>
          <View style={[styles.artistImageContainer, { backgroundColor: cardGradients[gradientIndex][0], height: 140, borderRadius: 20 }]}>
            {(() => {
              // Enhanced artist image resolution
              const resolveArtistImage = (a: any) => {
                const resolveCandidate = (candidate: any) => {
                  if (!candidate) return null;
                  if (typeof candidate === 'string') return candidate;
                  if (typeof candidate === 'object') {
                    return candidate.url || candidate.downloadURL || candidate.fullPath || candidate.path || candidate.fileUrl || null;
                  }
                  return null;
                };

                // Try multiple profile image fields
                return resolveCandidate(a?.image) || resolveCandidate(a?.profileImage) || resolveCandidate(a?.avatar) || resolveCandidate(a?.photo) || resolveCandidate(a?.profilePicture);
              };

              const artistImageUrl = resolveArtistImage(artist);
              console.log(`🎨 Artist ${artist.name} image URL:`, artistImageUrl);
              
              return artistImageUrl && typeof artistImageUrl === 'string' && artistImageUrl.startsWith('http') ? (
                <View style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden' }}>
                  <Animated.Image
                    source={{ uri: artistImageUrl }}
                    style={{ width: '100%', height: '100%', borderRadius: 20 }}
                    resizeMode="cover"
                    onError={() => {}}
                  />
                </View>
              ) : (
                <Icon name="user" size={48} color="#ffffff" />
              );
            })()}
            <View style={[styles.imageGradientOverlay, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]} />
          </View>
          <View style={[styles.floatingBadge, { backgroundColor: '#f59e0b', top: 12, right: 12 }]}>
            <Icon name="star" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={[styles.floatingBadgeText, { color: '#fff' }]}>{artist.rating}</Text>
          </View>
        </View>

        <View style={[styles.enhancedArtistContent, { padding: 20 }]}>
          <View style={[styles.artistTitleSection, { marginBottom: 12 }]}>
            <Text style={[styles.enhancedArtistName, { fontSize: 18, marginBottom: 8 }]}>{artist.name}</Text>
            <View style={[styles.artistSpecialtyBadge, { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }]}>
              <Text style={[styles.artistSpecialtyText, { fontSize: 12, color: '#6b7280', fontWeight: '600' }]}>{artist.specialty}</Text>
            </View>
          </View>

          <Text style={[styles.enhancedArtistDescription, { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20 }]} numberOfLines={2}>{artist.description}</Text>

          <TouchableOpacity style={[styles.viewButton, { alignSelf: 'flex-start' }]}>
            <Icon name="message-circle" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.viewButtonText}>Contact Artist</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Enhanced ticket card renderer
  const renderTicketCard = (ticket: any, index: number) => {
    const gradientIndex = index % cardGradients.length;

    return (
      <TouchableOpacity
        key={ticket.id}
        style={styles.enhancedTrendingCard}
        onPress={() => router.push({ pathname: '/(client)/(hidden)/ticket/[ticket]', params: { ticket: ticket.id.toString() } })}
        activeOpacity={0.95}
      >
        <View style={[
          styles.trendingImageContainer,
          { backgroundColor: cardGradients[index % cardGradients.length][0] }
        ]}>
          {/* display ticket flyer or image: support string uri or local require */}
          {(() => {
            const img = ticket?.flyer || ticket?.image || ticket?.flyerUrl || ticket?.cover;
            if (typeof img === 'string' && img.startsWith('http')) {
              return <Animated.Image source={{ uri: img }} style={styles.coverImage} resizeMode="cover" />;
            }
            if (typeof img === 'number') {
              return <Animated.Image source={img} style={styles.coverImage} resizeMode="cover" />;
            }
            return <Icon name="calendar" size={24} color="#ffffff" />;
          })()}
          <View style={styles.trendingCardOverlay} />
        </View>
        <View style={styles.enhancedTrendingContent}>
          <Text style={styles.enhancedTrendingTitle}>{ticket.title}</Text>
          <View style={styles.trendingInfo}>
            <Icon name="map-pin" size={12} color="#6b7280" />
            <Text style={styles.trendingInfoText}>{ticket.venue}, {ticket.city}</Text>
          </View>
          <View style={styles.enhancedTrendingPrice}>
            <Text style={styles.trendingPriceText}>{ticket.price} MAD</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Fetch real artists and tickets when popup opens
  useEffect(() => {
    if (isPopupVisible && popupContent === 'artists') {
      fetchArtists().then(setRealArtists).catch(() => setRealArtists([]));
    }
    if (isPopupVisible && popupContent === 'tickets') {
      fetchAllTickets().then(setRealTickets).catch(() => setRealTickets([]));
    }
    if (isPopupVisible && popupContent === 'services') {
      fetchAllServices().then(svcs => {
        if (Array.isArray(svcs) && svcs.length > 0) setRealServices(svcs as Service[]);
        else setRealServices([]);
      }).catch(() => setRealServices([]));
    }
  }, [isPopupVisible, popupContent]);

  // Fetch tickets on mount so Trending section has data immediately
  useEffect(() => {
    let mounted = true;
    fetchAllTickets()
      .then(tickets => {
        if (!mounted) return;
        if (Array.isArray(tickets) && tickets.length > 0) {
          console.log('Fetched tickets on mount:', tickets.length);
          // normalize tickets to ensure image field is a usable uri or local require
          const normalized = tickets.map((t: any) => {
            const imgCandidate = t.images && Array.isArray(t.images) && t.images.length > 0 ? t.images[0] : (t.image || t.flyer || t.cover || t.flyerUrl || null);
            let imageUri: any = null;
            if (typeof imgCandidate === 'string' && imgCandidate.startsWith('http')) imageUri = imgCandidate;
            else if (typeof imgCandidate === 'object' && imgCandidate !== null) imageUri = imgCandidate.url || imgCandidate.downloadURL || imgCandidate.path || null;
            else if (typeof imgCandidate === 'number') imageUri = imgCandidate; // local require

            return {
              id: t.id,
              title: t.title || t.name || t.eventName || 'Untitled',
              venue: t.venue || t.location || (t as any).venueName || '',
              city: t.city || t.cityName || '',
              price: t.price || (t.priceAmount ?? 0),
              image: imageUri,
              raw: t,
            } as any;
          });
          console.log('Sample normalized ticket:', normalized[0]);
          setRealTickets(normalized);
        } else {
          // fallback to local dummy tickets so UI shows cards
          console.log('No tickets from Firebase, using dummyTickets');
          setRealTickets(dummyTickets as any[]);
        }
      })
      .catch(() => {
        if (!mounted) return;
        console.log('Error fetching tickets, using dummyTickets');
        setRealTickets(dummyTickets as any[]);
      });

    return () => { mounted = false; };
  }, []);

  // Fetch real services from Firebase for Top Services using only Firestore fields
  useEffect(() => {
    let mounted = true;

    const resolveCandidateSync = (candidate: any): string | number | null => {
      if (!candidate) return null;
      if (typeof candidate === 'number') return candidate; // local require
      if (typeof candidate === 'string') {
        if (candidate.startsWith('http')) return candidate;
        // do not attempt Storage resolution here; ignore gs:// or storage paths
        return null;
      }
      if (typeof candidate === 'object') {
        const possible = candidate.url || candidate.downloadURL || candidate.fileUrl || candidate.path || candidate.fullPath || null;
        if (typeof possible === 'string' && possible.startsWith('http')) return possible;
        return null;
      }
      return null;
    };

    fetchAllServices()
      .then(svcs => {
        console.log('Fetched services on mount:', Array.isArray(svcs) ? svcs.length : typeof svcs);
        if (!Array.isArray(svcs) || svcs.length === 0) {
          if (mounted) setRealServices([]);
          return;
        }

        console.log('services sample (raw):', svcs.slice(0, 3));

        const normalized = svcs.map((s: any) => {
          const imagesArr = s.images && Array.isArray(s.images) ? s.images : (s.images && typeof s.images === 'object' ? [s.images] : null);
          let candidate = null;
          if (imagesArr && imagesArr.length > 0) candidate = imagesArr[0];
          else if (s.image) candidate = s.image;
          else if (s.cover) candidate = s.cover;
          else if (s.flyer) candidate = s.flyer;

          let imageUri: any = null;
          const resolved = resolveCandidateSync(candidate);
          if (resolved) imageUri = typeof resolved === 'number' ? resolved : { uri: resolved };

          return {
            id: s.id || s.serviceId || s._id,
            title: s.title || s.name || s.serviceName || 'Untitled Service',
            location: s.location || s.city || s.venue || '',
            reviews: s.reviews || s.rating || '0',
            orders: s.orders || s.orderCount || '0',
            price: s.price || s.basePrice || '0',
            available: s.available || (s.status === 'available' ? 'Available' : 'Booked'),
            image: imageUri,
            raw: s,
          } as any;
        });

        console.log('services sample (normalized):', normalized.slice(0, 3));
        const shuffled = normalized.sort(() => 0.5 - Math.random());
        if (mounted) setRealServices(shuffled as Service[]);
      })
      .catch(err => { console.log('Error fetching services:', err); if (mounted) setRealServices([]); });

    return () => { mounted = false; };
  }, []);

  const handleFeatureNavigation = (featureTitle: string) => {
    setPopupVisible(false); // Close the popup first
    
    switch (featureTitle) {
      case 'Become Provider':
        router.push('/(client)/(hidden)/features/become-provider');
        break;
      case 'Services':
        router.push('/(client)/(hidden)/features/services');
        break;
      case 'Privacy Policy':
        router.push('/(client)/(hidden)/features/privacy-policy');
        break;
      case 'Help & Support':
        router.push('/(client)/(hidden)/features/help-support');
        break;
      case 'About Us':
        router.push('/(client)/(hidden)/features/about-us');
        break;
      case 'Terms of Service':
        router.push('/(client)/(hidden)/features/terms-of-service');
        break;
      default:
        // For service categories, you could navigate to a filtered services page
        console.log(`Navigate to ${featureTitle} services`);
        break;
    }
  };

  // Enhanced popup content renderer
  const renderPopupContent = () => {
    switch (popupContent) {
      case 'features':
        return (
          <View style={styles.enhancedPopupContent}>
            <View style={styles.popupTitleContainer}>
              <Text style={styles.enhancedPopupTitle}>Discover Features</Text>
              <Text style={styles.popupSubtitle}>Everything you need for perfect events</Text>
            </View>
            <View style={styles.enhancedFeaturesGrid}>
              {featuredServices.map((item, index) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.enhancedFeatureItem}
                  onPress={() => handleFeatureNavigation(item.title)}
                >
                  <View style={[styles.enhancedFeatureIcon, {
                    backgroundColor: cardGradients[index % cardGradients.length][0],
                  }]}>
                    <Icon name={item.icon} size={24} color="#fff" />
                  </View>
                  <Text style={styles.enhancedFeatureTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'services':
        return (
          <View style={styles.enhancedPopupContent}>
            <View style={styles.popupTitleContainer}>
              <Text style={styles.enhancedPopupTitle}>Premium Services</Text>
              <Text style={styles.popupSubtitle}>Professional services for your events</Text>
            </View>
            <FlatList
              data={realServices}
              renderItem={({ item, index }) => renderServiceCard(item, index)}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.enhancedPopupList}
            />
          </View>
        );
      case 'tickets':
        return (
          <View style={styles.enhancedPopupContent}>
            <View style={styles.popupTitleContainer}>
              <Text style={styles.enhancedPopupTitle}>Event Tickets</Text>
              <Text style={styles.popupSubtitle}>Book your spot at amazing events</Text>
            </View>
            <FlatList
              data={realTickets}
              renderItem={({ item, index }) => renderTicketCard(item, index)}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.enhancedPopupList}
            />
          </View>
        );
      case 'artists':
        return (
          <View style={styles.enhancedPopupContent}>
            <View style={styles.popupTitleContainer}>
              <Text style={styles.enhancedPopupTitle}>Featured Artists</Text>
              <Text style={styles.popupSubtitle}>Connect with talented professionals</Text>
            </View>
            <FlatList
              data={realArtists}
              renderItem={({ item, index }) => renderArtistCard(item, index)}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.enhancedPopupList}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const headerTranslateY = headerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const headerOpacity = headerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // UI helper functions
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getGreeting = () => {
    return `Good ${getTimeOfDay()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}!`;
  };

  // Enhanced navigation data
  // const navigationItems: NavigationItem[] = [
  //   {
  //     id: 'features',
  //     title: 'Features',
  //     subtitle: 'Explore all',
  //     icon: 'grid',
  //     colors: ['#4f46e5', '#818cf8'],
  //     onPress: () => showPopup('features'),
  //     badge: true,
  //   },
  //   {
  //     id: 'services',
  //     title: 'Services',
  //     subtitle: 'Premium quality',
  //     icon: 'package',
  //     colors: ['#059669', '#10b981'],
  //     onPress: () => showPopup('services'),
  //   },
  //   {
  //     id: 'events',
  //     title: 'Events',
  //     subtitle: 'Discover amazing',
  //     icon: 'calendar',
  //     colors: ['#d946ef', '#f472b6'],
  //     onPress: () => handleSectionChange('events'),
  //   },
  //   {
  //     id: 'artists',
  //     title: 'Artists',
  //     subtitle: 'Meet creators',
  //     icon: 'users',
  //     colors: ['#0ea5e9', '#38bdf8'],
  //     onPress: () => showPopup('artists'),
  //   },
  //   {
  //     id: 'tickets',
  //     title: 'Tickets',
  //     subtitle: 'Book now',
  //     icon: 'ticket',
  //     colors: ['#f59e0b', '#fbbf24'],
  //     onPress: () => showPopup('tickets'),
  //   },
  // ];

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

  const featuredServices: FeaturedService[] = [

    { id: 7, title: 'Become Provider', icon: 'user' },
    { id: 8, title: 'Services', icon: 'grid' },
    { id: 9, title: 'Privacy Policy', icon: 'shield' },
    { id: 10, title: 'Help & Support', icon: 'help-circle' },
    { id: 11, title: 'About Us', icon: 'heart' },
    { id: 12, title: 'Terms of Service', icon: 'file-text' }
  ];

  const filteredEvents = activeCategory === 'All'
    ? events
    : events.filter(event => event.category === activeCategory);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1, paddingBottom: 20 }}>
        {/* Enhanced Header Section */}
        <Animated.View style={[styles.enhancedHeader, {
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
        }]}>


          {/* Enhanced Search Bar */}
          <View style={styles.enhancedSearchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.enhancedSearchInput}
                placeholder="Search events, services, artists..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Icon name="x" size={16} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

          <View style={styles.mainContent}>
          <View style={styles.enhancedNavigationSection}>
            {/* Quick Stats */}
            <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dummyTickets.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{artists.length}</Text>
              <Text style={styles.statLabel}>Artists</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{services.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            </View>
              {/* Enhanced Navigation Grid */}
              <View style={styles.enhancedNavGrid}>
              {navigationItems.map((item, index) => {
                // For the 'tickets' card, show the image from the first real ticket if available
                if (item.id === 'tickets' && realTickets.length > 0 && realTickets[0].image) {
                return (
                  <Animated.View
                  key={item.id}
                  style={[
                    styles.navItem,
                    {
                    transform: [
                      { scale: animatedValues.cards[index].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                      { translateY: animatedValues.cards[index].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                    ],
                    opacity: animatedValues.cards[index].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                    },
                  ]}
                  >
                  <TouchableOpacity
                    style={styles.navItemContent}
                    onPress={() => {
                    Animated.sequence([
                      Animated.timing(animatedValues.press, {
                      toValue: 0.95,
                      duration: 100,
                      useNativeDriver: true,
                      }),
                      Animated.spring(animatedValues.press, {
                      toValue: 1,
                      useNativeDriver: true,
                      damping: 8,
                      mass: 0.5,
                      }),
                    ]).start();
                    item.onPress();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.navItemGradient, { backgroundColor: item.colors[0] }]}>
                    <View style={styles.glassmorphismOverlay} />
                    {/* Show real ticket image */}
                    <View style={styles.navIconContainer}>
                      <Animated.Image
                      source={{ uri: realTickets[0].image }}
                      style={{ width: 48, height: 48, borderRadius: 12 }}
                      resizeMode="cover"
                      />
                    </View>
                    {item.badge && (
                      <Animated.View
                      style={[
                        styles.enhancedBadge,
                        { transform: [{ scale: animatedValues.pulse }] }
                      ]}
                      >
                      <Text style={styles.badgeText}>New</Text>
                      <View style={styles.badgePulse} />
                      </Animated.View>
                    )}
                    <View style={styles.particleContainer}>
                      <View style={[styles.particle, styles.particle1]} />
                      <View style={[styles.particle, styles.particle2]} />
                      <View style={[styles.particle, styles.particle3]} />
                    </View>
                    </View>
                    <View style={styles.navTextContainer}>
                    <Text style={styles.navItemLabel}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
                    )}
                    </View>
                  </TouchableOpacity>
                  </Animated.View>
                );
                }
                // Default nav item rendering
                return renderNavItem(item, index);
              })}
              </View>

              {/* Content Container */}
              <View style={styles.contentContainer}>
              {/* Events Section */}
              {activeSection === 'events' && (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Enhanced Trending Events */}
                <View style={styles.enhancedTrendingSection}>
                <View style={styles.enhancedSectionHeader}>
                <View>
                  <Text style={styles.enhancedSectionTitle}>Trending Now</Text>
                  <Text style={styles.sectionSubtitle}>Popular events this week</Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>debug: {realTickets.length} tickets{realTickets.length>0?` (first:${realTickets[0].id})`:''}</Text>
                </View>
                <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/(client)/tickets')}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Icon name="arrow-right" size={14} color="#4f46e5" />
                </TouchableOpacity>
                </View>
                <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.trendingScroll}
                >
                {realTickets.slice(0, 8).map((ticket, index) => (
                  <TouchableOpacity
                  key={ticket.id}
                  style={[
                  styles.enhancedTrendingCard,
                  {
                    width: 240, // Make card bigger
                    height: 320,
                    marginRight: 24,
                    ...(index === 0 ? { borderWidth: 2, borderColor: '#ef4444' } : {}),
                  }
                  ]}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/(client)/(hidden)/ticket/[ticket]', params: { ticket: ticket.id.toString() } })}
                  >
                  <View style={[
                  styles.trendingImageContainer,
                  {
                    backgroundColor: cardGradients[index % cardGradients.length][0],
                    height: 180, // Bigger image
                  }
                  ]}>
                  {/* Enhanced image handling with fallback for real tickets */}
                  {(() => {
                    // Use same robust image resolution as services
                    const resolveTicketImage = (t: any) => {
                      const resolveCandidate = (candidate: any) => {
                        if (!candidate) return null;
                        if (typeof candidate === 'string') return candidate;
                        if (typeof candidate === 'object') {
                          return candidate.url || candidate.downloadURL || candidate.fullPath || candidate.path || candidate.fileUrl || null;
                        }
                        return null;
                      };

                      // Try multiple image fields
                      let imgs = null;
                      if (t?.images && Array.isArray(t.images)) imgs = t.images;
                      else if (t?.image && Array.isArray(t.image)) imgs = t.image;
                      else if (t?.image) imgs = [t.image];

                      if (imgs && imgs.length > 0) {
                        const first = resolveCandidate(imgs[0]);
                        if (first) return first;
                      }

                      // Try other common fields
                      return resolveCandidate(t?.cover) || resolveCandidate(t?.flyer) || resolveCandidate(t?.flyerUrl) || resolveCandidate(t?.file) || resolveCandidate(t?.image);
                    };

                    const ticketImageUrl = resolveTicketImage(ticket);
                    console.log(`🎫 Ticket ${ticket.title} image URL:`, ticketImageUrl);
                    
                    return ticketImageUrl && typeof ticketImageUrl === 'string' && ticketImageUrl.startsWith('http') ? (
                      <View style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden' }}>
                        <Animated.Image
                          source={{ uri: ticketImageUrl }}
                          style={{ width: '100%', height: '100%', borderRadius: 20 }}
                          resizeMode="cover"
                          onError={() => {}}
                        />
                      </View>
                    ) : (
                      <Icon name="calendar" size={32} color="#ffffff" />
                    );
                  })()}
                  <View style={[styles.imageGradientOverlay, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]} />
                  {index === 0 && (
                    <View style={[styles.floatingBadge, { backgroundColor: '#ef4444', top: 12, left: 12 }]}>
                      <Text style={styles.floatingBadgeText}>Trending</Text>
                    </View>
                  )}
                  <View style={[styles.enhancedTrendingPrice, { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#1f2937', borderRadius: 16 }]}> 
                    <Text style={[styles.trendingPriceText, { fontSize: 16, color: '#ffffff', fontWeight: '700' }]}>{ticket.price} MAD</Text>
                  </View>
                  </View>
                  <View style={[styles.enhancedTrendingContent, { padding: 20 }]}> 
                    <Text style={[styles.enhancedTrendingTitle, { fontSize: 18, marginBottom: 12 }]}>{ticket.title}</Text>
                    <View style={[styles.trendingInfo, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      <Icon name="map-pin" size={14} color="#6b7280" />
                      <Text style={[styles.trendingInfoText, { fontSize: 15, color: '#6b7280' }]}>{ticket.venue}, {ticket.city}</Text>
                    </View>

                  </View>
                  </TouchableOpacity>
                ))}
                </ScrollView>
                </View>

                {/* Enhanced Categories - moved below Trending Now */}
                <View style={styles.enhancedCategoriesSection}>
                <Text style={styles.enhancedSectionTitle}>Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.enhancedCategoryButton,
                        activeCategory === category.name && styles.enhancedCategoryButtonActive
                      ]}
                      onPress={() => setActiveCategory(category.name)}
                    >
                      <View style={styles.categoryIconContainer}>
                        <Icon
                          name={category.icon}
                          size={16}
                          color={activeCategory === category.name ? '#ffffff' : '#4f46e5'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.enhancedCategoryButtonText,
                          activeCategory === category.name && styles.enhancedCategoryButtonTextActive
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                </View>

                {/* Enhanced Events List */}
                <View style={styles.enhancedEventsSection}>
                  <View style={styles.enhancedSectionHeader}>
                  <View>
                    <Text style={styles.enhancedSectionTitle}>Top Services</Text>
                    <Text style={styles.sectionSubtitle}>Don't miss out on these amazing services</Text>
                    <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>debug: {realServices.length} services{realServices.length>0?` (first:${realServices[0].id})`:''}</Text>
                  </View>
                  <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push({ pathname: '/(client)/search' })}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <Icon name="arrow-right" size={14} color="#4f46e5" />
                  </TouchableOpacity>
                  </View>
                  {resolvedTopServices.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 8, marginBottom: 8 }}>
                      {resolvedTopServices.slice(0, 8).map((service, index) => {
                        return (
                          <Animated.View
                            key={service.id}
                            style={{
                              marginRight: 20,
                              marginTop: 8,
                            }}
                          >
                            <TouchableOpacity
                              style={{
                                width: 250,
                                backgroundColor: 'rgba(255,255,255,0.85)',
                                borderRadius: 28,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: 'rgba(76,70,229,0.07)',
                              }}
                              activeOpacity={0.92}
                              onPress={() => router.push({ pathname: '/(client)/(hidden)/gig/[gigId]', params: { gigId: service.id.toString() } })}
                            >
                              {/* Service Image with glassmorphism and floating badge */}
                              <View style={{ position: 'relative', width: '100%', height: 150, backgroundColor: cardGradients[index % cardGradients.length][0], ...(index===0?{borderWidth:2,borderColor:'#ef4444'}:{}) }}>
                                {(() => {
                                  const img = service.image;
                                  if (!img) return (
                                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                      <Icon name="package" size={54} color="#ffffff" />
                                    </View>
                                  );

                                  // local require
                                  if (typeof img === 'number') {
                                    return <Animated.Image source={img as any} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
                                  }

                                  // object with { uri }
                                  if (typeof img === 'object' && (img as any).uri) {
                                    return <Animated.Image source={(img as any)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
                                  }

                                  // string url
                                  if (typeof img === 'string' && img.startsWith('http')) {
                                    return <Animated.Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
                                  }

                                  // fallback
                                  return (
                                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                      <Icon name="package" size={54} color="#ffffff" />
                                    </View>
                                  );
                                })()}
                                <View style={styles.imageGradientOverlay} />
                                <View style={[styles.floatingBadge, { backgroundColor: service.available === 'Available' ? '#10b981' : '#f59e0b' }]}>
                                  <Text style={styles.floatingBadgeText}>{service.available}</Text>
                                </View>
                              </View>
                              {/* Card Content */}
                              <View style={{ padding: 18 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 19, marginBottom: 2, color: '#1e293b' }} numberOfLines={1}>{service.title}</Text>
                                <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }} numberOfLines={1}>{service.location}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                  <Icon name="star" size={15} color="#f59e0b" style={{ marginRight: 3 }} />
                                  <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 15 }}>{service.reviews}</Text>
                                  <Text style={{ color: '#64748b', fontSize: 13, marginLeft: 10 }}>{service.orders}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 20 }}>{service.price}</Text>
                                  <View style={{ backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 }}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>View</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </Animated.View>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <View style={{ alignItems: 'center', marginVertical: 24 }}>
                      <Text style={{ color: '#6b7280', fontSize: 16 }}>No services available at the moment.</Text>
                    </View>
                  )}
                </View>
                </ScrollView>
              )}
              </View>
          </View>
        </View>

        {/* Enhanced Popup Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isPopupVisible}
          onRequestClose={() => setPopupVisible(false)}
        >
          <View style={styles.enhancedModalOverlay}>
            <View style={styles.enhancedModalContent}>
              <View style={styles.enhancedModalHeader}>
                <View style={styles.modalHandleBar} />
                <TouchableOpacity
                  style={styles.enhancedModalCloseButton}
                  onPress={() => setPopupVisible(false)}
                >
                  <Icon name="x" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {renderPopupContent()}
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Enhanced Header Styles
  enhancedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  zIndex: 10,
  // shadow removed
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeftSection: {
    flex: 1,
    position: 'relative',
  },
  enhancedHeaderWelcome: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  enhancedHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerAccent: {
    width: 40,
    height: 4,
    backgroundColor: '#4f46e5',
    borderRadius: 2,
    marginTop: 8,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  enhancedNotificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
  justifyContent: 'center',
  alignItems: 'center',
  // shadow removed
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  enhancedAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
  justifyContent: 'center',
  alignItems: 'center',
  // shadow removed
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Search Styles
  enhancedSearchContainer: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  borderWidth: 1,
  borderColor: '#e2e8f0',
  // shadow removed
  },
  searchIcon: {
    marginRight: 12,
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
  },

  // Enhanced Main Content
  mainContent: {
    flex: 1,
    marginTop: 150,
  },
  enhancedNavigationSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  paddingTop: 24,
  // shadow removed
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },

  // Enhanced Navigation Grid
  enhancedNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navItem: {
    width: '48%',
    aspectRatio: 1.2,
    marginBottom: 16,
  },
  navItemContent: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  navItemGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'relative',
  },
  glassmorphismOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  navIconContainer: {
    marginBottom: 8,
    zIndex: 2,
  },
  navTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  navItemLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  navItemSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Enhanced Badge
  enhancedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  zIndex: 3,
  // shadow removed
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  badgePulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    opacity: 0.3,
  },

  // Particle Effects
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  particle1: {
    top: '20%',
    left: '15%',
  },
  particle2: {
    top: '70%',
    right: '20%',
  },
  particle3: {
    bottom: '30%',
    left: '70%',
  },

  // Content Container
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Enhanced Categories
  enhancedCategoriesSection: {
    marginBottom: 24,
  },
  enhancedSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  enhancedCategoryButton: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  enhancedCategoryButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryIconContainer: {
    marginRight: 8,
  },
  enhancedCategoryButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedCategoryButtonTextActive: {
    color: '#ffffff',
  },

  // Enhanced Section Headers
  enhancedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  seeAllText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },

  // Enhanced Trending Section
  enhancedTrendingSection: {
    marginBottom: 32,
  },
  trendingScroll: {
    paddingBottom: 8,
  },
  enhancedTrendingCard: {
    width: 180,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 16,
  // shadow removed
    overflow: 'hidden',
  },
  trendingImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trendingCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  enhancedTrendingContent: {
    padding: 16,
  },
  enhancedTrendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 20,
  },
  trendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendingInfoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  enhancedTrendingPrice: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trendingPriceText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '700',
  },

  // Cover image used in cards
  coverImage: {
    width: '100%',
    height: '100%',
  },

  // Enhanced Events Section
  enhancedEventsSection: {
    marginBottom: 100,
  },

  // Enhanced Event Cards
  enhancedEventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
  // shadow removed
    overflow: 'hidden',
  },
  eventCardHeader: {
    position: 'relative',
  },
  eventImageContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eventCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  eventIcon: {
    opacity: 0.9,
    zIndex: 2,
  },
  eventDateBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  // shadow removed
  },
  eventDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
    lineHeight: 16,
  },
  eventMonthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  enhancedEventContent: {
    padding: 20,
  },
  eventTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  enhancedEventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  eventCategoryBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  eventCategoryText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  enhancedEventDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  enhancedEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  eventLocationText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  eventPriceContainer: {
    alignItems: 'flex-end',
  },
  eventPriceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  enhancedEventPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4f46e5',
  },
  enhancedBuyButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  // shadows removed per request
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  buyButtonIcon: {
    opacity: 0.9,
  },

  // Enhanced Service Cards
  enhancedServiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
  // shadows removed
    overflow: 'hidden',
  },
  serviceCardHeader: {
    position: 'relative',
  },
  serviceImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  serviceCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  servicePriceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  // shadow removed
  },
  servicePriceText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '800',
  },
  serviceAvailabilityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  // shadow removed
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  enhancedServiceDetails: {
    padding: 16,
  },
  enhancedServiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  serviceMetrics: {
    gap: 8,
  },
  serviceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMetricText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Enhanced Artist Cards
  enhancedArtistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
  // shadow removed
    overflow: 'hidden',
  },
  artistCardHeader: {
    position: 'relative',
  },
  artistImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  artistCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  artistRatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  // shadow removed
  },
  artistRatingText: {
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 4,
    fontWeight: '700',
  },
  enhancedArtistContent: {
    padding: 16,
  },
  artistTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  enhancedArtistName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
  },
  artistSpecialtyBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  artistSpecialtyText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  enhancedArtistDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  enhancedContactButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  // shadow removed
  },
  contactButtonIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Enhanced Modal Styles
  enhancedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  enhancedModalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: height * 0.85,
  },
  enhancedModalHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  modalHandleBar: {
    width: 48,
   
    borderRadius: 20,
  // shadow removed
  },
  enhancedModalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    zIndex: 2,
  },

  // Enhanced Popup Content
  enhancedPopupContent: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  popupTitleContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  enhancedPopupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  enhancedPopupList: {
    paddingBottom: 40,
  },

  // Enhanced Features Grid
  enhancedFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  enhancedFeatureItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
  },
  enhancedFeatureIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  // shadow removed
  },
  // Add enhancedFeatureTitle style (fix typo, was enhancedFeatureText before)
  enhancedFeatureTitle: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'center',
  },

  // New image/card helpers
  imageGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  imageTitle: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    zIndex: 3,
  },
  floatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 4,
  },
  floatingBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  viewButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

});