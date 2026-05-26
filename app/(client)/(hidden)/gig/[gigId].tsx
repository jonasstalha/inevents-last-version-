import { fetchArtistById } from '@/src/firebase/artistsService';
import { recordCouponUsage } from '@/src/firebase/couponService';
import { fetchServiceByIdFromFirebase } from '@/src/firebase/fetchAllServices';
import { storage } from '@/src/firebase/firebaseConfig';
import { createOrder } from '@/src/firebase/orderService';
import { validatePromoCode } from '@/src/firebase/promoService';
import { addServiceReview } from '@/src/firebase/reviewService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

// ─────────────────────────────────────────────────────────────
// Tab bar dimensions
// ─────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_INSET = Platform.OS === 'ios' ? 20 : 8;
const TOTAL_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_INSET;

// ─────────────────────────────────────────────────────────────
// Design tokens — single source of truth for the look & feel
// ─────────────────────────────────────────────────────────────
const COLORS = {
  // Backgrounds
  bg: '#F7F8FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F5F9',
  surfaceSubtle: '#FAFBFD',

  // Text
  text: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',

  // Primary
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primarySoft: '#EEF0FF',

  // Accents
  success: '#10B981',
  successSoft: '#ECFDF5',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  gold: '#F5B301',

  // Borders / dividers
  border: '#E5E7EB',
  borderSoft: '#EEF0F4',
  divider: '#F1F2F6',

  // Misc
  overlay: 'rgba(15, 23, 42, 0.55)',
  shadow: '#0F172A',
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

// Default image to show when no images are available
const DEFAULT_SERVICE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function ServiceDetailScreen() {
  const { gigId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [serviceQuantities, setServiceQuantities] = useState<{[key: string]: number}>({ 
    service: 1
  });
  const [customMessage, setCustomMessage] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  
   const [clientBudget, setClientBudget] = useState('');
   const [personalInfo, setPersonalInfo] = useState({
     fullName: '',
     email: '',
     phone: '',
     address: '',
     city: '',
     country: '',
     eventDate: '',
     eventLocation: '',
     additionalNotes: '',
   });
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [tempEventDate, setTempEventDate] = useState(new Date());
   const [selectedLocation, setSelectedLocation] = useState<any>(null);
   const [showLocationPicker, setShowLocationPicker] = useState(false);
  
   const [reviews, setReviews] = useState<Array<{
     user: string;
     text: string;
     rating: number;
     date: string;
     userId?: string;
   }>>([]);
   const [reviewSubmitting, setReviewSubmitting] = useState(false);
   const [reviewError, setReviewError] = useState<string | null>(null);
   const [coupon, setCoupon] = useState('');
   const [couponApplied, setCouponApplied] = useState(false);
   const [discount, setDiscount] = useState(0);
   const [promoError, setPromoError] = useState<string | null>(null);
   const [showAllReviews, setShowAllReviews] = useState(false);
  const [serviceData, setServiceData] = useState<any>(null);
  const [serviceVideos, setServiceVideos] = useState<string[]>([]);
  const [providerData, setProviderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
   const [previewMedia, setPreviewMedia] = useState<{type: 'image' | 'video', uri: string, index: number} | null>(null);
   const videoRef = useRef<any>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle opening full screen image preview
  const handleImagePress = (imageUri: string, index: number) => {
    setPreviewMedia({ type: 'image', uri: imageUri, index });
    setShowFullScreenPreview(true);
  };

  // Handle closing full screen preview
  const handleClosePreview = () => {
    setShowFullScreenPreview(false);
    setPreviewMedia(null);
  };

  // Fetch service details when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!gigId) {
        setError('No service ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch service data
        const service = await fetchServiceByIdFromFirebase(String(gigId));
        setServiceData(service);

        const resolveServiceStorageUrl = async (uri?: string | null) => {
          if (!uri) return null;
          const value = String(uri).trim();
          if (!value) return null;
          if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
            return value;
          }
          try {
            return await getDownloadURL(storageRef(storage, value));
          } catch (resolveError) {
            console.warn('Unable to resolve video storage URL:', value, resolveError);
            return null;
          }
        };

        const serviceAny = service as any;
        const rawServiceVideos = Array.from(new Set([
          serviceAny.video,
          serviceAny.videoUrl,
          serviceAny.videoUri,
          ...(Array.isArray(serviceAny.videos) ? serviceAny.videos : []),
          ...(Array.isArray(serviceAny.videoUrls) ? serviceAny.videoUrls : []),
          ...(Array.isArray(serviceAny.videoUris) ? serviceAny.videoUris : []),
        ].filter(Boolean)));

        const resolvedVideos = (
          await Promise.all(rawServiceVideos.map(resolveServiceStorageUrl))
        ).filter((uri): uri is string => !!uri);

        setServiceVideos(resolvedVideos);

        // If service has a userId, fetch the provider/artist details
        if (service.userId) {
          try {
            const artist = await fetchArtistById(service.userId);
            if (artist) {
              setProviderData(artist);
            } else {
              // Set default provider data if artist not found
              setProviderData({
                name: (service as any).artistName || "Service Provider",
                avatar: DEFAULT_AVATAR,
                level: "Service Provider",
                responseTime: "24 hours",
                completedOrders: "0",
              });
            }
          } catch (artistError) {
            console.error("Error fetching provider details:", artistError);
            // Set default provider data if artist fetch fails
            setProviderData({
              name: (service as any).artistName || "Service Provider",
              avatar: DEFAULT_AVATAR,
              level: "Service Provider",
              responseTime: "24 hours",
              completedOrders: "0",
            });
          }
        }

        // Set reviews from comments if available
        if (service.comments && Array.isArray(service.comments)) {
          const formattedReviews = service.comments.map(comment => {
            const commentAny = comment as any;
            return {
              user: commentAny.userName || commentAny.user || "Anonymous User",
              userId: commentAny.userId,
              text: commentAny.text || commentAny.content || "",
              rating: commentAny.rating || 5,
              date: commentAny.createdAt 
                ? (typeof commentAny.createdAt === 'string' 
                    ? new Date(commentAny.createdAt).toLocaleDateString() 
                    : commentAny.createdAt.toDate?.()?.toLocaleDateString() || "Recently")
                : "Recently"
            };
          });
          setReviews(formattedReviews);
        }

        // Start fade-in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error("Error fetching service details:", error);
        setError("Failed to load service details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [gigId]);

  // Calculate real average rating from reviews/comments
  const realAvgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (typeof r.rating === 'number' ? r.rating : 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Set up default service data structure
  const actualImageSources = Array.from(
    new Set([
      serviceData?.cover,
      ...(Array.isArray(serviceData?.images) ? serviceData.images : []),
      serviceData?.image,
    ].filter(Boolean))
  ) as string[];

  const defaultServiceData = {
    title: serviceData?.title || "Loading...",

    description: serviceData?.description || "Loading service details...",

    images: actualImageSources.length > 0 ? actualImageSources : (serviceVideos.length > 0 ? [] : [DEFAULT_SERVICE_IMAGE]),

    video: serviceVideos.length > 0 ? serviceVideos[0] : null,

    videos: serviceVideos,

    basePrice: serviceData?.price || serviceData?.basePrice || 0,

    rating: parseFloat(realAvgRating),

    reviewCount: reviews.length || 0,

    deliveryTime: serviceData?.deliveryTime || "Standard",

    tags: serviceData?.categories || serviceData?.tags || ["Service"],

    provider: {
      name: providerData?.storeName || providerData?.name || serviceData?.artistName || "Service Provider",
      avatar: providerData?.avatar || DEFAULT_AVATAR,
      level: providerData?.level || "Service Provider",
      responseTime: providerData?.responseTime || "24 hours",
      completedOrders: providerData?.completedOrders || "0",
    },
  };

  const mediaItems = actualImageSources.length > 0 || serviceVideos.length > 0
    ? [
      ...actualImageSources.map((uri: string) => ({ type: 'image' as const, uri })),
      ...serviceVideos.map((uri: string) => ({ type: 'video' as const, uri })),
    ]
    : [{ type: 'image' as const, uri: DEFAULT_SERVICE_IMAGE }];

  useEffect(() => {
    if (selectedImage >= mediaItems.length && mediaItems.length > 0) {
      setSelectedImage(0);
    }
  }, [mediaItems.length, selectedImage]);

  // Set up main service
  const services = {
    service: { 
      name: serviceData?.title || "Service", 
      basePrice: serviceData?.price || serviceData?.basePrice || 0, 
      min: 1, 
      max: 10 
    }
  };

  // Extra services removed

  const handleServiceChange = (change: number) => {
    setServiceQuantities((prev) => {
      const newQty = Math.max(services.service.min, Math.min(services.service.max, prev.service + change));
      return { ...prev, service: newQty };
    });
  };
  
  const handleItemQuantityChange = (itemKey: string, change: number, itemMax?: number) => {
    setServiceQuantities((prev) => {
      const currentValue = prev[itemKey as keyof typeof prev] as number || 0;
      const max = itemMax ? Number(itemMax) : 999;
      const newValue = Math.max(0, Math.min(currentValue + change, max));
      return {
        ...prev,
        [itemKey]: newValue
      };
    });
  };

  // No longer need toggle function since service items are removed

  const getExtraPrice = (extra: any) => {
    if (!extra) return 0;
    return typeof extra.price === 'number' ? extra.price : parseFloat(String(extra.price || 0));
  };

  const normalizeExtrasValue = (value: any): any[] => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
    return [];
  };

  const getExtrasCandidates = (serviceData: any): any[] => {
    const candidates = [serviceData?.extras, serviceData?.addOns, serviceData?.extraServices, serviceData?.extraServicesList];
    for (const candidate of candidates) {
      const normalized = normalizeExtrasValue(candidate);
      if (normalized.length > 0) return normalized;
    }
    return [];
  };

  const extrasList = useMemo(() => getExtrasCandidates(serviceData), [serviceData]);

  const calculatePrice = () => {
    // Calculate base price for all selected items and extras
    let total = 0;
    
    if (serviceData?.items) {
      serviceData.items.forEach((item: any, index: number) => {
        const itemId = `item_${index}`;
        const quantity = serviceQuantities[itemId] || 0;
        if (quantity > 0 && item.price) {
          const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
          total += itemPrice * quantity;
        }
      });
    }

    if (extrasList.length > 0) {
      extrasList.forEach((extra: any, index: number) => {
        const extraId = `extra_${index}`;
        const quantity = serviceQuantities[extraId] || 0;
        if (quantity > 0) {
          total += getExtraPrice(extra) * quantity;
        }
      });
    }
    
    if (couponApplied) total -= discount;
    
    return Math.max(total, 0);
  };

  const handleFinalSubmit = async () => {
    try {
      if (!personalInfo.fullName.trim() || !personalInfo.email.trim() || !personalInfo.phone.trim()) {
        Alert.alert('Missing Information', 'Please fill in all required fields (Name, Email, Phone).');
        return;
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to place an order.');
        return;
      }

      if (!serviceData) {
        Alert.alert('Error', 'Service data is still loading. Please wait and try again.');
        return;
      }

      const artistId = serviceData?.userId || serviceData?.artistId;
      if (!artistId) {
        console.error('❌ ERROR: artistId is missing for order submission!');
        Alert.alert('Error', 'Cannot create order: Artist ID is missing. Please try again.');
        return;
      }

      const items = Object.entries(serviceQuantities)
        .map(([key, quantity]) => {
          if (key.startsWith('item_')) {
            const index = parseInt(key.replace('item_', ''), 10);
            const item = serviceData?.items?.[index];
            if (item && quantity > 0) {
              return {
                id: item.id || key,
                title: item.title,
                quantity,
                price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)),
              };
            }
          }
          return null;
        })
        .filter(Boolean) as Array<{ id: string; title: string; quantity: number; price: number }>;

      const orderInput = {
        clientId: currentUser.uid,
        clientName: personalInfo.fullName,
        clientPhoto: currentUser.photoURL || undefined,
        artistId,
        artistName: defaultServiceData.provider.name,
        artistPhoto: defaultServiceData.provider.avatar,
        gigId: String(gigId),
        serviceId: String(gigId),
        serviceTitle: serviceData?.title || defaultServiceData.title,
        serviceCategory: serviceData?.category || 'Service',
        serviceImage: defaultServiceData.images[0] || undefined,
        description: customMessage,
        notes: personalInfo.eventLocation || '',
        attachments: [],
        type: 'service' as const,
        totalPrice: calculatePrice(),
        budget: Number(clientBudget) || undefined,
        currency: 'MAD',
        paymentStatus: 'unpaid' as const,
        selectedOptions: [],
        items,
        personalInfo: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          address: personalInfo.address,
          city: personalInfo.city,
          country: personalInfo.country,
          additionalNotes: customMessage || '',
        },
        customization: {
          eventDate: personalInfo.eventDate,
          location: personalInfo.eventLocation,
        },
      };

      const orderId = await createOrder(orderInput);
      console.log('✅ Order created with ID:', orderId);

      setCustomMessage('');
      setClientBudget('');
      setPersonalInfo({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        eventDate: '',
        eventLocation: '',
        additionalNotes: '',
      });

      Alert.alert(
        '🎉 Order Sent!',
        `Your order has been created and sent to ${defaultServiceData.provider.name}!\n\nTotal: ${calculatePrice()} MAD.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowOfferForm(false);
              router.push('/(client)/(hidden)/invoices');
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMsg = error?.message || 'There was a problem placing your order. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleContinuePress = () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to make a custom order.',
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
    
    setShowOfferForm(true);
  };

  const handleSendOffer = async () => {
    try {
      console.log('🎯 Starting order creation process...');
      
      // Get current user ID
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('❌ No current user found');
        Alert.alert('Error', 'You need to be logged in to place an order.');
        return;
      }
      
      console.log('👤 Current user:', currentUser.uid, currentUser.email);
      
      // Fetch current user's full profile data
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      
      let clientInfo = {
        fullName: currentUser.displayName || currentUser.email || 'Client',
        email: currentUser.email || '',
        phone: '',
        address: '',
        city: '',
        country: ''
      };
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          clientInfo = {
            fullName: userData.name || userData.displayName || currentUser.displayName || clientInfo.fullName,
            email: userData.email || currentUser.email || '',
            phone: userData.phone || userData.phoneNumber || '',
            address: userData.address || userData.street || '',
            city: userData.city || '',
            country: userData.country || ''
          };
          console.log('✅ Fetched user profile:', clientInfo);
        }
      } catch (profileError) {
        console.warn('⚠️ Could not fetch user profile, using defaults:', profileError);
      }
      
      // Check if service data is loaded
      if (!serviceData) {
        console.log('❌ Service data not loaded');
        Alert.alert('Error', 'Service data is not loaded. Please wait for the page to load completely.');
        return;
      }
      
      // Get artist ID from service data
      const artistId = serviceData?.userId || serviceData?.artistId;
      if (!artistId) {
        console.error('❌ ERROR: artistId is missing!');
        Alert.alert('Error', 'Cannot create order: Artist ID is missing. Please try again.');
        return;
      }
      
      // Build items array from service quantities
      const items = Object.entries(serviceQuantities)
        .map(([key, quantity]) => {
          if (key.startsWith('item_')) {
            const index = parseInt(key.replace('item_', ''));
            const item = serviceData?.items?.[index];
            if (item && quantity > 0) {
              return {
                id: item.id || key,
                title: item.title,
                quantity,
                price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price))
              };
            }
          }
          return null;
        })
        .filter(Boolean) as Array<{ id: string; title: string; quantity: number; price: number }>;

      // Use centralized createOrder function from orderService
      console.log('🔄 Creating order in centralized collection...');
      const orderId = await createOrder({
        clientId: currentUser.uid,
        clientName: clientInfo.fullName,
        clientPhoto: undefined,
        artistId: artistId,
        artistName: defaultServiceData.provider.name,
        artistPhoto: defaultServiceData.provider.avatar,
        gigId: String(gigId),
        gigTitle: serviceData?.title || defaultServiceData.title,
        serviceId: String(gigId),
        serviceTitle: serviceData?.title || defaultServiceData.title,
        serviceCategory: serviceData?.category || 'Service',
        serviceImage: defaultServiceData.images[0] || undefined,
        description: customMessage,
        notes: personalInfo.additionalNotes || '',
        type: 'service',
        totalPrice: calculatePrice(),
        currency: 'MAD',
        paymentStatus: 'unpaid',
        selectedOptions: [],
        items: items,
        clientInfo: clientInfo,
      });
      console.log('✅ Order created with ID:', orderId);

      // Record coupon usage if coupon was applied
      if (couponApplied && coupon.trim() && discount > 0) {
        try {
          console.log('🔄 Recording coupon usage...');
          await recordCouponUsage(
            coupon.trim().toUpperCase(),
            currentUser.uid,
            clientInfo.fullName,
            String(gigId),
            orderId,
            discount
          );
          console.log('✅ Coupon usage recorded');
        } catch (couponError) {
          console.warn('⚠️ Failed to record coupon usage:', couponError);
          // Don't throw - the order was created successfully
        }
      }

      // Show success message
      Alert.alert('🎉 Order Created!', `Your order has been sent to ${defaultServiceData.provider.name}!\n\nTotal: ${calculatePrice()} MAD\n\nYou'll receive a response within ${defaultServiceData.provider.responseTime}.`);
      setShowOfferForm(false);
      
      // Navigate back to client home
      router.push('/(client)/(hidden)/invoices');
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMsg = 'There was a problem creating your order. Please try again.';
      if (error.code === 'permission-denied') {
        errorMsg = 'Permission denied. You may not have permission to create orders.';
      } else if (error.message) {
        errorMsg = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMsg);
    }
  };

  const handleApplyCoupon = async () => {
    setPromoError(null);
    const code = coupon.trim();
    if (!code) {
      setPromoError('Please enter a promo code.');
      return;
    }
    try {
      const basePrice = defaultServiceData.basePrice || 0;
      const discountValue = await validatePromoCode(code, String(gigId), basePrice);
      if (discountValue > 0) {
        setDiscount(discountValue);
        setCouponApplied(true);
        Alert.alert('✅ Promo Applied!', `You saved ${discountValue} MAD on your order!`);
      } else {
        setDiscount(0);
        setCouponApplied(false);
        setPromoError('❌ Invalid promo code.');
      }
    } catch (err) {
      setPromoError('Error validating promo code.');
    }
  };

  const renderStars = (rating: number, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i <= rating + 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={COLORS.gold}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  // Header transitions from transparent (over hero image) to solid white as user scrolls
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 140, 200],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp',
  });
  const headerBorderOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Show loading screen while fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading service details…</Text>
        </View>
      </View>
    );
  }

  // Show error screen if there was a problem
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.errorButton}
          onPress={() => router.push('/(client)/search')}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Animated Header — fades in solid background on scroll */}
      <View style={styles.header} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: '#fff',
              opacity: headerBgOpacity,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.headerBorder,
            { opacity: headerBorderOpacity },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.headerButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/marketplace');
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: TOTAL_TAB_BAR_HEIGHT + 90 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            
              {/* Hero Media Gallery */}
              <View style={styles.imageSection}>
                {mediaItems?.[selectedImage]?.type === 'video' ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: mediaItems?.[selectedImage]?.uri }}
                    style={styles.mainImage}
                    useNativeControls
                    isLooping={false}
                    resizeMode={ResizeMode.CONTAIN}
                    onError={(e) => console.error('Video error:', e)}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => {
                      const media = mediaItems?.[selectedImage];
                      if (media && media.uri) {
                        setPreviewMedia({ type: 'image', uri: media.uri, index: selectedImage });
                        setShowFullScreenPreview(true);
                      }
                    }}
                  >
                    {mediaItems?.[selectedImage] && mediaItems?.[selectedImage]?.uri ? (
                      <Image source={{ uri: mediaItems?.[selectedImage]?.uri }} style={styles.mainImage} />
                    ) : null}
                  </TouchableOpacity>
                )}

                {/* Media counter chip */}
                {mediaItems.length > 1 && (
                  <View style={styles.mediaCounterChip}>
                    <Ionicons name="images-outline" size={12} color="#fff" />
                    <Text style={styles.mediaCounterChipText}>
                      {selectedImage + 1} / {mediaItems.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Main Content card — sits on top of the hero */}
              <View style={styles.mainContent}>
                {/* Thumbnail strip (moved into main card, sits right under hero) */}
                {mediaItems.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.thumbnailRow}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}
                  >
                    {mediaItems.map((media: any, index: number) => {
                      if (!media) return null;
                      const isVideo = media?.type === 'video';
                      const isSelected = selectedImage === index;

                      return (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.85}
                          onPress={() => setSelectedImage(index)}
                          style={[styles.thumbnail, isSelected && styles.thumbnailSelected]}
                        >
                          {isVideo ? (
                            <View style={styles.videoThumbnailContainer}>
                              <Ionicons name="play" size={18} color="#fff" />
                            </View>
                          ) : (
                            media?.uri ? (
                              <Image source={{ uri: media.uri }} style={styles.thumbnailImage} />
                            ) : null
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Title + Tags */}
                <View style={styles.titleSection}>
                  <Text style={styles.title}>{defaultServiceData.title}</Text>

                  {/* Inline rating row beneath title */}
                  <View style={styles.titleRatingRow}>
                    <View style={styles.starInline}>
                      <Ionicons name="star" size={14} color={COLORS.gold} />
                      <Text style={styles.ratingNumber}>{defaultServiceData.rating}</Text>
                    </View>
                    <Text style={styles.ratingDot}>·</Text>
                    <Text style={styles.ratingMeta}>{defaultServiceData.reviewCount} reviews</Text>
                    {defaultServiceData.deliveryTime ? (
                      <>
                        <Text style={styles.ratingDot}>·</Text>
                        <View style={styles.deliveryInline}>
                          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                          <Text style={styles.ratingMeta}>{defaultServiceData.deliveryTime}</Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {defaultServiceData.tags?.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.tagsContainer}
                      contentContainerStyle={{ paddingRight: 20 }}
                    >
                      {defaultServiceData.tags.map((tag: string, index: number) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <View style={styles.sectionDivider} />

                {/* Provider Card */}
                <View style={styles.providerSection}>
                  <View style={styles.providerCard}>
                    <Image source={{ uri: defaultServiceData.provider.avatar }} style={styles.providerAvatar} />
                    <View style={styles.providerInfo}>
                      <View style={styles.providerNameRow}>
                        <Text style={styles.providerName} numberOfLines={1}>
                          {defaultServiceData.provider.name}
                        </Text>
                        <View style={styles.levelBadge}>
                          <Ionicons name="shield-checkmark" size={10} color="#fff" />
                          <Text style={styles.levelText}>{defaultServiceData.provider.level}</Text>
                        </View>
                      </View>
                      <View style={styles.providerMetaRow}>
                        <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                        <Text style={styles.providerMetaText}>
                          Replies in {defaultServiceData.provider.responseTime}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>About this service</Text>
                  <Text style={styles.description}>{defaultServiceData.description}</Text>
                </View>

                <View style={styles.sectionDivider} />

                {/* Pricing / Customize */}
                <View style={styles.pricingSection}>
                  <Text style={styles.sectionTitle}>Customize your order</Text>

                  <Text style={styles.subsectionTitle}>Service items</Text>

                  {serviceData?.items && serviceData.items.map((item: any, index: number) => {
                    const itemId = `item_${index}`;
                    const quantity = serviceQuantities[itemId] || 0;
                    const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
                    const isActive = quantity > 0;

                    return (
                      <View
                        key={index}
                        style={[styles.serviceCard, isActive && styles.serviceCardActive]}
                      >
                        <View style={styles.serviceHeader}>
                          <Text style={styles.serviceName} numberOfLines={2}>{item.title}</Text>
                          <Text style={styles.servicePrice}>
                            {quantity > 0 ? `${quantity} × ` : ''}{itemPrice} MAD
                          </Text>
                        </View>
                        {item.description && (
                          <Text style={styles.serviceDescription}>{item.description}</Text>
                        )}
                        <View style={styles.quantitySelector}>
                          <Text style={styles.quantityLabel}>Qty</Text>
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                              onPress={() => handleItemQuantityChange(itemId, -1)}
                              disabled={quantity === 0}
                            >
                              <Ionicons name="remove" size={18} color={quantity === 0 ? COLORS.textSubtle : COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.quantityButton,
                                (item?.maxQuantity && quantity >= Number(item.maxQuantity)) && styles.quantityButtonDisabled
                              ]}
                              onPress={() => handleItemQuantityChange(itemId, 1, item?.maxQuantity)}
                              disabled={item?.maxQuantity && quantity >= Number(item.maxQuantity)}
                            >
                              <Ionicons
                                name="add"
                                size={18}
                                color={(item?.maxQuantity && quantity >= Number(item.maxQuantity)) ? COLORS.textSubtle : COLORS.primary}
                              />
                            </TouchableOpacity>
                          </View>
                          {item?.maxQuantity && (
                            <Text style={styles.maxQuantityText}>Max {item.maxQuantity}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {(!serviceData?.items || serviceData.items.length === 0) && (
                    <View style={styles.emptyCard}>
                      <Ionicons name="cube-outline" size={20} color={COLORS.textSubtle} />
                      <Text style={styles.emptyCardText}>No service items available.</Text>
                    </View>
                  )}

                  {/* Extras */}
                  <View style={styles.extrasSection}>
                    <Text style={styles.subsectionTitle}>Extras</Text>
                    {extrasList.length > 0 ? (
                      extrasList.map((extra: any, index: number) => {
                        const extraKey = `extra_${index}`;
                        const quantity = serviceQuantities[extraKey] || 0;
                        const isActive = quantity > 0;
                        return (
                          <View
                            key={`extra-${index}`}
                            style={[styles.extraCard, isActive && styles.extraCardActive]}
                          >
                            <View style={styles.serviceHeader}>
                              <Text style={styles.serviceName} numberOfLines={2}>
                                {extra.title || extra.name || `Extra ${index + 1}`}
                              </Text>
                              <Text style={styles.servicePrice}>{getExtraPrice(extra)} MAD</Text>
                            </View>
                            {extra.description ? <Text style={styles.serviceDescription}>{extra.description}</Text> : null}
                            <View style={styles.quantitySelector}>
                              <Text style={styles.quantityLabel}>Qty</Text>
                              <View style={styles.quantityControls}>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                                  onPress={() => handleItemQuantityChange(extraKey, -1)}
                                  disabled={quantity === 0}
                                >
                                  <Ionicons name="remove" size={18} color={quantity === 0 ? COLORS.textSubtle : COLORS.primary} />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{quantity}</Text>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  style={[
                                    styles.quantityButton,
                                    (extra?.maxQuantity && quantity >= Number(extra.maxQuantity)) && styles.quantityButtonDisabled,
                                  ]}
                                  onPress={() => handleItemQuantityChange(extraKey, 1, extra?.maxQuantity ?? 10)}
                                  disabled={extra?.maxQuantity ? quantity >= Number(extra.maxQuantity) : false}
                                >
                                  <Ionicons
                                    name="add"
                                    size={18}
                                    color={(extra?.maxQuantity && quantity >= Number(extra.maxQuantity)) ? COLORS.textSubtle : COLORS.primary}
                                  />
                                </TouchableOpacity>
                              </View>
                              {extra?.maxQuantity && (
                                <Text style={styles.maxQuantityText}>Max {extra.maxQuantity}</Text>
                              )}
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyCard}>
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.textSubtle} />
                        <Text style={styles.emptyCardText}>No extras available for this service.</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.sectionDivider} />

                {/* Reviews */}
                <View style={styles.reviewsSection}>
                  <View style={styles.reviewsHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>Reviews</Text>
                      <View style={styles.reviewsSummary}>
                        <Ionicons name="star" size={14} color={COLORS.gold} />
                        <Text style={styles.reviewsSummaryText}>
                          {defaultServiceData.rating} · {defaultServiceData.reviewCount} reviews
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.addReviewButton}
                      onPress={() => setShowReviewForm(true)}
                    >
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                      <Text style={styles.addReviewText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {reviews.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.textSubtle} />
                      <Text style={styles.emptyCardText}>No reviews yet. Be the first to leave one.</Text>
                    </View>
                  )}

                  {reviews.slice(0, showAllReviews ? reviews.length : 2).map((review, index) => (
                    <View key={index} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {(review.user || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewUser}>{review.user}</Text>
                          <View style={styles.reviewRating}>
                            {renderStars(review.rating, 12)}
                            <Text style={styles.reviewDate}>· {review.date}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.text}</Text>
                    </View>
                  ))}

                  {reviews.length > 2 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.showMoreButton}
                      onPress={() => setShowAllReviews(!showAllReviews)}
                    >
                      <Text style={styles.showMoreText}>
                        {showAllReviews ? 'Show less' : `Show ${reviews.length - 2} more`}
                      </Text>
                      <Ionicons name={showAllReviews ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                </View>

            </View>
          </Animated.View>
        </Animated.ScrollView>

        {/* Floating Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.priceSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalPrice}>{calculatePrice()}</Text>
              <Text style={styles.totalCurrency}>MAD</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.continueButton}
            onPress={handleContinuePress}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Multi-Step Custom Order Modal */}
        <Modal visible={showOfferForm} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Custom Order</Text>
                  <Text style={styles.modalSubtitle}>
                    Tell {defaultServiceData.provider.name} about your event
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.modalCloseButton}
                  onPress={() => setShowOfferForm(false)}
                >
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Describe your event</Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Tell the provider what you need…"
                    placeholderTextColor={COLORS.textSubtle}
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    style={styles.textArea}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Your budget *</Text>
                  <View style={styles.budgetInputContainer}>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={COLORS.textSubtle}
                      value={clientBudget}
                      onChangeText={setClientBudget}
                      keyboardType="numeric"
                      style={styles.budgetInput}
                    />
                    <Text style={styles.currencyLabel}>MAD</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full name *</Text>
                  <TextInput
                    value={personalInfo.fullName}
                    onChangeText={(text) => setPersonalInfo(prev => ({...prev, fullName: text}))}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textSubtle}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email *</Text>
                  <TextInput
                    value={personalInfo.email}
                    onChangeText={(text) => setPersonalInfo(prev => ({...prev, email: text}))}
                    placeholder="your.email@example.com"
                    placeholderTextColor={COLORS.textSubtle}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone number *</Text>
                  <TextInput
                    value={personalInfo.phone}
                    onChangeText={(text) => setPersonalInfo(prev => ({...prev, phone: text}))}
                    placeholder="+212 xxx xxx xxx"
                    placeholderTextColor={COLORS.textSubtle}
                    keyboardType="phone-pad"
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Event date</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.formInputPressable}
                    onPress={() => {
                      setTempEventDate(personalInfo.eventDate ? new Date(personalInfo.eventDate) : new Date());
                      setShowDatePicker(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
                    <Text style={personalInfo.eventDate ? styles.formInputText : styles.formInputPlaceholder}>
                      {personalInfo.eventDate || 'Select event date'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={tempEventDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const dateStr = selectedDate.toISOString().split('T')[0];
                          setPersonalInfo(prev => ({...prev, eventDate: dateStr}));
                        }
                      }}
                    />
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Event location</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.formInputPressable}
                    onPress={() => setShowLocationPicker(true)}
                  >
                    <Ionicons name="location-outline" size={18} color={COLORS.textMuted} />
                    <Text style={selectedLocation ? styles.formInputText : styles.formInputPlaceholder} numberOfLines={1}>
                      {selectedLocation?.address || 'Tap to select location on map'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Promo Code */}
                <View style={styles.couponSection}>
                  <Text style={styles.formLabel}>Promo code</Text>
                  <View style={styles.couponRow}>
                    <TextInput
                      style={[styles.couponInput, couponApplied && styles.couponInputDisabled]}
                      placeholder="Enter promo code"
                      placeholderTextColor={COLORS.textSubtle}
                      value={coupon}
                      onChangeText={setCoupon}
                      editable={!couponApplied}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.couponButton, couponApplied && styles.couponButtonApplied]}
                      onPress={handleApplyCoupon}
                      disabled={couponApplied}
                    >
                      <Text style={[styles.couponButtonText, couponApplied && styles.couponButtonTextApplied]}>
                        {couponApplied ? 'Applied' : 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {promoError && (
                    <View style={styles.discountRow}>
                      <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                      <Text style={[styles.discountText, { color: COLORS.danger }]}>{promoError}</Text>
                    </View>
                  )}
                  {couponApplied && !promoError && (
                    <View style={styles.discountRow}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                      <Text style={styles.discountText}>Discount applied: -{discount} MAD</Text>
                    </View>
                  )}
                </View>

                {/* Inline order summary */}
                <View style={styles.orderSummary}>
                  <Text style={styles.summaryTitle}>Order summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{calculatePrice() + (couponApplied ? discount : 0)} MAD</Text>
                  </View>
                  {couponApplied && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Discount</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.success }]}>-{discount} MAD</Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, { marginTop: 8 }]}>
                    <Text style={[styles.summaryLabel, { color: COLORS.text, fontWeight: '700' }]}>Total</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.text, fontSize: 18 }]}>{calculatePrice()} MAD</Text>
                  </View>
                </View>

                <View style={{ height: 8 }} />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowOfferForm(false)}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleFinalSubmit}
                  style={styles.modalSend}
                >
                  <Text style={styles.modalSendText}>Send order</Text>
                  <Ionicons name="send" size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Review Modal */}
        <Modal visible={showReviewForm} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.modalContentCompact]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Write a review</Text>
                  <Text style={styles.modalSubtitle}>Rate your experience</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.modalCloseButton}
                  onPress={() => setShowReviewForm(false)}
                >
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 20 }}>
                <View style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      activeOpacity={0.7}
                      onPress={() => setReviewRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= reviewRating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= reviewRating ? COLORS.gold : COLORS.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="Share your experience…"
                  placeholderTextColor={COLORS.textSubtle}
                  value={reviewText}
                  onChangeText={setReviewText}
                  style={styles.textArea}
                />

                {reviewError && (
                  <View style={styles.discountRow}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                    <Text style={[styles.discountText, { color: COLORS.danger }]}>{reviewError}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowReviewForm(false)}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={async () => {
                    setReviewSubmitting(true);
                    setReviewError(null);
                    try {
                      const auth = getAuth();
                      const currentUser = auth.currentUser;
                      if (!currentUser) {
                        setReviewError('You must be logged in to submit a review.');
                        setReviewSubmitting(false);
                        return;
                      }
                      if (!serviceData?.userId || !serviceData?.id) {
                        setReviewError('Service data missing.');
                        setReviewSubmitting(false);
                        return;
                      }
                      await addServiceReview(
                        serviceData.userId,
                        serviceData.id,
                        {
                          userId: currentUser.uid,
                          userName: currentUser.displayName || 'You',
                          rating: reviewRating,
                          text: reviewText,
                        }
                      );
                      setReviews(prev => [{
                        user: currentUser.displayName || 'You',
                        userId: currentUser.uid,
                        text: reviewText,
                        rating: reviewRating,
                        date: 'Just now'
                      }, ...prev]);
                      setReviewText('');
                      setReviewRating(5);
                      setShowReviewForm(false);
                    } catch (err) {
                      setReviewError('Failed to submit review.');
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                  style={[styles.modalSend, (!reviewText.trim() || reviewSubmitting) && styles.modalSendDisabled]}
                  disabled={!reviewText.trim() || reviewSubmitting}
                >
                  {reviewSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.modalSendText}>Submit</Text>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Location Picker Modal */}
        <Modal visible={showLocationPicker} animationType="slide">
          <View style={styles.locationPickerContainer}>
            <View style={styles.locationPickerHeader}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowLocationPicker(false)}>
                <Text style={styles.locationCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.locationPickerTitle}>Select location</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  if (selectedLocation) {
                    setPersonalInfo(prev => ({
                      ...prev,
                      eventLocation: selectedLocation.address
                    }));
                    setShowLocationPicker(false);
                  }
                }}
                disabled={!selectedLocation}
              >
                <Text style={[styles.locationDoneText, !selectedLocation && styles.locationDoneTextDisabled]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 33.5731,
                longitude: -7.5898,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setSelectedLocation({
                  latitude,
                  longitude,
                  address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                });
              }}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                />
              )}
            </MapView>

            <View style={styles.locationInfo}>
              <View style={styles.locationInfoIcon}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.locationCoordinates}>
                {selectedLocation
                  ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                  : 'Tap on map to drop a pin'}
              </Text>
            </View>
          </View>
        </Modal>

        {/* Full Screen Media Preview Modal */}
        <Modal visible={showFullScreenPreview} animationType="fade" transparent>
          <View style={styles.fullScreenModal}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity activeOpacity={0.7} onPress={handleClosePreview} style={styles.closeButton}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
              {previewMedia?.type === 'image' && (
                <Text style={styles.mediaCounter}>
                  {previewMedia.index + 1} / {mediaItems.length}
                </Text>
              )}
            </View>

            <View style={styles.fullScreenContent}>
              {previewMedia?.type === 'image' && (
                <Image source={{ uri: previewMedia.uri }} style={styles.fullScreenImage} resizeMode="contain" />
              )}

              {previewMedia?.type === 'video' && (
                <Video
                  source={{ uri: previewMedia.uri }}
                  style={styles.fullScreenVideo}
                  useNativeControls
                  shouldPlay={true}
                  isLooping={false}
                  onError={(e) => {
                    console.error('Video error:', e);
                    Alert.alert('Video Error', 'Failed to load video. Please try again.');
                  }}
                  progressUpdateIntervalMillis={500}
                />
              )}
            </View>

            {previewMedia?.type === 'image' && defaultServiceData.images.length > 1 && (
              <View style={styles.imageNavigation}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const newIndex = Math.max(0, (previewMedia.index || 0) - 1);
                    setPreviewMedia({
                      type: 'image',
                      uri: defaultServiceData.images[newIndex],
                      index: newIndex
                    });
                  }}
                  style={[styles.navButton, (previewMedia.index || 0) === 0 && styles.navButtonDisabled]}
                  disabled={(previewMedia.index || 0) === 0}
                >
                  <Ionicons name="chevron-back" size={22} color={(previewMedia.index || 0) === 0 ? "#666" : "#fff"} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const newIndex = Math.min(defaultServiceData.images.length - 1, (previewMedia.index || 0) + 1);
                    setPreviewMedia({
                      type: 'image',
                      uri: defaultServiceData.images[newIndex],
                      index: newIndex
                    });
                  }}
                  style={[styles.navButton, (previewMedia.index || 0) === defaultServiceData.images.length - 1 && styles.navButtonDisabled]}
                  disabled={(previewMedia.index || 0) === defaultServiceData.images.length - 1}
                >
                  <Ionicons name="chevron-forward" size={22} color={(previewMedia.index || 0) === defaultServiceData.images.length - 1 ? "#666" : "#fff"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ─── Header ──────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  headerBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 14,
  },

  content: {
    flex: 1,
  },

  // ─── Hero / media ────────────────────────────────────────
  imageSection: {
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth * 0.78,
    backgroundColor: COLORS.surfaceMuted,
  },
  mediaCounterChip: {
    position: 'absolute',
    bottom: 38,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  mediaCounterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },

  // ─── Thumbnails ──────────────────────────────────────────
  thumbnailRow: {
    flexGrow: 0,
    paddingTop: 14,
    paddingBottom: 4,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
  },
  thumbnailSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  videoThumbnailLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  videoThumbnailOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Main content card ───────────────────────────────────
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 8,
  },

  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
    marginHorizontal: 20,
    marginVertical: 4,
  },

  // ─── Title ───────────────────────────────────────────────
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 25,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: isSmallScreen ? 28 : 31,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  titleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  starInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },
  ratingDot: {
    color: COLORS.textSubtle,
    marginHorizontal: 6,
    fontSize: 13,
  },
  ratingMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  deliveryInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  tag: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginHorizontal: 4,
  },
  tagText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ─── Provider ────────────────────────────────────────────
  providerSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
    flexShrink: 1,
  },
  providerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.success,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },

  // ─── Description ─────────────────────────────────────────
  descriptionSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textMuted,
  },

  // ─── Pricing / cards ─────────────────────────────────────
  pricingSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  extrasSection: {
    marginTop: 18,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  serviceCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  serviceCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  extraCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  extraCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    lineHeight: 21,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  serviceDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 19,
  },

  // ─── Quantity selector ───────────────────────────────────
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: COLORS.surfaceMuted,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  maxQuantityText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginLeft: 8,
    fontWeight: '500',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 14,
    minWidth: 18,
    textAlign: 'center',
  },

  // ─── Empty card ──────────────────────────────────────────
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderStyle: 'dashed',
  },
  emptyCardText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },

  // ─── Form inputs ─────────────────────────────────────────
  formInputText: {
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
  },
  formInputPlaceholder: {
    color: COLORS.textSubtle,
    fontSize: 15,
    flex: 1,
  },

  // ─── Coupon ──────────────────────────────────────────────
  couponSection: {
    marginTop: 4,
    marginBottom: 18,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    fontSize: 15,
    color: COLORS.text,
  },
  couponInputDisabled: {
    backgroundColor: COLORS.surfaceMuted,
    color: COLORS.textSubtle,
  },
  couponButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: RADIUS.md,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponButtonApplied: {
    backgroundColor: COLORS.success,
  },
  couponButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  couponButtonTextApplied: {
    color: '#fff',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  discountText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Reviews ─────────────────────────────────────────────
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewsSummaryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  addReviewText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginLeft: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
    gap: 4,
  },
  showMoreText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Action bar ──────────────────────────────────────────
  actionBar: {
    position: 'absolute',
    bottom: TOTAL_TAB_BAR_HEIGHT,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 20,
  },
  priceSection: {
    flex: 1,
    marginRight: 14,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  totalCurrency: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Modal ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: screenHeight * 0.96,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  modalContentCompact: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
    maxWidth: screenWidth - 100,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    textAlignVertical: 'top',
    minHeight: 110,
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  modalPriceLabel: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  modalPriceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  modalSend: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSendDisabled: {
    backgroundColor: COLORS.textSubtle,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalSendText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Review modal star selector ─────────────────────────
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
    gap: 6,
  },
  starButton: {
    padding: 4,
  },

  // ─── Loading & error ─────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
    maxWidth: 320,
  },
  errorButton: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ─── Multi-step form (kept; unused but preserved) ────────
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleInactive: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepTextInactive: {
    color: COLORS.textSubtle,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepLineInactive: {
    backgroundColor: COLORS.border,
  },

  budgetHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
    textAlign: 'center',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  budgetInput: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 100,
    paddingHorizontal: 8,
    letterSpacing: -0.5,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  budgetComparison: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  budgetComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetComparisonLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  budgetComparisonValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  budgetLower: {
    color: COLORS.danger,
  },
  budgetHigher: {
    color: COLORS.success,
  },

  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 15,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  formInputPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 1,
    marginRight: 8,
  },

  orderSummary: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ─── Video sections ─────────────────────────────────────
  videoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  videoContainer: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  videoPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 10,
  },
  videoPlaceholderSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  videoMainContainer: {
    position: 'relative',
  },
  videoPlayButtonOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 14,
  },
  videoPlayerSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  galleryHintText: {
    marginTop: 10,
    paddingHorizontal: 20,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ─── Full screen preview ─────────────────────────────────
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 18,
    zIndex: 10,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight * 0.85,
  },
  fullScreenVideo: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  fullScreenVideoContainer: {
    width: screenWidth,
    height: screenHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(99, 102, 241, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNavigation: {
    position: 'absolute',
    bottom: 80,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  navButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // ─── Location picker ────────────────────────────────────
  locationPickerContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  locationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    zIndex: 10,
    elevation: 5,
  },
  locationCancelText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  locationPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  locationDoneText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  locationDoneTextDisabled: {
    color: COLORS.textSubtle,
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
    backgroundColor: COLORS.surfaceSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  locationInfoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCoordinates: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },

  // ─── Service items / addons (kept for compatibility) ────
  serviceItemsSelection: {
    marginBottom: 20,
  },
  serviceItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceItemInfo: {
    flex: 1,
  },
  serviceItemDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 19,
  },
  serviceItemToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  serviceItemToggleButtonSelected: {
    backgroundColor: COLORS.successSoft,
    borderColor: COLORS.success,
  },
  serviceItemToggleText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  serviceItemToggleTextSelected: {
    color: COLORS.success,
  },

  // ─── Add-ons (kept) ─────────────────────────────────────
  addonCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addonInfo: {
    marginLeft: 12,
    flex: 1,
  },
  addonName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  addonPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // ─── Misc save button (kept) ────────────────────────────
  saveButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0, right: 0,
    paddingHorizontal: 20,
  },
  contactButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
});