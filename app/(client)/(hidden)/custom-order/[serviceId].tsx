import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../../src/context/AuthContext';
import { fetchAllServices } from '../../../../src/firebase/clientTicketsService';
import { createCustomServiceOrder } from '../../../../src/firebase/customOrderService';

interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  artistId: string;
  artistName: string;
  image?: string;
}

export default function CustomOrderScreen() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Service data
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Step 1: Service customization
  const [customization, setCustomization] = useState({
    eventDate: '',
    eventTime: '',
    duration: '',
    location: '',
    guestCount: '',
    specificRequests: '',
  });
  
  // Step 2: Price proposal
  const [priceProposal, setPriceProposal] = useState({
    proposedPrice: '',
    budgetRange: '',
    priceJustification: '',
  });
  
  // Step 3: Personal information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: '',
    additionalNotes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServiceData();
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
      const services = await fetchAllServices();
      const foundService = services.find((s: any) => s.id === serviceId);
      
      if (foundService) {
        setServiceData({
          id: foundService.id,
          title: foundService.title || foundService.name || 'Service',
          description: foundService.description || 'No description available',
          price: foundService.price || 0,
          category: foundService.category || 'General',
          location: foundService.location || 'Location TBD',
          artistId: foundService.artistId || foundService.userId || 'unknown',
          artistName: foundService.artistName || 'Service Provider',
          image: foundService.image,
        });
      } else {
        Alert.alert('Error', 'Service not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      Alert.alert('Error', 'Failed to load service details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      Animated.timing(slideAnim, {
        toValue: -(currentStep * 100),
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      Animated.timing(slideAnim, {
        toValue: -((currentStep - 2) * 100),
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const validateStep1 = () => {
    if (!customization.eventDate || !customization.eventTime || !customization.location) {
      Alert.alert('Missing Information', 'Please fill in event date, time, and location.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!priceProposal.proposedPrice) {
      Alert.alert('Missing Information', 'Please enter your proposed price.');
      return false;
    }
    if (isNaN(parseFloat(priceProposal.proposedPrice))) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!personalInfo.fullName || !personalInfo.phone || !personalInfo.address) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Name, Phone, Address).');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      nextStep();
    } else if (currentStep === 2 && validateStep2()) {
      nextStep();
    }
  };

  const submitCustomOrder = async () => {
    if (!validateStep3()) return;
    
    setIsSubmitting(true);
    
    try {
      if (!user || !serviceData) {
        Alert.alert('Error', 'User authentication or service data not available');
        return;
      }

      const customMessage = `
EVENT DETAILS:
• Date: ${customization.eventDate}
• Time: ${customization.eventTime}
• Duration: ${customization.duration || 'Not specified'}
• Location: ${customization.location}
• Guest Count: ${customization.guestCount || 'Not specified'}
• Specific Requests: ${customization.specificRequests || 'None'}

PRICE PROPOSAL:
• Proposed Price: ${priceProposal.proposedPrice} MAD
• Budget Range: ${priceProposal.budgetRange || 'Not specified'}
• Justification: ${priceProposal.priceJustification || 'No additional notes'}

CLIENT INFORMATION:
• Name: ${personalInfo.fullName}
• Email: ${personalInfo.email}
• Phone: ${personalInfo.phone}
• Address: ${personalInfo.address}, ${personalInfo.city}, ${personalInfo.country}
• Additional Notes: ${personalInfo.additionalNotes || 'None'}
      `;

      await createCustomServiceOrder({
        clientId: (user as any)?.uid || (user as any)?.id || 'unknown',
        artistId: serviceData.artistId,
        serviceId: serviceData.id,
        serviceName: serviceData.title,
        clientPrice: parseFloat(priceProposal.proposedPrice),
        realPrice: serviceData.price,
        message: customMessage,
        status: 'pending',
        customization: {
          eventDate: customization.eventDate,
          eventTime: customization.eventTime,
          duration: customization.duration,
          location: customization.location,
          guestCount: customization.guestCount,
          specificRequests: customization.specificRequests,
        },
        priceProposal: {
          proposedPrice: priceProposal.proposedPrice,
          budgetRange: priceProposal.budgetRange,
          priceJustification: priceProposal.priceJustification,
        },
        personalInfo: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          address: personalInfo.address,
          city: personalInfo.city,
          country: personalInfo.country,
          additionalNotes: personalInfo.additionalNotes,
        },
        clientInfo: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          address: personalInfo.address,
          city: personalInfo.city,
          country: personalInfo.country,
        }
      });

      Alert.alert(
        'Order Submitted Successfully! 🎉',
        `Your custom order for "${serviceData.title}" has been sent to the service provider. They will review your proposal and respond soon.`,
        [
          {
            text: 'Continue Shopping',
            onPress: () => router.back()
          },
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting custom order:', error);
      Alert.alert('Error', 'Failed to submit your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Order</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              currentStep >= step ? styles.progressCircleActive : styles.progressCircleInactive
            ]}>
              <Text style={[
                styles.progressNumber,
                currentStep >= step ? styles.progressNumberActive : styles.progressNumberInactive
              ]}>
                {step}
              </Text>
            </View>
            <Text style={[
              styles.progressLabel,
              currentStep >= step ? styles.progressLabelActive : styles.progressLabelInactive
            ]}>
              {step === 1 ? 'Customize' : step === 2 ? 'Price' : 'Details'}
            </Text>
          </View>
        ))}
      </View>

      {/* Service Info */}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle}>{serviceData?.title}</Text>
        <Text style={styles.serviceProvider}>by {serviceData?.artistName}</Text>
        <Text style={styles.servicePrice}>Base Price: {serviceData?.price} MAD</Text>
      </View>

      {/* Steps Container */}
      <Animated.View style={[
        styles.stepsContainer,
        { transform: [{ translateX: slideAnim }] }
      ]}>
        {/* Step 1: Service Customization */}
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Customize Your Service</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Date *</Text>
            <TextInput
              style={styles.formInput}
              value={customization.eventDate}
              onChangeText={(text) => setCustomization(prev => ({ ...prev, eventDate: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Time *</Text>
            <TextInput
              style={styles.formInput}
              value={customization.eventTime}
              onChangeText={(text) => setCustomization(prev => ({ ...prev, eventTime: text }))}
              placeholder="HH:MM"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Duration</Text>
            <TextInput
              style={styles.formInput}
              value={customization.duration}
              onChangeText={(text) => setCustomization(prev => ({ ...prev, duration: text }))}
              placeholder="e.g., 4 hours, Full day"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Location *</Text>
            <TextInput
              style={styles.formInput}
              value={customization.location}
              onChangeText={(text) => setCustomization(prev => ({ ...prev, location: text }))}
              placeholder="Venue address or location details"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Number of Guests</Text>
            <TextInput
              style={styles.formInput}
              value={customization.guestCount}
              onChangeText={(text) => setCustomization(prev => ({ ...prev, guestCount: text }))}
              placeholder="Approximate number of attendees"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Specific Requests</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={customization.specificRequests}
              onChangeText={(text) => setCustomization(prev => ({ ...prev, specificRequests: text }))}
              placeholder="Any specific requirements or preferences..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Step 2: Price Proposal */}
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Your Price Proposal</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Proposed Price (MAD) *</Text>
            <TextInput
              style={styles.formInput}
              value={priceProposal.proposedPrice}
              onChangeText={(text) => setPriceProposal(prev => ({ ...prev, proposedPrice: text }))}
              placeholder="Enter your budget"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Base price: {serviceData?.price} MAD
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Budget Range</Text>
            <TextInput
              style={styles.formInput}
              value={priceProposal.budgetRange}
              onChangeText={(text) => setPriceProposal(prev => ({ ...prev, budgetRange: text }))}
              placeholder="e.g., 1000-1500 MAD"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Price Justification</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={priceProposal.priceJustification}
              onChangeText={(text) => setPriceProposal(prev => ({ ...prev, priceJustification: text }))}
              placeholder="Why this price? Any additional context..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Step 3: Personal Information */}
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Your Information</Text>
          
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
            <Text style={styles.formLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={personalInfo.additionalNotes}
              onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, additionalNotes: text }))}
              placeholder="Any additional information..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backStepButton}
            onPress={prevStep}
          >
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 1 ? styles.nextButtonFull : {}]}
          onPress={currentStep === 3 ? submitCustomOrder : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Submit Order' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: '#6C63FF',
  },
  progressCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressNumberInactive: {
    color: '#9CA3AF',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressLabelActive: {
    color: '#6C63FF',
  },
  progressLabelInactive: {
    color: '#9CA3AF',
  },
  serviceInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C63FF',
  },
  stepsContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '300%',
  },
  stepContainer: {
    flex: 1,
    width: '33.33%',
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backStepButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  backStepText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});