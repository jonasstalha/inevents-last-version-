import { Theme } from '@/src/constants/theme';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowLeft, Instagram } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AboutUs = () => {
  const router = useRouter();

  const handleInstagramPress = () => {
    Linking.openURL('https://www.instagram.com/inevent.ma/');
  };

  const sections = [
    {
      title: 'Our Story',
      content: 'inEvent was born from a simple but powerful observation:\norganizing events in Morocco often depends on fragmented contacts, informal agreements, and a lack of trust, visibility, and structure between service providers and clients.\n\nArtists, event professionals, and project owners struggle to find clients, showcase their work, and get fairly valued. At the same time, individuals and companies organizing events face difficulties finding reliable, verified, and high-quality services in one place.\n\nThis gap inspired the creation of inEvent — a digital platform designed to bring structure, transparency, and opportunity to the event industry (l\'événementiel).',
    },
    {
      title: 'Who We Are',
      content: 'inEvent is a Moroccan digital platform, operated by Alphabet Corporation, dedicated to connecting:\n\n• Artists\n• Event professionals\n• Small and large project owners\n• Suppliers\n• Individuals and organizations planning events\n\nThrough one unified website and mobile application, inEvent allows users to discover, compare, and access event-related services and products with confidence.',
    },
    {
      title: 'Why inEvent Exists',
      content: 'The Moroccan event industry is rich in talent but often limited by:\n\n• Lack of visibility for service providers\n• Difficulty accessing trustworthy professionals\n• Informal payment practices\n• Quality inconsistency\n• Limited digital tools tailored to events\n\ninEvent was created to professionalize, digitize, and elevate this ecosystem.',
    },
    {
      title: 'Our Mission',
      content: 'Our mission is to empower the Moroccan event industry by providing a secure, transparent, and professional digital environment where:\n\n• Service providers can grow their visibility and business\n• Clients can confidently organize successful events\n• Quality, fairness, and trust become industry standards\n\nWe aim to contribute to the development of the event sector in alignment with Morocco\'s future vision, creativity, and cultural identity.',
    },
    {
      title: 'Our Vision',
      content: 'We envision inEvent as the leading event services platform in Morocco, and later beyond, becoming the reference point for:\n\n• Event organization\n• Talent discovery\n• Creative collaboration\n• Digital transformation of the event industry\n\nOur long-term vision is to position Moroccan creativity and expertise on a global scale.',
    },
    {
      title: 'Our Goals',
      content: '• Centralize event-related services and products in one platform\n• Support artists and entrepreneurs in growing their client base\n• Encourage professionalism, transparency, and accountability\n• Reduce conflicts through structured processes and reviews\n• Promote quality through ratings, points, and visibility systems\n• Digitize an industry traditionally based on informal networks',
    },
    {
      title: 'Our Values',
      content: 'Trust – Building a reliable environment for all users\n\nTransparency – Clear rules, pricing logic, and visibility\n\nQuality – Encouraging excellence through reviews and performance\n\nFairness – Equal opportunity for small and large providers\n\nInnovation – Using technology to simplify and improve experiences\n\nCommunity – Supporting collaboration and mutual growth',
    },
    {
      title: 'The inEvent Platform',
      content: 'inEvent provides:\n\n• A curated Marketplace for event services and products\n• Seller profiles with reviews, ratings, and performance indicators\n• A Wallet system to manage platform operations\n• A Points & Rewards system to encourage engagement and quality\n• Advertising and visibility tools for professionals\n• Membership options to support long-term growth\n\nAll services and products on inEvent are focused exclusively on the event organization sector.',
    },
    {
      title: 'Our Commitment',
      content: 'We are committed to:\n\n• Protecting user privacy and data\n• Enforcing clear rules and ethical behavior\n• Continuously improving the platform\n• Listening to our community\n• Supporting Moroccan talent and entrepreneurship\n\nAny abuse, discrimination, or violation of our principles is taken seriously and addressed accordingly.',
    },
    {
      title: 'Looking Forward',
      content: 'inEvent is more than a platform — it is a movement to modernize how events are organized and how talent is discovered in Morocco.\n\nWe believe that by combining technology, creativity, and structure, we can help shape a stronger, more sustainable event industry for the future.',
    },
    {
      title: 'Operated By',
      content: 'inEvent is a product of Alphabet Corporation,\na company focused on digital solutions, innovation, and creative services.',
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
        <Text style={styles.headerTitle}>About Us</Text>
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
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>inEvent</Text>
            <Text style={styles.heroSubtitle}>
              Making events accessible to everyone
            </Text>
          </View>
        </View>

        {/* About Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map(renderSection)}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <TouchableOpacity style={styles.instagramButton} onPress={handleInstagramPress}>
            <Instagram size={24} color={Theme.colors.secondary} />
            <Text style={styles.instagramText}>@inevent.ma</Text>
          </TouchableOpacity>
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
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: Theme.typography.fontSize.lg,
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
  contactSection: {
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.sm,
  },
  instagramText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.secondary,
  },
});

export default AboutUs;
