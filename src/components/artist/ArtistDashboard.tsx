import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../../firebase/artistServices';
import { addServiceToFirebase, addTicketToFirebase, fetchArtistById } from '../../firebase/artistsService';
import AnalyticsPage from './AnalyticsPage';
import { useArtistStore } from './ArtistStore';
import CalendarPage from './CalendarPage';

const ArtistMobileApp = () => {
  // Error/success state for forms
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Handle navigation parameters
  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as string);
    }
    
    if (params.serviceId && params.editMode === 'true') {
      // Load service data for editing
      loadServiceForEditing(params.serviceId as string);
    }
  }, [params]);

  const {
    gigs,
    categories,
    addGig,
    updateGig,
    deleteGig,
    addCategory,
    updateCategory,
    deleteCategory,
    settings,
    toggleNotifications,
    updateLanguage,
    addPaymentMethod,
    removePaymentMethod,
    updateSecuritySettings,
    resetStore,
  } = useArtistStore();

  const [activeTab, setActiveTab] = useState('home');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ type: string; name: string } | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [credits, setCredits] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0.00);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  // State for real artist profile
  const [artistProfile, setArtistProfile] = useState({
    name: '',
    image: '',
    description: '',
    rating: 0,
    reviewsCount: 0
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // State for starter credits flag
  const [hasGivenStarterCredits, setHasGivenStarterCredits] = useState(false);

  // Fetch real artist profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      setProfileLoading(true);
      try {
        const artist = await fetchArtistById(user.uid);
        if (artist) {
          setArtistProfile({
            name: artist.name,
            image: artist.profileImage || '',
            description: artist.bio,
            rating: artist.rating,
            reviewsCount: (artist as any).reviewCount || (artist as any).reviewsCount || 0
          });
        }
      } catch (e) {
        // fallback: keep empty/default
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();

    // Initialize credits and wallet balance to 0
    // In production, this would be handled by a backend system
    if (!hasGivenStarterCredits) {
      // Start with 0 credits and 0 MAD in wallet
      setCredits(0);
      setWalletBalance(0.00);
      setHasGivenStarterCredits(true);
    }
  }, [hasGivenStarterCredits]);

  // Handle Add Funds button click
  const handleAddFunds = () => {
    setShowAddFundsModal(true);
  };

  // Helper functions to manage credits and wallet balance
  const addCredits = (amount: number) => {
    setCredits(prev => prev + amount);
  };

  const deductCredits = (amount: number) => {
    setCredits(prev => Math.max(0, prev - amount));
  };

  const addToWallet = (amount: number) => {
    setWalletBalance(prev => prev + amount);
  };

  const deductFromWallet = (amount: number) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
  };

  // Load service data for editing
  const loadServiceForEditing = async (serviceId: string) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch the service data
      const services = await fetchServicesByArtistId(currentUser.uid);
      const serviceToEdit = services.find(service => service.id === serviceId);
      
      if (serviceToEdit) {
        // Populate the form with existing service data
        setNewService({
          title: serviceToEdit.title || '',
          description: serviceToEdit.description || '',
          basePrice: serviceToEdit.basePrice?.toString() || '',
          minQuantity: '1',
          maxQuantity: '10',
          category: serviceToEdit.category || '',
          images: serviceToEdit.images || [],
          addOns: [{ name: '', price: '', type: 'checkbox' }],
          providerName: artistProfile.name,
          providerAvatar: artistProfile.image,
          rating: serviceToEdit.rating || 0,
          reviewCount: serviceToEdit.reviewCount || 0,
          isAvailable: true,
          location: '',
          defaultMessage: '',
          tags: '',
        });

        // Also populate individual states
        setServiceImages(serviceToEdit.images || []);
        setServiceLocation({ city: '' });
        
        // Set editing mode
        setEditingServiceId(serviceId);
        setActiveTab('ticket'); // Switch to the add/edit tab
      }
    } catch (error) {
      console.error('Error loading service for editing:', error);
    }
  };

  // State to track if we're editing a service
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Replace with marketplace categories from client CategorySelector
  const MARKETPLACE_CATEGORIES = [
    'Mariage',
    'Anniversaire',
    'Traiteur',
    'Musique',
    'Neggafa',
    'Conference',
    "Evenement d'entreprise",
    'Kermesse',
    'Henna',
    'Photographie',
    'Animation',
    'Decoration',
    'Buffet',
  ];

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    basePrice: '',
    minQuantity: '1',
    maxQuantity: '10',
    category: '',
    images: [] as string[],
    addOns: [
      { name: '', price: '', type: 'checkbox' },
    ],
    providerName: artistProfile.name,
    providerAvatar: artistProfile.image,
    rating: 0,
    reviewCount: 0,
    isAvailable: true,
    location: '',
    defaultMessage: '',
    tags: '',
  });
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState([
    { title: '', price: '', description: '' }
  ]);
  const [serviceLocation, setServiceLocation] = useState({ city: '' });
  const [addOns, setAddOns] = useState([
    { name: '', price: '', type: 'checkbox' },
  ]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [minQuantity, setMinQuantity] = useState('1');
  const [maxQuantity, setMaxQuantity] = useState('10');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [tags, setTags] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    ticketTypes: [{ name: 'Normal', price: '', quantity: '' }],
    flyer: null
  });

  // Image picker for service images
  const pickServiceImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setServiceImages([...serviceImages, ...result.assets.map(a => a.uri)]);
    }
  };
  const removeServiceImage = (uri: string) => {
    setServiceImages(serviceImages.filter(img => img !== uri));
  };

  // Add/remove service options
  const addServiceOption = () => {
    setServiceOptions([...serviceOptions, { title: '', price: '', description: '' }]);
  };
  const removeServiceOption = (idx: number) => {
    setServiceOptions(serviceOptions.filter((_, i) => i !== idx));
  };
  const updateServiceOption = (idx: number, field: 'title' | 'price' | 'description', value: string) => {
    const updated = [...serviceOptions];
    updated[idx][field] = value;
    setServiceOptions(updated);
  };

  // Add/remove add-ons
  const addAddOn = () => {
    setAddOns([...addOns, { name: '', price: '', type: 'checkbox' }]);
  };
  const removeAddOn = (idx: number) => {
    setAddOns(addOns.filter((_, i) => i !== idx));
  };
  const updateAddOn = (idx: number, field: 'name' | 'price' | 'type', value: string) => {
    const updated = [...addOns];
    updated[idx][field] = value;
    setAddOns(updated);
  };

  // Improve error handling
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return (error as { message: string }).message;
    }
    return 'An unknown error occurred.';
  };

  const addService = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setServiceError('You must be logged in to add a service.');
      Alert.alert('Error', 'You must be logged in to add a service.');
      return;
    }
    setServiceError('');
    setServiceSuccess('');
    if (credits < 5) {
      setServiceError('Insufficient credits! You need 5 credits to publish a service.');
      Alert.alert(
        'Insufficient Credits', 
        'You need 5 credits to publish a service. Click "Add Funds" to get more credits.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    if (!selectedCategory || !newService.title || !newService.description || !newService.basePrice) {
      setServiceError('Please fill in all required fields.');
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    // Validate basePrice
    if (!newService.basePrice || isNaN(Number(newService.basePrice))) {
      setServiceError('Service price is required and must be a valid number.');
      Alert.alert('Error', 'Service price is required and must be a valid number.');
      return;
    }

    // Log serviceData for debugging
    console.log('Constructed serviceData:', {
      title: newService.title,
      description: newService.description,
      category: selectedCategory.name,
      basePrice: Number(newService.basePrice),
      images: serviceImages,
      options: serviceOptions.map(opt => ({
        id: Date.now().toString() + Math.random(),
        title: opt.title,
        price: Number(opt.price),
        description: opt.description,
      })),
      location: serviceLocation.city || 'Unknown City',
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      artistId: currentUser.uid,
    });

    // Add missing properties to serviceData
    const serviceData = {
      title: newService.title,
      description: newService.description,
      category: selectedCategory.name,
      basePrice: Number(newService.basePrice),
      price: Number(newService.basePrice), // Add price field for compatibility
      images: serviceImages,
      options: serviceOptions.map(opt => ({
        id: Date.now().toString() + Math.random(),
        title: opt.title,
        price: Number(opt.price),
        description: opt.description,
      })),
      location: serviceLocation.city || 'Unknown City',
      city: serviceLocation.city || 'Unknown City',
      items: serviceOptions.map(opt => ({
        id: Date.now().toString() + Math.random(),
        title: opt.title,
        price: Number(opt.price),
        description: opt.description,
      })),
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      artistId: currentUser.uid,
    };
    try {
      console.log('Attempting to add service to Firebase:', serviceData);
      Alert.alert('Debug', 'Attempting to add service to Firebase. Check console for details.');
      const result = await addServiceToFirebase(currentUser.uid, serviceData);
      console.log('Service added to Firebase result:', result);
      Alert.alert('Success', 'Service added to Firebase!');
      // Fetch all services from Firebase and update local gigs state
      const allGigs = await fetchServicesByArtistId(currentUser.uid);
      allGigs.forEach(gig => delete gig.orders); // Remove orders if present for compatibility
      gigs.forEach(g => deleteGig(g.id));
      allGigs.forEach(gig => addGig({
        artistId: gig.artistId,
        title: gig.title,
        description: gig.description,
        basePrice: gig.basePrice,
        images: gig.images,
        category: gig.category,
        options: gig.options,
        location: gig.location,
        rating: gig.rating,
        reviewCount: gig.reviewCount,
        createdAt: gig.createdAt,
      }));
      deductCredits(5);
      setServiceSuccess('Service added successfully!');
      setNewService({
        title: '',
        description: '',
        basePrice: '',
        minQuantity: '1',
        maxQuantity: '10',
        category: '',
        images: [],
        addOns: [{ name: '', price: '', type: 'checkbox' }],
        providerName: artistProfile.name,
        providerAvatar: artistProfile.image,
        rating: 0,
        reviewCount: 0,
        isAvailable: true,
        location: '',
        defaultMessage: '',
        tags: '',
      });
      setServiceImages([]);
      setServiceOptions([{ title: '', price: '', description: '' }]);
      setServiceLocation({ city: '' });
      setSelectedCategory(null);
    } catch (error) {
      setServiceError('Failed to add service to Firebase.');
      console.error('Failed to add service to Firebase:', error);
      Alert.alert('Error', 'Failed to add service to Firebase: ' + getErrorMessage(error));
    }
  };

  const addEvent = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    setEventError('');
    setEventSuccess('');
    if (!currentUser) {
      setEventError('You must be logged in to add an event.');
      return;
    }
    if (credits < 10) {
      setEventError('Insufficient credits! You need 10 credits to publish an event.');
      Alert.alert(
        'Insufficient Credits', 
        'You need 10 credits to publish an event. Click "Add Funds" to get more credits.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    if (!newEvent.title || !newEvent.description || !newEvent.date) {
      setEventError('Please fill in all required fields.');
      return;
    }
    // Save event as a service (if needed)
    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      category: categories[0]?.name || '',
      basePrice: 0,
      images: [],
      options: [],
      location: '',
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      artistId: currentUser.uid,
    };
    // Save tickets to tickets subcollection
    const ticketData = newEvent.ticketTypes.map(t => ({
      ...t,
      eventTitle: newEvent.title,
      eventDate: newEvent.date,
      artistId: currentUser.uid,
    }));
    try {
      await addServiceToFirebase(currentUser.uid, eventData);
      for (const ticket of ticketData) {
        await addTicketToFirebase(currentUser.uid, ticket);
      }
      addGig(eventData);
      deductCredits(10);
      setEventSuccess('Event and tickets added successfully!');
      setNewEvent({
        title: '',
        description: '',
        date: '',
        ticketTypes: [{ name: 'Normal', price: '', quantity: '' }],
        flyer: null
      });
    } catch (error) {
      setEventError('Failed to add event or tickets to Firebase.');
    }
  };

  const addTicketType = () => {
    setNewEvent({
      ...newEvent,
      ticketTypes: [...newEvent.ticketTypes, { name: '', price: '', quantity: '' }]
    });
  };

  const updateTicketType = (index: number, field: 'name' | 'price' | 'quantity', value: string) => {
    const updatedTypes = [...newEvent.ticketTypes];
    updatedTypes[index][field] = value;
    setNewEvent({ ...newEvent, ticketTypes: updatedTypes });
  };

  // Home Page Component
  const HomePage = () => (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}> 
      {/* Profile Preview */}
      <View style={styles.profileCard}>
        <LinearGradient
          colors={['#6a0dad', '#4a148c']}
          style={styles.profileGradient}
        >
          <View style={styles.profileHeader}>
            {profileLoading ? (
              <Text style={{ color: '#fff', fontSize: 18 }}>Loading profile...</Text>
            ) : (
              <>
                <Image 
                  source={{ uri: artistProfile.image || 'https://ui-avatars.com/api/?name=Artist' }} 
                  style={styles.profileImage}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{artistProfile.name}</Text>
                  <View style={styles.ratingContainer}>
                    {/* Show 0 stars and 0 rating if no reviews, else show real stars and rating */}
                    {artistProfile.reviewsCount === 0 ? (
                      <>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Text key={i} style={styles.ratingStar}>☆</Text>
                        ))}
                        <Text style={styles.ratingText}>0.0 (0 reviews)</Text>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Text key={i} style={styles.ratingStar}>
                            {artistProfile.rating >= i + 1
                              ? '★'
                              : artistProfile.rating >= i + 0.5
                              ? '⯨'
                              : '☆'}
                          </Text>
                        ))}
                        <Text style={styles.ratingText}>
                          {artistProfile.rating.toFixed(1)} ({artistProfile.reviewsCount} reviews)
                        </Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.profileDescription}>{artistProfile.description}</Text>
                </View>
              </>
            )}
          </View>
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={() => router.push('/(artist)/public-profile')}
          >
            <Text style={styles.viewProfileText}>👁️ View Public Profile</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Credits and Wallet Balance */}
      <View style={styles.accountCard}>
        <Text style={styles.cardTitle}>My Account</Text>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available Credits</Text>
            <Text style={styles.balanceValue}>{credits}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>{walletBalance.toFixed(2)} MAD</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addFundsButton} onPress={handleAddFunds}>
          <Text style={styles.addFundsText}>➕ Add Funds</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Add Funds Modal */}
      <Modal
        visible={showAddFundsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddFundsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#6a0dad', '#4a148c']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🚀 Coming Soon!</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAddFundsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <View style={styles.modalIconContainer}>
                <View style={styles.modalIcon}>
                  <Ionicons name="card" size={40} color="#6a0dad" />
                </View>
              </View>
              
              <Text style={styles.modalMessage}>
                The Add Funds feature is currently under development. This feature will allow you to add credits and money to your wallet.
              </Text>
              
              <View style={styles.modalFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34c759" />
                  <Text style={styles.featureText}>Secure payment processing</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34c759" />
                  <Text style={styles.featureText}>Multiple payment methods</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34c759" />
                  <Text style={styles.featureText}>Instant wallet updates</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddFundsModal(false)}
              >
                <Text style={styles.modalButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      clientName: "John Smith",
      type: "service",
      service: "Live Performance",
      date: "2024-07-20",
      time: "8:00 PM",
      price: 1500,
      clientPrice: 1200,
      message: "Looking for acoustic set for wedding reception",
      status: "pending",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      clientName: "Sarah Johnson",
      type: "ticket",
      eventName: "Summer Music Festival",
      quantity: 5,
      ticketType: "VIP",
      price: 250,
      clientPrice: 200,
      message: "Can we get group discount?",
      status: "pending",
      timestamp: "4 hours ago"
    },
    {
      id: 3,
      clientName: "Mike Wilson",
      type: "service",
      service: "Recording Session",
      date: "2024-07-15",
      time: "2:00 PM",
      price: 800,
      clientPrice: null,
      message: "Need vocals for my track, studio session preferred",
      status: "pending",
      timestamp: "1 day ago"
    }
  ]);

  const [filter, setFilter] = useState('all'); // all, pending, accepted, declined
  const [counterOffer, setCounterOffer] = useState<{ [key: number]: string }>({});

  const handleAcceptOrder = (orderId: number) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'accepted' }
        : order
    ));
    Alert.alert("Success", "Order accepted successfully!");
  };

  const handleDeclineOrder = (orderId: number) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'declined' }
        : order
    ));
    Alert.alert("Order Declined", "Order has been declined.");
  };

  const handleCounterOffer = (orderId: number) => {
    const newPrice = counterOffer[orderId];
    if (!newPrice) {
      Alert.alert("Error", "Please enter a counter offer price");
      return;
    }
    
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, price: parseFloat(newPrice), status: 'counter_offered' }
        : order
    ));
    setCounterOffer({ ...counterOffer, [orderId]: '' });
    Alert.alert("Counter Offer Sent", `New price of $${newPrice} has been sent to client`);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9500';
      case 'accepted': return '#34c759';
      case 'declined': return '#ff3b30';
      case 'counter_offered': return '#007aff';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle';
      case 'declined': return 'close-circle';
      case 'counter_offered': return 'swap-horizontal';
      default: return 'help-circle';
    }
  };

 const CalendarPage = () => (
    <ScrollView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="mail-unread" size={24} color="#ff9500" />
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#34c759" />
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'accepted').length}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#6a0dad" />
          <Text style={styles.statValue}>
            ${orders.filter(o => o.status === 'accepted').reduce((sum, o) => sum + o.price, 0)}
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'accepted', 'declined'].map(status => (
          <TouchableOpacity 
            key={status}
            style={[styles.filterTab, filter === status && styles.activeFilterTab]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <Text style={styles.sectionTitle}>
          {filter === 'all' ? 'All Orders' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Orders`}
        </Text>
        
        {filteredOrders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{order.clientName}</Text>
                <Text style={styles.orderTime}>{order.timestamp}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Ionicons name={getStatusIcon(order.status)} size={16} color="white" />
                <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetails}>
              <View style={styles.orderType}>
                <Ionicons 
                  name={order.type === 'service' ? 'musical-notes' : 'ticket'} 
                  size={20} 
                  color="#6a0dad" 
                />
                <Text style={styles.orderTypeText}>
                  {order.type === 'service' ? order.service : `${order.quantity}x ${order.ticketType} Tickets`}
                </Text>
              </View>
              
              {order.date && (
                <Text style={styles.orderDate}>📅 {order.date} at {order.time}</Text>
              )}
              
              {order.eventName && (
                <Text style={styles.eventName}>🎵 {order.eventName}</Text>
              )}
            </View>

            {/* Price Information */}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Your Price:</Text>
                <Text style={styles.yourPrice}>${order.price}</Text>
              </View>
              {order.clientPrice && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Client Offer:</Text>
                  <Text style={styles.clientPrice}>${order.clientPrice}</Text>
                </View>
              )}
            </View>

            {/* Client Message */}
            {order.message && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageLabel}>Message:</Text>
                <Text style={styles.messageText}>"{order.message}"</Text>
              </View>
            )}

            {/* Action Buttons */}
            {order.status === 'pending' && (
              <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAcceptOrder(order.id)}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.declineButton}
                  onPress={() => handleDeclineOrder(order.id)}
                >
                  <Ionicons name="close" size={20} color="white" />
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Counter Offer Section */}
            {order.status === 'pending' && order.clientPrice && order.clientPrice < order.price && (
              <View style={styles.counterOfferContainer}>
                <Text style={styles.counterOfferLabel}>Counter Offer:</Text>
                <View style={styles.counterOfferRow}>
                  <TextInput
                    style={styles.counterOfferInput}
                    placeholder="Enter price"
                    keyboardType="numeric"
                    value={counterOffer[order.id] || ''}
                    onChangeText={(text) => setCounterOffer({...counterOffer, [order.id]: text})}
                  />
                  <TouchableOpacity 
                    style={styles.counterOfferButton}
                    onPress={() => handleCounterOffer(order.id)}
                  >
                    <Text style={styles.counterOfferButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No {filter === 'all' ? '' : filter} orders found</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="add-circle" size={24} color="#6a0dad" />
          <Text style={styles.quickActionText}>Create Service Package</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="ticket" size={24} color="#6a0dad" />
          <Text style={styles.quickActionText}>Add New Event Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="settings" size={24} color="#6a0dad" />
          <Text style={styles.quickActionText}>Pricing Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} // <-- Add this closing brace to end OrderManagementPage function

  // Settings Page Component
  const SettingsPage = () => {
    const router = useRouter();
    const [showComingSoonModal, setShowComingSoonModal] = useState(false);
    const [modalAnimation] = useState(new Animated.Value(0));

    const showComingSoonPrompt = () => {
      setShowComingSoonModal(true);
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const hideComingSoonModal = () => {
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        setShowComingSoonModal(false);
      });
    };

    const handleLogoutFromDashboard = async () => {
      Alert.alert(
        "Logout Confirmation",
        "Are you sure you want to logout? This will clear all your cached data and you'll need to login again.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              try {
                console.log('🔄 Starting complete logout process from dashboard...');
                
                // Step 1: Clear Artist Store state
                console.log('🧹 Clearing Artist Store state...');
                resetStore();
                
                // Step 2: Perform complete logout with cache clearing
                const performCompleteLogout = (await import('../../utils/logoutUtil')).default;
                const result = await performCompleteLogout({
                  clearAllStorage: true,
                  showSuccessMessage: false
                });
                
                if (result.success) {
                  console.log('✅ Dashboard logout completed successfully - redirecting to client side');
                  router.replace('/(client)');
                } else {
                  console.error('❌ Dashboard logout failed:', result.error);
                  // Still redirect even if logout had issues
                  router.replace('/(client)');
                  Alert.alert("Logout Notice", "You have been logged out, but some data may not have been cleared completely.");
                }
                
              } catch (error) {
                console.error('❌ Dashboard logout process failed:', error);
                
                // Emergency logout as fallback - always redirect
                try {
                  const { emergencyLogout } = await import('../../utils/logoutUtil');
                  await emergencyLogout();
                } catch (emergencyError) {
                  console.error('❌ Emergency dashboard logout failed:', emergencyError);
                } finally {
                  // Always redirect regardless of errors
                  router.replace('/(client)');
                }
              }
            }
          }
        ]
      );
    };

    // Update settingsPaths to match expo-router structure
    const settingsPaths = {
      profile: '/(artist)/settings/profile' as const,
      notifications: '/(artist)/settings/notifications' as const,
      payment: '/(artist)/settings/payment' as const,
      language: '/(artist)/settings/language' as const,
    };

    return (
      <>
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}> 
        {/* Profile Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profile Settings</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push(settingsPaths.profile)}>
            <Ionicons name="person" size={24} color="#6a0dad" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Edit Profile</Text>
              <Text style={styles.settingDescription}>Update your profile information</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push(settingsPaths.notifications)}>
            <Ionicons name="notifications" size={24} color="#6a0dad" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>{settings.notificationsEnabled ? 'Notifications are enabled' : 'Notifications are disabled'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        {/* Account Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push(settingsPaths.payment)}>
            <Ionicons name="card" size={24} color="#6a0dad" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Payment Methods</Text>
              <Text style={styles.settingDescription}>{settings.paymentMethods.length} payment methods added</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        {/* App Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <TouchableOpacity style={styles.settingItem} onPress={showComingSoonPrompt}>
            <Ionicons name="language" size={24} color="#6a0dad" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>Coming Soon</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutFromDashboard}>
          <Ionicons name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideComingSoonModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalHeader}>
              <Ionicons name="language" size={48} color="#ffffff" />
              <Text style={styles.modalTitle}>Language Settings</Text>
              <Text style={styles.modalSubtitle}>Coming Soon</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                We're developing comprehensive language support to make your experience truly global.
              </Text>
              <View style={styles.featureGrid}>
                <View style={styles.featureCard}>
                  <Ionicons name="globe" size={24} color="#667eea" />
                  <Text style={styles.featureTitle}>Multi-Language</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="flash" size={24} color="#f093fb" />
                  <Text style={styles.featureTitle}>Real-Time Switch</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="location" size={24} color="#4facfe" />
                  <Text style={styles.featureTitle}>Auto Detection</Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="star" size={24} color="#f6d365" />
                  <Text style={styles.featureTitle}>Native Feel</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCloseButton} onPress={hideComingSoonModal}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalCloseGradient}>
                <Text style={styles.modalCloseText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'ticket':
        try {
          const TicketComponent = require('./Ticket');
          return TicketComponent?.default ? React.createElement(TicketComponent.default) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Ticket component not found</Text>
              <Text style={styles.errorSubtext}>Add services and tickets here</Text>
            </View>
          );
        } catch (error) {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Ticket component not available</Text>
              <Text style={styles.errorSubtext}>Add services and tickets here</Text>
            </View>
          );
        }
      case 'analytics':
        return <AnalyticsPage gigs={gigs} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top, backgroundColor: '#f5f5f5' }]}> {/* Remove violet color from safe area */}
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {renderContent()}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}> 
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'home' && styles.activeTab]} 
          onPress={() => setActiveTab('home')}
        >
          <Ionicons name="home" size={24} color={activeTab === 'home' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'calendar' && styles.activeTab]} 
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons name="mail-unread" size={24} color={activeTab === 'calendar' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'ticket' && styles.activeTab]} 
          onPress={() => setActiveTab('ticket')}
        >
          <Ionicons name="add-circle" size={28} color={activeTab === 'ticket' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'ticket' && styles.activeTabText]}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'analytics' && styles.activeTab]} 
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons name="stats-chart" size={24} color={activeTab === 'analytics' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'settings' && styles.activeTab]} 
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons name="settings" size={24} color={activeTab === 'settings' ? '#6a0dad' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileGradient: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingStar: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#fff',
  },
  profileDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  viewProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  viewProfileText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  accountCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addFundsButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  addFundsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serviceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    color: '#333',
  },
  placeholderText: {
    color: '#666',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addServiceButton: {
    backgroundColor: '#6a0dad',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  addServiceText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  servicesCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  serviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#6a0dad',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#6a0dad',
    fontWeight: 'bold',
  },
  sectionCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventDate: {
    backgroundColor: '#6a0dad',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventMonth: {
    color: '#fff',
    fontSize: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  ticketTypeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ticketTypePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  ticketTypeStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ticketStat: {
    marginRight: 24,
  },
  ticketStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  ticketStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  editTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#6a0dad',
    borderRadius: 8,
  },
  editTicketText: {
    color: '#6a0dad',
    marginLeft: 8,
    fontWeight: '500',
  },
  createEventButton: {
    backgroundColor: '#6a0dad',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createEventText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    paddingTop: 16,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartFill: {
    width: 20,
    backgroundColor: '#6a0dad',
    borderRadius: 10,
  },
  chartLabel: {
    marginTop: 8,
    color: '#666',
  },
  popularEventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  popularEventImage: {
    width: '100%',
    height: 150,
  },
  popularEventInfo: {
    padding: 16,
  },
  popularEventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  popularEventStats: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#6a0dad',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  ordersContainer: {
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventName: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  yourPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34c759',
  },
  clientPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9500',
  },
  messageContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34c759',
    flexDirection: 'row',
       alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  counterOfferContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  counterOfferLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  counterOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterOfferInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    fontSize: 16,
  },
  counterOfferButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  counterOfferButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
       marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  modalButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6a0dad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#f7fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  modalCloseGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default ArtistMobileApp;
