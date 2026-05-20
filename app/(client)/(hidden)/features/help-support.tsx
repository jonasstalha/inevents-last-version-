import { Theme } from '@/src/constants/theme';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const HelpSupport = () => {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleWhatsAppPress = () => {
    const phone = '+212701186390'; // Remove spaces and dashes for URL
    const message = 'Hello, I need help with InEvent app.';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@inevent.ma');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+212701186390');
  };

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
      question: 'What if an event is cancelled?',
      answer: 'If an event is cancelled by the organizer, you\'ll receive a full refund automatically within 3-5 business days. You\'ll also be notified immediately via email and push notification.',
    },
  ];

  const renderFaqItem = (faq: any, index: number) => {
    const isExpanded = expandedFaq === index;
    
    return (
      <View key={index} style={styles.faqCard}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() => setExpandedFaq(isExpanded ? null : index)}
        >
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Text style={styles.faqToggle}>{isExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(client)')}
        >
          <ArrowLeft size={24} color={Theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <HelpCircle size={48} color={Theme.colors.primary} />
          <Text style={styles.heroTitle}>How Can We Help?</Text>
          <Text style={styles.heroSubtitle}>
            Get instant support or find answers to common questions
          </Text>
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <TouchableOpacity style={styles.contactCard} onPress={handleWhatsAppPress}>
            <View style={styles.contactIcon}>
              <MessageCircle size={24} color={Theme.colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp Support</Text>
              <Text style={styles.contactDescription}>Get instant help via WhatsApp</Text>
              <Text style={styles.contactValue}>+212 701-186390</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handlePhonePress}>
            <View style={styles.contactIcon}>
              <Phone size={24} color={Theme.colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactDescription}>Speak directly with our team</Text>
              <Text style={styles.contactValue}>+212 701-186390</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
            <View style={styles.contactIcon}>
              <Mail size={24} color={Theme.colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDescription}>Send us your questions</Text>
              <Text style={styles.contactValue}>support@inevent.ma</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqData.map((faq, index) => renderFaqItem(faq, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
            marginBottom: 30,

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    padding: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginLeft: Theme.spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing.xl,
  },
  heroSection: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: Theme.colors.secondary,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  contactSection: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.lg,
    textAlign: 'center',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.textDark,
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.primary,
  },
  faqSection: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  faqCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
  },
  faqQuestion: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.textDark,
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  faqToggle: {
    fontSize: 20,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.primary,
    width: 20,
    textAlign: 'center',
  },
  faqAnswer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  faqAnswerText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    lineHeight: 20,
    marginTop: Theme.spacing.sm,
  },
});

export default HelpSupport;
