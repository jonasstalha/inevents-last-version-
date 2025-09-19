
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { fetchAllServices } from '../src/firebase/clientTicketsService';
import type { Gig } from '../src/models/types';

const cardGradients = [
  ['#4f46e5', '#818cf8'],
  ['#059669', '#10b981'],
  ['#d946ef', '#f472b6'],
  ['#0ea5e9', '#38bdf8'],
  ['#f59e0b', '#fbbf24'],
];

const MarketplacePage = () => {
  const [services, setServices] = useState<Gig[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchAllServices().then((data) => {
      setServices(Array.isArray(data) ? data as Gig[] : []);
    });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Marketplace</Text>
      <Text style={styles.subtitle}>Discover top-rated services for your events</Text>
      <View style={styles.cardsContainer}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={service.id}
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => router.push({ pathname: '/(client)/(hidden)/gig/[gigId]', params: { gigId: service.id.toString() } })}
          >
            <View style={[styles.cardImage, { backgroundColor: cardGradients[index % cardGradients.length][0] }]}> 
              {service.image && typeof service.image === 'string' && service.image.startsWith('http') ? (
                <Animated.Image
                  source={{ uri: service.image }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => {}}
                />
              ) : (
                <View style={styles.iconContainer}>
                  <Icon name="package" size={54} color="#ffffff" />
                </View>
              )}
              <View style={styles.cardOverlay} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{service.type === 'service' ? 'Available' : service.type}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{service.title}</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>{service.category}</Text>
              <View style={styles.cardStats}>
                <Icon name="star" size={15} color="#f59e0b" style={{ marginRight: 3 }} />
                <Text style={styles.cardRating}>{service.rating}</Text>
                <Text style={styles.cardOrders}>{service.ordersCount ?? 0}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{service.basePrice} MAD</Text>
                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f3f4f6', flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 18 },
  cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    marginBottom: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76,70,229,0.07)',
  },
  cardImage: { position: 'relative', width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  iconContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
  },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardContent: { padding: 14 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 2, color: '#1e293b' },
  cardLocation: { color: '#64748b', fontSize: 13, marginBottom: 6 },
  cardStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardRating: { color: '#f59e0b', fontWeight: 'bold', fontSize: 14 },
  cardOrders: { color: '#64748b', fontSize: 12, marginLeft: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { color: '#10b981', fontWeight: 'bold', fontSize: 16 },
  viewButton: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  viewButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default MarketplacePage;
