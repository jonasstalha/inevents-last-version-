import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { addServiceToFirebase } from '../../src/firebase/artistsService';
import { ServiceData } from '../../src/firebase/firebaseTypes';

// Define a simpler service type for this component
interface SimpleService {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  city: string;
}

const MarketplacePage = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<SimpleService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  // Fetch services on component mount
  useEffect(() => {
    fetchArtistServices();
  }, []);

  const fetchArtistServices = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you'd fetch from Firestore here
      // For now, we'll just use sample data
      const sampleServices: SimpleService[] = [
        { id: '1', title: 'Music Performance', price: 200, category: 'Music', city: 'New York' },
        { id: '2', title: 'Art Workshop', price: 150, category: 'Visual Arts', city: 'Chicago' },
      ];
      setServices(sampleServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!user) return;
    
    if (!title || !description || !price || !category || !city) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newService: ServiceData = {
        title,
        description,
        price: parseFloat(price),
        category,
        city,
        items: [],
        createdAt: new Date(),
      };
      
      const result = await addServiceToFirebase(user.id, newService);
      console.log('Service added:', result);
      
      // Add to local state
      const newLocalService: SimpleService = {
        id: Math.random().toString(),
        title,
        description,
        price: parseFloat(price),
        category,
        city,
      };
      setServices([...services, newLocalService]);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setCity('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding service:', err);
      setError('Failed to add service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceItem = ({ item }: { item: SimpleService }) => (
    <View style={styles.serviceItem}>
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <View style={styles.serviceDetails}>
        <Text style={styles.servicePrice}>${item.price}</Text>
        <Text style={styles.serviceCategory}>{item.category}</Text>
      </View>
      <Text style={styles.serviceCity}>{item.city}</Text>
    </View>
  );

  const renderAddServiceForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Add New Service</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Service Title"
        value={title}
        onChangeText={setTitle}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Category (Music, Art, etc.)"
        value={category}
        onChangeText={setCategory}
      />
      
      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => setShowAddForm(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.addButton]}
          onPress={handleAddService}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'Add Service'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Services</Text>
        
        {!showAddForm && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Service</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showAddForm ? (
        renderAddServiceForm()
      ) : (
        <>
          {loading && <ActivityIndicator size="large" color="#6a0dad" style={styles.loader} />}
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          {services.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>You haven't added any services yet.</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.buttonText}>Add Your First Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={renderServiceItem}
              contentContainerStyle={styles.list}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6a0dad',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8e24aa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  serviceItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  serviceCategory: {
    fontSize: 14,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  serviceCity: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#6a0dad',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#9e9e9e',
  },
  errorText: {
    color: 'red',
    marginVertical: 8,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
});

export default MarketplacePage;
