// src/components/artist/Ticket.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { addServiceToFirebase, addTicketToFirebase } from '../../firebase/artistsService';
import { useArtistStore } from './ArtistStore';

// Map components - loaded lazily to avoid initialization errors
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let mapLoadError = false;
let mapsLoaded = false;

const loadMapsIfNeeded = () => {
  if (mapsLoaded || mapLoadError || Platform.OS === 'web') return;
  
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    Circle = maps.Circle || null;
    mapsLoaded = true;
    console.log('react-native-maps loaded successfully');
  } catch (e) {
    try {
      const maps = require('expo-maps');
      MapView = maps.MapView;
      Marker = maps.Marker;
      Circle = maps.Circle || null;
      mapsLoaded = true;
      console.log('expo-maps loaded successfully');
    } catch (e2) {
      console.log('Maps not available on this platform');
      mapLoadError = true;
    }
  }
};

// Fallback type for MapPressEvent for web
let MapPressEvent: any = undefined;

const { width } = Dimensions.get('window');

// Moroccan Regions and Cities
const MOROCCAN_REGIONS = [
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
];

const MOROCCAN_CITIES: { [key: string]: string[] } = {
  'Tanger-Tétouan-Al Hoceïma': ['Tanger', 'Tétouan', 'Al Hoceïma', 'Chefchaouen', 'Larache', 'Ouezzane'],
  "L'Oriental": ['Oujda', 'Nador', 'Berkane', 'Taourirt', 'Jerada', 'Figuig'],
  'Fès-Meknès': ['Fès', 'Meknès', 'Ifrane', 'Sefrou', 'Boulemane', 'Taza'],
  'Rabat-Salé-Kénitra': ['Rabat', 'Salé', 'Kénitra', 'Skhirate-Témara', 'Benslimane', 'Khémisset'],
  'Béni Mellal-Khénifra': ['Béni Mellal', 'Khénifra', 'Azilal', 'Fquih Ben Salah', 'Khouribga'],
  'Casablanca-Settat': ['Casablanca', 'Mohammedia', 'El Jadida', 'Settat', 'Berrchid', 'Nouaceur'],
  'Marrakech-Safi': ['Marrakech', 'Safi', 'Essaouira', 'Al Haouz', 'Chichaoua', 'Kelâat Sraghna'],
  'Drâa-Tafilalet': ['Errachidia', 'Ouarzazate', 'Tinghir', 'Zagora', 'Midelt', 'Errachidia'],
  'Souss-Massa': ['Agadir', 'Inezgane-Aït Melloul', 'Taroudant', 'Tiznit', 'Chtouka-Aït Baha', 'Tata'],
  'Guelmim-Oued Noun': ['Guelmim', 'Tan-Tan', 'Sidi Ifni', 'Tata', 'Assa-Zag'],
  'Laâyoune-Sakia El Hamra': ['Laâyoune', 'Boujdour', 'Tarfaya', 'Es-Semara'],
  'Dakhla-Oued Ed-Dahab': ['Dakhla', 'Aousserd', 'Oued Ed-Dahab'],
};

export default function Ticket() {
  const { gigs, addTicketToGig, addGig } = useArtistStore();
  const { user, loading } = useAuth();

  // --- FORM STATE ---
  const [form, setForm] = useState({
    name: '',
    price: '',
    location: '',
    category: '',
    description: '',
    flyer: '',
    ticketTypes: [
      { type: 'Normal', price: '', quantity: '' },
      { type: 'VIP', price: '', quantity: '' },
      { type: 'VVIP', price: '', quantity: '' },
    ],
  });

  type ServiceFormType = {
    title: string;
    locationName: string;
    region: string;
    category: string;
    description: string;
    images: string[];
    videos: string[];
    basePrice: string;
    serviceRadius: number;
    items: { title: string; price: string; maxQuantity: string }[];
    extraServices: { title: string; price: string; maxQuantity: string }[];
  };
  const [serviceForm, setServiceForm] = useState<ServiceFormType>({
    title: '',
    locationName: '',
    region: '',
    category: '',
    description: '',
    images: [],
    videos: [],
    basePrice: '',
    serviceRadius: 5,
    items: [{ title: '', price: '', maxQuantity: '' }],
    extraServices: [{ title: '', price: '', maxQuantity: '' }],
  });
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [serviceVideos, setServiceVideos] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [serviceRadius, setServiceRadius] = useState(5); // Default 5km radius
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'createTicket' | 'createService'>('createTicket');
  const [showTicketCategoryDropdown, setShowTicketCategoryDropdown] = useState(false);
  const [showServiceCategoryDropdown, setShowServiceCategoryDropdown] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [showMapSection, setShowMapSection] = useState(true);

  // Load maps when location modal opens
  useEffect(() => {
    if (locationModalVisible && !mapsReady && !mapLoadError) {
      loadMapsIfNeeded();
      // Check if maps loaded after a small delay
      setTimeout(() => {
        setMapsReady(true);
      }, 500);
    }
  }, [locationModalVisible]);

  // --- CATEGORY STATE ---
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError('');
      try {
        // Define separate categories for tickets and services
        const ticketCategories = [
  { id: 'music', name: 'Music', icon: 'musical-notes' },
  { id: 'theater', name: 'Theater', icon: 'film' },
  { id: 'comedy', name: 'Comedy', icon: 'happy' },
  { id: 'sports', name: 'Sports', icon: 'basketball' },
  { id: 'concerts', name: 'Concerts', icon: 'mic' },
  { id: 'festivals', name: 'Festivals', icon: 'star' },
  { id: 'education', name: 'Education', icon: 'school' },
  { id: 'family', name: 'Family & Leisure', icon: 'people' },
        ];

        const serviceCategories = [
    { id: 'Mariage', name: 'Mariage', icon: 'heart' },
    { id: 'Anniversaire', name: 'Anniversaire', icon: 'gift' },
    { id: 'Traiteur', name: 'Traiteur', icon: 'restaurant' },
    { id: 'Musique', name: 'Musique', icon: 'musical-notes' },
    { id: 'Neggafa', name: 'Neggafa', icon: 'person' },
    { id: 'Conference', name: 'Conference', icon: 'business' },
    { id: 'Evenement d\'entreprise', name: 'Evenement d\'entreprise', icon: 'people' },
    { id: 'Kermesse', name: 'Kermesse', icon: 'happy' },
    { id: 'Henna', name: 'Henna', icon: 'flower' },
    { id: 'Photographie', name: 'Photographie', icon: 'camera' },
    { id: 'Animation', name: 'Animation', icon: 'film' },
    { id: 'Decoration', name: 'Decoration', icon: 'color-palette' },
    { id: 'Buffet', name: 'Buffet', icon: 'restaurant' },
        ];

        // Set categories based on the active tab
        if (activeTab === 'createTicket') {
          setCategories(ticketCategories);
        } else {
          setCategories(serviceCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategoriesError('Could not load categories.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [activeTab]);

  // --- IMAGE PICKER ---
  const pickImage = async (forService = false) => {
    const maxImages = 4;
    const currentCount = forService ? serviceImages.length : (form.flyer ? 1 : 0);
    const remainingSlots = maxImages - currentCount;
    
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `You can only add up to ${maxImages} images.`);
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: !forService,
      aspect: [16, 9],
      quality: 0.8,
      allowsMultipleSelection: forService,
      selectionLimit: forService ? remainingSlots : 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (forService) {
        const newImages = [...serviceImages, ...result.assets.map(a => a.uri)].slice(0, maxImages);
        setServiceImages(newImages);
        setServiceForm({ ...serviceForm, images: newImages });
      } else {
        setForm({ ...form, flyer: result.assets[0].uri });
      }
    }
  };

  // --- VIDEO PICKER ---
  const pickVideo = async () => {
    const maxVideos = 1;
    
    if (serviceVideos.length >= maxVideos) {
      Alert.alert('Limit Reached', `You can only add up to ${maxVideos} video.`);
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newVideos = [...serviceVideos, result.assets[0].uri].slice(0, maxVideos);
      setServiceVideos(newVideos);
      setServiceForm({ ...serviceForm, videos: newVideos });
    }
  };

  // --- LOCATION PICKER ---
  const pickLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to pick a location. Please enable it in your device settings.');
        setLoadingLocation(false);
        return;
      }
      
      try {
        let loc = await Location.getCurrentPositionAsync({});
        if (loc && loc.coords) {
          setMapRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setPickedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setLocationModalVisible(true);
        } else {
          // Use default coordinates (Casablanca) if location unavailable
          setMapRegion({
            latitude: 33.5731,
            longitude: -7.5898,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setPickedLocation({ latitude: 33.5731, longitude: -7.5898 });
          Alert.alert('Location Unavailable', 'Using default location (Casablanca). You can manually select a location on the map.');
          setLocationModalVisible(true);
        }
      } catch (locError: any) {
        console.error('Error getting location:', locError);
        // Use default coordinates if location fails
        setMapRegion({
          latitude: 33.5731,
          longitude: -7.5898,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setPickedLocation({ latitude: 33.5731, longitude: -7.5898 });
        Alert.alert('Location Unavailable', 'Using default location (Casablanca). You can manually select a location on the map.');
        setLocationModalVisible(true);
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      Alert.alert('Error', 'Failed to access location. Please try again.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = (e: any) => {
    try {
      if (e && e.nativeEvent && e.nativeEvent.coordinate) {
        setPickedLocation(e.nativeEvent.coordinate);
        // Update map region to center on the picked location
        setMapRegion({
          latitude: e.nativeEvent.coordinate.latitude,
          longitude: e.nativeEvent.coordinate.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Error handling map press:', error);
    }
  };

  const confirmLocation = () => {
    try {
      if (pickedLocation) {
        setForm({ ...form, location: `${pickedLocation.latitude},${pickedLocation.longitude}` });
        setLocationModalVisible(false);
      } else {
        Alert.alert('Error', 'Please select a location first.');
      }
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  const confirmServiceLocation = () => {
    try {
      if (pickedLocation) {
        // For service form, we'll use the coordinates as location name
        // In a real app, you'd use reverse geocoding to get the actual city name
        const locationString = `${pickedLocation.latitude.toFixed(4)},${pickedLocation.longitude.toFixed(4)}`;
        setServiceForm({ 
          ...serviceForm, 
          locationName: locationString,
          serviceRadius: serviceRadius
        });
        setLocationModalVisible(false);
      } else {
        Alert.alert('Error', 'Please select a location first.');
      }
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  // Search for an address using geocoding
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        if (latitude && longitude) {
          setPickedLocation({ latitude, longitude });
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
          setSearchQuery('');
        } else {
          Alert.alert('No results', 'Could not find that address.');
        }
      } else {
        Alert.alert('No results', 'Could not find that address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to search address. Please try again.');
    }
  };

  // Get custom map style for a cleaner look
  const getMapStyle = () => {
    try {
      return [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ];
    } catch (e) {
      console.log('Error getting map style:', e);
      return [];
    }
  };

  // --- CATEGORY SELECT HANDLERS ---
  const handleCategorySelect = (catId: string) => {
    if (activeTab === 'createTicket') {
      setForm({ ...form, category: catId });
    } else {
      setServiceForm({ ...serviceForm, category: catId });
    }
  };

  // --- FORM HANDLERS ---
  const handleChange = (field: keyof typeof form, value: any) => {
    setForm({ ...form, [field]: value });
    setError('');
  };
  const handleServiceChange = (field: keyof typeof serviceForm, value: any) => {
    setServiceForm({ ...serviceForm, [field]: value });
    setServiceError('');
  };
  const updateServiceItem = (idx: number, key: 'title' | 'price' | 'maxQuantity', value: string) => {
    const items = [...serviceForm.items];
    items[idx][key] = value;
    setServiceForm({ ...serviceForm, items });
  };
  const addServiceItem = () => {
    setServiceForm({ ...serviceForm, items: [...serviceForm.items, { title: '', price: '', maxQuantity: '' }] });
  };
  const removeServiceItem = (idx: number) => {
    const items = serviceForm.items.filter((_, i) => i !== idx);
    setServiceForm({ ...serviceForm, items });
  };
  const addExtraServiceItem = () => {
    setServiceForm({ ...serviceForm, extraServices: [...serviceForm.extraServices, { title: '', price: '', maxQuantity: '' }] });
  };
  const removeExtraServiceItem = (idx: number) => {
    const extraServices = serviceForm.extraServices.filter((_, i) => i !== idx);
    setServiceForm({ ...serviceForm, extraServices });
  };
  const updateExtraServiceItem = (idx: number, key: 'title' | 'price' | 'maxQuantity', value: string) => {
    const extraServices = [...serviceForm.extraServices];
    extraServices[idx][key] = value;
    setServiceForm({ ...serviceForm, extraServices });
  };
  
  const handleTicketTypeChange = (idx: number, key: 'price' | 'quantity', value: string) => {
    const ticketTypes = [...form.ticketTypes];
    ticketTypes[idx][key] = value;
    setForm({ ...form, ticketTypes });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.location) {
      setError('Please fill all required fields.');
      return;
    }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    
    // Check if auth is still loading
    if (loading) {
      setError('Authentication is loading. Please wait and try again.');
      return;
    }
    
    // Check if user is authenticated
    if (!user?.uid) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    
    setSubmitting(true);
    try {
      await addTicketToFirebase(user.uid, {
        name: form.name,
        price: Number(form.price),
        location: form.location,
        description: form.description,
        flyer: form.flyer,
        ticketTypes: form.ticketTypes.map(tt => ({
          ...tt,
          price: Number(tt.price) || 0,
          quantity: Number(tt.quantity) || 0,
        })),
        category: form.category,
      });
      setForm({
        name: '',
        price: '',
        location: '',
        category: '',
        description: '',
        flyer: '',
        ticketTypes: [
          { type: 'Normal', price: '', quantity: '' },
          { type: 'VIP', price: '', quantity: '' },
          { type: 'VVIP', price: '', quantity: '' },
        ],
      });
      setError('');
      setActiveTab('createTicket');
      Alert.alert('Success', 'Ticket added and saved to Firebase!', [
        { text: 'OK', style: 'default' }
      ]);
    } catch (err: any) {
      console.error('[handleSubmit] Error:', err);
      let errorMessage = 'Failed to save ticket. ';
      
      if (err.message) {
        if (err.message.includes('User not authenticated')) {
          errorMessage += 'Please log in again.';
        } else if (err.message.includes('Invalid artist ID')) {
          errorMessage += 'Please log in again.';
        } else if (err.message.includes('permission')) {
          errorMessage += 'Permission denied. Please check your account permissions.';
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    }
    setSubmitting(false);
  };

  const handleServiceSubmit = async () => {
    // Either location text OR selected region/city works
    if (!serviceForm.title || !serviceForm.locationName) {
      setServiceError('Please enter a location and select a region.');
      return;
    }
    
    // Check if auth is still loading
    if (loading) {
      setServiceError('Authentication is loading. Please wait and try again.');
      return;
    }
    
    // Check if user is authenticated
    if (!user?.uid) {
      console.log('[handleServiceSubmit] User object:', user);
      console.log('[handleServiceSubmit] Loading state:', loading);
      setServiceError('User not authenticated. Please log in again.');
      return;
    }
    
    console.log('[handleServiceSubmit] Creating service with user:', user.uid);
    console.log('[handleServiceSubmit] Service form data:', serviceForm);
    console.log('[handleServiceSubmit] Service images:', serviceImages);
    setServiceSubmitting(true);
    try {
      
      // Use the base price from the form
      const basePrice = parseFloat(serviceForm.basePrice) || 0;
      
      const serviceDataWithPrice = {
        ...serviceForm,
        price: basePrice,
        basePrice: basePrice,
        serviceRadius: serviceForm.serviceRadius || 5,
        // Include map coordinates if map location was selected
        ...(pickedLocation && pickedLocation.latitude && pickedLocation.longitude ? {
          mapLatitude: pickedLocation.latitude,
          mapLongitude: pickedLocation.longitude,
        } : {}),
      
      };
      
      console.log('[handleServiceSubmit] Service data with price:', serviceDataWithPrice);
      const serviceResult = await addServiceToFirebase(user.uid, serviceDataWithPrice);
      const serviceId = serviceResult.id;
      
      setServiceForm({
        title: '',
        locationName: '',
        region: '',
        category: '',
        description: '',
        images: [],
        videos: [],
        basePrice: '',
        serviceRadius: 5,
        items: [{ title: '', price: '', maxQuantity: '' }],
        extraServices: [{ title: '', price: '', maxQuantity: '' }],
      });
      setServiceVideos([]);
      setServiceError('');
      Alert.alert('Success', 'Service created and saved to Firebase!', [
        { text: 'OK', style: 'default' }
      ]);
    } catch (err: any) {
      console.error('[handleServiceSubmit] Error:', err);
      let errorMessage = 'Failed to save service. ';
      
      if (err.message) {
        if (err.message.includes('User not authenticated')) {
          errorMessage += 'Please log in again.';
        } else if (err.message.includes('Invalid artist ID')) {
          errorMessage += 'Please log in again.';
        } else if (err.message.includes('permission')) {
          errorMessage += 'Permission denied. Please check your account permissions.';
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setServiceError(errorMessage);
    }
    setServiceSubmitting(false);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: 0 }]}> {/* Remove extra top padding */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.headerContent, { marginTop: 0 }]}> {/* Remove extra margin */}
          <Text style={styles.headerTitle}>
            {activeTab === 'createTicket' ? 'Create Ticket' : 'Create Service'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'createTicket'
              ? 'Create and manage your event tickets'
              : 'Create and manage your artist services'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'createTicket' && styles.activeTab]}
        onPress={() => setActiveTab('createTicket')}
      >
        <Ionicons 
          name="add-circle" 
          size={20} 
          color={activeTab === 'createTicket' ? '#667eea' : '#8e8e93'} 
        />
        <Text style={[styles.tabText, activeTab === 'createTicket' && styles.activeTabText]}>
          Create Ticket
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'createService' && styles.activeTab]}
        onPress={() => setActiveTab('createService')}
      >
        <Ionicons 
          name="construct-outline" 
          size={20} 
          color={activeTab === 'createService' ? '#667eea' : '#8e8e93'} 
        />
        <Text style={[styles.tabText, activeTab === 'createService' && styles.activeTabText]}>
          Create Service
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateServiceForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Create New Service</Text>
        {/* Service Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Title *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="construct-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter service title"
              placeholderTextColor="#a1a1aa"
              value={serviceForm.title}
              onChangeText={v => handleServiceChange('title', v)}
              maxLength={40}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
        </View>
        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location *</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[styles.textInput, { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 }]}
              placeholder="Enter city name"
              placeholderTextColor="#a1a1aa"
              value={serviceForm.locationName}
              onChangeText={v => handleServiceChange('locationName', v)}
              maxLength={40}
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={{ backgroundColor: '#667eea', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center' }} 
              onPress={pickLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="map" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Region & City Dropdowns (modal) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Region</Text>
          <TouchableOpacity
            style={[styles.dropdownButtonCompact, { justifyContent: 'space-between' }]}
            onPress={() => setShowRegionModal(true)}
          >
            <Text style={serviceForm.region ? { color: '#111' } : { color: '#777' }}>
              {serviceForm.region || 'Select a region'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#777" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City</Text>
          <TouchableOpacity
            style={[styles.dropdownButtonCompact, { justifyContent: 'space-between' }]}
            onPress={() => {
              if (!serviceForm.region) {
                setServiceError('Please select a region first');
                return;
              }
              setShowCityModal(true);
            }}
          >
            <Text style={serviceForm.locationName ? { color: '#111' } : { color: '#777' }}>
              {serviceForm.locationName || 'Select a city'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#777" />
          </TouchableOpacity>
        </View>

        {/* Region Modal */}
        <Modal transparent animationType="fade" visible={showRegionModal} onRequestClose={() => setShowRegionModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRegionModal(false)}>
            <View style={styles.modalContentList}>
              <ScrollView>
                {MOROCCAN_REGIONS.map((r) => (
                  <TouchableOpacity key={r} style={styles.modalOption} onPress={() => { setServiceForm(prev => ({ ...prev, region: r, locationName: '' })); setShowRegionModal(false); setServiceError(''); }}>
                    <Text style={styles.modalOptionText}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* City Modal */}
        <Modal transparent animationType="fade" visible={showCityModal} onRequestClose={() => setShowCityModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCityModal(false)}>
            <View style={styles.modalContentList}>
              <ScrollView>
                {(MOROCCAN_CITIES[serviceForm.region] || []).map((c) => (
                  <TouchableOpacity key={c} style={styles.modalOption} onPress={() => { handleServiceChange('locationName', c); setShowCityModal(false); }}>
                    <Text style={styles.modalOptionText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        {/* Category Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category *</Text>
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#667eea" />
          ) : categoriesError ? (
            <Text style={{ color: '#ef4444' }}>{categoriesError}</Text>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', paddingVertical: 4 }}
              style={{ maxHeight: 50 }}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={{
                    backgroundColor: serviceForm.category === cat.id ? '#667eea' : '#f8fafc',
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: serviceForm.category === cat.id ? '#667eea' : '#e2e8f0',
                  }}
                  onPress={() => handleCategorySelect(cat.id)}
                >
                  <Text style={{ color: serviceForm.category === cat.id ? '#fff' : '#374151', fontSize: 14 }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        {/* Base Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Base Price (MAD)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor="#a1a1aa"
              value={serviceForm.basePrice}
              onChangeText={v => handleServiceChange('basePrice', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>
        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter service description..."
              placeholderTextColor="#a1a1aa"
              value={serviceForm.description}
              onChangeText={v => handleServiceChange('description', v)}
              multiline
              numberOfLines={3}
              maxLength={120}
              textAlignVertical="top"
            />
          </View>
        </View>
        {/* Images */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Images (max 4)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {serviceImages.map((img, idx) => (
              <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                <Image source={{ uri: img }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                <TouchableOpacity 
                  style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -12, marginLeft: -12, backgroundColor: '#ff3b30', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => {
                    const newImages = serviceImages.filter((_, i) => i !== idx);
                    setServiceImages(newImages);
                    setServiceForm({ ...serviceForm, images: newImages });
                  }}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {serviceImages.length < 4 && (
              <TouchableOpacity style={[styles.uploadContainer, { width: 60, height: 60, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }]} onPress={() => pickImage(true)}>
                <Ionicons name="add" size={28} color="#667eea" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
        {/* Videos */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Videos (max 1)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {serviceVideos.map((vid, idx) => (
              <View key={idx} style={{ position: 'relative', marginRight: 8 }}>
                <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Ionicons name="videocam" size={24} color="#667eea" />
                </View>
                <TouchableOpacity 
                  style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -12, marginLeft: -12, backgroundColor: '#ff3b30', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => {
                    const newVideos = serviceVideos.filter((_, i) => i !== idx);
                    setServiceVideos(newVideos);
                    setServiceForm({ ...serviceForm, videos: newVideos });
                  }}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {serviceVideos.length < 1 && (
              <TouchableOpacity style={[styles.uploadContainer, { width: 60, height: 60, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }]} onPress={pickVideo}>
                <Ionicons name="add" size={28} color="#667eea" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
        {/* Service Items */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Items</Text>
          {serviceForm.items.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TextInput
                style={[styles.textInput, { flex: 2, marginRight: 8 }]}
                placeholder="Item title"
                placeholderTextColor="#a1a1aa"
                value={item.title}
                onChangeText={v => updateServiceItem(idx, 'title', v)}
                maxLength={30}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                placeholder="Price"
                placeholderTextColor="#a1a1aa"
                value={item.price}
                onChangeText={v => updateServiceItem(idx, 'price', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                placeholder="Max"
                placeholderTextColor="#a1a1aa"
                value={item.maxQuantity}
                onChangeText={v => updateServiceItem(idx, 'maxQuantity', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={4}
              />
              <TouchableOpacity onPress={() => removeServiceItem(idx)}>
                <Ionicons name="remove-circle" size={22} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addServiceItem} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="add-circle" size={20} color="#667eea" />
            <Text style={{ color: '#667eea', marginLeft: 4 }}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Extra Services */}
        <View style={[styles.inputGroup, { marginTop: 16 }]}> 
          <Text style={styles.inputLabel}>Extra Services</Text>
          {serviceForm.extraServices.map((extra, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TextInput
                style={[styles.textInput, { flex: 2, marginRight: 8 }]}
                placeholder="Extra service title"
                placeholderTextColor="#a1a1aa"
                value={extra.title}
                onChangeText={v => updateExtraServiceItem(idx, 'title', v)}
                maxLength={30}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                placeholder="Price"
                placeholderTextColor="#a1a1aa"
                value={extra.price}
                onChangeText={v => updateExtraServiceItem(idx, 'price', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                placeholder="Max"
                placeholderTextColor="#a1a1aa"
                value={extra.maxQuantity}
                onChangeText={v => updateExtraServiceItem(idx, 'maxQuantity', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={4}
              />
              <TouchableOpacity onPress={() => removeExtraServiceItem(idx)}>
                <Ionicons name="remove-circle" size={22} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addExtraServiceItem} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="add-circle" size={20} color="#667eea" />
            <Text style={{ color: '#667eea', marginLeft: 4 }}>Add Extra Service</Text>
          </TouchableOpacity>
        </View>
        
        {serviceError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{serviceError}</Text>
          </View>
        ) : null}
        <TouchableOpacity 
          style={[styles.submitButton, serviceSubmitting && styles.submitButtonDisabled]} 
          onPress={handleServiceSubmit} 
          disabled={serviceSubmitting}
        >
          <LinearGradient
            colors={serviceSubmitting ? ['#a1a1aa', '#a1a1aa'] : ['#667eea', '#764ba2']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {serviceSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add-circle" size={20} color="#fff" />
            )}
            <Text style={styles.submitButtonText}>
              {serviceSubmitting ? 'Creating Service...' : 'Create Service'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateTicketForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Create New Ticket</Text>
        {/* Coming Soon Message */}
        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct-outline" size={64} color="#667eea" />
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>Ticket creation is currently under development. This feature will be available soon!</Text>
        </View>
        {/* Ticket creation code commented out for future implementation */}
        {/*
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ticket Title *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="ticket-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter ticket title"
              placeholderTextColor="#a1a1aa"
              value={form.name}
              onChangeText={v => handleChange('name', v)}
              maxLength={40}
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Base Price (MAD) *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor="#a1a1aa"
              value={form.price}
              onChangeText={v => handleChange('price', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Event Location *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter event location"
              placeholderTextColor="#a1a1aa"
              value={form.location}
              onChangeText={v => handleChange('location', v)}
              maxLength={40}
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="pricetags-outline" size={20} color="#667eea" style={styles.inputIcon} />
            {categoriesLoading ? (
              <ActivityIndicator size="small" color="#667eea" />
            ) : categoriesError ? (
              <Text style={{ color: '#ef4444' }}>{categoriesError}</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={{
                      backgroundColor: form.category === cat.id ? '#667eea' : '#f8fafc',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                    onPress={() => handleChange('category', cat.id)}
                  >
                    <Text style={{ color: form.category === cat.id ? '#fff' : '#374151' }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter ticket description..."
              placeholderTextColor="#a1a1aa"
              value={form.description}
              onChangeText={v => handleChange('description', v)}
              multiline
              numberOfLines={3}
              maxLength={120}
              textAlignVertical="top"
            />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Event Flyer</Text>
          <TouchableOpacity style={styles.uploadContainer} onPress={() => pickImage(false)}>
            {form.flyer ? (
              <View style={styles.flyerContainer}>
                <Image source={{ uri: form.flyer }} style={styles.flyerImage} />
                <View style={styles.flyerOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.flyerOverlayText}>Change Image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#667eea" />
                <Text style={styles.uploadText}>Upload Event Flyer</Text>
                <Text style={styles.uploadSubtext}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ticket Types</Text>
          {form.ticketTypes.map((tt, idx) => (
            <View key={tt.type} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ width: 60 }}>{tt.type}</Text>
              <TextInput
                style={[styles.textInput, { flex: 1, marginLeft: 8 }]}
                placeholder={`Price for ${tt.type}`}
                placeholderTextColor="#a1a1aa"
                value={tt.price}
                onChangeText={v => handleTicketTypeChange(idx, 'price', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginLeft: 8 }]}
                placeholder={`Quantity`}
                placeholderTextColor="#a1a1aa"
                value={tt.quantity}
                onChangeText={v => handleTicketTypeChange(idx, 'quantity', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          ))}
        </View>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          <LinearGradient
            colors={submitting ? ['#a1a1aa', '#a1a1aa'] : ['#667eea', '#764ba2']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add-circle" size={20} color="#fff" />
            )}
            <Text style={styles.submitButtonText}>
              {submitting ? 'Creating Ticket...' : 'Create Ticket'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        */}
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
      >
        {renderHeader()}
        {renderTabBar()}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'createTicket' ? renderCreateTicketForm() : renderCreateServiceForm()}
        </ScrollView>

        {/* Location Modal */}
        <Modal visible={locationModalVisible} animationType="slide" statusBarTranslucent>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {Platform.OS !== 'web' && mapRegion && mapsReady && MapView && !mapLoadError ? (
              <View style={{ flex: 1 }}>
                <MapView
                  style={styles.map}
                  region={mapRegion}
                  onPress={handleMapPress}
                  customMapStyle={getMapStyle()}
                >
                  {pickedLocation && Marker && (
                    <Marker
                      coordinate={pickedLocation}
                      draggable
                      onDragEnd={(e: any) => {
                        const coord = e.nativeEvent.coordinate;
                        setPickedLocation(coord);
                        setMapRegion({
                          ...mapRegion,
                          latitude: coord.latitude,
                          longitude: coord.longitude,
                        });
                      }}
                    >
                      <View style={styles.markerContainer}>
                        <View style={styles.markerPin}>
                          <Ionicons name="location" size={24} color="#667eea" />
                        </View>
                        <View style={styles.markerShadow} />
                      </View>
                    </Marker>
                  )}
                  {pickedLocation && Circle && (
                    <Circle
                      center={pickedLocation}
                      radius={serviceRadius * 1000}
                      strokeColor="#667eea"
                      fillColor="rgba(102, 126, 234, 0.1)"
                      strokeWidth={2}
                    />
                  )}
                </MapView>

                {/* Search bar overlay */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#a1a1aa" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a city or address"
                    placeholderTextColor="#a1a1aa"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={searchAddress}
                  />
                </View>

                {/* Current location button */}
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={async () => {
                    try {
                      let { status } = await Location.requestForegroundPermissionsAsync();
                      if (status === 'granted') {
                        let loc = await Location.getCurrentPositionAsync({});
                        setPickedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                        setMapRegion({
                          latitude: loc.coords.latitude,
                          longitude: loc.coords.longitude,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        });
                      }
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                >
                  <Ionicons name="locate" size={24} color="#667eea" />
                </TouchableOpacity>


              </View>
            ) : mapRegion ? (
              <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 20 }]}>
                <Ionicons name="location-outline" size={64} color="#667eea" />
                <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: '#374151', textAlign: 'center' }}>Select Service Area</Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>Current Location:</Text>
                <Text style={{ marginTop: 4, fontSize: 14, color: '#374151', textAlign: 'center', fontFamily: 'monospace' }}>
                  {pickedLocation?.latitude.toFixed(6)}, {pickedLocation?.longitude.toFixed(6)}
                </Text>
                <Text style={{ marginTop: 16, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>Service Radius: {serviceRadius} km</Text>
                
                {/* Coordinate Input */}
                <View style={{ width: '100%', marginTop: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>Enter Coordinates</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Latitude</Text>
                      <TextInput
                        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, fontSize: 14 }}
                        placeholder="33.5731"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        value={pickedLocation?.latitude.toString() || ''}
                        onChangeText={(text) => {
                          const lat = parseFloat(text) || 0;
                          if (pickedLocation) {
                            setPickedLocation({ ...pickedLocation, latitude: lat });
                          } else {
                            setPickedLocation({ latitude: lat, longitude: mapRegion.longitude });
                          }
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Longitude</Text>
                      <TextInput
                        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, fontSize: 14 }}
                        placeholder="-7.5898"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        value={pickedLocation?.longitude.toString() || ''}
                        onChangeText={(text) => {
                          const lng = parseFloat(text) || 0;
                          if (pickedLocation) {
                            setPickedLocation({ ...pickedLocation, longitude: lng });
                          } else {
                            setPickedLocation({ latitude: mapRegion.latitude, longitude: lng });
                          }
                        }}
                      />
                    </View>
                  </View>
                  

                  
                  <TouchableOpacity
                    style={{ backgroundColor: '#667eea', borderRadius: 8, padding: 12, alignItems: 'center' }}
                    onPress={async () => {
                      try {
                        let { status } = await Location.requestForegroundPermissionsAsync();
                        if (status === 'granted') {
                          let loc = await Location.getCurrentPositionAsync({});
                          setPickedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                          setMapRegion({
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                          });
                        }
                      } catch (e) {
                        console.log('Error getting location:', e);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Use My Current Location</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }]}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>Getting your location...</Text>
              </View>
            )}
            
            {/* Radius Control */}
            <View style={{ position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>Service Area Radius: {serviceRadius} km</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  onPress={() => setServiceRadius(Math.max(50, serviceRadius - 25))}
                  style={{ backgroundColor: '#667eea', borderRadius: 8, padding: 8, marginRight: 12 }}
                >
                  <Ionicons name="remove" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
                  <View style={{ width: `${(serviceRadius / 200) * 100}%`, height: '100%', backgroundColor: '#667eea', borderRadius: 2 }} />
                </View>
                <TouchableOpacity 
                  onPress={() => setServiceRadius(Math.min(200, serviceRadius + 25))}
                  style={{ backgroundColor: '#667eea', borderRadius: 8, padding: 8, marginLeft: 12 }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'center' }}>Drag pin to move • Tap +/- to adjust radius</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLocationModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={activeTab === 'createService' ? confirmServiceLocation : confirmLocation}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.confirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmButtonText}>Confirm Location</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}



// Helper function to map Ionicons names to Feather icon names
function mapIconName(ioniconsName: string): string {
  const iconMap: Record<string, string> = {
    'heart': 'heart',
    'gift': 'gift',
    'restaurant': 'coffee',
    'musical-notes': 'music',
    'person': 'user',
    'business': 'briefcase',
    'people': 'users',
    'happy': 'smile',
    'flower': 'award', // No direct equivalent in Feather
    'camera': 'camera',
    'film': 'film',
    'color-palette': 'award', // No direct equivalent in Feather
    // Add more mappings as needed
  };

  return iconMap[ioniconsName] || 'circle'; // Default to 'circle' if no mapping exists
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 180,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#f1f5f9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8e8e93',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formContainer: {
    padding: 16,
    paddingTop: 24,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  uploadContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  flyerContainer: {
    position: 'relative',
  },
  flyerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  flyerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  flyerOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#1e293b',
  },
  placeholderText: {
    color: '#a1a1aa',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  ticketsContainer: {
    padding: 16,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  ticketImageContainer: {
    position: 'relative',
  },
  ticketImage: {
    width: '100%',
    height: 160,
  },
  ticketBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  ticketContent: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  ticketDetails: {
    marginBottom: 12,
  },
  ticketDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    flex: 1,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentList: {
    width: '80%',
    maxHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownButtonCompact: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerShadow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -2,
  },
  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  currentLocationButton: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  radiusPanel: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  radiusSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radiusButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  radiusHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 12,
  },
  confirmButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});