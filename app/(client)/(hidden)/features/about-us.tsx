import { Theme } from '@/src/constants/theme';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowLeft, Instagram } from 'lucide-react-native';
import React from 'react';
import {
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
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>InEvent</Text>
            <Text style={styles.heroSubtitle}>
              Making events accessible to everyone
            </Text>
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.missionSection}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            To democratize event planning by connecting organizers with the best service providers, 
            while making it easier for people to discover and attend amazing events.
          </Text>
        </View>

        {/* Values Section */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valuesList}>
            <View style={styles.valueItem}>
              <Text style={styles.valueTitle}>💜 Passion for Events</Text>
              <Text style={styles.valueDescription}>Every event should be memorable and meaningful</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueTitle}>🤝 Community First</Text>
              <Text style={styles.valueDescription}>Building connections between organizers and attendees</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueTitle}>⭐ Excellence</Text>
              <Text style={styles.valueDescription}>Committed to providing the highest quality service</Text>
            </View>
          </View>
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
  missionSection: {
    padding: Theme.spacing.xl,
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
  missionText: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    lineHeight: 24,
    textAlign: 'center',
  },
  valuesSection: {
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.secondary,
    marginTop: Theme.spacing.md,
  },
  valuesList: {
    gap: Theme.spacing.lg,
  },
  valueItem: {
    alignItems: 'center',
  },
  valueTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
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
