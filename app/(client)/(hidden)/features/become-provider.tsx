import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

export default function BecomeProviderScreen() {
  const router = useRouter();

  const benefits = [
    {
      icon: 'dollar-sign',
      title: 'Earn Money',
      description: 'Set your own prices and earn money doing what you love',
      color: '#10b981'
    },
    {
      icon: 'users',
      title: 'Reach Customers',
      description: 'Connect with thousands of potential clients in your area',
      color: '#3b82f6'
    },
    {
      icon: 'star',
      title: 'Build Reputation',
      description: 'Get reviews and build your professional reputation',
      color: '#f59e0b'
    },
    {
      icon: 'calendar',
      title: 'Flexible Schedule',
      description: 'Work when you want, accept bookings that fit your schedule',
      color: '#8b5cf6'
    },
    {
      icon: 'trending-up',
      title: 'Grow Your Business',
      description: 'Use our platform to expand and grow your service business',
      color: '#ef4444'
    },
    {
      icon: 'shield',
      title: 'Secure Payments',
      description: 'Get paid securely through our trusted payment system',
      color: '#06b6d4'
    }
  ];

  const steps = [
    {
      step: '1',
      title: 'Create Your Profile',
      description: 'Sign up and create a detailed profile showcasing your services and expertise'
    },
    {
      step: '2',
      title: 'Verify Your Identity',
      description: 'Complete our verification process to build trust with customers'
    },
    {
      step: '3',
      title: 'List Your Services',
      description: 'Add your services with descriptions, pricing, and availability'
    },
    {
      step: '4',
      title: 'Start Receiving Bookings',
      description: 'Get notified of bookings and start earning money immediately'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Provider</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Icon name="briefcase" size={48} color="#4f46e5" />
          </View>
          <Text style={styles.heroTitle}>Join Our Provider Network</Text>
          <Text style={styles.heroSubtitle}>
            Turn your skills into income by offering services to thousands of customers
          </Text>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Join Us?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={[styles.benefitIcon, { backgroundColor: benefit.color }]}>
                  <Icon name={benefit.icon} size={24} color="#ffffff" />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                {index < steps.length - 1 && <View style={styles.stepConnector} />}
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of providers already earning on our platform
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Icon name="user" size={20} color="#ffffff" style={styles.ctaIcon} />
            <Text style={styles.ctaButtonText}>Start Your Application</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 24,
    textAlign: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  stepItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 32,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  stepConnector: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -32,
    width: 2,
    backgroundColor: '#e2e8f0',
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    marginTop: 32,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaIcon: {
    marginRight: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
