import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../../firebase/artistServices';
import {
  Coupon,
  createCoupon,
  deleteCoupon,
  getCouponsByArtist,
  updateCoupon
} from '../../firebase/couponService';

interface Service {
  id: string;
  title: string;
}

const CouponManagement = () => {
  const insets = useSafeAreaInsets();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    serviceId: '',
    serviceName: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    description: '',
    minOrderValue: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Dropdown states
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showDiscountTypeDropdown, setShowDiscountTypeDropdown] = useState(false);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching data for artist:', currentUser?.uid);
      
      // Fetch artist's services
      const servicesData = await fetchServicesByArtistId(currentUser!.uid);
      console.log('Services fetched:', servicesData.length);
      setServices(servicesData.map(s => ({ id: s.id, title: s.title })));
      
      // Fetch artist's coupons
      const couponsData = await getCouponsByArtist(currentUser!.uid);
      console.log('Coupons fetched:', couponsData.length);
      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.code.trim()) newErrors.code = 'Coupon code is required';
    if (!formData.serviceId) newErrors.serviceId = 'Please select a service';
    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0 || isNaN(parseFloat(formData.discountValue))) {
      newErrors.discountValue = 'Discount value must be a valid number greater than 0';
    }
    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }
    if (!formData.maxUses || parseInt(formData.maxUses) <= 0 || isNaN(parseInt(formData.maxUses))) {
      newErrors.maxUses = 'Max uses must be a valid number greater than 0';
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (formData.expiryDate <= new Date()) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCoupon = async () => {
    if (!validateForm()) return;

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create coupons');
      return;
    }

    if (services.length === 0) {
      Alert.alert('Error', 'No services found. Please create a service first.');
      return;
    }

    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      
      if (!selectedService) {
        Alert.alert('Error', 'Selected service not found');
        return;
      }
      
      // Parse and validate numeric values
      const discountValue = parseFloat(formData.discountValue);
      const maxUses = parseInt(formData.maxUses);
      const minOrderValue = formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0;
      
      if (isNaN(discountValue) || isNaN(maxUses) || (formData.minOrderValue && isNaN(minOrderValue))) {
        Alert.alert('Error', 'Please enter valid numeric values');
        return;
      }
      
      const couponData = {
        code: formData.code.toUpperCase(),
        serviceId: formData.serviceId,
        serviceName: selectedService.title || '',
        artistId: currentUser.uid,
        artistName: currentUser.displayName || 'Artist',
        discountType: formData.discountType,
        discountValue,
        maxUses,
        isActive: formData.isActive,
        expiryDate: formData.expiryDate, // Already a Date object
        description: formData.description || '',
        minOrderValue,
      };

      console.log('Creating coupon with data:', couponData);
      await createCoupon(couponData);
      
      Alert.alert('Success', 'Coupon created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      const errorMessage = error?.message || 'Failed to create coupon';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleToggleCouponStatus = async (couponId: string, isActive: boolean) => {
    try {
      await updateCoupon(couponId, { isActive });
      fetchData();
    } catch (error) {
      console.error('Error updating coupon:', error);
      Alert.alert('Error', 'Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    Alert.alert(
      'Delete Coupon',
      'Are you sure you want to delete this coupon? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCoupon(couponId);
              Alert.alert('Success', 'Coupon deleted successfully');
              fetchData();
            } catch (error) {
              console.error('Error deleting coupon:', error);
              Alert.alert('Error', 'Failed to delete coupon');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      code: '',
      serviceId: '',
      serviceName: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      description: '',
      minOrderValue: '',
      isActive: true,
    });
    setErrors({});
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.expiryDate;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData(prev => ({ ...prev, expiryDate: currentDate }));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderCouponCard = (coupon: Coupon) => {
    const isExpired = new Date() > coupon.expiryDate;
    const usagePercentage = (coupon.currentUses / coupon.maxUses) * 100;

    return (
      <View key={coupon.id} style={styles.couponCard}>
        <View style={styles.couponHeader}>
          <View style={styles.couponCodeContainer}>
            <Text style={styles.couponCode}>{coupon.code}</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: coupon.isActive && !isExpired ? '#4CAF50' : '#f44336' 
            }]}>
              <Text style={styles.statusText}>
                {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              setSelectedCoupon(coupon);
              setShowDetailsModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.serviceName}>{coupon.serviceName}</Text>
        
        <View style={styles.discountContainer}>
          <Text style={styles.discountText}>
            {coupon.discountType === 'percentage' 
              ? `${coupon.discountValue}% OFF`
              : `${coupon.discountValue} MAD OFF`}
          </Text>
        </View>

        <View style={styles.usageContainer}>
          <Text style={styles.usageText}>
            Used: {coupon.currentUses} / {coupon.maxUses}
          </Text>
          <View style={styles.usageBar}>
            <View style={[styles.usageProgress, { width: `${usagePercentage}%` }]} />
          </View>
        </View>

        <Text style={styles.expiryText}>
          Expires: {coupon.expiryDate.toLocaleDateString()}
        </Text>

        <View style={styles.couponActions}>
          <Switch
            value={coupon.isActive}
            onValueChange={(value) => handleToggleCouponStatus(coupon.id!, value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={coupon.isActive ? '#f5dd4b' : '#f4f3f4'}
          />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCoupon(coupon.id!)}
          >
            <Ionicons name="trash" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading coupons...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content} />

      {/* Create Coupon Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Coupon</Text>
            <TouchableOpacity onPress={handleCreateCoupon}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Coupon Code</Text>
              <View style={styles.codeInputContainer}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={formData.code}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, code: text.toUpperCase() }))}
                  placeholder="Enter coupon code"
                  maxLength={10}
                />
                <TouchableOpacity style={styles.generateButton} onPress={generateCouponCode}>
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
              {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Service</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowServiceDropdown(true)}
              >
                <Text style={[styles.dropdownText, !formData.serviceId && styles.placeholderText]}>
                  {formData.serviceId 
                    ? services.find(s => s.id === formData.serviceId)?.title 
                    : 'Select a service'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {errors.serviceId && <Text style={styles.errorText}>{errors.serviceId}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount Type</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowDiscountTypeDropdown(true)}
              >
                <Text style={styles.dropdownText}>
                  {formData.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount (MAD)'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Discount Value {formData.discountType === 'percentage' ? '(%)' : '(MAD)'}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.discountValue}
                onChangeText={(text) => setFormData(prev => ({ ...prev, discountValue: text }))}
                placeholder={formData.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                keyboardType="numeric"
              />
              {errors.discountValue && <Text style={styles.errorText}>{errors.discountValue}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Maximum Uses</Text>
              <TextInput
                style={styles.input}
                value={formData.maxUses}
                onChangeText={(text) => setFormData(prev => ({ ...prev, maxUses: text }))}
                placeholder="e.g., 50"
                keyboardType="numeric"
              />
              {errors.maxUses && <Text style={styles.errorText}>{errors.maxUses}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expiry Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(formData.expiryDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Minimum Order Value (MAD) - Optional</Text>
              <TextInput
                style={styles.input}
                value={formData.minOrderValue}
                onChangeText={(text) => setFormData(prev => ({ ...prev, minOrderValue: text }))}
                placeholder="e.g., 100"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe this coupon..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Service Selection Modal */}
      <Modal visible={showServiceDropdown} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowServiceDropdown(false)}
          activeOpacity={1}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Service</Text>
            <ScrollView style={styles.dropdownList}>
              {services.map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      serviceId: service.id,
                      serviceName: service.title 
                    }));
                    setShowServiceDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{service.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Discount Type Selection Modal */}
      <Modal visible={showDiscountTypeDropdown} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowDiscountTypeDropdown(false)}
          activeOpacity={1}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Discount Type</Text>
            <ScrollView style={styles.dropdownList}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, discountType: 'percentage' }));
                  setShowDiscountTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Percentage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, discountType: 'fixed' }));
                  setShowDiscountTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Fixed Amount (MAD)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={formData.expiryDate}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 24,
  },
  addButton: {
    backgroundColor: '#6a0dad',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponCodeContainer: {
    flex: 1,
  },
  couponCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 4,
  },
  serviceName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  discountContainer: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  discountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  usageContainer: {
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  usageBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  usageProgress: {
    height: '100%',
    backgroundColor: '#6a0dad',
    borderRadius: 2,
  },
  expiryText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  couponActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    marginRight: 12,
  },
  generateButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: 300,
    padding: 20,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 4,
  },
});

export default CouponManagement;