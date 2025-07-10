import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const TermsOfService = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

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

  const termsSections = [
    {
      title: 'Acceptance of Terms',
      icon: 'check-circle',
      content: [
        'By accessing and using our event platform, you accept and agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, please do not use our services.',
        'These terms apply to all users including event organizers, service providers, and attendees.',
        'We reserve the right to modify these terms at any time with notice to users.',
      ],
    },
    {
      title: 'User Accounts',
      icon: 'user',
      content: [
        'You must provide accurate and complete information when creating an account.',
        'You are responsible for maintaining the security of your account credentials.',
        'You must notify us immediately of any unauthorized use of your account.',
        'One person or entity may not maintain multiple accounts.',
        'We reserve the right to suspend or terminate accounts that violate our policies.',
      ],
    },
    {
      title: 'Event Booking & Payments',
      icon: 'credit-card',
      content: [
        'All bookings are subject to availability and confirmation from event organizers.',
        'Payment is required at the time of booking unless otherwise specified.',
        'We use secure third-party payment processors for all transactions.',
        'Refunds are subject to the specific cancellation policy of each event.',
        'We may charge transaction fees as disclosed at the time of booking.',
      ],
    },
    {
      title: 'User Conduct',
      icon: 'shield',
      content: [
        'Users must comply with all applicable laws and regulations.',
        'Prohibited activities include fraud, spam, harassment, and illegal content.',
        'Users may not interfere with the platform\'s operation or security.',
        'Respect other users and maintain professional communication.',
        'Report any suspicious or inappropriate behavior to our support team.',
      ],
    },
    {
      title: 'Service Provider Terms',
      icon: 'briefcase',
      content: [
        'Service providers must have proper licenses and insurance as required by law.',
        'All services must be delivered as described in listings and agreements.',
        'Providers are responsible for their own taxes and business compliance.',
        'We may verify credentials and conduct background checks as appropriate.',
        'Providers must maintain high standards of professionalism and quality.',
      ],
    },
    {
      title: 'Content & Intellectual Property',
      icon: 'file-text',
      content: [
        'Users retain ownership of content they create and upload.',
        'By uploading content, you grant us a license to use it for platform operations.',
        'You must have rights to all content you upload to the platform.',
        'We respect intellectual property rights and respond to valid DMCA notices.',
        'Our platform content and technology are protected by intellectual property laws.',
      ],
    },
    {
      title: 'Cancellations & Refunds',
      icon: 'x-circle',
      content: [
        'Each event has its own cancellation policy set by the organizer.',
        'Cancellation policies are clearly displayed before booking.',
        'Refunds are processed according to the applicable cancellation policy.',
        'We may charge processing fees for cancellations as disclosed.',
        'Force majeure events may result in full refunds at our discretion.',
      ],
    },
    {
      title: 'Platform Availability',
      icon: 'wifi',
      content: [
        'We strive to maintain platform availability but cannot guarantee 100% uptime.',
        'We may temporarily suspend service for maintenance or security reasons.',
        'We are not liable for losses due to temporary service interruptions.',
        'Critical updates and maintenance will be communicated in advance when possible.',
      ],
    },
    {
      title: 'Limitation of Liability',
      icon: 'alert-triangle',
      content: [
        'Our liability is limited to the amount you paid for services in the past 12 months.',
        'We are not liable for indirect, incidental, or consequential damages.',
        'We do not guarantee the quality or safety of third-party services.',
        'Users participate in events at their own risk.',
        'Our maximum liability per incident is limited as specified in applicable law.',
      ],
    },
    {
      title: 'Dispute Resolution',
      icon: 'users',
      content: [
        'We encourage users to resolve disputes through our support system first.',
        'Disputes not resolved through support may be subject to arbitration.',
        'Class action lawsuits are waived in favor of individual arbitration.',
        'Arbitration will be conducted under the rules of the American Arbitration Association.',
        'Some jurisdictions may not allow certain limitations, in which case local laws apply.',
      ],
    },
  ];

  const quickSummary = [
    { icon: 'user' as const, title: 'Account Responsibility', description: 'Keep your account secure and information accurate' },
    { icon: 'dollar-sign', title: 'Fair Pricing', description: 'Transparent pricing with no hidden fees' },
    { icon: 'shield' as const, title: 'Safe Environment', description: 'We maintain a secure platform for all users' },
    { icon: 'clock', title: 'Timely Service', description: 'Reliable platform with minimal downtime' },
  ];

  const renderSection = (section: any, index: number) => {
    const isExpanded = expandedSection === index;
    
    return (
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
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : index)}
        >
          <View style={styles.sectionIcon}>
            <Icon name={section.icon as any} size={20} color="#4c4ec7" />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.content.map((item: string, itemIndex: number) => (
              <View key={itemIndex} style={styles.contentItem}>
                <View style={styles.bullet} />
                <Text style={styles.contentText}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
              <Icon name="file-text" size={48} color="#fff" />
              <Text style={styles.heroTitle}>Terms of Service</Text>
              <Text style={styles.heroSubtitle}>
                Understanding our platform rules and your rights as a user
              </Text>
              <View style={styles.lastUpdated}>
                <Icon name="calendar" size={16} color="#fff" />
                <Text style={styles.lastUpdatedText}>Effective: January 1, 2024</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Summary */}
        <Animated.View
          style={[
            styles.summarySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.summaryTitle}>Terms Summary</Text>
          <Text style={styles.summaryDescription}>
            Here are the key points of our Terms of Service:
          </Text>
          <View style={styles.summaryGrid}>
            {quickSummary.map((item, index) => (
              <View key={index} style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Icon name={item.icon as any} size={20} color="#4c4ec7" />
                </View>
                <Text style={styles.summaryCardTitle}>{item.title}</Text>
                <Text style={styles.summaryCardDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Important Notice */}
        <Animated.View
          style={[
            styles.noticeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.noticeCard}>
            <Icon name="info" size={24} color="#f39c12" />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Important Notice</Text>
              <Text style={styles.noticeText}>
                These terms constitute a legally binding agreement between you and our platform. 
                Please read them carefully before using our services.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Detailed Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionMainTitle}>Detailed Terms</Text>
          <Text style={styles.sectionDescription}>
            Tap any section below to view the full terms and conditions.
          </Text>
          {termsSections.map((section, index) => renderSection(section, index))}
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
            <Text style={styles.contactTitle}>Questions About Our Terms?</Text>
            <Text style={styles.contactSubtitle}>
              Our legal team is available to help clarify any questions
            </Text>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact Legal Team</Text>
              <Icon name="mail" size={16} color="#4c4ec7" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Acknowledgment */}
        <View style={styles.acknowledgmentSection}>
          <Text style={styles.acknowledgmentText}>
            By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  summaryCardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  noticeSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 15,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionMainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 10,
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
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
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
  acknowledgmentSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  acknowledgmentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default TermsOfService;
