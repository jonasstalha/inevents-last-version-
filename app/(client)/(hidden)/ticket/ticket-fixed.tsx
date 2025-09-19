import { fetchTicketById } from '@/src/firebase/clientTicketsService';
import { Ticket } from '@/src/models/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolation,
    FadeInDown,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

// Placeholder image for fallback
const placeholderImage = require('../../../../assets/images/first.jpeg');

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Categories for mapping
const categories = [
  { id: 'all', name: 'All Events', icon: 'grid', color: '#6C63FF' },
  { id: 'musique', name: 'Musique', icon: 'musical-notes', color: '#FF6B6B' },
  { id: 'theatre', name: 'Theatre', icon: 'film', color: '#4ECDC4' },
  { id: 'comedie', name: 'Comedie', icon: 'happy', color: '#FFD166' },
  { id: 'sport', name: 'Sport', icon: 'basketball', color: '#06D6A0' },
  { id: 'concert', name: 'Concert', icon: 'mic', color: '#118AB2' },
  { id: 'festival', name: 'Festival', icon: 'star', color: '#9B5DE5' },
  { id: 'formation', name: 'Formation', icon: 'school', color: '#F15BB5' },
  { id: 'famille', name: 'Famille & Loisirs', icon: 'people', color: '#00BBF9' },
];

// Helper function to categorize the event based on title or description
const categorizeEvent = (title: string = '', description: string = '') => {
  const text = (title + ' ' + description).toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    musique: ['music', 'musique', 'concert', 'festival', 'dj', 'live', 'band', 'song'],
    theatre: ['theatre', 'theater', 'drama', 'play', 'act', 'stage', 'performance'],
    comedie: ['comedy', 'comedie', 'humour', 'funny', 'stand-up', 'laugh'],
    sport: ['sport', 'football', 'basketball', 'tennis', 'match', 'game', 'tournament'],
    concert: ['concert', 'live music', 'performance', 'show'],
    festival: ['festival', 'celebration', 'event', 'gala'],
    formation: ['formation', 'training', 'workshop', 'seminar', 'course', 'education', 'learn'],
    famille: ['family', 'famille', 'kids', 'children', 'parenting', 'loisir'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'all';
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

// Transform Firebase ticket to UI format
const transformTicketData = (ticket: Ticket) => {
  // Extract city and venue from location if available
  const locationParts = ticket.location?.split(',') || [];
  const city = locationParts[0]?.trim() || 'Unknown City';
  const venue = locationParts[1]?.trim() || locationParts[0]?.trim() || 'Unknown Venue';
  
  // Determine category based on title or description
  const category = categorizeEvent(ticket.eventName, ticket.description);
  
  return {
    id: ticket.id,
    title: ticket.eventName || 'Unnamed Event',
    description: ticket.description || 'No description provided',
    city,
    venue,
    price: ticket.price || 0,
    date: ticket.eventDate ? new Date(ticket.eventDate).toISOString().split('T')[0] : undefined,
    time: ticket.eventDate ? new Date(ticket.eventDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined,
    image: ticket.flyer ? { uri: ticket.flyer } : placeholderImage,
    availableTickets: typeof ticket.status === 'string' && ticket.status === 'available' ? 
                     Math.floor(Math.random() * 100) + 10 : 0,
    rating: 4 + Math.random() * 0.9, // Random rating between 4.0-4.9
    artistId: ticket.artistId,
    createdAt: ticket.createdAt,
    category,
    status: ticket.status || 'available'
  };
};

export default function TicketDetailScreen() {
  const { ticket } = useLocalSearchParams();
  const router = useRouter();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(300);
  
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        if (!ticket) {
          setError('No ticket ID provided');
          setLoading(false);
          return;
        }
        
        const ticketId = String(ticket);
        const fetchedTicket = await fetchTicketById(ticketId);
        
        if (!fetchedTicket) {
          setError('Ticket not found');
          setLoading(false);
          return;
        }
        
        // Transform ticket data for UI
        setTicketData(transformTicketData(fetchedTicket));
      } catch (err) {
        console.error('Error fetching ticket details:', err);
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticket]);
  
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [0, 200],
        [headerHeight.value, 150],
        Extrapolation.CLAMP
      ),
    };
  });
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }
  
  if (error || !ticketData) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.notFound}>{error || 'Ticket not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get category color based on ticket category
  const categoryInfo = categories.find(cat => cat.id === ticketData.category) || categories[0];
  const categoryColor = categoryInfo.color;
  
  const buyTicket = () => {
    Alert.alert('Purchase Ticket', 'Ticket purchasing functionality will be implemented soon!');
  };
  
  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Image source={ticketData.image} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButtonHeader}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Share button */}
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Ionicons name={(categoryInfo.icon as any)} size={16} color="#FFFFFF" />
            <Text style={styles.categoryText}>{categoryInfo.name}</Text>
          </View>
        </Animated.View>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={styles.title}>{ticketData.title}</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="map-marker" size={18} color={categoryColor} />
                <Text style={styles.infoText}>{ticketData.venue}, {ticketData.city}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={18} color={categoryColor} />
                <Text style={styles.infoText}>
                  {ticketData.date ? formatDate(ticketData.date) : 'Date TBD'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={18} color={categoryColor} />
                <Text style={styles.infoText}>{ticketData.time || 'Time TBD'}</Text>
              </View>
            </View>
            
            <View style={styles.priceAndRating}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={[styles.priceValue, { color: categoryColor }]}>
                  {ticketData.price} MAD
                </Text>
              </View>
              
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Rating</Text>
                <View style={styles.starsContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingValue}>
                    {ticketData.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{ticketData.description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityContainer}>
              <View style={styles.availabilityInfo}>
                <Ionicons 
                  name={ticketData.availableTickets > 0 ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={ticketData.availableTickets > 0 ? "#06D6A0" : "#FF6B6B"} 
                />
                <Text style={styles.availabilityText}>
                  {ticketData.availableTickets > 0 
                    ? `${ticketData.availableTickets} tickets available` 
                    : 'No tickets available'}
                </Text>
              </View>
              {ticketData.availableTickets < 50 && ticketData.availableTickets > 0 && (
                <Text style={styles.limitedText}>Limited tickets remaining!</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.buyButton, 
                { 
                  backgroundColor: ticketData.availableTickets > 0 ? categoryColor : '#CCCCCC',
                  opacity: ticketData.availableTickets > 0 ? 1 : 0.7
                }
              ]}
              onPress={buyTicket}
              disabled={ticketData.availableTickets <= 0}
            >
              <Text style={styles.buyButtonText}>
                {ticketData.availableTickets > 0 ? 'Buy Ticket' : 'Sold Out'}
              </Text>
              {ticketData.availableTickets > 0 && (
                <Ionicons name="ticket-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
            
            {/* Space at the bottom for better UX */}
            <View style={{ height: 40 }} />
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C63FF',
  },
  headerContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  backButtonHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  priceAndRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
  },
  availabilityContainer: {
    marginBottom: 24,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#1E293B',
  },
  limitedText: {
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 32,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  notFound: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748B',
    marginVertical: 20,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
