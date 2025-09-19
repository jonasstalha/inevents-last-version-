import { fetchTicketById } from '@/src/firebase/clientTicketsService';
import { createOrder } from '@/src/firebase/orderService';
import { Ticket } from '@/src/models/types';
import { AntDesign, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeInUp,
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

// This is a simplified version with direct date processing in transformTicketData

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

// Helper functions for order processing
const calculateSubtotal = (ticketData: TicketDataUI, quantities: number[]): number => {
  if (ticketData.ticketTypes && ticketData.ticketTypes.length > 0) {
    return ticketData.ticketTypes.reduce((sum: number, type: any, index: number) => {
      return sum + (parseFloat(type.price) * (quantities[index] || 0));
    }, 0);
  } else if (ticketData.quantity) {
    return ticketData.price * ticketData.quantity;
  }
  return 0;
};

const calculateFees = (ticketData: TicketDataUI, quantities: number[]): number => {
  // Assuming a service fee of 5% of the subtotal
  return Math.round(calculateSubtotal(ticketData, quantities) * 0.05);
};

const calculateTotal = (ticketData: TicketDataUI, quantities: number[]): number => {
  return calculateSubtotal(ticketData, quantities) + calculateFees(ticketData, quantities);
};

const hasSelectedTickets = (quantities: number[]): boolean => {
  return quantities.some(quantity => quantity > 0);
};

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
  availableTickets: number;
  rating: number;
  artistId: string;
  createdAt: any;
  category: string;
  status: string;
}

export default function TicketDetailScreen() {
  const { ticket } = useLocalSearchParams();
  const router = useRouter();
  const [ticketData, setTicketData] = useState<TicketDataUI | null>(null);
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
        const transformedTicket = transformTicketData(fetchedTicket);
        setTicketData(transformedTicket);
        
        // Initialize selected quantities array separately
        if (transformedTicket.ticketTypes) {
          setSelectedQuantities(Array(transformedTicket.ticketTypes.length).fill(0));
        }
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
  
  // Show checkout modal with order summary
  const showCheckoutModal = () => {
    // Make sure there are tickets selected
    if (!hasSelectedTickets(selectedQuantities)) {
      Alert.alert('Selection Required', 'Please select at least one ticket');
      return;
    }

    // Check if user is logged in
    if (!auth.currentUser) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to purchase tickets.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Login',
            onPress: () => router.push('/auth')
          }
        ]
      );
      return;
    }

    // Show checkout modal
    setCheckoutModalVisible(true);
  };

  // Process and submit the order to Firebase
  const processOrder = async () => {
    try {
      setOrderProcessing(true);

      // Verify user is logged in again (extra security)
      if (!auth.currentUser) {
        Alert.alert(
          'Authentication Required',
          'Please log in to complete your purchase',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/auth') }
          ]
        );
        setOrderProcessing(false);
        return;
      }

      // Prepare ticket quantities
      // Since we removed the fallback dummy tickets, we always have ticketTypes if we got here
      const ticketQuantities = ticketData.ticketTypes.map((type: any, index: number) => ({
        type: type.type,
        price: parseFloat(type.price),
        quantity: selectedQuantities[index]
      })).filter((item: any) => item.quantity > 0);

      // Calculate total tickets ordered
      const totalTicketsOrdered = ticketQuantities.reduce((sum: number, item: {quantity: number}) => sum + item.quantity, 0);
      
      // Ensure tickets are available
      if (totalTicketsOrdered > ticketData.availableTickets) {
        Alert.alert(
          'Not Enough Tickets',
          `Sorry, only ${ticketData.availableTickets} tickets are available for this event.`
        );
        setOrderProcessing(false);
        return;
      }

      // Create order in Firebase
      const orderInput = {
        ticketId: ticketData.id,
        artistId: ticketData.artistId,
        ticketName: ticketData.title,
        clientName: auth.currentUser.displayName || undefined,
        totalPrice: calculateTotal(ticketData, selectedQuantities),
        ticketQuantities,
        specialRequests
      };

      const newOrderId = await createOrder(orderInput);
      setOrderId(newOrderId);
      
      // Hide checkout modal and show success modal
      setCheckoutModalVisible(false);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Processing Error', 
        'We encountered an issue while processing your order. Please try again or contact support if the problem persists.'
      );
    } finally {
      setOrderProcessing(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 80 }} // Add extra padding at bottom for nav bar
      >
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Image source={ticketData.image} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          
          {/* Floating action buttons at top */}
          <View style={styles.headerActions}>
            {/* Back button */}
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.rightHeaderActions}>
              {/* Favorite button */}
              <TouchableOpacity style={styles.headerActionButton}>
                <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              
              {/* Share button */}
              <TouchableOpacity style={styles.headerActionButton}>
                <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bottom header content with date and category */}
          <View style={styles.headerBottomContent}>
            <View style={styles.eventDateBadge}>
              <Ionicons name="calendar" size={16} color="#FFFFFF" />
              <Text style={styles.eventDateText}>{formatDate(ticketData.date)}</Text>
            </View>
            
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Ionicons name={(categoryInfo.icon as any)} size={16} color="#FFFFFF" />
              <Text style={styles.categoryText}>{categoryInfo.name}</Text>
            </View>
          </View>
        </Animated.View>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.eventTitleContainer}>
            <Text style={styles.title}>{ticketData.title}</Text>
            <View style={styles.eventStatusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.eventStatusText}>Open</Text>
            </View>
          </Animated.View>
          
          <View style={styles.metaInfoContainer}>
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#6C63FF" />
                <View>
                  <Text style={styles.metaLabel}>Location</Text>
                  <Text style={styles.metaText}>{ticketData.venue}, {ticketData.city}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
                <View>
                  <Text style={styles.metaLabel}>Date & Time</Text>
                  <Text style={styles.metaText}>{formatDate(ticketData.date)} | {ticketData.time}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.descriptionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#1E293B" />
              <Text style={styles.sectionHeaderText}>Event Details</Text>
            </View>
            <Text style={styles.description}>{ticketData.description}</Text>
          </View>
          
          {/* Checkout Modal */}
          <Modal
            transparent={true}
            visible={checkoutModalVisible}
            animationType="slide"
            onRequestClose={() => setCheckoutModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View 
                entering={FadeInUp.springify()}
                style={[styles.modalContent, { height: '90%' }]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Complete Your Purchase</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setCheckoutModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                {/* Progress Indicator */}
                <View style={styles.checkoutProgress}>
                  <View style={styles.progressStepCompleted}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.progressTextCompleted}>Select Tickets</Text>
                  </View>
                  <View style={styles.progressLine} />
                  <View style={styles.progressStepActive}>
                    <View style={styles.progressIndicatorActive}>
                      <Text style={styles.progressIndicatorText}>2</Text>
                    </View>
                    <Text style={styles.progressTextActive}>Review & Pay</Text>
                  </View>
                  <View style={styles.progressLine} />
                  <View style={styles.progressStep}>
                    <View style={styles.progressIndicator}>
                      <Text style={styles.progressIndicatorText}>3</Text>
                    </View>
                    <Text style={styles.progressText}>Confirmation</Text>
                  </View>
                </View>
                
                <ScrollView 
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 70 }} // Additional padding for content
                >
                  {/* Event Summary */}
                  <View style={styles.eventSummary}>
                    <Image source={ticketData.image} style={styles.checkoutImage} />
                    <View style={styles.eventSummaryContent}>
                      <Text style={styles.checkoutEventTitle}>{ticketData.title}</Text>
                      <Text style={styles.checkoutEventDate}>
                        {formatDate(ticketData.date)} at {ticketData.time}
                      </Text>
                      <Text style={styles.checkoutEventLocation}>
                        {ticketData.venue}, {ticketData.city}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Order Details */}
                  <Text style={styles.sectionTitle}>Order Details</Text>
                  <View style={styles.orderDetailsList}>
                    {ticketData.ticketTypes && ticketData.ticketTypes.length > 0 ? (
                      ticketData.ticketTypes.map((type: any, index: number) => (
                        selectedQuantities[index] > 0 && (
                          <View key={index} style={styles.orderDetailItem}>
                            <View style={styles.orderDetailRow}>
                              <Text style={styles.orderItemName}>{type.type}</Text>
                              <Text style={styles.orderItemPrice}>
                                {type.price} MAD x {selectedQuantities[index]}
                              </Text>
                            </View>
                            <Text style={styles.orderItemSubtotal}>
                              {parseFloat(type.price) * selectedQuantities[index]} MAD
                            </Text>
                          </View>
                        )
                      ))
                    ) : (
                      <View style={styles.orderDetailItem}>
                        <View style={styles.orderDetailRow}>
                          <Text style={styles.orderItemName}>Standard Entry</Text>
                          <Text style={styles.orderItemPrice}>
                            {ticketData.price} MAD x {ticketData.quantity}
                          </Text>
                        </View>
                        <Text style={styles.orderItemSubtotal}>
                          {ticketData.price * ticketData.quantity} MAD
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Service Fee */}
                  <View style={styles.orderDetailItem}>
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.orderItemName}>Service Fee</Text>
                      <Text style={styles.orderItemPrice}>{calculateFees(ticketData, selectedQuantities)} MAD</Text>
                    </View>
                  </View>
                  
                  {/* Total */}
                  <View style={styles.orderTotalContainer}>
                    <Text style={styles.orderTotalLabel}>Total</Text>
                    <Text style={styles.orderTotalAmount}>{calculateTotal(ticketData, selectedQuantities)} MAD</Text>
                  </View>
                  
                  {/* Special Requests */}
                  <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
                  <TextInput
                    style={styles.specialRequestsInput}
                    placeholder="Any specific requirements for your tickets..."
                    multiline={true}
                    numberOfLines={3}
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                  />
                  
                  {/* Payment Terms */}
                  <View style={styles.paymentTerms}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />
                    <Text style={styles.paymentTermsText}>
                      Secure payment • Terms & conditions apply
                    </Text>
                  </View>

                  {/* Checkout Button */}
                  <TouchableOpacity
                    style={[styles.checkoutButton, orderProcessing && styles.disabledButton]}
                    disabled={orderProcessing}
                    onPress={processOrder}
                  >
                    {orderProcessing ? (
                      <>
                        <ActivityIndicator color="#FFF" size="small" />
                        <Text style={[styles.checkoutButtonText, {marginLeft: 8}]}>Processing...</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.checkoutButtonText}>Secure My Tickets Now</Text>
                        <FontAwesome name="credit-card" size={18} color="#FFF" style={styles.checkoutButtonIcon} />
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>
          
          {/* Success Modal */}
          <Modal
            transparent={true}
            visible={successModalVisible}
            animationType="fade"
            onRequestClose={() => setSuccessModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              {/* Confetti Animation (render conditionally for performance) */}
              {successModalVisible && (
                <>
                  {[...Array(20)].map((_, i) => (
                    <Animated.View
                      key={i}
                      entering={FadeInDown
                        .delay(i * 50)
                        .springify()
                        .withInitialValues({ transform: [{ translateY: -400 }] })}
                      style={[
                        styles.confettiPiece,
                        {
                          left: `${Math.random() * 100}%`,
                          backgroundColor: [
                            '#FF6B6B', '#4ECDC4', '#FFD166', 
                            '#06D6A0', '#118AB2', '#9B5DE5', 
                            '#F15BB5', '#00BBF9', '#6C63FF'
                          ][Math.floor(Math.random() * 9)],
                          width: Math.random() * 10 + 5,
                          height: Math.random() * 10 + 5,
                          transform: [
                            { rotate: `${Math.random() * 360}deg` },
                            { scale: Math.random() * 0.5 + 0.5 }
                          ]
                        }
                      ]}
                    />
                  ))}
                </>
              )}
              
              <Animated.View 
                entering={FadeInUp.delay(300).springify()}
                style={[styles.modalContent, styles.successModalContent]}
              >
                <Animated.View 
                  entering={FadeInDown.delay(500)
                    .springify()
                    .withInitialValues({ transform: [{ scale: 0 }] })
                  }
                  style={styles.successIconContainer}
                >
                  <View style={styles.successIconOuter}>
                    <AntDesign name="checkcircle" size={60} color="#4CAF50" />
                  </View>
                </Animated.View>
                
                <Animated.Text 
                  entering={FadeInUp.delay(700).springify()}
                  style={styles.successTitle}
                >
                  Purchase Successful!
                </Animated.Text>
                
                <Animated.Text 
                  entering={FadeInUp.delay(800).springify()}
                  style={styles.successMessage}
                >
                  Your ticket order has been confirmed. You will receive a confirmation email shortly.
                </Animated.Text>
                
                <Animated.Text 
                  entering={FadeInUp.delay(900).springify()}
                  style={styles.orderIdText}
                >
                  Order ID: {orderId}
                </Animated.Text>
                
                <Animated.View entering={FadeInUp.delay(1000).springify()}>
                  <TouchableOpacity
                    style={[styles.successButton, styles.viewTicketsButton]}
                    onPress={() => {
                      setSuccessModalVisible(false);
                      router.push('/(client)/profile');
                    }}
                  >
                    <Text style={styles.successButtonText}>View My Tickets</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.View entering={FadeInUp.delay(1100).springify()}>
                  <TouchableOpacity
                    style={[styles.successButton, styles.continueButton]}
                    onPress={() => {
                      setSuccessModalVisible(false);
                      router.back();
                    }}
                  >
                    <Text style={styles.continueButtonText}>Continue Exploring</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </View>
          </Modal>
          {/* Ticket Types Section */}
          {ticketData.ticketTypes && ticketData.ticketTypes.length > 0 && (
            <>
                <Text style={styles.sectionTitle}>Ticket Options</Text>
                {ticketData.ticketTypes.map((type: any, index: number) => (
                <View key={index} style={styles.ticketTypeCard}>
                  <View style={styles.ticketTypeHeader}>
                  <View style={styles.ticketTypeInfo}>
                    <Text style={styles.ticketTypeName}>{type.type}</Text>
                    <Text style={styles.ticketTypeDescription}>
                    {type.description || (type.type.includes('VIP') ? 'Special seating with exclusive perks' : 'General admission with standard seating')}
                    </Text>
                  </View>
                  <Text style={styles.ticketTypePrice}>{type.price} MAD</Text>
                  </View>
                  
                  <View style={styles.ticketTypeFooter}>
                  <View style={styles.ticketAvailability}>
                    <Ionicons name="ticket-outline" size={16} color="#64748B" />
                    <Text style={styles.ticketAvailabilityText}>
                    {ticketData.availableTickets} available
                    </Text>
                  </View>
                  
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity 
                    style={[styles.quantityButton, 
                      selectedQuantities[index] <= 0 && styles.disabledQuantityButton]}
                    disabled={selectedQuantities[index] <= 0}
                    onPress={() => {
                      setSelectedQuantities(prev => {
                      const newQuantities = [...prev];
                      if (newQuantities[index] > 0) {
                        newQuantities[index] = newQuantities[index] - 1;
                      }
                      return newQuantities;
                      });
                    }}
                    >
                    <Ionicons name="remove" size={20} color={selectedQuantities[index] <= 0 ? "#A0AEC0" : "#6C63FF"} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>
                    {selectedQuantities[index] || 0}
                    </Text>
                    <TouchableOpacity 
                    style={[styles.quantityButton, 
                      selectedQuantities[index] >= Math.min(10, ticketData.availableTickets) && styles.disabledQuantityButton]}
                    disabled={selectedQuantities[index] >= Math.min(10, ticketData.availableTickets)}
                    onPress={() => {
                      setSelectedQuantities(prev => {
                      const newQuantities = [...prev];
                      if (newQuantities[index] < Math.min(10, ticketData.availableTickets)) {
                        newQuantities[index] = newQuantities[index] + 1;
                      }
                      return newQuantities;
                      });
                    }}
                    >
                    <Ionicons name="add" size={20} color={selectedQuantities[index] >= Math.min(10, ticketData.availableTickets) ? "#A0AEC0" : "#6C63FF"} />
                    </TouchableOpacity>
                  </View>
                  </View>
                </View>
                ))}
              {ticketData.ticketTypes.map((type: any, index: number) => (
                <View key={index} style={styles.ticketTypeCard}>
                  <View style={styles.ticketTypeHeader}>
                    <View style={styles.ticketTypeInfo}>
                      <Text style={styles.ticketTypeName}>{type.type}</Text>
                      <Text style={styles.ticketTypeDescription}>
                        {type.description || (type.type.includes('VIP') ? 'Special seating with exclusive perks' : 'General admission with standard seating')}
                      </Text>
                    </View>
                    <Text style={styles.ticketTypePrice}>{type.price} MAD</Text>
                  </View>
                  
                  <View style={styles.ticketTypeFooter}>
                    <View style={styles.ticketAvailability}>
                      <Ionicons name="ticket-outline" size={16} color="#64748B" />
                      <Text style={styles.ticketAvailabilityText}>
                        {ticketData.availableTickets} available
                      </Text>
                    </View>
                  
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity 
                        style={[styles.quantityButton, 
                          (selectedQuantities[index] <= 0) && styles.disabledQuantityButton]}
                        disabled={selectedQuantities[index] <= 0}
                        onPress={() => {
                          if (selectedQuantities[index] > 0) {
                            const newQuantities = [...selectedQuantities];
                            newQuantities[index] = newQuantities[index] - 1;
                            setSelectedQuantities(newQuantities);
                          }
                        }}
                      >
                        <Ionicons name="remove" size={20} color={(selectedQuantities[index] <= 0) ? "#A0AEC0" : "#6C63FF"} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>
                        {selectedQuantities[index] || 0}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.quantityButton, 
                          (selectedQuantities[index] >= Math.min(10, ticketData.availableTickets)) && styles.disabledQuantityButton]}
                        disabled={selectedQuantities[index] >= Math.min(10, ticketData.availableTickets)}
                        onPress={() => {
                          if (selectedQuantities[index] < Math.min(10, ticketData.availableTickets)) {
                            const newQuantities = [...selectedQuantities];
                            newQuantities[index] = newQuantities[index] + 1;
                            setSelectedQuantities(newQuantities);
                          }
                        }}
                      >
                        <Ionicons name="add" size={20} color={(selectedQuantities[index] >= Math.min(10, ticketData.availableTickets)) ? "#A0AEC0" : "#6C63FF"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Order Summary - only shown if ticket types are available */}
          {ticketData.ticketTypes && ticketData.ticketTypes.length > 0 && (
            <>
              <Animated.View 
                entering={FadeInDown.delay(200).springify()}
                style={styles.orderSummaryContainer}
              >
                <View style={styles.orderSummary}>
                  <View style={styles.orderSummaryHeader}>
                    <View style={styles.orderTitleContainer}>
                      <Ionicons name="receipt-outline" size={20} color="#6C63FF" style={styles.orderSummaryIcon} />
                      <Text style={styles.sectionTitle}>Order Summary</Text>
                    </View>
                    {hasSelectedTickets(selectedQuantities) && (
                      <View style={styles.selectedTicketsCount}>
                        <Ionicons name="ticket" size={14} color="#6C63FF" />
                        <Text style={styles.selectedTicketsText}>
                          {selectedQuantities.reduce((sum, qty) => sum + qty, 0)} 
                          ticket{selectedQuantities.reduce((sum, qty) => sum + qty, 0) !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.summaryCardContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>
                        {calculateSubtotal(ticketData, selectedQuantities)} MAD
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelWithInfo}>
                        <Text style={styles.summaryLabel}>Service Fee</Text>
                        <TouchableOpacity style={styles.infoButton}>
                          <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.summaryValue}>{calculateFees(ticketData, selectedQuantities)} MAD</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, styles.totalLabel]}>Total</Text>
                      <Text style={styles.totalValue}>
                        {calculateTotal(ticketData, selectedQuantities)} MAD
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.availabilityRow}>
                    {ticketData.availableTickets < 50 && (
                      <View style={styles.availabilityBadge}>
                        <Ionicons name="time-outline" size={14} color="#FF3B30" />
                        <Text style={styles.availability}>
                          Only {ticketData.availableTickets} left
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>

              <Animated.View 
                entering={FadeInDown.delay(300).springify()}
                style={styles.completeOrderContainer}
              >
                {hasSelectedTickets(selectedQuantities) ? (
                  <LinearGradient
                    colors={['#6C63FF', '#5A51D8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <TouchableOpacity 
                      style={styles.buyButton}
                      onPress={showCheckoutModal}
                    >
                      <View style={styles.buyButtonContent}>
                        <Ionicons name="cart-outline" size={22} color="#FFFFFF" style={styles.buyButtonIcon} />
                        <Text style={styles.buyButtonText}>Secure My Tickets</Text>
                      </View>
                      <View style={styles.arrowContainer}>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                ) : (
                  <View style={styles.selectTicketsPromptContainer}>
                    <Ionicons name="ticket-outline" size={24} color="#64748B" />
                    <Text style={styles.selectTicketPrompt}>Select tickets to continue</Text>
                  </View>
                )}
              </Animated.View>
            </>
          )}
          
          {/* Display a message if no tickets are available */}
          {(!ticketData.ticketTypes || ticketData.ticketTypes.length === 0) && (
            <View style={styles.centered}>
              <Ionicons name="alert-circle-outline" size={40} color="#64748B" />
              <Text style={styles.notFound}>No tickets are currently available for this event</Text>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
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
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  image: {
    width: '100%',
    height: 280, // Increased height for better visual impact
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160, // Taller overlay for more gradient effect
  },
  headerActions: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  rightHeaderActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBottomContent: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  eventDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  eventDateText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  eventStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  eventStatusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  metaInfoContainer: {
    marginBottom: 24,
  },
  metaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFF3F9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 10,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 10,
  },
  descriptionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 5,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  availability: {
    fontSize: 14,
    color: '#FF4757',
  },
  purchaseButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  notFound: {
    fontSize: 20,
    color: '#FF4757',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  // Ticket selection and order styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 14,
  },
  ticketTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketTypeInfo: {
    flex: 1,
    marginRight: 10,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  ticketTypeDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  ticketTypePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  ticketTypeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ticketAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketAvailabilityText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledQuantityButton: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  orderSummaryContainer: {
    marginVertical: 20,
  },
  orderSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderSummaryIcon: {
    marginRight: 8,
  },
  selectedTicketsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF20',
  },
  selectedTicketsText: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  summaryCardContent: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  summaryLabelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 2,
    marginLeft: 5,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  completeOrderContainer: {
    marginTop: 15,
    marginBottom: 40, // Add bottom margin to prevent button from being hidden by navigation bar
  },
  gradientButton: {
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buyButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyButtonIcon: {
    marginRight: 10,
  },
  arrowContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectTicketsPromptContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  selectTicketPrompt: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  totalLabel: {
    fontWeight: '600',
    color: '#1E293B',
    fontSize: 16,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 50, // Increased padding bottom
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  checkoutProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  progressStep: {
    alignItems: 'center',
    width: 80,
  },
  progressStepActive: {
    alignItems: 'center',
    width: 80,
  },
  progressStepCompleted: {
    alignItems: 'center',
    width: 80,
  },
  progressIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressIndicatorActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressIndicatorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
  },
  progressTextActive: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
  },
  progressTextCompleted: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#E2E8F0',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    padding: 20,
    paddingBottom: 50, // Add extra padding at the bottom for navigation bar
  },
  
  // Event summary in checkout modal
  eventSummary: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  checkoutImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  eventSummaryContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  checkoutEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  checkoutEventDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 3,
  },
  checkoutEventLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  
  // Order details in checkout
  orderDetailsList: {
    marginBottom: 15,
  },
  orderDetailItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#64748B',
  },
  orderItemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C63FF',
    textAlign: 'right',
  },
  orderTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  orderTotalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  orderTotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  
  // Special requests input
  specialRequestsInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  // Checkout button
  checkoutButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  checkoutButtonIcon: {
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  paymentTerms: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  paymentTermsText: {
    color: '#64748B',
    fontSize: 13,
    marginLeft: 5,
    textAlign: 'center',
  },
  
  // Success modal
  successModalContent: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 40,
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
    borderRadius: 3,
    opacity: 0.7,
  },
  successIconContainer: {
    marginBottom: 25,
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  orderIdText: {
    fontSize: 14,
    color: '#6C63FF',
    marginBottom: 25,
    fontWeight: '500',
  },
  successButton: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 8,
    width: '90%',
    alignItems: 'center',
  },
  viewTicketsButton: {
    backgroundColor: '#6C63FF',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  continueButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  }
}); 