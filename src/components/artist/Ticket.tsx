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
import { useArtistStore } from './ArtistStore';

// Only import MapView and Marker if not on web
let MapView: any = () => null;
let Marker: any = () => null;
if (Platform.OS !== 'web') {
  const maps = require('expo-maps');
  MapView = maps.MapView;
  Marker = maps.Marker;
}

// Fallback type for MapPressEvent for web
let MapPressEvent: any = undefined;
if (Platform.OS !== 'web') {
  MapPressEvent = undefined; // expo-maps does not export MapPressEvent type
}

const { width } = Dimensions.get('window');

export default function Ticket() {
  const { gigs, addTicketToGig, addGig } = useArtistStore();

  // --- FORM STATE ---
  const [form, setForm] = useState({
    name: '',
    price: '',
    location: '',
    category: '',
    description: '',
    flyer: '',
    ticketTypes: [
      { type: 'Normal', price: '' },
      { type: 'VIP', price: '' },
      { type: 'VVIP', price: '' },
    ],
  });

  type ServiceFormType = {
    title: string;
    city: string;
    category: string;
    description: string;
    images: string[];
    items: { title: string; price: string }[];
  };
  const [serviceForm, setServiceForm] = useState<ServiceFormType>({
    title: '',
    city: '',
    category: '',
    description: '',
    images: [],
    items: [{ title: '', price: '' }],
  });
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState<'createTicket' | 'createService'>('createTicket');
  const [showTicketCategoryDropdown, setShowTicketCategoryDropdown] = useState(false);
  const [showServiceCategoryDropdown, setShowServiceCategoryDropdown] = useState(false);

  // --- CATEGORY STATE ---
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    // Fetch categories from real backend endpoint (replace with your real API)
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError('');
      try {
        // Example: fetch from a real backend endpoint
        // NOTE: Replace with your actual backend endpoint for categories
        const response = await fetch('https://your-backend.com/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        // Ensure data is an array of { id, name, icon? }
        setCategories(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setCategoriesError('Could not load categories.');
        // Fallback to static if needed
        setCategories([
          { id: 'musique', name: 'Musique', icon: 'musical-notes' },
          { id: 'theatre', name: 'Theatre', icon: 'film' },
          { id: 'comedie', name: 'Comedie', icon: 'happy' },
          { id: 'sport', name: 'Sport', icon: 'basketball' },
          { id: 'concert', name: 'Concert', icon: 'mic' },
          { id: 'festival', name: 'Festival', icon: 'star' },
          { id: 'formation', name: 'Formation', icon: 'school' },
          { id: 'famille', name: 'Famille & Loisirs', icon: 'people' },
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // --- IMAGE PICKER ---
  const pickImage = async (forService = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      allowsMultipleSelection: forService,
      selectionLimit: forService ? 5 : 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (forService) {
        setServiceImages([...serviceImages, ...result.assets.map(a => a.uri)]);
        setServiceForm({ ...serviceForm, images: [...serviceImages, ...result.assets.map(a => a.uri)] });
      } else {
        setForm({ ...form, flyer: result.assets[0].uri });
      }
    }
  };

  // --- LOCATION PICKER ---
  const pickLocation = async () => {
    setLoadingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to pick a location.');
      setLoadingLocation(false);
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setMapRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setPickedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    setLocationModalVisible(true);
    setLoadingLocation(false);
  };

  const handleMapPress = (e: any) => {
    setPickedLocation(e.nativeEvent.coordinate);
  };

  const confirmLocation = () => {
    if (pickedLocation) {
      setForm({ ...form, location: `${pickedLocation.latitude},${pickedLocation.longitude}` });
      setLocationModalVisible(false);
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
  const handleServiceItemChange = (idx: number, key: 'title' | 'price', value: string) => {
    const items = [...serviceForm.items];
    items[idx][key] = value;
    setServiceForm({ ...serviceForm, items });
  };
  const addServiceItem = () => {
    setServiceForm({ ...serviceForm, items: [...serviceForm.items, { title: '', price: '' }] });
  };
  const removeServiceItem = (idx: number) => {
    const items = serviceForm.items.filter((_, i) => i !== idx);
    setServiceForm({ ...serviceForm, items });
  };
  const handleTicketTypeChange = (idx: number, value: string) => {
    const ticketTypes = [...form.ticketTypes];
    ticketTypes[idx].price = value;
    setForm({ ...form, ticketTypes });
  };

  const handleSubmit = () => {
    // Validation: only require name, price, quantity, date, time
    if (!form.name || !form.price || !form.location) {
      setError('Please fill all required fields.');
      return;
    }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    setSubmitting(true);
    // Add ticket to the first gig (or create a default gig if none exists)
    let gigId = gigs[0]?.id;
    if (!gigId) {
      const defaultGig = {
        artistId: 'default',
        title: 'General',
        description: 'General tickets',
        basePrice: 0,
        images: [],
        category: '',
        options: [],
        location: '',
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
      };
      addGig(defaultGig);
      gigId = (gigs.length > 0 ? gigs[gigs.length - 1].id : '1');
    }
    addTicketToGig(gigId, {
      id: Date.now().toString(),
      name: form.name,
      price: Number(form.price),
      location: form.location,
      description: form.description,
      flyer: form.flyer,
      ticketTypes: form.ticketTypes,
    });
    setForm({
      name: '',
      price: '',
      location: '',
      category: '',
      description: '',
      flyer: '',
      ticketTypes: [
        { type: 'Normal', price: '' },
        { type: 'VIP', price: '' },
        { type: 'VVIP', price: '' },
      ],
    });
    setSubmitting(false);
    setError('');
    setActiveTab('createTicket');
    Alert.alert('Success', 'Ticket added successfully!', [
      { text: 'OK', style: 'default' }
    ]);
  };

  const handleServiceSubmit = () => {
    if (!serviceForm.title || !serviceForm.city) {
      setServiceError('Please fill all required fields.');
      return;
    }
    setServiceSubmitting(true);
    // Here you would add logic to save the service (e.g., call addServiceToStore or similar)
    setTimeout(() => {
      setServiceForm({
        title: '',
        city: '',
        category: '',
        description: '',
        images: [],
        items: [{ title: '', price: '' }],
      });
      setServiceSubmitting(false);
      setServiceError('');
      Alert.alert('Success', 'Service created successfully!', [
        { text: 'OK', style: 'default' }
      ]);
    }, 1000);
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
            />
          </View>
        </View>
        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter city"
              placeholderTextColor="#a1a1aa"
              value={serviceForm.city}
              onChangeText={v => handleServiceChange('city', v)}
              maxLength={40}
            />
          </View>
        </View>
        {/* Category Dropdown */}
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
                      backgroundColor: serviceForm.category === cat.id ? '#667eea' : '#f8fafc',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                    onPress={() => handleCategorySelect(cat.id)}
                  >
                    <Text style={{ color: serviceForm.category === cat.id ? '#fff' : '#374151' }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
          <Text style={styles.inputLabel}>Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {serviceImages.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 8 }} />
            ))}
            <TouchableOpacity style={[styles.uploadContainer, { width: 60, height: 60, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }]} onPress={() => pickImage(true)}>
              <Ionicons name="add" size={28} color="#667eea" />
            </TouchableOpacity>
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
                onChangeText={v => handleServiceItemChange(idx, 'title', v)}
                maxLength={30}
              />
              <TextInput
                style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                placeholder="Price"
                placeholderTextColor="#a1a1aa"
                value={item.price}
                onChangeText={v => handleServiceItemChange(idx, 'price', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
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
        {/* Ticket Title */}
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
        {/* Price */}
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
        {/* Event Location */}
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
        {/* Category Dropdown */}
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
        {/* Description */}
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
        {/* Flyer Upload */}
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
        {/* Ticket Types */}
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
                onChangeText={v => handleTicketTypeChange(idx, v.replace(/[^0-9]/g, ''))}
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
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderHeader()}
        {renderTabBar()}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
            
            {mapRegion && (
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={handleMapPress}
              >
                {pickedLocation && <Marker coordinate={pickedLocation} />}
              </MapView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLocationModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
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
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
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
});