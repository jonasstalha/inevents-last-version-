import { Theme } from '@/src/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Star, TrendingUp, Users } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const BecomeProvider = () => {
  const router = useRouter();

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Reach more customers and increase your revenue',
    },
    {
      icon: Users,
      title: 'Connect with Clients',
      description: 'Build lasting relationships with event organizers',
    },
    {
      icon: Star,
      title: 'Build Your Reputation',
      description: 'Showcase your work and receive customer reviews',
    },
    {
      icon: CheckCircle,
      title: 'Secure Payments',
      description: 'Get paid safely and on time for your services',
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Register',
      description: 'Create your provider account with basic information',
    },
    {
      step: '2',
      title: 'Verify',
      description: 'Upload your credentials and business documents',
    },
    {
      step: '3',
      title: 'Setup Profile',
      description: 'Add your services, portfolio, and pricing',
    },
    {
      step: '4',
      title: 'Start Earning',
      description: 'Receive bookings and grow your business',
    },
  ];

  const renderBenefitCard = (benefit: any, index: number) => (
    <View key={index} style={styles.benefitCard}>
      <View style={styles.benefitIcon}>
        <benefit.icon size={24} color={Theme.colors.primary} />
      </View>
      <Text style={styles.benefitTitle}>{benefit.title}</Text>
      <Text style={styles.benefitDescription}>{benefit.description}</Text>
    </View>
  );

  const renderStepCard = (step: any, index: number) => (
    <View key={index} style={styles.stepCard}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step.step}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
      </View>
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
        <Text style={styles.headerTitle}>Become a Provider</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Join Our Network</Text>
          <Text style={styles.heroSubtitle}>
            Become a service provider and grow your event business
          </Text>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Join InEvent?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map(renderBenefitCard)}
          </View>
        </View>

        {/* Steps Section */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsList}>
            {steps.map(renderStepCard)}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaDescription}>
            Join thousands of successful service providers
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Apply Now</Text>
          </TouchableOpacity>
          
          <View style={styles.infoNote}>
            <Text style={styles.infoText}>
              Application review typically takes 2-3 business days
            </Text>
          </View>
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
    marginBottom: Theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  benefitsSection: {
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
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: '48%',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  benefitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  benefitTitle: {
    fontSize: Theme.typography.fontSize.md,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  benefitDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  stepsSection: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  stepsList: {
    gap: Theme.spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  stepNumberText: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.secondary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.textDark,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
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
