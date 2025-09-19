import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useMarketplaceStore } from '../stores/useMarketplaceStore';

export default function HomeScreen() {
  const { services } = useMarketplaceStore();

  const topRatedServices = services
    .filter((service) => service.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating);

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Top Rated Services</Text>
      <FlatList
        data={topRatedServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>
              {item.name} ⭐ {item.rating}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
