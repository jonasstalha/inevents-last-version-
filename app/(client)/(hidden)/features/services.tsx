import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Coffee, Home, Music, Users, Utensils } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const Services = () => {
  const router = useRouter();

  const services = [
    {
      id: 1,
      title: 'Catering Services',
      icon: Utensils,
      image: 'https://firebasestorage.googleapis.com/v0/b/inevents-2fe56.appspot.com/o/services%2Fcatering.jpg?alt=media',
      description: 'Professional catering for all types of events',
      features: ['Custom menus', 'Professional staff', 'Equipment included', 'Dietary accommodations'],
    },
    {
      id: 2,
      title: 'Venue Booking',
      icon: Home,
      image: 'https://firebasestorage.googleapis.com/v0/b/inevents-2fe56.appspot.com/o/services%2Fvenue.jpg?alt=media',
      description: 'Find and book the perfect venue for your event',
      features: ['Wide selection', 'Virtual tours', 'Instant booking', 'Flexible packages'],
    },
    {
      id: 3,
      title: 'Entertainment',
      icon: Music,
      image: 'https://firebasestorage.googleapis.com/v0/b/inevents-2fe56.appspot.com/o/services%2Fentertainment.jpg?alt=media',
      description: 'Live music, DJs, and entertainment services',
      features: ['Live bands', 'Professional DJs', 'Sound systems', 'Lighting setup'],
    },
    {
      id: 4,
      title: 'Photography',
      icon: Camera,
      image: 'https://firebasestorage.googleapis.com/v0/b/inevents-2fe56.appspot.com/o/services%2Fphotography.jpg?alt=media',
      description: 'Capture your special moments professionally',
      features: ['Event photography', 'Video recording', 'Drone shots', 'Quick delivery'],
    },
    {
      id: 5,
      title: 'Event Planning',
      icon: Users,
      image: 'https://firebasestorage.googleapis.com/v0/b/inevents-2fe56.appspot.com/o/services%2Fplanning.jpg?alt=media',
      description: 'Complete event planning and coordination',
      features: ['Full planning', 'Day coordination', 'Vendor management', 'Timeline creation'],
    },
    {
      id: 6,
      title: 'Specialty Services',
      icon: Coffee,
      image: 'https://firebasestorage.googleapis.com/v0/b/inevents-2fe56.appspot.com/o/services%2Fspecialty.jpg?alt=media',
      description: 'Additional services to enhance your event',
      features: ['Decorations', 'Transportation', 'Security', 'Special effects'],
    },
  ];

  const renderServiceCard = (service: any) => (
    <View key={service.id} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIcon}>
          <service.icon size={24} color={Theme.colors.primary} />
        </View>
        <Text style={styles.serviceTitle}>{service.title}</Text>
      </View>
      
      <Text style={styles.serviceDescription}>{service.description}</Text>
      
      <View style={styles.featuresList}>
        {service.features.map((feature: string, index: number) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
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
        <Text style={styles.headerTitle}>Our Services</Text>
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
          <Text style={styles.heroTitle}>Event Services</Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to make your event perfect
          </Text>
        </View>

        {/* Services Grid */}
        <View style={styles.servicesSection}>
          {services.map(renderServiceCard)}
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
    paddingTop: 10,
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
    height: 200,
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
  servicesSection: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  serviceCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    ...Theme.shadows.sm,
  },
  serviceImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  serviceTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.textDark,
    flex: 1,
  },
  serviceDescription: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.md,
    lineHeight: 22,
    paddingHorizontal: Theme.spacing.lg,
  },
  featuresList: {
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
    marginRight: Theme.spacing.sm,
    marginTop: 2,
  },
  featureText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    flex: 1,
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
  },
  ctaButtonText: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.secondary,
  },
});

export default Services;
