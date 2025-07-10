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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HelpSupport = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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

  const supportChannels = [
    {
      title: 'Live Chat',
      icon: 'message-circle',
      description: 'Get instant help from our support team',
      availability: '24/7 Available',
      color: '#4ecdc4',
      action: 'Start Chat',
    },
    {
      title: 'Email Support',
      icon: 'mail',
      description: 'Send us detailed questions or feedback',
      availability: 'Response in 2-4 hours',
      color: '#45b7d1',
      action: 'Send Email',
    },
    {
      title: 'Phone Support',
      icon: 'phone',
      description: 'Speak directly with our experts',
      availability: 'Mon-Fri, 9AM-6PM',
      color: '#f39c12',
      action: 'Call Now',
    },
    {
      title: 'Video Call',
      icon: 'video',
      description: 'Schedule a personalized consultation',
      availability: 'By Appointment',
      color: '#e74c3c',
      action: 'Schedule',
    },
  ];

  const faqData = [
    {
      question: 'How do I book an event?',
      answer: 'Browse our events, select your preferred event, choose your tickets, and complete the secure checkout process. You\'ll receive a confirmation email with your tickets.',
    },
    {
      question: 'Can I cancel or refund my booking?',
      answer: 'Cancellation policies vary by event. Check the specific event\'s cancellation policy before booking. Most events allow cancellation up to 24-48 hours before the event date.',
    },
    {
      question: 'How do I become a service provider?',
      answer: 'Click on "Become a Provider" in the app, complete the registration form, upload your credentials, and our team will review your application within 2-3 business days.',
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Yes, we use industry-standard encryption and secure payment processors. We never store your full credit card information on our servers.',
    },
    {
      question: 'How do I contact an event organizer?',
      answer: 'You can contact organizers through the event page after booking. We provide secure messaging to protect your privacy while facilitating communication.',
    },
    {
      question: 'What if an event is cancelled?',
      answer: 'If an event is cancelled by the organizer, you\'ll receive a full refund automatically within 3-5 business days. You\'ll also be notified immediately via email and push notification.',
    },
    {
      question: 'How do I update my profile?',
      answer: 'Go to Settings > Profile to update your personal information, preferences, and notification settings. Changes are saved automatically.',
    },
    {
      question: 'Can I transfer my tickets to someone else?',
      answer: 'Ticket transfer availability depends on the event organizer\'s policy. Look for the "Transfer Tickets" option in your booking details if available.',
    },
  ];

  const filteredFaqs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSupportChannel = (channel: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.channelCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[channel.color, `${channel.color}88`]}
        style={styles.channelGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.channelHeader}>
          <View style={styles.channelIcon}>
            <Icon name={channel.icon as any} size={24} color="#fff" />
          </View>
          <Text style={styles.channelTitle}>{channel.title}</Text>
        </View>
        
        <Text style={styles.channelDescription}>{channel.description}</Text>
        <Text style={styles.channelAvailability}>{channel.availability}</Text>
        
        <TouchableOpacity style={styles.channelButton}>
          <Text style={styles.channelButtonText}>{channel.action}</Text>
          <Icon name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  const renderFaqItem = (faq: any, index: number) => {
    const isExpanded = expandedFaq === index;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.faqCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => setExpandedFaq(isExpanded ? null : index)}
        >
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
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
        <Text style={styles.headerTitle}>Help & Support</Text>
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
              <Icon name="help-circle" size={48} color="#fff" />
              <Text style={styles.heroTitle}>How Can We Help?</Text>
              <Text style={styles.heroSubtitle}>
                Find answers to common questions or contact our support team
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statsGrid}>
            {[
              { icon: 'clock', value: '< 2 min', label: 'Avg Response Time' },
              { icon: 'users', value: '50K+', label: 'Happy Users' },
              { icon: 'star', value: '4.9/5', label: 'Support Rating' },
              { icon: 'check-circle', value: '99%', label: 'Resolution Rate' },
            ].map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Icon name={stat.icon as any} size={20} color="#4c4ec7" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Support Channels */}
        <View style={styles.channelsSection}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.channelsGrid}>
            {supportChannels.map((channel, index) => renderSupportChannel(channel, index))}
          </View>
        </View>

        {/* FAQ Search */}
        <Animated.View
          style={[
            styles.searchSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Icon name="x" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* FAQ List */}
        <View style={styles.faqSection}>
          {filteredFaqs.map((faq, index) => renderFaqItem(faq, index))}
          
          {filteredFaqs.length === 0 && searchQuery.length > 0 && (
            <View style={styles.noResults}>
              <Icon name="search" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>No FAQs found</Text>
              <Text style={styles.noResultsSubtext}>Try different search terms or contact support</Text>
            </View>
          )}
        </View>

        {/* Emergency Contact */}
        <Animated.View
          style={[
            styles.emergencySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#ff6b6b', '#ee5a6f']}
            style={styles.emergencyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="alert-circle" size={40} color="#fff" />
            <Text style={styles.emergencyTitle}>Need Immediate Help?</Text>
            <Text style={styles.emergencySubtitle}>
              For urgent issues during events, use our emergency hotline
            </Text>
            <TouchableOpacity style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>Emergency Contact</Text>
              <Icon name="phone" size={16} color="#ff6b6b" />
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
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '23%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  channelsSection: {
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
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  channelCard: {
    width: '48%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  channelGradient: {
    padding: 20,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  channelDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
    lineHeight: 20,
  },
  channelAvailability: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 15,
  },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  channelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginTop: 15,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  emergencySection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emergencyGradient: {
    padding: 30,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 25,
    lineHeight: 24,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginRight: 8,
  },
});

export default HelpSupport;
