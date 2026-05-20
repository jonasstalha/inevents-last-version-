import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
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
      title: 'Privacy Policy – inEvent Website & Application',
      content: 'This Privacy Policy explains how inEvent, operated by Alphabet Corporation ("we," "us," or "our"), collects, uses, stores, shares, and protects your personal data when you access or use the inEvent website and mobile application (collectively, the "Platform").\n\nBy accessing or using the Platform, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the Platform.',
    },
    {
      title: '1. Information We Collect',
      content: '1.1 Personal Information\n\n• Full name\n• Email address\n• Phone number\n• Profile information (photo, description, services offered)\n• Account credentials\n• Business or professional information (for Sellers)\n\n1.2 Transaction & Wallet Information\n\n• Order history\n• Wallet activity and balance\n• Membership payments\n• Advertisement payments\n• Points and performance data\n\nNote: inEvent does not collect or store bank card information. Wallet funding is completed via bank transfer to Alphabet Corporation.\n\n1.3 Content You Provide\n\n• Services and product listings\n• Images, videos, and descriptions\n• Reviews and ratings\n• Any other content you voluntarily publish on the Platform\n\n1.4 Technical & Usage Data\n\n• IP address\n• Device type and operating system\n• Browser type\n• Log data, timestamps\n• Website and application usage data\n\n1.5 Cookies & Tracking Technologies\n\nWe use cookies and similar technologies to:\n\n• Ensure platform functionality\n• Analyze usage and performance\n• Improve user experience\n• Detect fraud and misuse\n\nYou can manage or disable cookies through your browser or device settings.',
    },
    {
      title: '2. How We Use Your Information',
      content: 'We use collected information to:\n\n• Operate, maintain, and improve the Platform\n• Create and manage user accounts\n• Process orders and transactions\n• Manage Wallets, Memberships, advertisements, and points\n• Display services and products in the Marketplace\n• Rank listings and improve visibility\n• Provide customer support\n• Prevent fraud, abuse, and unauthorized access\n• Comply with legal and regulatory obligations\n• Use services, products, images, and videos for marketing and promotional purposes',
    },
    {
      title: '3. Legal Basis for Processing',
      content: 'We process personal data based on:\n\n• Your consent\n• Contractual necessity (Terms of Service)\n• Legal obligations\n• Legitimate business interests',
    },
    {
      title: '4. Sharing of Information',
      content: 'We do not sell your personal data.\n\nWe may share your data only in the following cases:\n\n• With trusted service providers who assist in operating the Platform\n• When required by law, regulation, or legal process\n• To protect the rights, property, or safety of inEvent, its users, or the public\n• In connection with a merger, acquisition, or business transfer\n\nAll third parties are required to apply appropriate data protection measures.',
    },
    {
      title: '5. Public Information & Marketplace Visibility',
      content: 'Certain information such as profile details, services, products, images, videos, reviews, ratings, and points may be publicly visible on the Platform.\n\nYou control what content you publish.\n\ninEvent is not responsible for how other users use publicly available information.',
    },
    {
      title: '6. Data Retention',
      content: 'We retain personal data only for as long as necessary to:\n\n• Provide our services\n• Fulfill legal and accounting obligations\n• Resolve disputes\n• Enforce our Terms of Service\n\nUsers may request account deletion at any time through account settings or by contacting us.',
    },
    {
      title: '7. Data Security',
      content: 'We apply reasonable technical and organizational measures to protect personal data, including:\n\n• Secure servers\n• Restricted access\n• Monitoring systems\n\nHowever, no electronic storage or transmission method is completely secure, and absolute security cannot be guaranteed.',
    },
    {
      title: '8. Your Rights',
      content: 'Subject to applicable laws, you have the right to:\n\n• Access your personal data\n• Update or correct inaccurate information\n• Request deletion of your data\n• Object to or limit processing\n• Withdraw consent where applicable\n\nRequests can be submitted by contacting us.',
    },
    {
      title: '9. Children\'s Privacy',
      content: 'The Platform is intended only for users 18 years or older.\nWe do not knowingly collect personal data from minors.',
    },
    {
      title: '10. Third-Party Links',
      content: 'The Platform may contain links to third-party websites or services.\nWe are not responsible for their content or privacy practices.',
    },
    {
      title: '11. International Data Transfers',
      content: 'Your information may be stored or processed on servers located inside or outside Morocco, in compliance with applicable data protection laws.',
    },
    {
      title: '12. Changes to This Privacy Policy',
      content: 'We may update this Privacy Policy from time to time.\nAny changes will be published on the Platform with an updated effective date.\nContinued use of the Platform constitutes acceptance of the revised Policy.',
    },
    {
      title: '13. Contact Us',
      content: 'For privacy-related questions, requests, or concerns, please contact:\n\ninEvent – Alphabet Corporation\n📧 Email: support@inevent.ma\n🌐 Website: www.inevent.ma',
    },
    {
      title: '14. Language',
      content: 'This Privacy Policy was originally drafted in Arabic.\nEnglish and French translations are provided for convenience only.\nIn the event of any inconsistency, the Arabic version shall prevail.',
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <Shield size={48} color={Theme.colors.primary} />
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>
            Learn how we collect, use, and protect your information
          </Text>
        </View>

        {/* Policy Sections */}
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
