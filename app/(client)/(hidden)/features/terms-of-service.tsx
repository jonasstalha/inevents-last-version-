import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const TermsOfService = () => {
  const router = useRouter();

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using the InEvent mobile application, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service govern your use of our platform.',
    },
    {
      title: 'User Accounts',
      content: 'To access certain features of our service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
    },
    {
      title: 'Event Bookings',
      content: 'When you book an event through our platform, you enter into a direct contractual relationship with the event organizer. InEvent serves as an intermediary platform and is not responsible for the actual delivery of events.',
    },
    {
      title: 'Payment Terms',
      content: 'Payments for events are processed securely through our platform. Refund policies are determined by individual event organizers and will be clearly stated before booking. Processing fees may apply.',
    },
    {
      title: 'Service Provider Terms',
      content: 'Service providers using our platform must comply with all applicable laws and regulations. You are responsible for the quality and delivery of your services and must maintain appropriate insurance coverage.',
    },
    {
      title: 'Prohibited Uses',
      content: 'You may not use our service for any unlawful purpose, to violate any laws, to harass or harm others, to transmit harmful content, or to interfere with the security or functionality of our platform.',
    },
    {
      title: 'Limitation of Liability',
      content: 'InEvent shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our service, even if we have been advised of the possibility of such damages.',
    },
    {
      title: 'Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.',
    },
  ];

  const renderSection = (section: any, index: number) => (
    <View key={index} style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(client)')}
        >
          <ArrowLeft size={24} color={Theme.colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <FileText size={48} color={Theme.colors.primary} />
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroSubtitle}>
            Please read these terms carefully before using our service
          </Text>
          <Text style={styles.lastUpdated}>
            Last updated: January 2024
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            Welcome to InEvent. These Terms of Service ("Terms") govern your use of our mobile application and services. By using our platform, you agree to comply with and be bound by these Terms.
          </Text>
        </View>

        {/* Terms Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map(renderSection)}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About These Terms?</Text>
          <Text style={styles.contactText}>
            If you have any questions about these Terms of Service, please contact our legal team.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Legal</Text>
          </TouchableOpacity>
        </View>

        {/* Agreement Section */}
        <View style={styles.agreementSection}>
          <Text style={styles.agreementText}>
            By continuing to use InEvent, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
    marginBottom: Theme.spacing.md,
  },
  lastUpdated: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
  },
  introSection: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  introText: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    lineHeight: 24,
    textAlign: 'left',
  },
  sectionsContainer: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.md,
  },
  sectionContent: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    lineHeight: 22,
  },
  contactSection: {
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.sm,
  },
  contactText: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  contactButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.md,
  },
  contactButtonText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.secondary,
  },
  agreementSection: {
    padding: Theme.spacing.xl,
    backgroundColor: `${Theme.colors.info}15`,
    marginTop: Theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  agreementText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TermsOfService;
