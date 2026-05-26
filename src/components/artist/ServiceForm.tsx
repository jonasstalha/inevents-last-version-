import { Ionicons } from '@expo/vector-icons';
import { ImagePickerAsset } from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Theme } from '../../constants/theme';
import { createServiceWithImages, updateServiceWithImages } from '../../firebase/artistServices';
import { pickImages, pickVideo } from '../../firebase/storageService';
import { GigInput, GigOption } from '../../models/types';

const { width, height } = Dimensions.get('window');

// Moroccan regions (12)
const MOROCCAN_REGIONS = [
  'Tanger-Tétouan-Al Hoceïma',
  'L\'Oriental',
  'Fès-Meknès',
  'Rabat-Salé-Kénitra',
  'Béni Mellal-Khénifra',
  'Casablanca-Settat',
  'Marrakech-Safi',
  'Drâa-Tafilalet',
  'Souss-Massa',
  'Guelmim-Oued Noun',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab'
];

// Radius options (in km)
const RADIUS_OPTIONS = [50, 100, 150, 200];

// Simplified mapping of regions to sample cities for dropdown
const REGION_CITIES: Record<string, string[]> = {
  'Tanger-Tétouan-Al Hoceïma': ['Tanger', 'Tétouan', 'Al Hoceïma'],
  "L'Oriental": ['Oujda', 'Nador', 'Berkane'],
  'Fès-Meknès': ['Fès', 'Meknès', 'Ifrane'],
  'Rabat-Salé-Kénitra': ['Rabat', 'Salé', 'Kénitra'],
  'Béni Mellal-Khénifra': ['Béni Mellal', 'Khénifra', 'Khouribga'],
  'Casablanca-Settat': ['Casablanca', 'Mohammedia', 'El Jadida'],
  'Marrakech-Safi': ['Marrakech', 'Essaouira', 'Safi'],
  'Drâa-Tafilalet': ['Errachidia', 'Ouarzazate', 'Zagora'],
  'Souss-Massa': ['Agadir', 'Inezgane', 'Tiznit'],
  'Guelmim-Oued Noun': ['Guelmim', 'Tan-Tan'],
  'Laâyoune-Sakia El Hamra': ['Laâyoune', 'Boujdour'],
  'Dakhla-Oued Ed-Dahab': ['Dakhla']
};

interface ServiceFormProps {
  artistId: string;
  initialValues?: {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    category: string;
    options: GigOption[];
    images: string[];
    video?: string;
      locationName?: string;    // new field
      radius?: number;          // new field
      extras?: GigOption[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ 
  artistId, 
  initialValues, 
  onSuccess, 
  onCancel 
}) => {
  // Form state
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [basePrice, setBasePrice] = useState(
    initialValues?.basePrice ? initialValues.basePrice.toString() : ''
  );
  const [category, setCategory] = useState(initialValues?.category || '');
  const [options, setOptions] = useState<GigOption[]>(initialValues?.options || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location fields
  const [locationName, setLocationName] = useState(initialValues?.locationName || '');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [serviceRadius, setServiceRadius] = useState(initialValues?.radius || 50);
  
  // Dropdown modals
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  
  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: 33.5731,
    longitude: -7.5898,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  // Reverse geocode to get a human-readable location name
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const result = results[0];
        // Combine parts to form a meaningful name
        const name = `${result.city || result.region || ''}, ${result.country || 'Morocco'}`.trim();
        return name || 'Selected location';
      }
      return 'Selected location';
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
      return 'Unknown location';
    }
  };
  
  // Handle map press to select location
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    
    // Reverse geocode to get a location name
    const name = await reverseGeocode(latitude, longitude);
    setLocationName(name);
  };
  
  // Get user's current location to center the map
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setMapRegion({
          ...mapRegion,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  };
  
  // Image handling
  const [selectedImages, setSelectedImages] = useState<ImagePickerAsset[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Video handling
  const [selectedVideo, setSelectedVideo] = useState<ImagePickerAsset | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | undefined>(initialValues?.video);
  const [deleteVideo, setDeleteVideo] = useState(false);
  
  // Option form
  const [optionTitle, setOptionTitle] = useState('');
  const [optionDescription, setOptionDescription] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [optionMaxQuantity, setOptionMaxQuantity] = useState('');

  // Extras (similar to options but optional and different color)
  const [extras, setExtras] = useState<GigOption[]>(initialValues?.extras || []);
  const [extraTitle, setExtraTitle] = useState('');
  const [extraDescription, setExtraDescription] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [extraMaxQuantity, setExtraMaxQuantity] = useState('');
  
  // Handle image selection (unchanged)
  const handleSelectImages = async () => {
    try {
      const totalImages = existingImages.length + selectedImages.length;
      if (totalImages >= 5) {
        Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
        return;
      }
      const images = await pickImages(true);
      if (images.length > 0) {
        const remainingSlots = 5 - totalImages;
        const imagesToAdd = images.slice(0, remainingSlots);
        setSelectedImages([...selectedImages, ...imagesToAdd]);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };
  
  // Remove a selected image (not yet uploaded)
  const removeSelectedImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };
  
  // Mark an existing image for deletion
  const markImageForDeletion = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
    setImagesToDelete([...imagesToDelete, url]);
  };
  
  // Handle video selection
  const handleSelectVideo = async () => {
    try {
      if (selectedVideo || (existingVideo && !deleteVideo)) {
        Alert.alert('Limit Reached', 'You can only upload 1 video.');
        return;
      }
      const video = await pickVideo();
      if (video) {
        setSelectedVideo(video);
        setDeleteVideo(false);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };
  
  // Remove selected video (not yet uploaded)
  const removeSelectedVideo = () => {
    setSelectedVideo(null);
  };
  
  // Mark existing video for deletion
  const markVideoForDeletion = () => {
    setDeleteVideo(true);
    setExistingVideo(undefined);
  };
  
  // Restore existing video
  const restoreVideo = () => {
    setDeleteVideo(false);
    setExistingVideo(initialValues?.video);
  };
  
  // Add an option
  const addOption = () => {
    if (!optionTitle || !optionDescription || !optionPrice) {
      Alert.alert('Missing Information', 'Please fill in all option fields');
      return;
    }
    
    const newOption: GigOption = {
      id: Math.random().toString(36).substr(2, 9),
      title: optionTitle,
      description: optionDescription,
      price: Number(optionPrice),
      maxQuantity: optionMaxQuantity ? Number(optionMaxQuantity) : undefined
    };
    
    setOptions([...options, newOption]);
    setOptionTitle('');
    setOptionDescription('');
    setOptionPrice('');
    setOptionMaxQuantity('');
  };
  
  // Remove an option
  const removeOption = (id: string) => {
    setOptions(options.filter(option => option.id !== id));
  };

  // Add an extra (optional)
  const addExtra = () => {
    if (!extraTitle || !extraDescription || !extraPrice) {
      Alert.alert('Missing Information', 'Please fill in all extra fields');
      return;
    }
    const newExtra: GigOption = {
      id: Math.random().toString(36).substr(2, 9),
      title: extraTitle,
      description: extraDescription,
      price: Number(extraPrice),
      maxQuantity: extraMaxQuantity ? Number(extraMaxQuantity) : undefined
    };
    setExtras([...extras, newExtra]);
    setExtraTitle('');
    setExtraDescription('');
    setExtraPrice('');
    setExtraMaxQuantity('');
  };

  const removeExtra = (id: string) => {
    setExtras(extras.filter(e => e.id !== id));
  };

  const updateExtra = (idx: number, key: 'title' | 'description' | 'price' | 'maxQuantity', value: string) => {
    const updated = [...extras];
    const extra = updated[idx];
    if (!extra) return;
    if (key === 'price') {
      extra.price = Number(value || 0);
    } else if (key === 'maxQuantity') {
      extra.maxQuantity = value ? Number(value) : undefined;
    } else {
      (extra as any)[key] = value;
    }
    updated[idx] = extra;
    setExtras(updated);
  };

  const addEmptyExtra = () => {
    const newExtra: GigOption = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      description: '',
      price: 0,
    };
    setExtras([...extras, newExtra]);
  };

  // If creating a new service, show one empty extra row by default so the
  // Extras section is visible and editable after reload.
  useEffect(() => {
    if (!initialValues && extras.length === 0) {
      addEmptyExtra();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Form submission
  const handleSubmit = async () => {
    // Validation
    if (!title || !description || !basePrice || !category) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    if (!locationName) {
      Alert.alert('Missing Information', 'Please enter a location name');
      return;
    }
    
    // Prepare service data including location fields
    const serviceData: GigInput = {
      title,
      description,
      basePrice: Number(basePrice),
      category,
      options,
      extras,
      locationName,
      radius: serviceRadius
    };
    
    console.log('[ServiceForm] handleSubmit called:', {
      isUpdate: !!initialValues?.id,
      serviceId: initialValues?.id,
      artistId,
      selectedImageCount: selectedImages.length,
      imagesToDeleteCount: imagesToDelete.length,
      hasSelectedVideo: !!selectedVideo,
      deleteVideo,
      serviceData
    });
    
    setIsSubmitting(true);
    
    try {
      if (initialValues?.id) {
        await updateServiceWithImages(
          artistId,
          initialValues.id,
          serviceData,
          selectedImages,
          imagesToDelete,
          selectedVideo,
          deleteVideo
        );
      } else {
        await createServiceWithImages(
          artistId,
          serviceData,
          selectedImages,
          selectedVideo
        );
      }
      console.log('[ServiceForm] Service saved successfully');
      
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        initialValues ? 'Service updated successfully' : 'Service created successfully',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service. Please try again.');
    }
  };
  
  // Render image previews (unchanged)
  const renderImagePreviews = () => {
    return (
      <View style={styles.imagePreviewContainer}>
        {existingImages.map((url, index) => (
          <View key={`existing-${index}`} style={styles.imagePreview}>
            <Image source={{ uri: url }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => markImageForDeletion(url)}
            >
              <Ionicons name="close-circle" size={24} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {selectedImages.map((image, index) => (
          <View key={`new-${index}`} style={styles.imagePreview}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeSelectedImage(index)}
            >
              <Ionicons name="close-circle" size={24} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImages}>
          <Ionicons name="add" size={40} color={Theme.colors.primary} />
          <Text style={styles.addImageText}>Add Images</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render video preview (unchanged)
  const renderVideoPreview = () => {
    return (
      <View style={styles.videoPreviewContainer}>
        {existingVideo && !deleteVideo && (
          <View style={styles.videoPreview}>
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={40} color={Theme.colors.primary} />
              <Text style={styles.videoText}>Video uploaded</Text>
            </View>
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={markVideoForDeletion}
            >
              <Ionicons name="close-circle" size={24} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        {selectedVideo && (
          <View style={styles.videoPreview}>
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={40} color={Theme.colors.primary} />
              <Text style={styles.videoText}>Video selected</Text>
            </View>
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={removeSelectedVideo}
            >
              <Ionicons name="close-circle" size={24} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        {!selectedVideo && !existingVideo && (
          <TouchableOpacity style={styles.addVideoButton} onPress={handleSelectVideo}>
            <Ionicons name="add" size={40} color={Theme.colors.primary} />
            <Text style={styles.addVideoText}>Add Video</Text>
          </TouchableOpacity>
        )}
        {deleteVideo && initialValues?.video && (
          <TouchableOpacity style={styles.restoreVideoButton} onPress={restoreVideo}>
            <Ionicons name="refresh" size={20} color={Theme.colors.primary} />
            <Text style={styles.restoreVideoText}>Restore Video</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render option list (unchanged)
  const renderOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Service Items</Text>
        {options.length > 0 ? (
          options.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                <Text style={styles.optionPrice}>${option.price.toFixed(2)}</Text>
                {option.maxQuantity && (
                  <Text style={styles.optionMaxQuantity}>Max: {option.maxQuantity}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.removeOptionButton}
                onPress={() => removeOption(option.id)}
              >
                <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noOptionsText}>No service items added yet</Text>
        )}
        <View style={styles.addOptionForm}>
          <TextInput
            style={styles.input}
            placeholder="Item Title"
            value={optionTitle}
            onChangeText={setOptionTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Item Description"
            value={optionDescription}
            onChangeText={setOptionDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="decimal-pad"
            value={optionPrice}
            onChangeText={setOptionPrice}
          />
          <TextInput
            style={styles.input}
            placeholder="Max Quantity (optional)"
            keyboardType="number-pad"
            value={optionMaxQuantity}
            onChangeText={setOptionMaxQuantity}
          />
          <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
            <Text style={styles.buttonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Helper to render custom dropdown
  const renderDropdown = (
    label: string,
    value: string,
    onSelect: (val: string) => void,
    options: string[],
    modalVisible: boolean,
    setModalVisible: (visible: boolean) => void
  ) => (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
          {value || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Theme.colors.text} />
      </TouchableOpacity>
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(opt);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>{initialValues ? 'Edit Service' : 'Create New Service'}</Text>
        
        {/* Image Section */}
        <Text style={styles.sectionTitle}>Service Images (Max 5)</Text>
        {renderImagePreviews()}
        
        {/* Video Section */}
        <Text style={styles.sectionTitle}>Service Video (Optional, Max 1)</Text>
        {renderVideoPreview()}
        
        {/* Main Form */}
        <Text style={styles.sectionTitle}>Service Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Service Title"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Service Description"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Base Price"
          keyboardType="decimal-pad"
          value={basePrice}
          onChangeText={setBasePrice}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />
        
        {/* Region and City dropdowns for better UX */}
        <Text style={styles.sectionTitle}>Region & City</Text>
        {renderDropdown('Region', region, (val) => { setRegion(val); setCity(''); }, Object.keys(REGION_CITIES), regionModalVisible, setRegionModalVisible)}
        <View style={{ height: 8 }} />
        {region ? (
          renderDropdown('City', city, setCity, REGION_CITIES[region] || [], cityModalVisible, setCityModalVisible)
        ) : (
          <Text style={styles.dropdownPlaceholder}>Select a region first to choose a city</Text>
        )}
        
        {/* Location Fields */}
        <Text style={styles.sectionTitle}>Service Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Location Name (e.g., Casablanca, Morocco)"
          value={locationName}
          onChangeText={setLocationName}
        />
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setMapVisible(true)}
        >
          <Ionicons name="map-outline" size={20} color={Theme.colors.primary} />
          <Text style={styles.mapButtonText}>Pick on Map</Text>
        </TouchableOpacity>
        {selectedLocation && (
          <View style={styles.locationInfo}>
            <View style={styles.locationInfoHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.locationInfoTitle}>Location Selected</Text>
            </View>
            <Text style={styles.locationText}>
              {locationName}
            </Text>
            <Text style={styles.locationCoords}>
              Coordinates: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
            </Text>
            <Text style={styles.radiusText}>Service Radius: {serviceRadius} km</Text>
          </View>
        )}
        
        {/* Options Section */}
        {renderOptions()}

        {/* Extras Section (optional) - editable list like service items */}
        <View style={styles.extrasContainer}>
          <Text style={styles.sectionTitle}>Extra Services (optional)</Text>
          {extras.length > 0 ? (
            extras.map((extra, idx) => (
              <View key={extra.id} style={[styles.extraItem, { flexDirection: 'column' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 2, marginRight: 8 }]}
                    placeholder="Extra title"
                    value={extra.title}
                    onChangeText={v => updateExtra(idx, 'title', v)}
                  />
                  <TextInput
                    style={[styles.input, { width: 100 }]}
                    placeholder="Price"
                    keyboardType="decimal-pad"
                    value={String(extra.price || '')}
                    onChangeText={v => updateExtra(idx, 'price', v)}
                  />
                  <TouchableOpacity onPress={() => removeExtra(extra.id)} style={{ marginLeft: 8 }}>
                    <Ionicons name="remove-circle" size={22} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Extra description"
                  value={extra.description}
                  onChangeText={v => updateExtra(idx, 'description', v)}
                  multiline
                />
                <TextInput
                  style={[styles.input, { width: 140 }]}
                  placeholder="Max Quantity (optional)"
                  keyboardType="number-pad"
                  value={extra.maxQuantity ? String(extra.maxQuantity) : ''}
                  onChangeText={v => updateExtra(idx, 'maxQuantity', v)}
                />
              </View>
            ))
          ) : (
            <Text style={styles.noOptionsText}>No extras added</Text>
          )}

          <View style={styles.addOptionForm}>
            <TextInput
              style={styles.input}
              placeholder="Extra Title"
              value={extraTitle}
              onChangeText={setExtraTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Extra Description"
              value={extraDescription}
              onChangeText={setExtraDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              keyboardType="decimal-pad"
              value={extraPrice}
              onChangeText={setExtraPrice}
            />
            <TextInput
              style={styles.input}
              placeholder="Max Quantity (optional)"
              keyboardType="number-pad"
              value={extraMaxQuantity}
              onChangeText={setExtraMaxQuantity}
            />
            <TouchableOpacity style={[styles.addOptionButton, styles.addExtraButton]} onPress={addExtra}>
              <Text style={styles.buttonText}>Add Extra</Text>
            </TouchableOpacity>
          </View>
        </View>


        
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {initialValues ? 'Update Service' : 'Create Service'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Map Modal */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Pick Location</Text>
            <TouchableOpacity
              style={styles.mapCloseButton}
              onPress={() => setMapVisible(false)}
            >
              <Ionicons name="close" size={24} color={Theme.colors.textDark} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            {/* Interactive Map */}
            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={true}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={true}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title={locationName || 'Selected Location'}
                  description={`Radius: ${serviceRadius}km`}
                  draggable
                  onDragEnd={handleMapPress}
                />
              )}
            </MapView>
            
            {/* My Location Button */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={getUserLocation}
            >
              <Ionicons name="locate" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
            
            {/* Radius Slider */}
            <View style={styles.radiusSliderContainer}>
              <Text style={styles.radiusSliderLabel}>Service Radius: {serviceRadius} km</Text>
              <View style={styles.radiusSliderButtons}>
                <TouchableOpacity
                  style={styles.radiusSliderButton}
                  onPress={() => setServiceRadius(Math.max(50, serviceRadius - 25))}
                >
                  <Ionicons name="remove" size={20} color={Theme.colors.primary} />
                </TouchableOpacity>
                
                <View style={styles.radiusSliderTrack}>
                  <View
                    style={[
                      styles.radiusSliderFill,
                      { width: `${(serviceRadius / 200) * 100}%` },
                    ]}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.radiusSliderButton}
                  onPress={() => setServiceRadius(Math.min(200, serviceRadius + 25))}
                >
                  <Ionicons name="add" size={20} color={Theme.colors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* Quick radius buttons */}
              <View style={styles.radiusQuickButtons}>
                {[50, 100, 150, 200].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusQuickButton,
                      serviceRadius === radius && styles.radiusQuickButtonActive,
                    ]}
                    onPress={() => setServiceRadius(radius)}
                  >
                    <Text
                      style={[
                        styles.radiusQuickButtonText,
                        serviceRadius === radius && styles.radiusQuickButtonTextActive,
                      ]}
                    >
                      {radius}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Region Selector */}
            <View style={styles.regionSelectorContainer}>
              <Text style={styles.regionSelectorLabel}>Or select from list:</Text>
              <ScrollView style={styles.regionList} nestedScrollEnabled={true}>
                {MOROCCAN_REGIONS.map((region) => (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.regionItem,
                      locationName === region && styles.regionItemActive,
                    ]}
                    onPress={() => {
                      setLocationName(region);
                      const index = MOROCCAN_REGIONS.indexOf(region);
                      setSelectedLocation({
                        latitude: 33.5731 + (index * 0.5),
                        longitude: -7.5898 + (index * 0.3),
                      });
                    }}
                  >
                    <Ionicons 
                      name="location-outline" 
                      size={20} 
                      color={locationName === region ? '#FFFFFF' : Theme.colors.primary} 
                    />
                    <Text style={[
                      styles.regionItemText,
                      locationName === region && styles.regionItemTextActive,
                    ]}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.mapConfirmButton}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.mapConfirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: Theme.spacing.lg,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.md,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 4,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: Theme.borderRadius.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  addImageButton: {
    width: 100,
    height: 100,
    margin: 4,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.xs,
    marginTop: 5,
  },
  videoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.md,
  },
  videoPreview: {
    width: 150,
    height: 100,
    margin: 4,
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
  },
  videoText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.xs,
    marginTop: 5,
  },
  removeVideoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  addVideoButton: {
    width: 150,
    height: 100,
    margin: 4,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVideoText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.xs,
    marginTop: 5,
  },
  restoreVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.sm,
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    marginTop: Theme.spacing.sm,
  },
  restoreVideoText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.sm,
    marginLeft: 5,
  },
  optionsContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  optionDescription: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
  },
  optionPrice: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
    marginTop: 4,
  },
  optionMaxQuantity: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text,
    marginTop: 2,
  },
  removeOptionButton: {
    padding: 10,
  },
  noOptionsText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.md,
  },
  addOptionForm: {
    backgroundColor: '#F9F9F9',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.sm,
  },
  extrasContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    backgroundColor: '#FFF7F0',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.sm,
  },
  addExtraButton: {
    backgroundColor: '#FF9800',
  },
  addOptionButton: {
    backgroundColor: Theme.colors.secondary,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.lg,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginLeft: Theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  buttonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: '#FFFFFF',
  },
  cancelButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  // Dropdown styles
  dropdownContainer: {
    marginBottom: Theme.spacing.md,
  },
  dropdownLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
    marginBottom: 5,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
  },
  dropdownText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  dropdownPlaceholder: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    maxHeight: 400,
  },
  modalOption: {
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalOptionText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  mapButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
    marginLeft: 8,
  },
  locationInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  locationInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfoTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
    marginLeft: 8,
  },
  locationText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginBottom: 4,
  },
  locationCoords: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
    marginBottom: 4,
  },
  radiusText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
    marginTop: 4,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapModalTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
  },
  mapCloseButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    padding: 16,
  },

  radiusSliderContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  radiusSliderLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginBottom: 12,
  },
  radiusSliderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radiusSliderButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  radiusSliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  radiusSliderFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 4,
  },
  radiusQuickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusQuickButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  radiusQuickButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  radiusQuickButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
  },
  radiusQuickButtonTextActive: {
    color: '#fff',
  },
  mapConfirmButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  mapConfirmButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: '#fff',
  },

  regionSelectorContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  regionSelectorLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
    marginBottom: 12,
  },
  regionList: {
    maxHeight: 200,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  regionItemActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  regionItemText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
    marginLeft: 12,
    flex: 1,
  },
  regionItemTextActive: {
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily.medium,
  },

  map: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    marginBottom: 16,
  },
  myLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});