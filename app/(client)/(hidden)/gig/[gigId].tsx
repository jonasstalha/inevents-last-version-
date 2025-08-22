import { Theme } from '@/src/constants/theme';
import { fetchArtistById } from '@/src/firebase/artistsService';
import { fetchServiceByIdFromFirebase } from '@/src/firebase/fetchAllServices';
import { Ionicons } from '@expo/vector-icons';
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
  const [reviews, setReviews] = useState<Array<{
    user: string;
    text: string;
    rating: number;
    date: string;
  }>>([]);
  const [saved, setSaved] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceData, setServiceData] = useState<any>(null);
  const [providerData, setProviderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
            // Using type assertion to handle dynamic comment structure
            const commentAny = comment as any;
            return {
              user: commentAny.userName || commentAny.user || "Anonymous User",
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

  // Set up default service data structure
  const defaultServiceData = {
    title: serviceData?.title || "Loading...",
    description: serviceData?.description || "Loading service details...",
    images: serviceData?.images?.length > 0 
      ? serviceData.images 
      : serviceData?.image 
        ? [serviceData.image] 
        : [DEFAULT_SERVICE_IMAGE],
    provider: {
      name: providerData?.name || serviceData?.artistName || "Service Provider",
      avatar: providerData?.profilePicture || providerData?.avatar || DEFAULT_AVATAR,
      level: providerData?.level || "Service Provider",
      responseTime: providerData?.responseTime || "24 hours",
      completedOrders: providerData?.completedOrders || "0+",
    },
    basePrice: serviceData?.price || serviceData?.basePrice || 0,
    rating: serviceData?.rating || 4.5,
    reviewCount: reviews.length || 0,
    deliveryTime: serviceData?.deliveryTime || "Standard",
    tags: serviceData?.categories || serviceData?.tags || ["Service"]
  };

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
  
  const handleItemQuantityChange = (itemKey: string, change: number) => {
    setServiceQuantities((prev) => {
      const currentValue = prev[itemKey as keyof typeof prev] as number || 0;
      const newValue = Math.max(0, currentValue + change);
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

  const handleSendOffer = async () => {
    try {
      // Get current user ID
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to place an order.');
        return;
      }
      
      // Create order object
      const newOrder = {
        id: `order_${Date.now()}`,
        clientId: currentUser.uid,
        artistId: serviceData.userId || serviceData.artistId,
        gigId: String(gigId),
        gigTitle: serviceData.title || defaultServiceData.title,
        message: customMessage,
        items: Object.entries(serviceQuantities).map(([key, quantity]) => {
          // For service items from Firebase
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
        status: 'pending', // pending, accepted, declined
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save order to Firebase
      const { addDoc, collection } = await import('firebase/firestore');
      const { getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      await addDoc(collection(db, 'orders'), newOrder);

      // Show success message
      Alert.alert('🎉 Offer Sent!', `Your custom offer has been sent to ${defaultServiceData.provider.name}!\n\nTotal: ${calculatePrice()} MAD\n\nYou'll receive a response within ${defaultServiceData.provider.responseTime}.`);
      setShowOfferForm(false);
      
      // Navigate back to client home
      router.push('/(client)');
    } catch (error) {
      console.error('Error sending offer:', error);
      Alert.alert('Error', 'There was a problem sending your offer. Please try again.');
    }
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'SAVE10') {
      setDiscount(100);
      setCouponApplied(true);
      Alert.alert('✅ Coupon Applied!', 'You saved 100 MAD on your order!');
    } else if (coupon.trim().toUpperCase() === 'WELCOME20') {
      setDiscount(200);
      setCouponApplied(true);
      Alert.alert('✅ Welcome Bonus!', 'You saved 200 MAD as a new customer!');
    } else {
      setDiscount(0);
      setCouponApplied(false);
      Alert.alert('❌ Invalid Coupon', 'This coupon code is not valid. Try SAVE10 or WELCOME20!');
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
    outputRange: [0, 1],
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
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
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
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {defaultServiceData.title}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setSaved(!saved)}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={saved ? '#6366f1' : '#1a1a1a'} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            
            {/* Hero Image Gallery */}
            <View style={styles.imageSection}>
              <Image source={{ uri: defaultServiceData.images[selectedImage] }} style={styles.mainImage} />
              <TouchableOpacity style={styles.saveButton} onPress={() => setSaved(!saved)}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? '#6366f1' : '#fff'} />
              </TouchableOpacity>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                {defaultServiceData.images.map((img: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImage(index)}
                    style={[styles.thumbnail, selectedImage === index && styles.thumbnailSelected]}
                  >
                    <Image source={{ uri: img }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
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
              <View style={styles.providerSection}>
                <View style={styles.providerLeft}>
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
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="chatbubble-outline" size={18} color="#6366f1" />
                </TouchableOpacity>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#6366f1" />
                  <Text style={styles.statText}>Delivery: {defaultServiceData.deliveryTime}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flash-outline" size={16} color="#6366f1" />
                  <Text style={styles.statText}>Response: {defaultServiceData.provider.responseTime}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#6366f1" />
                  <Text style={styles.statText}>{defaultServiceData.provider.completedOrders} services completed</Text>
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
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleItemQuantityChange(itemId, -1)}
                          >
                            <Ionicons name="remove" size={20} color="#6366f1" />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{quantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleItemQuantityChange(itemId, 1)}
                          >
                            <Ionicons name="add" size={20} color="#6366f1" />
                          </TouchableOpacity>
                        </View>
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

                {/* Coupon Section */}
                <View style={styles.couponSection}>
                  <Text style={styles.subsectionTitle}>Promo Code</Text>
                  <View style={styles.couponRow}>
                    <TextInput
                      style={[styles.couponInput, couponApplied && styles.couponInputDisabled]}
                      placeholder="Enter promo code (try SAVE10)"
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
                  {couponApplied && (
                    <View style={styles.discountRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.discountText}>Discount applied: -{discount} MAD</Text>
                    </View>
                  )}
                </View>
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
          <TouchableOpacity style={styles.continueButton} onPress={() => setShowOfferForm(true)}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Offer Modal */}
        <Modal visible={showOfferForm} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Custom Offer</Text>
                <TouchableOpacity onPress={() => setShowOfferForm(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                Tell {defaultServiceData.provider.name} about your service requirements
              </Text>
              
              <TextInput
                multiline
                numberOfLines={6}
                placeholder="Describe your event in detail..."
                value={customMessage}
                onChangeText={setCustomMessage}
                style={styles.textArea}
              />
              
              <View style={styles.modalPriceRow}>
                <Text style={styles.modalPriceLabel}>Total Amount:</Text>
                <Text style={styles.modalPriceValue}>{calculatePrice()} MAD</Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowOfferForm(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOffer} style={styles.modalSend}>
                  <Text style={styles.modalSendText}>Send Offer</Text>
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
                  onPress={() => {
                    setReviews(prev => [{
                      user: 'You',
                      text: reviewText,
                      rating: reviewRating,
                      date: 'Just now'
                    }, ...prev]);
                    setReviewText('');
                    setReviewRating(5);
                    setShowReviewForm(false);
                  }}
                  style={[styles.modalSend, !reviewText.trim() && styles.modalSendDisabled]}
                  disabled={!reviewText.trim()}
                >
                  <Text style={styles.modalSendText}>Submit Review</Text>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 16,
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
    backgroundColor: '#f1f5f9',
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
  
  quantityLabel: {
    fontSize: 16,
    color: '#4b5563',
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
  
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
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
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
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
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: screenHeight * 0.8,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
});