import React, { useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useMarketplaceStore } from '../../stores/useMarketplaceStore';

const MarketplacePage = () => {
  const { services, setServices } = useMarketplaceStore();

  useEffect(() => {
    const fetchServices = async () => {
      const response = await fetch('https://yourapi.com/services'); // Replace with your real API
      const data = await response.json();
      setServices(data);
    };

    fetchServices();
  }, [setServices]);

  return (
    <FlatList
      data={services}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
        </View>
      )}
    />
  );
};

export default MarketplacePage;
