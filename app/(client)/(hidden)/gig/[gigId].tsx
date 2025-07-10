import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

export default function EventDetailScreen() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [serviceQuantities, setServiceQuantities] = useState({ eventPlanning: 1 });
  const [extras, setExtras] = useState({ urgentDelivery: false, extraRevisions: 0, sourceFiles: false });
  const [customMessage, setCustomMessage] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState([
    { user: 'Alex Thompson', text: 'Amazing event planning! The team perfectly captured our vision. Super fast execution too!', rating: 5, date: '2 days ago' },
    { user: 'Jamie Chen', text: 'Very professional and creative agency. Great communication throughout the process.', rating: 4, date: '1 week ago' },
    { user: 'Marcus Rodriguez', text: 'Exceeded expectations! The additional services were handled quickly and professionally.', rating: 5, date: '2 weeks ago' }
  ]);
  const [saved, setSaved] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const eventData = {
    title: 'Premium Event Planning & Coordination',
    description: 'Make your event unforgettable! We offer full-service event planning, coordination, and creative solutions for weddings, corporate events, birthdays, and more. Enjoy stress-free planning, professional execution, and a memorable experience for you and your guests.',
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1515168833906-d2a3b82b1a48?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=600&h=400&fit=crop'
    ],
    provider: {
      name: 'Elite Events Agency',
      avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop&crop=face',
      level: 'Top Event Planner',
      responseTime: '2 hours',
      completedOrders: '200+',
    },
    basePrice: 500,
    rating: 4.9,
    reviewCount: 87,
    deliveryTime: 'Flexible',
    tags: ['Event Planning', 'Weddings', 'Corporate', 'Birthday', 'Full Service']
  };

  const services = {
    eventPlanning: { name: 'Event Planning', basePrice: 500, min: 1, max: 10 }
  };

  const extraServices = {
    urgentDelivery: { name: '24-hour express delivery', price: 25, icon: 'flash' },
    extraRevisions: { name: 'Additional revision', price: 10, icon: 'refresh' },
    sourceFiles: { name: 'Source files (AI, PSD)', price: 15, icon: 'document' }
  };

  const handleServiceChange = (change) => {
    setServiceQuantities((prev) => {
      const newQty = Math.max(services.eventPlanning.min, Math.min(services.eventPlanning.max, prev.eventPlanning + change));
      return { eventPlanning: newQty };
    });
  };

  const calculatePrice = () => {
    let total = services.eventPlanning.basePrice * serviceQuantities.eventPlanning;
    if (extras.urgentDelivery) total += extraServices.urgentDelivery.price;
    if (extras.extraRevisions > 0) total += extras.extraRevisions * extraServices.extraRevisions.price;
    if (extras.sourceFiles) total += extraServices.sourceFiles.price;
    if (couponApplied) total -= discount;
    return Math.max(total, 0);
  };

  const handleSendOffer = () => {
    Alert.alert('🎉 Offer Sent!', `Your custom offer has been sent to ${eventData.provider.name}!\n\nTotal: $${calculatePrice()}\n\nYou'll receive a response within ${eventData.provider.responseTime}.`);
    setShowOfferForm(false);
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'SAVE10') {
      setDiscount(10);
      setCouponApplied(true);
      Alert.alert('✅ Coupon Applied!', 'You saved $10 on your order!');
    } else if (coupon.trim().toUpperCase() === 'WELCOME20') {
      setDiscount(20);
      setCouponApplied(true);
      Alert.alert('✅ Welcome Bonus!', 'You saved $20 as a new customer!');
    } else {
      setDiscount(0);
      setCouponApplied(false);
      Alert.alert('❌ Invalid Coupon', 'This coupon code is not valid. Try SAVE10 or WELCOME20!');
    }
  };

  const renderStars = (rating, size = 16) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {eventData.title}
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
              <Image source={{ uri: eventData.images[selectedImage] }} style={styles.mainImage} />
              <TouchableOpacity style={styles.saveButton} onPress={() => setSaved(!saved)}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? '#6366f1' : '#fff'} />
              </TouchableOpacity>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                {eventData.images.map((img, index) => (
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
                <Text style={styles.title}>{eventData.title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
                  {eventData.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Provider Info */}
              <View style={styles.providerSection}>
                <View style={styles.providerLeft}>
                  <Image source={{ uri: eventData.provider.avatar }} style={styles.providerAvatar} />
                  <View style={styles.providerInfo}>
                    <View style={styles.providerNameRow}>
                      <Text style={styles.providerName}>{eventData.provider.name}</Text>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>{eventData.provider.level}</Text>
                      </View>
                    </View>
                    <View style={styles.ratingRow}>
                      {renderStars(eventData.rating)}
                      <Text style={styles.ratingText}>{eventData.rating} ({eventData.reviewCount} reviews)</Text>
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
                  <Text style={styles.statText}>Delivery: {eventData.deliveryTime}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flash-outline" size={16} color="#6366f1" />
                  <Text style={styles.statText}>Response: {eventData.provider.responseTime}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#6366f1" />
                  <Text style={styles.statText}>{eventData.provider.completedOrders} events planned</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>About This Event</Text>
                <Text style={styles.description}>{eventData.description}</Text>
              </View>

              {/* Pricing Section */}
              <View style={styles.pricingSection}>
                <Text style={styles.sectionTitle}>Customize Your Order</Text>
                
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{services.eventPlanning.name}</Text>
                    <Text style={styles.servicePrice}>${services.eventPlanning.basePrice} each</Text>
                  </View>
                  
                  <View style={styles.quantitySelector}>
                    <Text style={styles.quantityLabel}>Quantity:</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={[styles.quantityButton, serviceQuantities.eventPlanning <= services.eventPlanning.min && styles.quantityButtonDisabled]}
                        onPress={() => handleServiceChange(-1)}
                        disabled={serviceQuantities.eventPlanning <= services.eventPlanning.min}
                      >
                        <Ionicons name="remove" size={20} color={serviceQuantities.eventPlanning <= services.eventPlanning.min ? '#9ca3af' : '#6366f1'} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{serviceQuantities.eventPlanning}</Text>
                      <TouchableOpacity
                        style={[styles.quantityButton, serviceQuantities.eventPlanning >= services.eventPlanning.max && styles.quantityButtonDisabled]}
                        onPress={() => handleServiceChange(1)}
                        disabled={serviceQuantities.eventPlanning >= services.eventPlanning.max}
                      >
                        <Ionicons name="add" size={20} color={serviceQuantities.eventPlanning >= services.eventPlanning.max ? '#9ca3af' : '#6366f1'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

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
                      <Text style={styles.discountText}>Discount applied: -${discount}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Reviews Section */}
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>Reviews ({eventData.reviewCount})</Text>
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
            <Text style={styles.totalPrice}>${calculatePrice()}</Text>
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
                Tell {eventData.provider.name} about your event requirements
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
                <Text style={styles.modalPriceValue}>${calculatePrice()}</Text>
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
});