import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const Services = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const services = [
    {
      id: 1,
      title: 'Catering Services',
      icon: 'coffee' as const,
      description: 'Professional catering for all types of events',
      features: ['Custom menus', 'Professional staff', 'Equipment included', 'Dietary accommodations'],
      color: '#ff6b6b',
    },
    {
      id: 2,
      title: 'Venue Booking',
      icon: 'home' as const,
      description: 'Find and book the perfect venue for your event',
      features: ['Verified venues', 'Instant booking', 'Flexible cancellation', '24/7 support'],
      color: '#4ecdc4',
    },
    {
      id: 3,
      title: 'Photography',
      icon: 'camera' as const,
      description: 'Capture your special moments with professional photographers',
      features: ['HD quality photos', 'Quick delivery', 'Multiple packages', 'Video options'],
      color: '#45b7d1',
    },
    {
      id: 4,
      title: 'Music & Entertainment',
      icon: 'music' as const,
      description: 'Professional musicians and entertainment for your event',
      features: ['Live performances', 'DJ services', 'Sound equipment', 'Custom playlists'],
      color: '#f39c12',
    },
    {
      id: 5,
      title: 'Event Decoration',
      icon: 'award' as const,
      description: 'Transform your venue with stunning decorations',
      features: ['Theme-based designs', 'Premium materials', 'Setup & cleanup', 'Custom arrangements'],
      color: '#e74c3c',
    },
    {
      id: 6,
      title: 'Event Planning',
      icon: 'calendar' as const,
      description: 'Complete event planning and coordination services',
      features: ['Full coordination', 'Timeline management', 'Vendor coordination', 'Day-of support'],
      color: '#9b59b6',
    },
  ];

  const renderServiceCard = (service: any, index: number) => (
    <Animated.View
      key={service.id}
      style={[
        styles.serviceCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[service.color, `${service.color}88`]}
        style={styles.serviceGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceIconContainer}>
            <Icon name={service.icon} size={28} color="#fff" />
          </View>
          <Text style={styles.serviceTitle}>{service.title}</Text>
        </View>
        
        <Text style={styles.serviceDescription}>{service.description}</Text>
        
        <View style={styles.featuresContainer}>
          {service.features.map((feature: string, featureIndex: number) => (
            <View key={featureIndex} style={styles.featureItem}>
              <Icon name="check" size={16} color="#fff" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Icon name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Services</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <Icon name="grid" size={48} color="#fff" />
              <Text style={styles.heroTitle}>Premium Event Services</Text>
              <Text style={styles.heroSubtitle}>
                Everything you need to make your event unforgettable
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Benefits Section */}
        <Animated.View
          style={[
            styles.benefitsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Why Choose Our Services?</Text>
          <View style={styles.benefitsGrid}>
            {[
              { icon: 'shield' as const, title: 'Verified Providers', description: 'All service providers are thoroughly vetted' },
              { icon: 'clock' as const, title: 'Quick Response', description: 'Get quotes and confirmations within 24 hours' },
              { icon: 'dollar-sign' as const, title: 'Best Prices', description: 'Competitive pricing with no hidden fees' },
              { icon: 'star' as const, title: 'Quality Guaranteed', description: '100% satisfaction or money back' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Icon name={benefit.icon} size={24} color="#4c4ec7" />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Services Grid */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => renderServiceCard(service, index))}
          </View>
        </View>

        {/* CTA Section */}
        <Animated.View
          style={[
            styles.ctaSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#4c4ec7', '#6c5ce7']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
            <Text style={styles.ctaSubtitle}>
              Contact us today to discuss your event needs
            </Text>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Get Free Quote</Text>
              <Icon name="arrow-right" size={16} color="#4c4ec7" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 15,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 30,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  benefitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  servicesGrid: {
    gap: 15,
  },
  serviceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  serviceGradient: {
    padding: 25,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  serviceDescription: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 20,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
    opacity: 0.9,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  ctaSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: 30,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 25,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c4ec7',
    marginRight: 8,
  },
});

export default Services;
