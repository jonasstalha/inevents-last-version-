import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
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
      title: 'Terms of Service – inEvent Website & Application',
      content: 'These Terms of Service ("Terms" or "Terms and Conditions") govern your access to and use of the inEvent website and mobile application (collectively referred to as the "Platform"), including all content, features, tools, and services provided through inEvent, owned and operated by Alphabet Corporation.\n\nThroughout these Terms, "we," "us," or "our" refer to inEvent and Alphabet Corporation, and "you," "your," or "User" refer to any individual or entity accessing or using the Platform.\n\nPlease read these Terms carefully before using the Platform. By accessing or using the inEvent website or application, creating an account, or clicking "Accept" or "Agree" when prompted, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.\n\nIf you do not agree to these Terms or the Privacy Policy, you must not access or use the Platform.\n\nFor additional policies related to specific features or activities on the Platform, please refer to the dedicated policy pages available on inEvent.',
    },
    {
      title: 'Eligibility',
      content: 'The inEvent Platform is available only to users who are 18 years of age or older.',
    },
    {
      title: 'Definitions',
      content: 'Artist / Seller: Also referred to as (Service Provider – Vendor – Project Owner), any individual or entity offering services or products through the Platform.\n\nUser / Buyer: Also referred to as (Client – Customer), any individual or entity purchasing services or products.\n(Artists and Buyers may collectively be referred to as "Users".)\n\nProducts & Services: Any service or product offered by a Seller on inEvent.\n\nOrder: The process through which a User purchases a service or product.\n\nMarketplace: The section of the Platform where all services and products are displayed.\n\nWallet: A digital wallet required for Sellers to activate their accounts, receive transactions, pay commissions, advertisements, and Membership fees.\n\nPoints: A reward system allowing Users to earn points based on activity and performance on the Platform.',
    },
    {
      title: 'General Rules',
      content: 'You are solely responsible for all activities conducted through your account. inEvent is not responsible for any actions, losses, or issues arising from your account usage.\n\nFor each completed sale, a commission ranging from 10% to 20% will be automatically deducted from the Seller\'s Wallet.\n\nFunds stored in the Wallet cannot be withdrawn.\n\nOrder cancellations by Sellers may negatively impact reputation, ranking, and overall performance.\n\nSellers may earn points that improve visibility, unlock rewards, and contribute to obtaining a Verification Badge.\n\nAll payments must be processed exclusively through the inEvent Wallet system. External payment methods are strictly prohibited.\n\nOnce an order is placed, Buyers are entitled to receive the service or product as agreed upon with the Seller, including conditions discussed through the inEvent messaging system.\n\ninEvent reserves the right to use listed services and products for marketing and advertising purposes.\n\nSales commissions are removed only upon subscribing to and activating a Membership plan.\n\nWe respect your privacy. For more details, please refer to our Privacy Policy or contact us.',
    },
    {
      title: 'Sellers (Artists & Project Owners)',
      content: 'Wallet activation is mandatory for account activation and public visibility.\n\nSellers may list services and products through My Services & Products.\n\nAdditional or customized services may be offered subject to prior agreement with the Buyer regarding scope and price.\n\nA commission of 10% to 20% is deducted per service or product upon order confirmation.\n\nSellers may promote their offerings through paid advertisements on the Platform.\n\nReviews play a critical role in credibility and user trust.',
    },
    {
      title: 'Services & Products Policy',
      content: 'Services, products, or user accounts may be removed if they involve:\n\n• Illegal or prohibited activities\n• Intellectual property infringement\n• Immoral or inappropriate content\n• Violence, hate speech, racism, or abusive language\n• Poor quality or misleading services or products\n• Advertising unrelated to the event industry (l\'événementiel)\n\nAdditional rules:\n\nRemoved services or products negatively affect account performance.\n\nDeleted listings cannot be restored or edited.\n\nListings containing external links or third-party advertisements will be removed.\n\nEach listing must include at least two original images and one video, accurately representing the service or product.\n\nSellers must deliver the same quality displayed in uploaded media.\n\nAll services and products must be directly related to event organization and management. Any listing outside this scope will be removed.',
    },
    {
      title: 'Buyers (Users)',
      content: 'Orders must be placed only through the inEvent website or application.\n\ninEvent may use purchased services or products for marketing and promotional purposes.\n\nBuyers may request customized services subject to mutual agreement.\n\nRepeated order cancellations may result in account suspension or deletion.',
    },
    {
      title: 'Payments',
      content: 'Upon order approval, the service price, location, and date must be confirmed.\n\nPayment is made in cash, directly to the Seller, upon completion of the service, unless otherwise specified on the Platform.',
    },
    {
      title: 'Orders',
      content: 'An order is considered completed at the agreed service date and time.\n\nOrders conducted outside the inEvent Platform are not covered and may result in account removal.\n\nSellers must comply with agreed timelines, quality standards, and service details.',
    },
    {
      title: 'Reviews',
      content: 'Buyers are encouraged to leave honest reviews to maintain platform quality.\n\nReviews are removed only if they violate our Terms or Privacy Policy.',
    },
    {
      title: 'Marketplace Visibility',
      content: 'Visibility is influenced by:\n\n• Positive reviews and high ratings\n• Paid promotions\n• High point balances',
    },
    {
      title: 'Wallet',
      content: 'Wallet activation is mandatory for Sellers.\n\nWallets are funded via bank transfer to Alphabet Corporation.\n\nCommissions are deducted automatically upon order confirmation.\n\nWallets may be used for advertisements and Membership payments.',
    },
    {
      title: 'Points System',
      content: 'Points are earned for completed transactions.\n\nOrder cancellations or policy violations result in point deductions.\n\nPoints unlock rewards and improve account performance.',
    },
    {
      title: 'User Conduct & Protection',
      content: 'inEvent connects users across Morocco to buy and sell event-related services.\n\nHarassment, discrimination, hate speech, or threats are strictly prohibited.\n\nSharing personal contact details to bypass inEvent systems is forbidden.\n\nAny violation may result in legal action, suspension, or permanent account removal.',
    },
    {
      title: 'Content & Intellectual Property',
      content: 'Sellers guarantee that all listed services and products are original and lawful.\n\nUser-generated content remains the sole responsibility of the uploader.\n\ninEvent may remove content that violates intellectual property laws.',
    },
    {
      title: 'Ownership & Usage Rights',
      content: 'All content, including services, products, images, videos, usernames, and media, may be used by inEvent and Alphabet Corporation for marketing, advertising, platform improvement, and service development.',
    },
    {
      title: 'Disclaimer',
      content: 'Your use of the inEvent website and application is at your own risk. inEvent does not guarantee service quality or outcomes.',
    },
    {
      title: 'Account Suspension or Deletion',
      content: 'inEvent reserves the right to suspend or permanently delete accounts for violations or low-quality performance.\n\nSuspended users cannot buy or sell on the Platform.\n\nUsers may delete their accounts at any time through account settings.',
    },
    {
      title: 'Security',
      content: 'Users may be required to verify account ownership through customer support.',
    },
    {
      title: 'Changes to These Terms',
      content: 'inEvent may update these Terms at any time.\n\nContinued use of the Platform after updates constitutes acceptance.\n\nUsers who do not agree must deactivate their accounts.',
    },
    {
      title: 'Indemnification',
      content: 'You agree to indemnify and hold harmless inEvent and Alphabet Corporation against any claims, damages, or losses arising from your use of the Platform or violation of these Terms.',
    },
    {
      title: 'Severability',
      content: 'If any provision is found unenforceable, the remaining provisions remain valid and enforceable.',
    },
    {
      title: 'Entire Agreement',
      content: 'These Terms constitute the entire agreement between you and inEvent regarding the use of the website and application.\n\nThe original version is written in Arabic. English and French translations are provided for convenience only.',
    },
  ];

  const renderSection = (section: any, index: number) => (
    <View key={index} style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
          <FileText size={48} color={Theme.colors.primary} />
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroSubtitle}>
            Please read these terms carefully before using our service
          </Text>
        </View>

        {/* Terms Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map(renderSection)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
            marginBottom: 20,
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
  sectionsContainer: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
    gap: Theme.spacing.lg,
  },
  sectionCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
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
