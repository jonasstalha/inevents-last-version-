import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BecomeProvider = () => {
  const router = useRouter();

  const sections = [
    {
      title: 'Become a Provider on inEvent',
      content: 'Promote Your Brand Where Events Begin\n\ninEvent is the digital hub where events are planned, organized, and brought to life.\nBy becoming a Provider, your business gains direct visibility among individuals, professionals, and organizations actively searching for event-related services and products.\n\nThis program is designed for third-party companies, brands, and professionals who want to advertise, promote, or showcase their offerings on inEvent — without being Marketplace sellers.',
    },
    {
      title: 'What Is a Provider?',
      content: 'A Provider is a third-party company or professional that:\n\n• Offers products or services related to the event industry\n• Wants to advertise or promote their brand on inEvent\n• Does not sell directly through the Marketplace\n• Uses inEvent as a visibility and lead-generation platform\n\nExamples include:\n\n• Venues and event spaces\n• Catering companies\n• Equipment rental companies\n• Printing and branding agencies\n• Transport and logistics providers\n• Event technology solutions\n• Corporate service providers',
    },
    {
      title: 'Why Become a Provider?',
      content: '🎯 Targeted Visibility\nReach users who are actively planning events, not just browsing ads.\n\n🚀 Brand Exposure\nShowcase your brand across the inEvent website and mobile application through premium placements.\n\n📈 Qualified Leads\nGain visibility among clients already interested in event solutions.\n\n🧠 Smart Positioning\nAssociate your brand with a professional, trusted event ecosystem.\n\n💼 No Marketplace Constraints\nYou promote your brand without managing orders, wallets, or Marketplace rules.',
    },
    {
      title: 'How the Provider System Works',
      content: '1. Apply as a Provider\nSubmit your business information and advertising request.\n\n2. Verification & Approval\nOur team reviews your brand to ensure alignment with the event industry and platform values.\n\n3. Choose Your Advertising Plan\nSelect from available visibility options and placements.\n\n4. Launch Your Campaign\nYour ads go live on the inEvent website and application.\n\n5. Measure Visibility & Impact\nBenefit from exposure within a targeted event-focused audience.',
    },
    {
      title: 'Advertising Options',
      content: 'Providers may benefit from:\n\n• Homepage featured banners\n• Category-based visibility\n• Sponsored placements\n• Branded content sections\n• Event-focused promotional slots\n• Seasonal or campaign-based exposure\n\nAll advertising content must comply with inEvent guidelines and quality standards.',
    },
    {
      title: 'Who Can Become a Provider?',
      content: 'You are eligible if:\n\n• Your products or services are related to event organization or support\n• Your brand operates legally and professionally\n• Your advertising content respects inEvent policies\n• You are not attempting to bypass Marketplace rules\n\ninEvent reserves the right to approve or reject any Provider application.',
    },
    {
      title: 'Provider Responsibilities',
      content: 'By becoming a Provider, you agree to:\n\n• Provide accurate and lawful information\n• Respect inEvent advertising policies\n• Avoid misleading or deceptive content\n• Comply with applicable laws and regulations\n\ninEvent does not guarantee leads, sales, or performance outcomes.',
    },
    {
      title: 'Important Notes',
      content: '• Provider ads are promotional only and do not represent Marketplace listings\n• Transactions, communications, and service delivery occur outside inEvent\n• inEvent is not responsible for third-party services or outcomes\n• Provider status does not grant seller privileges',
    },
    {
      title: 'Our Commitment',
      content: 'We are committed to offering:\n\n• A clean, professional advertising environment\n• Relevant and high-quality brand exposure\n• Fair visibility opportunities\n• Continuous platform improvement',
    },
    {
      title: 'Ready to Become a Provider?',
      content: 'If you want to promote your business where events take shape, inEvent Provider Program is the right place for you.',
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
        <Text style={styles.headerTitle}>Become a Provider</Text>
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
          <Text style={styles.heroTitle}>Join Our Network</Text>
          <Text style={styles.heroSubtitle}>
            Become a service provider and grow your event business
          </Text>
        </View>

        {/* Provider Sections */}
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
    marginBottom: Theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
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
  ctaSection: {
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.sm,
  },
  ctaDescription: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  ctaButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  ctaButtonText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.secondary,
  },
  infoNote: {
    backgroundColor: `${Theme.colors.info}15`,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.info,
  },
  infoText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
});

export default BecomeProvider;
