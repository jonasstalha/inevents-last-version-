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

const PrivacyPolicy = () => {
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

  const privacySections = [
    {
      title: 'Information We Collect',
      icon: 'database',
      content: [
        'Personal information you provide when creating an account',
        'Event preferences and booking history',
        'Payment information (securely processed)',
        'Device information and usage analytics',
        'Location data (with your permission)',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: 'settings',
      content: [
        'Provide and improve our event services',
        'Process bookings and payments',
        'Send important updates and notifications',
        'Personalize your experience',
        'Ensure platform security and prevent fraud',
      ],
    },
    {
      title: 'Information Sharing',
      icon: 'share-2',
      content: [
        'We never sell your personal information',
        'Event organizers receive necessary booking details only',
        'Service providers get contact info for booked events',
        'Legal authorities (only when required by law)',
        'Trusted partners for payment processing',
      ],
    },
    {
      title: 'Data Security',
      icon: 'shield',
      content: [
        'End-to-end encryption for sensitive data',
        'Secure payment processing with industry standards',
        'Regular security audits and updates',
        'Restricted access to personal information',
        'Secure data centers and backup systems',
      ],
    },
    {
      title: 'Your Rights',
      icon: 'user',
      content: [
        'Access your personal data anytime',
        'Request data correction or deletion',
        'Opt out of marketing communications',
        'Download your data in portable format',
        'Contact our privacy team with concerns',
      ],
    },
    {
      title: 'Cookies & Tracking',
      icon: 'eye',
      content: [
        'Essential cookies for app functionality',
        'Analytics cookies to improve user experience',
        'Marketing cookies (with your consent)',
        'Third-party integrations for enhanced features',
        'You can manage cookie preferences in settings',
      ],
    },
  ];

  const renderSection = (section: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Icon name={section.icon as any} size={24} color="#4c4ec7" />
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      
      <View style={styles.sectionContent}>
        {section.content.map((item: string, itemIndex: number) => (
          <View key={itemIndex} style={styles.contentItem}>
            <View style={styles.bullet} />
            <Text style={styles.contentText}>{item}</Text>
          </View>
        ))}
      </View>
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
              <Icon name="lock" size={48} color="#fff" />
              <Text style={styles.heroTitle}>Your Privacy Matters</Text>
              <Text style={styles.heroSubtitle}>
                We're committed to protecting your personal information and being transparent about our practices
              </Text>
              <View style={styles.lastUpdated}>
                <Icon name="calendar" size={16} color="#fff" />
                <Text style={styles.lastUpdatedText}>Last updated: January 2024</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Overview */}
        <Animated.View
          style={[
            styles.overviewSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.overviewTitle}>Privacy at a Glance</Text>
          <View style={styles.overviewGrid}>
            {[
              { icon: 'shield' as const, title: 'No Data Selling', description: 'We never sell your personal information to third parties' },
              { icon: 'lock' as const, title: 'Secure Storage', description: 'Your data is encrypted and stored securely' },
              { icon: 'user' as const, title: 'Easy Deletion', description: 'Delete your account and data anytime' },
              { icon: 'eye' as const, title: 'Minimal Collection', description: 'We only collect what we need for our services' },
            ].map((item, index) => (
              <View key={index} style={styles.overviewCard}>
                <View style={styles.overviewIcon}>
                  <Icon name={item.icon as any} size={20} color="#4c4ec7" />
                </View>
                <Text style={styles.overviewCardTitle}>{item.title}</Text>
                <Text style={styles.overviewCardDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Detailed Sections */}
        <View style={styles.sectionsContainer}>
          {privacySections.map((section, index) => renderSection(section, index))}
        </View>

        {/* Contact Section */}
        <Animated.View
          style={[
            styles.contactSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#4c4ec7', '#6c5ce7']}
            style={styles.contactGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="help-circle" size={40} color="#fff" />
            <Text style={styles.contactTitle}>Questions About Privacy?</Text>
            <Text style={styles.contactSubtitle}>
              Our privacy team is here to help you understand our practices
            </Text>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact Privacy Team</Text>
              <Icon name="mail" size={16} color="#4c4ec7" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Legal Notice */}
        <View style={styles.legalNotice}>
          <Text style={styles.legalText}>
            This privacy policy is part of our Terms of Service. By using our app, you agree to the collection and use of information in accordance with this policy.
          </Text>
        </View>
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
    marginBottom: 20,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
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
  overviewIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  overviewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  overviewCardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  sectionContent: {
    paddingLeft: 10,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4c4ec7',
    marginTop: 8,
    marginRight: 15,
  },
  contentText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    flex: 1,
  },
  contactSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  contactGradient: {
    padding: 30,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  contactSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 25,
    lineHeight: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c4ec7',
    marginRight: 8,
  },
  legalNotice: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4c4ec7',
  },
  legalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default PrivacyPolicy;
