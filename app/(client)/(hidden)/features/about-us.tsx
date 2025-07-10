import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const AboutUs = () => {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const values = [
    {
      icon: 'heart',
      title: 'Passion for Events',
      description: 'We believe every event should be memorable and meaningful',
      color: '#ff6b6b',
    },
    {
      icon: 'users',
      title: 'Community First',
      description: 'Building connections between event organizers and attendees',
      color: '#4ecdc4',
    },
    {
      icon: 'award',
      title: 'Excellence',
      description: 'Committed to providing the highest quality service',
      color: '#f39c12',
    },
    {
      icon: 'shield',
      title: 'Trust & Security',
      description: 'Your safety and privacy are our top priorities',
      color: '#9b59b6',
    },
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612e3c9?w=150&h=150&fit=crop&crop=face',
      bio: '10+ years in event management',
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Tech innovator and startup veteran',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Design',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Award-winning UX/UI designer',
    },
    {
      name: 'David Thompson',
      role: 'VP of Operations',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: 'Operations excellence expert',
    },
  ];

  const stats = [
    { value: '100K+', label: 'Events Hosted' },
    { value: '500K+', label: 'Happy Users' },
    { value: '50+', label: 'Cities' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const renderValueCard = (value: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.valueCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[value.color, `${value.color}88`]}
        style={styles.valueGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.valueIcon}>
          <Icon name={value.icon as any} size={24} color="#fff" />
        </View>
        <Text style={styles.valueTitle}>{value.title}</Text>
        <Text style={styles.valueDescription}>{value.description}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderTeamMember = (member: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.teamCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Image
        source={{ uri: member.image }}
        style={styles.teamImage}
        defaultSource={require('../../../../assets/images/icon.png')}
      />
      <Text style={styles.teamName}>{member.name}</Text>
      <Text style={styles.teamRole}>{member.role}</Text>
      <Text style={styles.teamBio}>{member.bio}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <Icon name="heart" size={48} color="#fff" />
              <Text style={styles.heroTitle}>Our Story</Text>
              <Text style={styles.heroSubtitle}>
                Connecting people through unforgettable events since 2020
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Mission Section */}
        <Animated.View
          style={[
            styles.missionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Text style={styles.missionText}>
              To democratize event planning by connecting organizers with the best service providers, 
              while making it easier for people to discover and attend amazing events. We believe 
              that great events bring communities together and create lasting memories.
            </Text>
            <View style={styles.missionHighlight}>
              <Icon name="target" size={24} color="#4c4ec7" />
              <Text style={styles.missionHighlightText}>
                Making event planning accessible to everyone
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Our Impact</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Values Section */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valuesGrid}>
            {values.map((value, index) => renderValueCard(value, index))}
          </View>
        </View>

        {/* Story Section */}
        <Animated.View
          style={[
            styles.storySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Our Journey</Text>
          <View style={styles.storyCard}>
            <View style={styles.storyContent}>
              <Text style={styles.storyText}>
                Founded in 2020 during a time when connecting became more important than ever, 
                our platform was born from the simple idea that great events shouldn't be limited 
                by geography or resources.
              </Text>
              <Text style={styles.storyText}>
                What started as a small team of event enthusiasts has grown into a thriving 
                community of organizers, service providers, and event-goers from around the world.
              </Text>
              <Text style={styles.storyText}>
                Today, we're proud to be the go-to platform for everything from intimate gatherings 
                to large-scale conferences, helping create memories that last a lifetime.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Team Section */}
        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>Meet Our Team</Text>
          <View style={styles.teamGrid}>
            {team.map((member, index) => renderTeamMember(member, index))}
          </View>
        </View>

        {/* Vision Section */}
        <Animated.View
          style={[
            styles.visionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#4c4ec7', '#6c5ce7']}
            style={styles.visionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="eye" size={40} color="#fff" />
            <Text style={styles.visionTitle}>Our Vision</Text>
            <Text style={styles.visionSubtitle}>
              To be the world's most trusted platform for event discovery and planning, 
              fostering connections and creating communities everywhere.
            </Text>
            <TouchableOpacity style={styles.visionButton}>
              <Text style={styles.visionButtonText}>Join Our Mission</Text>
              <Icon name="arrow-right" size={16} color="#4c4ec7" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Contact Section */}
        <Animated.View
          style={[
            styles.contactSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Get In Touch</Text>
          <View style={styles.contactGrid}>
            {[
              { icon: 'mail', title: 'Email Us', value: 'hello@eventapp.com' },
              { icon: 'phone', title: 'Call Us', value: '+1 (555) 123-4567' },
              { icon: 'map-pin', title: 'Visit Us', value: 'San Francisco, CA' },
              { icon: 'globe', title: 'Website', value: 'www.eventapp.com' },
            ].map((contact, index) => (
              <TouchableOpacity key={index} style={styles.contactCard}>
                <View style={styles.contactIcon}>
                  <Icon name={contact.icon as any} size={20} color="#4c4ec7" />
                </View>
                <Text style={styles.contactTitle}>{contact.title}</Text>
                <Text style={styles.contactValue}>{contact.value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 15,
  },
  headerSpacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 30,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  missionSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  missionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 26,
    marginBottom: 20,
  },
  missionHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4c4ec7',
  },
  missionHighlightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c4ec7',
    marginLeft: 12,
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '23%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4c4ec7',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  valuesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueCard: {
    width: '48%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  valueGradient: {
    padding: 20,
    alignItems: 'center',
  },
  valueIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 18,
  },
  storySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  storyContent: {
    gap: 15,
  },
  storyText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 26,
  },
  teamSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  teamImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  teamRole: {
    fontSize: 14,
    color: '#4c4ec7',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  teamBio: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  visionSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  visionGradient: {
    padding: 30,
    alignItems: 'center',
  },
  visionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  visionSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 25,
    lineHeight: 24,
  },
  visionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  visionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4c4ec7',
    marginRight: 8,
  },
  contactSection: {
    paddingHorizontal: 20,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  contactIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  contactValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default AboutUs;
