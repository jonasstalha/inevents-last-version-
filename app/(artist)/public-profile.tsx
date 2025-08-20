
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../../src/firebase/artistServices';
import { fetchArtistById } from '../../src/firebase/artistsService';


const PublicProfile = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndServices = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      setLoading(true);
      try {
        const artist = await fetchArtistById(user.uid);
        if (artist) {
          setArtistProfile({
            name: artist.name,
            avatar: artist.profileImage || 'https://ui-avatars.com/api/?name=Artist',
            description: artist.bio || '',
            rating: artist.rating || 0,
          });
          const gigs = await fetchServicesByArtistId(user.uid);
          setServices(gigs);
        }
      } catch (e) {
        // fallback: keep null
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndServices();
  }, []);


  // TODO: Optionally fetch and show real gigs/services for this artist
  // For now, only show profile info and rating

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8ff' }}>
      {/* Back Button */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: 12, zIndex: 10 }}>
        <Ionicons
          name="arrow-back"
          size={28}
          color="#6a0dad"
          onPress={() => router.back()}
          style={{ backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#6a0dad" style={{ marginTop: 60 }} />
        ) : artistProfile ? (
          <>
            {/* Avatar, Name, Description */}
            <View style={[styles.profileHeader, { backgroundColor: '#fff', borderRadius: 18, marginTop: 40, marginHorizontal: 12, paddingVertical: 18, shadowColor: '#6a0dad', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }]}> 
              <View style={{alignItems:'center', marginBottom:8}}>
                <View style={{borderWidth:3, borderColor:'#fff', borderRadius:50, overflow:'hidden', shadowColor:'#6a0dad', shadowOpacity:0.15, shadowRadius:8, elevation:3}}>
                  <Image source={{ uri: artistProfile.avatar }} style={{width:90, height:90, borderRadius:45, backgroundColor:'#eee'}} />
                </View>
              </View>
              <Text style={styles.name}>{artistProfile.name}</Text>
              <Text style={styles.description}>{artistProfile.description}</Text>
              {/* Rating */}
              <View style={{marginTop:10, alignItems:'center'}}>
                <View style={{flexDirection:'row', alignItems:'center', marginTop:6}}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Text key={i} style={{fontSize:18, color:'#FFD700', marginRight:2}}>
                      {artistProfile.rating >= i + 1
                        ? '★'
                        : artistProfile.rating >= i + 0.5
                        ? '⯨'
                        : '☆'}
                    </Text>
                  ))}
                  <Text style={{color:'#888', fontWeight:'bold', fontSize:14, marginLeft:6}}>
                    {artistProfile.rating?.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
            {/* Real Services */}
            <View style={{marginTop:24, marginHorizontal:12}}>
              <Text style={{fontWeight:'bold', fontSize:18, marginBottom:10, color:'#6a0dad'}}>My Published Services</Text>
              {services.length === 0 ? (
                <Text style={{color:'#bbb', fontStyle:'italic'}}>No services published yet.</Text>
              ) : (
                services.map((service, idx) => (
                  <View key={service.id || idx} style={{backgroundColor:'#fff', borderRadius:12, marginBottom:16, padding:14, shadowColor:'#6a0dad', shadowOpacity:0.06, shadowRadius:6, elevation:1}}>
                    <Text style={{fontWeight:'bold', fontSize:16, color:'#222'}}>{service.title}</Text>
                    <Text style={{color:'#666', marginBottom:6}}>{service.category}</Text>
                    <Text style={{color:'#444', marginBottom:8}}>{service.description}</Text>
                    {service.images && service.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:4}}>
                        {service.images.map((img: string, i: number) => (
                          <Image key={i} source={{ uri: img }} style={{width:60, height:60, borderRadius:8, marginRight:8}} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <Text style={{marginTop:60, textAlign:'center', color:'#888'}}>No profile data found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 8,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#222',
  },
  title: {
    fontSize: 15,
    color: '#6a0dad',
    fontWeight: '600',
    marginTop: 2,
  },
  slogan: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginTop: 6,
    textAlign: 'center',
  },
  categoryBox: {
    backgroundColor: '#f7f3fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#6a0dad',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6a0dad',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 4,
  },
});

export default PublicProfile;
