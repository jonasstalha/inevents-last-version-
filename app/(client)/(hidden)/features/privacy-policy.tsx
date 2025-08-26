import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const PrivacyPolicy = () => {
  const router = useRouter();

  const sections = [
    {
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support. This includes personal information like your name, email address, phone number, and payment information.',
    },
    {
      title: 'How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and events.',
    },
    {
      title: 'Information Sharing',
      content: 'We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who assist us in operating our platform, conducting business, or servicing you.',
    },
    {
      title: 'Data Security',
      content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.',
    },
    {
      title: 'Your Rights',
      content: 'You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. Contact us if you wish to exercise any of these rights.',
    },
    {
      title: 'Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.',
    },
    {
      title: 'Contact Information',
      content: 'If you have any questions about this Privacy Policy, please contact us at privacy@inevent.ma or through our support channels.',
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Shield size={48} color={Theme.colors.primary} />
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>
            Learn how we collect, use, and protect your information
          </Text>
          <Text style={styles.lastUpdated}>
            Last updated: January 2024
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            At InEvent, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
          </Text>
        </View>

        {/* Policy Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map(renderSection)}
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Questions?</Text>
          <Text style={styles.footerText}>
            If you have any questions about this Privacy Policy, please contact our support team.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  footerSection: {
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.sm,
  },
  footerText: {
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
});

export default PrivacyPolicy;
