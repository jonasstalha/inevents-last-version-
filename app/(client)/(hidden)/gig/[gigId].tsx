import { Theme } from '@/src/constants/theme';
import { fetchArtistById } from '@/src/firebase/artistsService';
import { recordCouponUsage } from '@/src/firebase/couponService';
import { fetchServiceByIdFromFirebase } from '@/src/firebase/fetchAllServices';
import { validatePromoCode } from '@/src/firebase/promoService';
import { addServiceReview } from '@/src/firebase/reviewService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
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
    eventLocation: ''
  });
  
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
   const [isLoading, setIsLoading] = useState(true);
   const [serviceData, setServiceData] = useState<any>(null);
   const [providerData, setProviderData] = useState<any>(null);
   const [error, setError] = useState<string | null>(null);

   // Date picker state
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [tempEventDate, setTempEventDate] = useState(new Date());

   // Location picker state
   const [showLocationPicker, setShowLocationPicker] = useState(false);
   const [selectedLocation, setSelectedLocation] = useState<{
     latitude: number;
     longitude: number;
     address: string;
   } | null>(null);
   const [locationSearch, setLocationSearch] = useState('');
  
   // Full screen preview state
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
          duration: 800,
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
  const defaultServiceData = {
    title: serviceData?.title || "Loading...",

    description: serviceData?.description || "Loading service details...",

    images: serviceData?.cover
      ? [serviceData.cover]
      : serviceData?.images?.length > 0
      ? serviceData.images
      : serviceData?.image
      ? [serviceData.image]
      : [DEFAULT_SERVICE_IMAGE],

    video: serviceData?.video,

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

  const mediaItems = [
    ...defaultServiceData.images.map((uri: string) => ({ type: 'image', uri })),
    ...(defaultServiceData.video ? [{ type: 'video', uri: defaultServiceData.video }] : []),
  ];

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

  const calculatePrice = () => {
    // Calculate base price for all selected items
    let total = 0;
    
    // Add prices for each selected service item from Firebase
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
    
    // Apply discount if coupon is applied
    if (couponApplied) total -= discount;
    
    return Math.max(total, 0);
  };

  const handleFinalSubmit = async () => {
    try {
      // Validate required personal info
      if (!personalInfo.fullName.trim() || !personalInfo.email.trim() || !personalInfo.phone.trim()) {
        Alert.alert('Missing Information', 'Please fill in all required fields (Name, Email, Phone).');
        return;
      }

      // Get current user ID
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to place an order.');
        return;
      }
      
       // Create custom order object
       const customOrder = {
         id: `custom_order_${Date.now()}`,
         clientId: currentUser.uid,
         artistId: serviceData?.userId || serviceData?.artistId,
         serviceId: String(gigId),
         serviceTitle: serviceData?.title || defaultServiceData.title,
         serviceDescription: customMessage,
         clientBudget: Number(clientBudget),
         estimatedPrice: calculatePrice(),
         clientInfo: personalInfo,
         type: 'service',
         status: 'pending', // pending, accepted, declined, completed
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       };
      
      console.log('🎯 Creating custom order:', customOrder);
      console.log('Artist ID:', customOrder.artistId);
      console.log('Service data userId:', serviceData?.userId);
      
      // Validate artistId
      if (!customOrder.artistId) {
        console.error('❌ ERROR: artistId is missing for custom order!');
        Alert.alert('Error', 'Cannot create order: Artist ID is missing. Please try again.');
        return;
      }
      const { addDoc, collection } = await import('firebase/firestore');
      const { getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      console.log('🔄 Saving custom order to Firebase...');
      const docRef = await addDoc(collection(db, 'customOrders'), customOrder);
      console.log('✅ Custom order saved with ID:', docRef.id);

      // Reset form
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
        eventLocation: ''
      });

      // Show success message
      Alert.alert(
        '🎉 Custom Order Sent!', 
        `Your custom order has been sent to ${defaultServiceData.provider.name}!\n\nYour Budget: ${clientBudget} MAD\n\nYou'll receive a response within ${defaultServiceData.provider.responseTime}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowOfferForm(false);
              router.push('/(client)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error sending custom order:', error);
      Alert.alert('Error', 'There was a problem sending your custom order. Please try again.');
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
      
      console.log('📋 Service data:', serviceData);
      console.log('📋 Service data userId:', serviceData?.userId);
      console.log('📋 Service data artistId:', serviceData?.artistId);
      console.log('📋 Default service data:', defaultServiceData);
      
       const newOrder = {
         id: `order_${Date.now()}`,
         clientId: currentUser.uid,
         clientName: clientInfo.fullName,
         clientEmail: clientInfo.email,
         clientInfo: clientInfo,
         artistId: serviceData?.userId || serviceData?.artistId,
         gigId: String(gigId),
         gigTitle: serviceData?.title || defaultServiceData.title,
         message: customMessage,
         items: Object.entries(serviceQuantities).map(([key, quantity]) => {
           if (key.startsWith('item_')) {
             const index = parseInt(key.replace('item_', ''));
             const item = serviceData?.items?.[index];
             if (item) {
               return {
                 id: item.id || key,
                 title: item.title,
                 quantity,
                 price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price))
               };
             }
           }
           return null;
         }).filter(Boolean),
         totalPrice: calculatePrice(),
         type: 'service',
         status: 'pending',
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       };
       
      console.log('=== ORDER DEBUG ===');
      console.log('clientId:', newOrder.clientId);
      console.log('artistId being saved:', newOrder.artistId);
      console.log('serviceData.userId:', serviceData?.userId);
      console.log('serviceData.artistId:', serviceData?.artistId);
      console.log('gigTitle:', newOrder.gigTitle);
      console.log('order object:', newOrder);
      console.log('===================');
      
      // Validate required fields
      if (!newOrder.artistId) {
        console.error('❌ ERROR: artistId is missing!');
        Alert.alert('Error', 'Cannot create order: Artist ID is missing. Please try again.');
        return;
      }
      
      if (!newOrder.clientId) {
        console.error('❌ ERROR: clientId is missing!');
        Alert.alert('Error', 'Cannot create order: Client ID is missing. Please try again.');
        return;
      }
      
      // Save order to Firebase
      const { addDoc, collection } = await import('firebase/firestore');
      
      console.log('🔄 Attempting to save to global orders collection...');
      // Save order to global orders collection
      const orderRef = await addDoc(collection(db, 'orders'), newOrder);
      console.log('✅ Order created in global collection with ID:', orderRef.id);
      
      // Also save to artist's incoming orders
      if (newOrder.artistId) {
        try {
          console.log('🔄 Attempting to save to artist incoming orders...');
          const artistIncomingOrdersRef = collection(db, 'users', newOrder.artistId, 'incoming_orders');
          const incomingOrderData = {
            ...newOrder,
            orderId: orderRef.id
          };
          await addDoc(artistIncomingOrdersRef, incomingOrderData);
          console.log('✅ Order also saved to artist incoming orders');
        } catch (error) {
          console.warn('⚠️ Failed to save to artist incoming orders:', error);
          // Don't throw - the main order was saved successfully
        }
      }

      // Record coupon usage if coupon was applied
      if (couponApplied && coupon.trim() && discount > 0) {
        try {
          console.log('🔄 Recording coupon usage...');
          await recordCouponUsage(
            coupon.trim().toUpperCase(),
            currentUser.uid,
            clientInfo.fullName,
            String(gigId),
            orderRef.id,
            discount
          );
          console.log('✅ Coupon usage recorded');
        } catch (couponError) {
          console.warn('⚠️ Failed to record coupon usage:', couponError);
          // Don't throw - the order was created successfully
        }
      }

      // Show success message
      Alert.alert('🎉 Offer Sent!', `Your custom offer has been sent to ${defaultServiceData.provider.name}!\n\nTotal: ${calculatePrice()} MAD\n\nYou'll receive a response within ${defaultServiceData.provider.responseTime}.`);
      setShowOfferForm(false);
      
      // Navigate back to client home
      router.push('/(client)');
    } catch (error: any) {
      console.error('❌ Error sending offer:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'There was a problem sending your offer. Please try again.';
      if (error.code === 'permission-denied') {
        errorMsg = 'Permission denied. You may not be logged in or have permission to create orders.';
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

  const renderStars = (rating: number, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i <= rating + 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color="#FFD700"
          style={{ marginRight: 1 }}
        />
      );
    }
    return stars;
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 1],
    extrapolate: 'clamp',
  });

  // Show loading screen while fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  // Show error screen if there was a problem
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#f43f5e" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.push('/(client)/search')}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/marketplace');
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#302d2d" />
        </TouchableOpacity>


      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 200 }} // Increased padding to allow more scrolling
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            
             {/* Hero Media Gallery - Images + Video */}
             <View style={styles.imageSection}>
               <TouchableOpacity onPress={() => {
                 const media = mediaItems[selectedImage];
                 if (media.type === 'video') {
                   setPreviewMedia({ type: 'video', uri: media.uri, index: selectedImage });
                 } else {
                   setPreviewMedia({ type: 'image', uri: selectedImage < (defaultServiceData.images?.length || 0) ? defaultServiceData.images[selectedImage] : '', index: selectedImage });
                 }
                 setShowFullScreenPreview(true);
               }}>
                 {mediaItems[selectedImage]?.type === 'video' ? (
                   <View style={styles.videoMainContainer}>
                     <Video
                       ref={videoRef}
                       source={{ uri: mediaItems[selectedImage].uri }}
                       style={styles.mainImage}
                       resizeMode="contain"
                       useNativeControls
                       isLooping={false}
                       onError={(e) => console.error('Video error:', e)}
                     />
                     <View style={styles.videoPlayButtonOverlay}>
                       <Ionicons name="play-circle" size={80} color="#fff" />
                     </View>
                   </View>
                 ) : (
                   <Image source={{ uri: defaultServiceData.images[selectedImage] }} style={styles.mainImage} />
                 )}
               </TouchableOpacity>
               
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                 {mediaItems.map((media: any, index: number) => {
                   const isVideo = media.type === 'video';
                   const isSelected = selectedImage === index;
                   
                   return (
                     <TouchableOpacity
                       key={index}
                       onPress={() => setSelectedImage(index)}
                       style={[styles.thumbnail, isSelected && styles.thumbnailSelected]}
                     >
                       {isVideo ? (
                         <View style={styles.videoThumbnailContainer}>
                           <Image source={{ uri: defaultServiceData.images[0] || DEFAULT_SERVICE_IMAGE }} style={styles.thumbnailImage} />
                           <View style={styles.videoThumbnailOverlay}>
                             <Ionicons name="play" size={24} color="#fff" />
                           </View>
                         </View>
                       ) : (
                         <Image source={{ uri: media.uri }} style={styles.thumbnailImage} />
                       )}
                     </TouchableOpacity>
                   );
                 })}
               </ScrollView>
              </View>

             {/* Main Content */}
            <View style={styles.mainContent}>
              
              {/* Title and Tags */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>{defaultServiceData.title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
                  {defaultServiceData.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Provider Info */}

              {/* Provider Info & Stats Row - Enhanced Placement */}
              <View style={[styles.providerSection, { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Image source={{ uri: defaultServiceData.provider.avatar }} style={styles.providerAvatar} />
                  <View style={styles.providerInfo}>
                    <View style={styles.providerNameRow}>
                      <Text style={styles.providerName}>{defaultServiceData.provider.name}</Text>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>{defaultServiceData.provider.level}</Text>
                      </View>
                    </View>
                    <View style={styles.ratingRow}>
                      {renderStars(defaultServiceData.rating)}
                      <Text style={styles.ratingText}>{defaultServiceData.rating} ({defaultServiceData.reviewCount} reviews)</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>About This Service</Text>
                <Text style={styles.description}>{defaultServiceData.description}</Text>
              </View>
              
              {/* Service Items section removed */}

              {/* Pricing Section */}
              <View style={styles.pricingSection}>
                <Text style={styles.sectionTitle}>Customize Your Order</Text>
                
                {/* List of service items from Firebase that can be added/removed */}
                <Text style={styles.subsectionTitle}>Service Items:</Text>
                
                {serviceData?.items && serviceData.items.map((item: any, index: number) => {
                  const itemId = `item_${index}`;
                  const quantity = serviceQuantities[itemId] || 0;
                  const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
                  
                  return (
                    <View key={index} style={styles.serviceCard}>
                      <View style={styles.serviceHeader}>
                        <Text style={styles.serviceName}>{item.title}</Text>
                        <Text style={styles.servicePrice}>
                          {quantity > 0 ? `${quantity} × ` : ''}{itemPrice} MAD
                        </Text>
                      </View>
                      {item.description && (
                        <Text style={styles.serviceDescription}>{item.description}</Text>
                      )}
                      <View style={styles.quantitySelector}>
                        <Text style={styles.quantityLabel}>Qty:</Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                            onPress={() => handleItemQuantityChange(itemId, -1)}
                            disabled={quantity === 0}
                          >
                            <Ionicons name="remove" size={20} color={quantity === 0 ? '#ccc' : '#6366f1'} />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{quantity}</Text>
                          <TouchableOpacity
                            style={[
                              styles.quantityButton, 
                              (item?.maxQuantity && quantity >= Number(item.maxQuantity)) && styles.quantityButtonDisabled
                            ]}
                            onPress={() => handleItemQuantityChange(itemId, 1, item?.maxQuantity)}
                            disabled={item?.maxQuantity && quantity >= Number(item.maxQuantity)}
                          >
                            <Ionicons 
                              name="add" 
                              size={20} 
                              color={(item?.maxQuantity && quantity >= Number(item.maxQuantity)) ? '#ccc' : '#6366f1'} 
                            />
                          </TouchableOpacity>
                        </View>
                        {item?.maxQuantity && (
                          <Text style={styles.maxQuantityText}>Max: {item.maxQuantity}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
                
                {(!serviceData?.items || serviceData.items.length === 0) && (
                  <View style={styles.serviceCard}>
                    <Text style={styles.serviceDescription}>No service items available.</Text>
                  </View>
                )}

                {/* Additional services section removed */}

                 {/* Coupon Section moved to negotiation modal */}
               </View>

              {/* Reviews Section */}
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>Reviews ({defaultServiceData.reviewCount})</Text>
                  <TouchableOpacity
                    style={styles.addReviewButton}
                    onPress={() => setShowReviewForm(true)}
                  >
                    <Ionicons name="add" size={16} color="#6366f1" />
                    <Text style={styles.addReviewText}>Add Review</Text>
                  </TouchableOpacity>
                </View>

                {reviews.slice(0, showAllReviews ? reviews.length : 2).map((review, index) => (
                  <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewUser}>{review.user}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating, 14)}
                    </View>
                    <Text style={styles.reviewText}>{review.text}</Text>
                  </View>
                ))}

                {reviews.length > 2 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllReviews(!showAllReviews)}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllReviews ? 'Show Less' : `Show ${reviews.length - 2} More Reviews`}
                    </Text>
                    <Ionicons name={showAllReviews ? 'chevron-up' : 'chevron-down'} size={16} color="#6366f1" />
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
            <Text style={styles.totalPrice}>{calculatePrice()} MAD</Text>
          </View>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinuePress}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Multi-Step Custom Order Modal */}
        <Modal visible={showOfferForm} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Custom Order</Text>
                <TouchableOpacity onPress={() => setShowOfferForm(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSubtitle}>
                  Tell {defaultServiceData.provider.name} about your service requirements
                </Text>
                
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="Describe your event in detail..."
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  style={styles.textArea}
                />
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Your Budget *</Text>
                  <View style={styles.budgetInputContainer}>
                    <TextInput
                      placeholder="0"
                      value={clientBudget}
                      onChangeText={setClientBudget}
                      keyboardType="numeric"
                      style={styles.budgetInput}
                    />
                    <Text style={styles.currencyLabel}>MAD</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name *</Text>
                  <TextInput
                    value={personalInfo.fullName}
                    onChangeText={(text) => setPersonalInfo(prev => ({...prev, fullName: text}))}
                    placeholder="Enter your full name"
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email *</Text>
                  <TextInput
                    value={personalInfo.email}
                    onChangeText={(text) => setPersonalInfo(prev => ({...prev, email: text}))}
                    placeholder="your.email@example.com"
                    keyboardType="email-address"
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number *</Text>
                  <TextInput
                    value={personalInfo.phone}
                    onChangeText={(text) => setPersonalInfo(prev => ({...prev, phone: text}))}
                    placeholder="+212 xxx xxx xxx"
                    keyboardType="phone-pad"
                    style={styles.formInput}
                  />
                </View>

                 <View style={styles.formGroup}>
                   <Text style={styles.formLabel}>Event Date</Text>
                   <TouchableOpacity
                     style={styles.formInput}
                     onPress={() => {
                       setTempEventDate(personalInfo.eventDate ? new Date(personalInfo.eventDate) : new Date());
                       setShowDatePicker(true);
                     }}
                   >
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
                   <Text style={styles.formLabel}>Event Location</Text>
                   <TouchableOpacity
                     style={styles.formInput}
                     onPress={() => setShowLocationPicker(true)}
                   >
                     <Text style={selectedLocation ? styles.formInputText : styles.formInputPlaceholder}>
                       {selectedLocation?.address || 'Tap to select location on map'}
                     </Text>
                   </TouchableOpacity>
                 </View>

                 {/* Promo Code Section - Inside Negotiation Modal */}
                 <View style={styles.couponSection}>
                   <Text style={styles.subsectionTitle}>Promo Code</Text>
                   <View style={styles.couponRow}>
                     <TextInput
                       style={[styles.couponInput, couponApplied && styles.couponInputDisabled]}
                       placeholder="Enter promo code"
                       value={coupon}
                       onChangeText={setCoupon}
                       editable={!couponApplied}
                     />
                     <TouchableOpacity
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
                       <Ionicons name="alert-circle" size={16} color="#ef4444" />
                       <Text style={[styles.discountText, { color: '#ef4444' }]}>{promoError}</Text>
                     </View>
                   )}
                   {couponApplied && !promoError && (
                     <View style={styles.discountRow}>
                       <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                       <Text style={styles.discountText}>Discount applied: -{discount} MAD</Text>
                     </View>
                   )}
                 </View>
               </ScrollView>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  onPress={() => setShowOfferForm(false)}
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleFinalSubmit}
                  style={styles.modalSend}
                >
                  <Text style={styles.modalSendText}>Send Order</Text>
                  <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Review Modal */}
        <Modal visible={showReviewForm} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <TouchableOpacity onPress={() => setShowReviewForm(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>Rate your experience</Text>
              
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={32}
                      color={star <= reviewRating ? '#FFD700' : '#e5e7eb'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Share your experience..."
                value={reviewText}
                onChangeText={setReviewText}
                style={styles.textArea}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowReviewForm(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
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
                  <Text style={styles.modalSendText}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</Text>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
                {reviewError && (
                  <Text style={{ color: '#ef4444', marginTop: 8 }}>{reviewError}</Text>
                )}
              </View>
            </View>
          </View>
         </Modal>

         {/* Location Picker Modal */}
         <Modal visible={showLocationPicker} animationType="slide">
           <View style={styles.locationPickerContainer}>
             <View style={styles.locationPickerHeader}>
               <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                 <Text style={styles.locationCancelText}>Cancel</Text>
               </TouchableOpacity>
               <Text style={styles.locationPickerTitle}>Select Event Location</Text>
               <TouchableOpacity
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
                 latitude: 33.5731, // Morocco default
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
               <Ionicons name="location" size={20} color="#6366f1" />
               <Text style={styles.locationCoordinates}>
                 {selectedLocation
                   ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                   : 'Tap on map to select location'}
               </Text>
             </View>
           </View>
         </Modal>

         {/* Full Screen Media Preview Modal */}
        <Modal visible={showFullScreenPreview} animationType="fade" transparent>
          <View style={styles.fullScreenModal}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity onPress={handleClosePreview} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
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
            
             {/* Image Navigation - only for images */}
             {previewMedia?.type === 'image' && defaultServiceData.images.length > 1 && (
               <View style={styles.imageNavigation}>
                 <TouchableOpacity 
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
                   <Ionicons name="chevron-back" size={24} color={(previewMedia.index || 0) === 0 ? "#ccc" : "#fff"} />
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
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
                   <Ionicons name="chevron-forward" size={24} color={(previewMedia.index || 0) === defaultServiceData.images.length - 1 ? "#ccc" : "#fff"} />
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
    backgroundColor: '#e4eaf0',
  },
  
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 30,
    paddingHorizontal: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#70a1d3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginHorizontal: 16,
  },
  
  content: {
    flex: 1,
  },
  
  imageSection: {
    position: 'relative',
  },
  
  mainImage: {
    width: screenWidth,
    height: screenWidth * 0.75,
    backgroundColor: '#f1f5f9',
  },
  
  saveButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  thumbnailContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  
  thumbnailSelected: {
    borderColor: '#6366f1',
  },
  
   thumbnailImage: {
     width: '100%',
     height: '100%',
   },

   videoThumbnailContainer: {
     position: 'relative',
     width: '100%',
     height: '100%',
   },

   videoThumbnailOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.3)',
     justifyContent: 'center',
     alignItems: 'center',
   },

   videoMainContainer: {
     position: 'relative',
   },

   videoPlayButtonOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.2)',
     justifyContent: 'center',
     alignItems: 'center',
   },

   fullScreenVideo: {
     width: screenWidth,
     height: screenHeight * 0.8,
   },
  
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
  },
  
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  title: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: isSmallScreen ? 28 : 32,
    marginBottom: 16,
  },
  
  tagsContainer: {
    flexDirection: 'row',
  },
  
  tag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  
  tagText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  
  levelBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
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
    color: '#6b7280',
    marginLeft: 4,
  },
  
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  
  serviceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  
   quantitySelector: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
   },
   
   quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  quantityButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
    marginRight: 8,
  },
  
  maxQuantityText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
  },
  
   quantityText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1a1a1a',
     marginHorizontal: 16,
     minWidth: 24,
     textAlign: 'center',
   },

   formInputText: {
     color: '#1a1a1a',
   },

   formInputPlaceholder: {
     color: '#9ca3af',
   },
  
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  addonCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
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
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  
  addonPrice: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  
  couponSection: {
    marginTop: 20,
  },
  
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    marginRight: 12,
  },
  
  couponInputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  
  couponButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  
  couponButtonApplied: {
    backgroundColor: '#10b981',
  },
  
  couponButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  couponButtonTextApplied: {
    color: '#fff',
  },
  
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  
  discountText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  
  reviewsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  
  addReviewText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  
  showMoreText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 120,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  
  priceSection: {
    flex: 1,
    marginRight: 16,
  },
  
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  continueButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // Changed back to flex-end for bottom slide-up
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: screenHeight * 0.90, // Increased to 90% of screen height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 20,
  },
  
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  
  modalPriceLabel: {
    fontSize: 16,
    color: '#4b5563',
  },
  
  modalPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  
  modalCancel: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  modalCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  
  modalSend: {
    flex: 2,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  modalSendDisabled: {
    backgroundColor: '#9ca3af',
  },
  
  modalSendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  
  starButton: {
    padding: 4,
  },
  
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#f43f5e',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Service Item Selection Styles
  serviceItemsSelection: {
    marginBottom: 20,
  },
  
  serviceItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
  
  serviceItemToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  
  serviceItemToggleButtonSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  
  serviceItemToggleText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  
  serviceItemToggleTextSelected: {
    color: '#10b981',
  },
  
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 12,
  },

  // Multi-step form styles
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  stepCircleActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },

  stepCircleInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },

  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },

  stepTextActive: {
    color: '#ffffff',
  },

  stepTextInactive: {
    color: '#9ca3af',
  },

  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },

  stepLineActive: {
    backgroundColor: '#6366f1',
  },

  stepLineInactive: {
    backgroundColor: '#d1d5db',
  },

  modalScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    // Removed maxHeight restriction to allow full form visibility
  },

  budgetHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },

  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  budgetInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    minWidth: 120,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    paddingBottom: 8,
    marginRight: 8,
  },

  currencyLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
  },

  budgetComparison: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
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
    color: '#6b7280',
  },

  budgetComparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },

  budgetLower: {
    color: '#dc2626',
  },

  budgetHigher: {
    color: '#059669',
  },

  formGroup: {
    marginBottom: 16,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
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
    color: '#6b7280',
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  
  // Video Section Styles
  videoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  
  videoContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  videoPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  
  videoPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    marginTop: 12,
  },
  
  videoPlaceholderSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Full Screen Preview Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  fullScreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  mediaCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  
  fullScreenVideoContainer: {
    width: screenWidth,
    height: screenHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  videoPlayerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  videoPlayerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  
  videoPlayerSubtext: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  
  playButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  imageNavigation: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
   navButtonDisabled: {
     backgroundColor: 'rgba(0,0,0,0.2)',
   },

   // Location Picker Styles
   locationPickerContainer: {
     flex: 1,
     backgroundColor: '#fff',
   },

   locationPickerHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 20,
     paddingVertical: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#e2e8f0',
     backgroundColor: '#fff',
     zIndex: 10,
     elevation: 5,
   },

   locationCancelText: {
     fontSize: 16,
     color: '#6b7280',
     fontWeight: '500',
   },

   locationPickerTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1a1a1a',
   },

   locationDoneText: {
     fontSize: 16,
     color: '#6366f1',
     fontWeight: '600',
   },

   locationDoneTextDisabled: {
     color: '#9ca3af',
   },

   map: {
     flex: 1,
   },

   locationInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     padding: 16,
     backgroundColor: '#f8fafc',
     borderTopWidth: 1,
     borderTopColor: '#e2e8f0',
   },

   locationCoordinates: {
     fontSize: 14,
     color: '#4b5563',
     marginLeft: 8,
   },
});