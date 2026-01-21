import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../../src/context/AuthContext';
import { fetchAllTickets } from '../../../../src/firebase/clientTicketsService';
import { createOrder } from '../../../../src/firebase/orderService';

// Fallback images
const ticketImages = [
  require('../../../../assets/images/first.jpeg'),
  require('../../../../assets/images/fourth.jpeg'),
  require('../../../../assets/images/secend.jpg'),
  require('../../../../assets/images/third.jpg'),
];

// Define ticket interface
interface TicketData {
  id: string;
  name?: string;
  eventName?: string;
  title?: string;
  city?: string;
  venue?: string;
  price: number;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  flyer?: string;
  artistName?: string;
  artistPhoto?: string;
  artistId?: string;
  ticketTypes?: { type: string; price: string | number }[];
  availableTickets?: number;
  eventDate?: any;
  createdAt?: any;
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

// Helper function to get random placeholder image
const getRandomPlaceholderImage = () => {
  const placeholders = ticketImages;
  return placeholders[Math.floor(Math.random() * placeholders.length)];
};

export default function TicketDetailScreen() {
  const { ticket } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Personal information form states
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: '',
    specialRequests: ''
  });

  useEffect(() => {
    fetchTicketData();
    startPulseAnimation();
  }, [ticket]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      console.log('🎫 Fetching ticket details for ID:', ticket);
      
      // Fetch all tickets from Firebase
      const allTickets = await fetchAllTickets();
      console.log(`📊 Found ${allTickets.length} total tickets`);
      
      // Find the specific ticket
      const foundTicket: any = allTickets.find((t: any) => t.id === ticket);
      
      if (foundTicket) {
        console.log('✅ Found ticket:', foundTicket.name || foundTicket.eventName || 'Unnamed');
        
        // Transform the ticket data
        const locationParts = foundTicket.location?.split(',') || [];
        const city = locationParts[0]?.trim() || 'Unknown City';
        const venue = locationParts[1]?.trim() || locationParts[0]?.trim() || 'Unknown Venue';
        
        // Format date
        let eventDate = '';
        let eventTime = '20:00';
        if (foundTicket.eventDate) {
          const date = foundTicket.eventDate.toDate ? foundTicket.eventDate.toDate() : new Date(foundTicket.eventDate);
          eventDate = date.toISOString().split('T')[0];
          eventTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else {
          eventDate = new Date().toISOString().split('T')[0];
        }
        
        const transformedTicket: TicketData = {
          id: foundTicket.id,
          name: foundTicket.name,
          eventName: foundTicket.eventName,
          title: foundTicket.name || foundTicket.eventName || foundTicket.title || 'Unnamed Event',
          city,
          venue,
          price: typeof foundTicket.price === 'number' ? foundTicket.price : parseFloat(foundTicket.price) || 0,
          date: eventDate,
          time: eventTime,
          location: foundTicket.location,
          description: foundTicket.description || 'No description available.',
          flyer: foundTicket.flyer,
          artistName: foundTicket.artistName || 'Unknown Artist',
          artistPhoto: foundTicket.artistPhoto,
          artistId: foundTicket.artistId || foundTicket.userId || 'unknown',
          ticketTypes: foundTicket.ticketTypes || [],
          availableTickets: foundTicket.availableTickets || 100,
          eventDate: foundTicket.eventDate,
          createdAt: foundTicket.createdAt
        };
        
        setTicketData(transformedTicket);
        // Auto-select first ticket type if available
        if (transformedTicket.ticketTypes && transformedTicket.ticketTypes.length > 0) {
          setSelectedTicketType(0);
        }
      } else {
        console.log('❌ Ticket not found with ID:', ticket);
        setError('Ticket not found');
      }
    } catch (err) {
      console.error('❌ Error fetching ticket:', err);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!ticketData || selectedTicketType === null) return 0;
    if (ticketData.ticketTypes && ticketData.ticketTypes.length > 0) {
      const selectedPrice = ticketData.ticketTypes[selectedTicketType]?.price;
      const price = typeof selectedPrice === 'number' ? selectedPrice : parseFloat(selectedPrice?.toString() || '0');
      return price * quantity;
    }
    return ticketData.price * quantity;
  };

  // Handle purchase
  const handlePurchase = () => {
    animateButtonPress();
    
    if (!ticketData) return;
    
    if (ticketData.ticketTypes && ticketData.ticketTypes.length > 0 && selectedTicketType === null) {
      Alert.alert('Select Ticket Type', 'Please select a ticket type before proceeding.');
      return;
    }

    setShowPurchaseModal(true);
  };

  // Confirm purchase - show personal info form first
  const confirmPurchase = async () => {
    setShowPurchaseModal(false);
    setShowPersonalInfoForm(true);
  };

  // Handle form submission with personal info
  const submitOrderWithPersonalInfo = async () => {
    setIsPurchasing(true);
    
    try {
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to purchase tickets.');
        setIsPurchasing(false);
        return;
      }

      if (!ticketData) {
        Alert.alert('Error', 'Ticket data not available.');
        setIsPurchasing(false);
        return;
      }

      // Validate required fields
      if (!personalInfo.fullName.trim() || !personalInfo.phone.trim() || !personalInfo.address.trim()) {
        Alert.alert('Missing Information', 'Please fill in all required fields (Full Name, Phone, Address).');
        setIsPurchasing(false);
        return;
      }

      // Check if enough tickets are available
      if (quantity > (ticketData.availableTickets || 0)) {
        Alert.alert(
          'Not Enough Tickets',
          `Sorry, only ${ticketData.availableTickets || 0} tickets are available for this event.`
        );
        setIsPurchasing(false);
        return;
      }

      // Prepare ticket quantities for order
      const ticketQuantities = [];
      if (ticketData.ticketTypes && ticketData.ticketTypes.length > 0 && selectedTicketType !== null) {
        // Specific ticket type selected
        const selectedType = ticketData.ticketTypes[selectedTicketType];
        ticketQuantities.push({
          type: selectedType.type,
          price: typeof selectedType.price === 'number' ? selectedType.price : parseFloat(selectedType.price?.toString() || '0'),
          quantity: quantity
        });
      } else {
        // General ticket
        ticketQuantities.push({
          type: 'General',
          price: ticketData.price,
          quantity: quantity
        });
      }

      // Create order in Firebase with personal info
      const orderInput = {
        ticketId: ticketData.id,
        artistId: ticketData.artistId || 'unknown',
        ticketName: ticketData.title,
        clientName: personalInfo.fullName,
        totalPrice: calculateTotal(),
        ticketQuantities,
        specialRequests: personalInfo.specialRequests,
        clientInfo: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          address: personalInfo.address,
          city: personalInfo.city,
          country: personalInfo.country
        }
      };

      const newOrderId = await createOrder(orderInput);
      
      setIsPurchasing(false);
      setShowPersonalInfoForm(false);
      
      Alert.alert(
        'Purchase Successful! 🎉',
        `Your ${quantity} ticket(s) for "${ticketData?.title}" have been purchased successfully. Total: ${calculateTotal()} MAD\n\nOrder ID: ${newOrderId}`,
        [
          {
            text: 'View My Tickets',
            onPress: () => router.push('/(client)/tickets')
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      setIsPurchasing(false);
      Alert.alert(
        'Order Processing Error', 
        'We encountered an issue while processing your order. Please try again or contact support if the problem persists.'
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading ticket details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !ticketData) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text style={styles.notFound}>{error || 'Ticket not found'}</Text>
        <Text style={styles.errorSubtext}>The ticket you're looking for doesn't exist or has been removed.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get image source
  const imageSource = ticketData.flyer 
    ? { uri: ticketData.flyer } 
    : getRandomPlaceholderImage();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(client)/tickets')} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
        </View>
      
      {/* Event Image */}
      <Image source={imageSource} style={styles.image} />
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{ticketData.title}</Text>
        
        {/* Artist Info */}
        {ticketData.artistName && (
          <View style={styles.artistRow}>
            <Ionicons name="person-outline" size={18} color="#6C63FF" />
            <Text style={styles.artistText}>by {ticketData.artistName}</Text>
          </View>
        )}
        
        {/* Location */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker" size={18} color="#6C63FF" />
          <Text style={styles.metaText}>{ticketData.venue}, {ticketData.city}</Text>
        </View>
        
        {/* Date & Time */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={18} color="#6C63FF" />
          <Text style={styles.metaText}>{formatDate(ticketData.date || '')} | {ticketData.time}</Text>
        </View>
        
        {/* Price */}
        <View style={styles.metaRow}>
          <Ionicons name="pricetag-outline" size={18} color="#6C63FF" />
          <Text style={styles.metaText}>Starting from {ticketData.price} MAD</Text>
        </View>
        
        {/* Description */}
        <Text style={styles.sectionTitle}>About this event</Text>
        <Text style={styles.description}>{ticketData.description}</Text>
        
        {/* Ticket Types */}
        {ticketData.ticketTypes && ticketData.ticketTypes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Ticket Type</Text>
            {ticketData.ticketTypes.map((ticketType, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.ticketTypeRow,
                  selectedTicketType === index && styles.selectedTicketType
                ]}
                onPress={() => setSelectedTicketType(index)}
              >
                <View style={styles.ticketTypeLeft}>
                  <Text style={[
                    styles.ticketTypeName,
                    selectedTicketType === index && styles.selectedTicketTypeName
                  ]}>
                    {ticketType.type}
                  </Text>
                  <Text style={styles.ticketTypeFeatures}>
                    {index === 0 && "General Admission"}
                    {index === 1 && "Premium seating, Fast entry"}
                    {index === 2 && "VIP lounge, Meet & greet"}
                  </Text>
                </View>
                <View style={styles.ticketTypeRight}>
                  <Text style={[
                    styles.ticketTypePrice,
                    selectedTicketType === index && styles.selectedTicketTypePrice
                  ]}>
                    {ticketType.price} MAD
                  </Text>
                  {selectedTicketType === index && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Quantity Selection */}
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => quantity > 1 && setQuantity(quantity - 1)}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? "#CBD5E1" : "#6C63FF"} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, quantity >= 10 && styles.quantityButtonDisabled]}
            onPress={() => quantity < 10 && setQuantity(quantity + 1)}
            disabled={quantity >= 10}
          >
            <Ionicons name="add" size={20} color={quantity >= 10 ? "#CBD5E1" : "#6C63FF"} />
          </TouchableOpacity>
        </View>

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {selectedTicketType !== null && ticketData.ticketTypes && ticketData.ticketTypes.length > 0
                ? `${ticketData.ticketTypes[selectedTicketType]?.type} × ${quantity}`
                : `Ticket × ${quantity}`
              }
            </Text>
            <Text style={styles.priceValue}>{calculateTotal()} MAD</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee</Text>
            <Text style={styles.priceValue}>Free</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{calculateTotal()} MAD</Text>
          </View>
        </View>
        
        {/* Availability */}
        <View style={styles.availabilitySection}>
          <View style={styles.availabilityHeader}>
            <Ionicons name="time-outline" size={20} color="#DC2626" />
            <Text style={styles.availabilityText}>
              {ticketData.availableTickets && ticketData.availableTickets < 50 
          ? `Only ${ticketData.availableTickets} tickets left!` 
          : 'Tickets Available'}
            </Text>
          </View>
          {ticketData.availableTickets && ticketData.availableTickets < 20 && (
            <Text style={styles.urgencyText}>⚡ Limited availability - Book now!</Text>
          )}
        </View>
      </View>
      </ScrollView>
      
      {/* Fixed Bottom Action Buttons */}
      <View style={styles.bottomActionContainer}>
        <Animated.View
          style={[
            styles.buyButton,
            {
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim }
              ]
            },
            (!selectedTicketType && ticketData.ticketTypes && ticketData.ticketTypes.length > 0) && styles.buyButtonDisabled
          ]}
        >
          <TouchableOpacity 
            style={styles.buyButtonTouchable}
            onPress={handlePurchase}
            disabled={!selectedTicketType && ticketData.ticketTypes && ticketData.ticketTypes.length > 0}
            activeOpacity={0.8}
          >
            <View style={styles.buyButtonContent}>
              <View style={styles.buyButtonLeft}>
                <Text style={styles.buyButtonText}>
                  Buy {quantity} Ticket{quantity > 1 ? 's' : ''}
                </Text>
                <Text style={styles.buyButtonSubtext}>
                  Total: {calculateTotal()} MAD
                </Text>
              </View>
              <View style={styles.buyButtonRight}>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Purchase Confirmation Modal */}
      <Modal
        visible={showPurchaseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Purchase</Text>
              <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalEventTitle}>{ticketData?.title}</Text>
              <Text style={styles.modalEventDetails}>
                {ticketData?.venue}, {ticketData?.city}
              </Text>
              <Text style={styles.modalEventDetails}>
                {formatDate(ticketData?.date || '')} | {ticketData?.time}
              </Text>
              
              <View style={styles.modalPriceSummary}>
                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalPriceLabel}>
                    {selectedTicketType !== null && ticketData?.ticketTypes && ticketData.ticketTypes.length > 0
                      ? `${ticketData.ticketTypes[selectedTicketType]?.type} × ${quantity}`
                      : `Ticket × ${quantity}`
                    }
                  </Text>
                  <Text style={styles.modalPriceValue}>{calculateTotal()} MAD</Text>
                </View>
                <View style={[styles.modalPriceRow, styles.modalTotalRow]}>
                  <Text style={styles.modalTotalLabel}>Total</Text>
                  <Text style={styles.modalTotalValue}>{calculateTotal()} MAD</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowPurchaseModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={confirmPurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.modalConfirmText, { marginLeft: 8 }]}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Purchase</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Personal Information Form Modal */}
      <Modal
        visible={showPersonalInfoForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPersonalInfoForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.personalInfoModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personal Information</Text>
              <TouchableOpacity onPress={() => setShowPersonalInfoForm(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={personalInfo.fullName}
                  onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, fullName: text }))}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: '#F3F4F6' }]}
                  value={personalInfo.email}
                  editable={false}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={personalInfo.phone}
                  onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phone: text }))}
                  placeholder="+212 xxx xxx xxx"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address *</Text>
                <TextInput
                  style={styles.formInput}
                  value={personalInfo.address}
                  onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, address: text }))}
                  placeholder="Street address"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    value={personalInfo.city}
                    onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, city: text }))}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.formInput}
                    value={personalInfo.country}
                    onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, country: text }))}
                    placeholder="Country"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Special Requests</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={personalInfo.specialRequests}
                  onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, specialRequests: text }))}
                  placeholder="Any special requests or notes..."
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{ticketData?.title}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {selectedTicketType !== null && ticketData?.ticketTypes && ticketData.ticketTypes.length > 0
                      ? `${ticketData.ticketTypes[selectedTicketType]?.type} × ${quantity}`
                      : `Ticket × ${quantity}`
                    }
                  </Text>
                  <Text style={styles.summaryValue}>{calculateTotal()} MAD</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{calculateTotal()} MAD</Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.formCancelButton} 
                onPress={() => setShowPersonalInfoForm(false)}
              >
                <Text style={styles.formCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.formSubmitButton} 
                onPress={submitOrderWithPersonalInfo}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.formSubmitText, { marginLeft: 8 }]}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.formSubmitText}>Complete Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200, // Increased space to ensure all content is scrollable above the fixed button
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 120, // Positioned above nav bar
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 40,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  artistText: {
    fontSize: 16,
    color: '#6C63FF',
    marginLeft: 8,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 15,
    color: '#64748B',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 8,
  },
  ticketTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedTicketType: {
    borderColor: '#6C63FF',
    backgroundColor: '#F8F7FF',
  },
  ticketTypeLeft: {
    flex: 1,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedTicketTypeName: {
    color: '#6C63FF',
  },
  ticketTypeFeatures: {
    fontSize: 14,
    color: '#64748B',
  },
  ticketTypeRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  ticketTypePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 8,
  },
  selectedTicketTypePrice: {
    color: '#6C63FF',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginHorizontal: 24,
  },
  priceSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  availabilitySection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3F2',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B91C1C',
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  wishlistButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FF',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FF',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyButton: {
    width: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyButtonTouchable: {
    flex: 1,
  },
  buyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buyButtonLeft: {
    flex: 1,
  },
  buyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  buyButtonSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E7FF',
  },
  buyButtonRight: {
    marginLeft: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalContent: {
    padding: 20,
  },
  modalEventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalEventDetails: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  modalPriceSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPriceLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalPriceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  modalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginBottom: 0,
  },
  modalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#6C63FF',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Loading and Error States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C63FF',
    marginTop: 16,
    fontWeight: '500',
  },
  notFound: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Personal Info Form Styles
  personalInfoModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    marginTop: 'auto',
  },
  formContainer: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  orderSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  formCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  formCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  formSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#6C63FF',
  },
  formSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 