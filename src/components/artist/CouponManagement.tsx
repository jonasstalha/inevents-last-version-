import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth } from 'firebase/auth';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../../firebase/artistServices';
import {
    Coupon,
    createCoupon,
    deleteCoupon,
    getCouponsByArtist,
    updateCoupon,
} from '../../firebase/couponService';

interface Service {
  id: string;
  title: string;
}

const MIN_TOUCH_SIZE = 44;
const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;
const COUPON_ITEM_ESTIMATED_HEIGHT = 190;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const toDate = (value: Date | { toDate?: () => Date } | string | number): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value as string | number);
};

type CouponCardProps = {
  coupon: Coupon;
  onToggleStatus: (couponId: string, isActive: boolean) => void;
  onDelete: (couponId: string) => void;
  onOpenDetails: (coupon: Coupon) => void;
  fontScale: number;
};

const CouponCard = memo(({ coupon, onToggleStatus, onDelete, onOpenDetails, fontScale }: CouponCardProps) => {
  const expiryDate = toDate(coupon.expiryDate as Date);
  const isExpired = new Date() > expiryDate;
  const usagePercentage = coupon.maxUses > 0 ? clamp((coupon.currentUses / coupon.maxUses) * 100, 0, 100) : 0;

  return (
    <View style={styles.couponCard}>
      <View style={styles.couponHeader}>
        <View style={styles.couponCodeContainer}>
          <Text
            style={[styles.couponCode, { fontSize: clamp(18 / fontScale, 16, 20) }]}
            allowFontScaling
            maxFontSizeMultiplier={2}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {coupon.code}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: coupon.isActive && !isExpired ? '#2e7d32' : '#d32f2f' },
            ]}
          >
            <Text style={styles.statusText} allowFontScaling maxFontSizeMultiplier={2}>
              {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onOpenDetails(coupon)}
          accessibilityRole="button"
          accessibilityLabel={`Open options for coupon ${coupon.code}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.serviceName} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
        {coupon.serviceName}
      </Text>

      <View style={styles.discountContainer}>
        <Text style={styles.discountText} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${coupon.discountValue} MAD OFF`}
        </Text>
      </View>

      <View style={styles.usageContainer}>
        <Text style={styles.usageText} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
          Used: {coupon.currentUses} / {coupon.maxUses}
        </Text>
        <View style={styles.usageBar}>
          <View style={[styles.usageProgress, { width: `${usagePercentage}%` }]} />
        </View>
      </View>

      <Text style={styles.expiryText} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
        Expires: {expiryDate.toLocaleDateString()}
      </Text>

      <View style={styles.couponActions}>
        <Switch
          value={coupon.isActive}
          onValueChange={(value) => onToggleStatus(coupon.id!, value)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={coupon.isActive ? '#f5dd4b' : '#f4f3f4'}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(coupon.id!)}
          accessibilityRole="button"
          accessibilityLabel={`Delete coupon ${coupon.code}`}
        >
          <Ionicons name="trash" size={20} color="#d32f2f" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

CouponCard.displayName = 'CouponCard';

const CouponManagement = () => {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    serviceId: '',
    serviceName: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: '',
    minOrderValue: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showDiscountTypeDropdown, setShowDiscountTypeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= TABLET_BREAKPOINT;
  const isLargeTablet = shortestSide >= LARGE_TABLET_BREAKPOINT;
  const isCompactWidth = width <= 360;

  const horizontalPadding = useMemo(() => clamp(width * 0.05, 12, 28), [width]);
  const contentMaxWidth = useMemo(() => {
    if (isLargeTablet) return 1000;
    if (isTablet) return 860;
    return 680;
  }, [isLargeTablet, isTablet]);

  const createModalMaxWidth = useMemo(() => {
    if (isLargeTablet) return 760;
    if (isTablet) return 680;
    return 620;
  }, [isLargeTablet, isTablet]);

  const dropdownModalMaxWidth = isTablet ? 560 : 460;
  const modalHeightLimit = Math.max(360, height - insets.top - insets.bottom - 24);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const servicesData = await fetchServicesByArtistId(currentUser.uid);
      setServices(servicesData.map((s) => ({ id: s.id, title: s.title })));

      const couponsData = await getCouponsByArtist(currentUser.uid);
      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateCouponCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code: result }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.code.trim()) newErrors.code = 'Coupon code is required';
    if (!formData.serviceId) newErrors.serviceId = 'Please select a service';
    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0 || isNaN(parseFloat(formData.discountValue))) {
      newErrors.discountValue = 'Discount value must be a valid number greater than 0';
    }
    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }
    if (!formData.maxUses || parseInt(formData.maxUses, 10) <= 0 || isNaN(parseInt(formData.maxUses, 10))) {
      newErrors.maxUses = 'Max uses must be a valid number greater than 0';
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (formData.expiryDate <= new Date()) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      code: '',
      serviceId: '',
      serviceName: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      description: '',
      minOrderValue: '',
      isActive: true,
    });
    setErrors({});
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setShowDatePicker(false);
    resetForm();
  }, [resetForm]);

  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedCoupon(null);
  }, []);

  const handleCreateCoupon = useCallback(async () => {
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
      const selectedService = services.find((s) => s.id === formData.serviceId);

      if (!selectedService) {
        Alert.alert('Error', 'Selected service not found');
        return;
      }

      const discountValue = parseFloat(formData.discountValue);
      const maxUses = parseInt(formData.maxUses, 10);
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
        expiryDate: formData.expiryDate,
        description: formData.description || '',
        minOrderValue,
      };

      await createCoupon(couponData);

      Alert.alert('Success', 'Coupon created successfully!');
      setShowCreateModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      const errorMessage = error?.message || 'Failed to create coupon';
      Alert.alert('Error', errorMessage);
    }
  }, [currentUser, fetchData, formData, resetForm, services, validateForm]);

  const handleToggleCouponStatus = useCallback(async (couponId: string, isActive: boolean) => {
    try {
      await updateCoupon(couponId, { isActive });
      await fetchData();
    } catch (error) {
      console.error('Error updating coupon:', error);
      Alert.alert('Error', 'Failed to update coupon status');
    }
  }, [fetchData]);

  const handleDeleteCoupon = useCallback((couponId: string) => {
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
              closeDetailsModal();
              await fetchData();
            } catch (error) {
              console.error('Error deleting coupon:', error);
              Alert.alert('Error', 'Failed to delete coupon');
            }
          },
        },
      ]
    );
  }, [closeDetailsModal, fetchData]);

  const onDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event?.type === 'dismissed' || !selectedDate) {
      return;
    }

    setFormData((prev) => ({ ...prev, expiryDate: selectedDate }));
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const openDetailsModal = useCallback((coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowDetailsModal(true);
  }, []);

  const handleToggleFromDetails = useCallback(async () => {
    if (!selectedCoupon?.id) return;
    await handleToggleCouponStatus(selectedCoupon.id, !selectedCoupon.isActive);
    closeDetailsModal();
  }, [closeDetailsModal, handleToggleCouponStatus, selectedCoupon]);

  const renderCouponCard = useCallback(({ item }: { item: Coupon }) => {
    return (
      <CouponCard
        coupon={item}
        onToggleStatus={handleToggleCouponStatus}
        onDelete={handleDeleteCoupon}
        onOpenDetails={openDetailsModal}
        fontScale={fontScale}
      />
    );
  }, [fontScale, handleDeleteCoupon, handleToggleCouponStatus, openDetailsModal]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pricetag-outline" size={48} color="#999" />
      <Text style={styles.emptyText} allowFontScaling maxFontSizeMultiplier={2}>
        No coupons yet
      </Text>
      <Text style={styles.emptySubtext} allowFontScaling maxFontSizeMultiplier={2}>
        Create your first coupon to boost bookings and sales.
      </Text>
    </View>
  ), []);

  const listHeaderComponent = useMemo(() => (
    <View style={styles.listHeaderContainer}>
      <Text style={styles.screenTitle} allowFontScaling maxFontSizeMultiplier={2}>
        Coupons
      </Text>
      <Text style={styles.screenSubtitle} allowFontScaling maxFontSizeMultiplier={2}>
        Manage promo codes for your services.
      </Text>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text allowFontScaling maxFontSizeMultiplier={2}>Loading coupons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.screenFrame, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]}> 
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: horizontalPadding,
              maxWidth: contentMaxWidth,
              alignSelf: 'center',
              width: '100%',
            },
          ]}
        >
          <Text
            style={[styles.headerTitle, isCompactWidth && styles.headerTitleCompact]}
            allowFontScaling
            maxFontSizeMultiplier={2}
            numberOfLines={2}
          >
            Coupon Management
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Create coupon"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.listWrapper, { maxWidth: contentMaxWidth }]}> 
            <FlatList
              data={coupons}
              renderItem={renderCouponCard}
              keyExtractor={(item) => item.id || item.code}
              getItemLayout={(_, index) => ({
                length: COUPON_ITEM_ESTIMATED_HEIGHT,
                offset: COUPON_ITEM_ESTIMATED_HEIGHT * index,
                index,
              })}
              contentContainerStyle={styles.listContentContainer}
              ListHeaderComponent={listHeaderComponent}
              ListEmptyComponent={listEmptyComponent}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={70}
              windowSize={8}
              removeClippedSubviews
            />
          </View>
        </View>
      </View>

      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={closeCreateModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCreateModal} />
          <View
            style={[
              styles.modalContainer,
              {
                width: '94%',
                minWidth: 280,
                maxWidth: createModalMaxWidth,
                maxHeight: modalHeightLimit,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalIconButton}
                onPress={closeCreateModal}
                accessibilityRole="button"
                accessibilityLabel="Close create coupon form"
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
                Create Coupon
              </Text>
              <TouchableOpacity
                style={styles.saveActionButton}
                onPress={handleCreateCoupon}
                accessibilityRole="button"
                accessibilityLabel="Save coupon"
              >
                <Text style={styles.saveButton} allowFontScaling maxFontSizeMultiplier={2}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>
                  Coupon Code
                </Text>
                <View style={styles.codeInputContainer}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={formData.code}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, code: text.toUpperCase() }))}
                    placeholder="Enter coupon code"
                    placeholderTextColor="#8f8f8f"
                    maxLength={10}
                    autoCapitalize="characters"
                    allowFontScaling
                    maxFontSizeMultiplier={2}
                  />
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generateCouponCode}
                    accessibilityRole="button"
                    accessibilityLabel="Generate coupon code"
                  >
                    <Text style={styles.generateButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                      Generate
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.code && <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2}>{errors.code}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>Service</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowServiceDropdown(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select service"
                >
                  <Text
                    style={[styles.dropdownText, !formData.serviceId && styles.placeholderText]}
                    allowFontScaling
                    maxFontSizeMultiplier={2}
                    numberOfLines={2}
                  >
                    {formData.serviceId ? services.find((s) => s.id === formData.serviceId)?.title : 'Select a service'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.serviceId && <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2}>{errors.serviceId}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>Discount Type</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDiscountTypeDropdown(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select discount type"
                >
                  <Text style={styles.dropdownText} allowFontScaling maxFontSizeMultiplier={2}>
                    {formData.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount (MAD)'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>
                  Discount Value {formData.discountType === 'percentage' ? '(%)' : '(MAD)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.discountValue}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, discountValue: text }))}
                  placeholder={formData.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                  placeholderTextColor="#8f8f8f"
                  keyboardType="numeric"
                  allowFontScaling
                  maxFontSizeMultiplier={2}
                />
                {errors.discountValue && <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2}>{errors.discountValue}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>Maximum Uses</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxUses}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, maxUses: text }))}
                  placeholder="e.g., 50"
                  placeholderTextColor="#8f8f8f"
                  keyboardType="numeric"
                  allowFontScaling
                  maxFontSizeMultiplier={2}
                />
                {errors.maxUses && <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2}>{errors.maxUses}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>Expiry Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select expiry date"
                >
                  <Text style={styles.dateButtonText} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
                    {formatDate(formData.expiryDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {errors.expiryDate && <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2}>{errors.expiryDate}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>Minimum Order Value (MAD) - Optional</Text>
                <TextInput
                  style={styles.input}
                  value={formData.minOrderValue}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, minOrderValue: text }))}
                  placeholder="e.g., 100"
                  placeholderTextColor="#8f8f8f"
                  keyboardType="numeric"
                  allowFontScaling
                  maxFontSizeMultiplier={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={2}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                  placeholder="Describe this coupon..."
                  placeholderTextColor="#8f8f8f"
                  multiline
                  numberOfLines={3}
                  allowFontScaling
                  maxFontSizeMultiplier={2}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                  <Text style={[styles.label, styles.switchLabel]} allowFontScaling maxFontSizeMultiplier={2}>Active</Text>
                  <Switch value={formData.isActive} onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))} />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showServiceDropdown} transparent animationType="fade" onRequestClose={() => setShowServiceDropdown(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowServiceDropdown(false)}>
          <Pressable onPress={() => {}}>
            <View
              style={[
                styles.dropdownModal,
                {
                  width: '92%',
                  minWidth: 280,
                  maxWidth: dropdownModalMaxWidth,
                  maxHeight: modalHeightLimit * 0.65,
                },
              ]}
            >
              <Text style={styles.dropdownTitle} allowFontScaling maxFontSizeMultiplier={2}>
                Select Service
              </Text>
              <FlatList
                style={styles.dropdownList}
                data={services}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: service }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, serviceId: service.id, serviceName: service.title }));
                      setShowServiceDropdown(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select service ${service.title}`}
                  >
                    <Text style={styles.dropdownItemText} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
                      {service.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showDiscountTypeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscountTypeDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDiscountTypeDropdown(false)}>
          <Pressable onPress={() => {}}>
            <View style={[styles.dropdownModal, { width: '92%', minWidth: 280, maxWidth: dropdownModalMaxWidth }]}> 
              <Text style={styles.dropdownTitle} allowFontScaling maxFontSizeMultiplier={2}>
                Select Discount Type
              </Text>
              <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, discountType: 'percentage' }));
                    setShowDiscountTypeDropdown(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Choose percentage discount"
                >
                  <Text style={styles.dropdownItemText} allowFontScaling maxFontSizeMultiplier={2}>Percentage</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, discountType: 'fixed' }));
                    setShowDiscountTypeDropdown(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Choose fixed amount discount"
                >
                  <Text style={styles.dropdownItemText} allowFontScaling maxFontSizeMultiplier={2}>Fixed Amount (MAD)</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showDetailsModal} transparent animationType="fade" onRequestClose={closeDetailsModal}>
        <Pressable style={styles.modalOverlay} onPress={closeDetailsModal}>
          <Pressable onPress={() => {}}>
            <View
              style={[
                styles.detailsModal,
                {
                  width: '90%',
                  minWidth: 260,
                  maxWidth: isTablet ? 520 : 420,
                },
              ]}
            >
              <Text style={styles.dropdownTitle} allowFontScaling maxFontSizeMultiplier={2} numberOfLines={2}>
                {selectedCoupon?.code || 'Coupon'}
              </Text>
              <TouchableOpacity
                style={styles.detailsAction}
                onPress={handleToggleFromDetails}
                accessibilityRole="button"
                accessibilityLabel="Toggle coupon status"
              >
                <Text style={styles.detailsActionText} allowFontScaling maxFontSizeMultiplier={2}>
                  {selectedCoupon?.isActive ? 'Deactivate' : 'Activate'} Coupon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailsAction}
                onPress={() => selectedCoupon?.id && handleDeleteCoupon(selectedCoupon.id)}
                accessibilityRole="button"
                accessibilityLabel="Delete selected coupon"
              >
                <Text style={[styles.detailsActionText, styles.deleteText]} allowFontScaling maxFontSizeMultiplier={2}>
                  Delete Coupon
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={formData.expiryDate}
          mode="date"
          is24Hour
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
  screenFrame: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    width: '100%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202020',
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  headerTitleCompact: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#6a0dad',
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    paddingTop: 12,
    width: '100%',
  },
  listWrapper: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  listContentContainer: {
    paddingBottom: 18,
  },
  listHeaderContainer: {
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    flexShrink: 1,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#666',
    flexShrink: 1,
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
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    flexShrink: 1,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
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
    gap: 12,
  },
  couponCodeContainer: {
    flex: 1,
    minWidth: 0,
  },
  couponCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  menuButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    flexShrink: 1,
  },
  discountContainer: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  discountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    flexShrink: 1,
  },
  usageContainer: {
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    flexShrink: 1,
  },
  usageBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    width: '100%',
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
    flexShrink: 1,
  },
  couponActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  modalIconButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    flexShrink: 1,
  },
  saveActionButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  modalContent: {
    width: '100%',
  },
  modalContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    flexShrink: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
    width: '100%',
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
    minHeight: 48,
    width: '100%',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    flexWrap: 'wrap',
  },
  codeInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 160,
  },
  generateButton: {
    backgroundColor: '#6a0dad',
    minWidth: 110,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 1,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    flexShrink: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  dropdownList: {
    maxHeight: 320,
  },
  dropdownItem: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  textArea: {
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    marginBottom: 0,
    flex: 1,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
    flexShrink: 1,
  },
  detailsModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  detailsAction: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailsActionText: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    flexShrink: 1,
  },
  deleteText: {
    color: '#d32f2f',
  },
});

export default CouponManagement;
