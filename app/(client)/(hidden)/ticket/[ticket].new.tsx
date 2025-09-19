import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
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
import { fetchTicketById } from '../../../../src/firebase/clientTicketsService';
import { Ticket } from '../../../../src/models/types';

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
  
  // Calculate real ticket quantities from ticket types
  const ticketTypes = ticket.ticketTypes?.map(type => {
    // Convert string quantity to number if available
    const typeObj = type as any;
    const quantity = typeObj.quantity ? parseInt(typeObj.quantity, 10) : 50;
    
    return {
      type: type.type,
      price: type.price,
      quantity: !isNaN(quantity) ? quantity : 50
    };
  }) || [];
  
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
    ticketTypes: ticketTypes.length > 0 ? ticketTypes : [{ type: 'Standard', price: ticket.price.toString(), quantity: 50 }],
    artistId: ticket.artistId,
    createdAt: ticket.createdAt,
    category,
    status: ticket.status || 'available'
  };
};

// Define interface for ticket types
interface TicketType {
  type: string;
  price: string;
  quantity: number;
}

// Define interface for ticket data structure
interface TicketDataUI {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  price: number;
  date: string | undefined;
  time: string | undefined;
  image: any;
  ticketTypes: TicketType[];
  artistId: string;
  createdAt: any;
  category: string;
  status: string;
}

export default function TicketDetailScreen() {
  const { ticket } = useLocalSearchParams();
  const router = useRouter();
  
  // All state declarations at the top
  const [ticketData, setTicketData] = useState<TicketDataUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Animation values
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(300);
  
  // Format price with thousand separators - plain function, no dependencies
  const formatPrice = (price: number): string => {
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Update total price - called by other functions
  const updateTotalPrice = useCallback((tickets: Record<string, number> = selectedTickets) => {
    if (!ticketData) return;
    
    let price = 0;
    ticketData.ticketTypes.forEach(type => {
      if (tickets[type.type]) {
        price += parseFloat(type.price) * tickets[type.type];
      }
    });
    
    // Apply promo discount
    const finalPrice = price * (1 - promoDiscount);
    setTotalPrice(finalPrice);
  }, [ticketData, selectedTickets, promoDiscount]);
  
  // Handle ticket quantity change
  const handleTicketQuantityChange = useCallback((typeIndex: number, quantity: number) => {
    if (!ticketData) return;
    
    const type = ticketData.ticketTypes[typeIndex];
    if (!type) return;
    
    const newSelectedTickets = { ...selectedTickets };
    
    // Update quantity or remove if zero
    if (quantity > 0) {
      newSelectedTickets[type.type] = quantity;
    } else {
      delete newSelectedTickets[type.type];
    }
    
    setSelectedTickets(newSelectedTickets);
    
    // Call updateTotalPrice with the new tickets
    if (ticketData) {
      let price = 0;
      ticketData.ticketTypes.forEach(type => {
        if (newSelectedTickets[type.type]) {
          price += parseFloat(type.price) * newSelectedTickets[type.type];
        }
      });
      
      // Apply promo discount
      const finalPrice = price * (1 - promoDiscount);
      setTotalPrice(finalPrice);
    }
  }, [ticketData, selectedTickets, promoDiscount]);
  
  // Apply promo code
  const applyPromoCode = useCallback(() => {
    // Simple promo code logic - in real app, this would validate with backend
    const promoDiscounts: Record<string, number> = {
      'SUMMER10': 0.1,
      'WELCOME20': 0.2,
      'FLASH50': 0.5,
      'EVENT25': 0.25
    };
    
    const discount = promoDiscounts[promoCode.toUpperCase()];
    
    if (discount) {
      setPromoDiscount(discount);
      Alert.alert(
        'Promo Applied!',
        `Discount of ${discount * 100}% has been applied to your order.`
      );
    } else {
      setPromoDiscount(0);
      Alert.alert(
        'Invalid Promo Code',
        'The promo code you entered is not valid or has expired.'
      );
    }
    
    // We call updateTotalPrice indirectly by manually calculating
    if (ticketData) {
      let price = 0;
      ticketData.ticketTypes.forEach(type => {
        if (selectedTickets[type.type]) {
          price += parseFloat(type.price) * selectedTickets[type.type];
        }
      });
      
      // Apply new promo discount
      const newDiscount = promoDiscounts[promoCode.toUpperCase()] || 0;
      const finalPrice = price * (1 - newDiscount);
      setTotalPrice(finalPrice);
    }
  }, [ticketData, promoCode, selectedTickets]);
  
  // Buy ticket function
  const buyTicket = useCallback(() => {
    const ticketsSelected = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0) > 0;
    
    if (!ticketsSelected) {
      Alert.alert('Selection Required', 'Please select at least one ticket to continue.');
      return;
    }
    
    // Show order confirmation modal
    setShowOrderModal(true);
  }, [selectedTickets]);
  
  // Create order function
  const createOrder = useCallback(async () => {
    if (!ticketData) return;
    
    setOrderProcessing(true);
    setOrderError(null);
    
    try {
      // In a real app, this would call your API to create an order
      // For now, we'll simulate an API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Order successful
      setOrderComplete(true);
      setOrderProcessing(false);
      
      // Reset selections after successful order
      setSelectedTickets({});
      
      // Update total price manually instead of calling updateTotalPrice to avoid dependencies
      setTotalPrice(0);
      
      // Close modal after a delay
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderComplete(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating order:', error);
      setOrderError('Something went wrong. Please try again.');
      setOrderProcessing(false);
    }
  }, [ticketData]);
  
  // Helper functions with useCallback
  const getTotalTicketsAvailable = useCallback(() => {
    if (!ticketData) return 0;
    return ticketData.ticketTypes.reduce((total, type) => total + type.quantity, 0);
  }, [ticketData]);
  
  const hasLimitedAvailability = useCallback(() => {
    if (!ticketData) return false;
    return ticketData.ticketTypes.some(type => type.quantity > 0 && type.quantity < 20);
  }, [ticketData]);
  
  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  
  // Header animation
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
  
  // Load ticket data
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
  
  // Check if any tickets are available
  const hasAvailableTickets = getTotalTicketsAvailable() > 0;
  
  return (
    <View style={styles.container}>
      {/* Order Modal */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!orderProcessing) setShowOrderModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {orderComplete ? (
              <View style={styles.orderCompleteContainer}>
                <Ionicons name="checkmark-circle" size={70} color="#22C55E" />
                <Text style={styles.orderCompleteTitle}>Order Successful!</Text>
                <Text style={styles.orderCompleteText}>
                  Your tickets have been reserved and will be delivered to your email shortly.
                </Text>
              </View>
            ) : orderProcessing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.processingText}>Processing your order...</Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Your Order</Text>
                  <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalDivider} />
                
                <Text style={styles.orderSummaryTitle}>Order Summary</Text>
                {Object.entries(selectedTickets).map(([type, quantity]) => 
                  quantity > 0 && (
                    <View key={`order-${type}`} style={styles.modalItemRow}>
                      <Text style={styles.modalItemText}>{type} × {quantity}</Text>
                      <Text style={styles.modalItemPrice}>
                        {formatPrice(parseFloat(ticketData.ticketTypes.find(t => t.type === type)?.price || "0") * quantity)} MAD
                      </Text>
                    </View>
                  )
                )}
                
                {promoDiscount > 0 && (
                  <View style={styles.modalItemRow}>
                    <View style={styles.discountLabelContainer}>
                      <Ionicons name="pricetag" size={16} color="#22C55E" />
                      <Text style={styles.modalDiscountLabel}>Discount ({promoDiscount * 100}%)</Text>
                    </View>
                    <Text style={styles.modalDiscountValue}>
                      -{formatPrice(totalPrice / (1 - promoDiscount) * promoDiscount)} MAD
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalDivider} />
                
                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>Total Amount</Text>
                  <Text style={[styles.modalTotalValue, { color: categoryColor }]}>
                    {formatPrice(totalPrice)} MAD
                  </Text>
                </View>
                
                {orderError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#FF4757" />
                    <Text style={styles.errorText}>{orderError}</Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[styles.placeOrderButton, { backgroundColor: categoryColor }]}
                  onPress={createOrder}
                >
                  <Text style={styles.placeOrderText}>Place Order</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelOrderButton}
                  onPress={() => setShowOrderModal(false)}
                >
                  <Text style={styles.cancelOrderText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Fixed button at the bottom */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.fixedBuyButton, 
            { 
              backgroundColor: hasAvailableTickets ? categoryColor : '#CCCCCC',
              opacity: hasAvailableTickets ? 1 : 0.7
            }
          ]}
          onPress={buyTicket}
          disabled={!hasAvailableTickets || Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0) === 0}
        >
          <Text style={styles.buyButtonText}>
            {hasAvailableTickets ? `Buy Tickets - ${formatPrice(totalPrice)} MAD` : 'Sold Out'}
          </Text>
          {hasAvailableTickets && (
            <Ionicons name="ticket-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{ticketData.description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Ticket Options</Text>
            {ticketData.ticketTypes.map((type, index) => (
              <View key={`${type.type}-${index}`} style={styles.ticketTypeContainer}>
                <View style={styles.ticketTypeInfo}>
                  <Text style={styles.ticketTypeName}>{type.type}</Text>
                  <Text style={[styles.ticketTypePrice, { color: categoryColor }]}>
                    {type.price} MAD
                  </Text>
                </View>
                
                <View style={styles.ticketQuantitySection}>
                  <Text style={styles.availabilityText}>
                    {type.quantity > 0 
                      ? `${type.quantity} available` 
                      : 'Sold out'}
                  </Text>
                  
                  {type.quantity > 0 && (
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity 
                        style={[styles.quantityButton, selectedTickets[type.type] <= 0 && styles.quantityButtonDisabled]} 
                        onPress={() => handleTicketQuantityChange(index, Math.max(0, (selectedTickets[type.type] || 0) - 1))}
                        disabled={selectedTickets[type.type] <= 0}
                      >
                        <Ionicons name="remove" size={16} color={selectedTickets[type.type] <= 0 ? "#B0B0B0" : "#FFFFFF"} />
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityText}>{selectedTickets[type.type] || 0}</Text>
                      
                      <TouchableOpacity 
                        style={[styles.quantityButton, (selectedTickets[type.type] || 0) >= type.quantity && styles.quantityButtonDisabled]} 
                        onPress={() => handleTicketQuantityChange(index, Math.min(type.quantity, (selectedTickets[type.type] || 0) + 1))}
                        disabled={(selectedTickets[type.type] || 0) >= type.quantity}
                      >
                        <Ionicons name="add" size={16} color={(selectedTickets[type.type] || 0) >= type.quantity ? "#B0B0B0" : "#FFFFFF"} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {type.quantity < 20 && type.quantity > 0 && (
                  <Text style={styles.limitedText}>Limited tickets remaining!</Text>
                )}
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.promoContainer}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={[styles.promoButton, { backgroundColor: categoryColor }]}
                  onPress={applyPromoCode}
                >
                  <Text style={styles.promoButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
              
              {promoDiscount > 0 && (
                <View style={styles.discountBadge}>
                  <Ionicons name="pricetag" size={16} color="#FFFFFF" />
                  <Text style={styles.discountText}>{promoDiscount * 100}% OFF Applied</Text>
                </View>
              )}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.orderSummary}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              {Object.entries(selectedTickets).map(([type, quantity]) => 
                quantity > 0 && (
                  <View key={type} style={styles.summaryRow}>
                    <Text style={styles.summaryText}>{type} × {quantity}</Text>
                    <Text style={styles.summaryPrice}>
                      {formatPrice(parseFloat(ticketData.ticketTypes.find(t => t.type === type)?.price || "0") * quantity)} MAD
                    </Text>
                  </View>
                )
              )}
              
              {promoDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>Discount</Text>
                  <Text style={styles.discountValue}>-{formatPrice(totalPrice / (1 - promoDiscount) * promoDiscount)} MAD</Text>
                </View>
              )}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={[styles.totalValue, { color: categoryColor }]}>
                  {formatPrice(totalPrice)} MAD
                </Text>
              </View>
            </View>
            
            {/* Space at the bottom for better UX and to avoid nav bar overlap */}
            <View style={{ height: 20 }} />
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // All your existing styles here...
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFound: {
    fontSize: 18,
    color: '#4A5568',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100, // Extra padding at bottom for fixed buy button
  },
  scrollContent: {
    paddingBottom: 80, // Space for the fixed button
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#4A5568',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  ticketTypeContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketTypeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  ticketTypePrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ticketQuantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    color: '#718096',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
    paddingHorizontal: 6,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 18,
    textAlign: 'center',
  },
  limitedText: {
    color: '#F56565',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  promoContainer: {
    marginBottom: 16,
  },
  promoInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#2D3748',
    marginRight: 12,
  },
  promoButton: {
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderSummary: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#4A5568',
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
  },
  discountLabel: {
    fontSize: 15,
    color: '#22C55E',
  },
  discountValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#22C55E',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  fixedBuyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalItemText: {
    fontSize: 15,
    color: '#4A5568',
  },
  modalItemPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
  },
  discountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDiscountLabel: {
    fontSize: 15,
    color: '#22C55E',
    marginLeft: 4,
  },
  modalDiscountValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#22C55E',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  modalTotalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3748',
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeOrderButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelOrderButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  cancelOrderText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4757',
    marginLeft: 8,
  },
  orderCompleteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  orderCompleteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  orderCompleteText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C63FF',
  }
});
