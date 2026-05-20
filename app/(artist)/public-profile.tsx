
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchServicesByArtistId } from '../../src/firebase/artistServices';
import { fetchArtistById } from '../../src/firebase/artistsService';


const PublicProfile = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfileAndServices = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      // Determine which artist ID to fetch
      const targetArtistId = params.id ? params.id as string : currentUser?.uid;
      
      if (!targetArtistId) {
        setLoading(false);
        return;
      }

      // Check if this is the current user's own profile
      const isOwn = !!(currentUser && currentUser.uid === targetArtistId);
      setIsOwnProfile(isOwn);
      
      setLoading(true);
      try {
        const artist = await fetchArtistById(targetArtistId);
        if (artist) {
          setArtistProfile({
            name: artist.name,
            avatar: artist.profileImage || 'https://ui-avatars.com/api/?name=Artist',
            description: artist.bio || '',
            rating: artist.rating || 0,
          });
          const gigs = await fetchServicesByArtistId(targetArtistId);
          setServices(gigs);
        }
      } catch (e) {
        console.error('Error fetching artist profile:', e);
        // fallback: keep null
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndServices();
  }, [params.id]);

  // Service management functions
  const handleEditService = (serviceId: string) => {
    // Navigate to artist dashboard with editing parameters
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { 
        tab: 'ticket',
        editMode: 'true',
        serviceId: serviceId 
      }
    });
  };

  const handleViewServiceStats = (serviceId: string) => {
    // Navigate to analytics tab with specific service
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { 
        tab: 'analytics',
        serviceId: serviceId 
      }
    });
  };

  const handleCreateNewService = () => {
    // Navigate to service creation (Add tab)
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { tab: 'ticket' }
    });
  };

  const handleManageAllServices = () => {
    // Navigate to orders/services management tab
    router.push({
      pathname: '/(artist)/ArtistPlatform',
      params: { tab: 'calendar' }
    });
  };


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
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                <Text style={{fontWeight:'bold', fontSize:18, color:'#6a0dad'}}>
                  {isOwnProfile ? 'My Published Services' : 'Published Services'}
                </Text>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={{
                      backgroundColor:'#6a0dad',
                      paddingVertical:8,
                      paddingHorizontal:12,
                      borderRadius:6,
                      flexDirection:'row',
                      alignItems:'center'
                    }}
                    onPress={handleManageAllServices}
                  >
                    <Ionicons name="settings-outline" size={16} color="#fff" style={{marginRight:4}} />
                    <Text style={{color:'#fff', fontWeight:'bold', fontSize:12}}>Manage All</Text>
                  </TouchableOpacity>
                )}
              </View>
              {services.length === 0 ? (
                <View style={{alignItems:'center', padding:20, backgroundColor:'#f8f9fa', borderRadius:12, borderStyle:'dashed', borderWidth:2, borderColor:'#ddd'}}>
                  <Ionicons name="add-circle-outline" size={48} color="#ccc" style={{marginBottom:8}} />
                  <Text style={{color:'#888', fontStyle:'italic', marginBottom:8}}>
                    {isOwnProfile ? 'No services published yet.' : 'This artist has no published services yet.'}
                  </Text>
                  {isOwnProfile && (
                    <TouchableOpacity 
                      style={{
                        backgroundColor:'#6a0dad',
                        paddingVertical:10,
                        paddingHorizontal:16,
                        borderRadius:8
                      }}
                      onPress={handleCreateNewService}
                    >
                      <Text style={{color:'#fff', fontWeight:'bold'}}>Create Your First Service</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                services.map((service, idx) => (
                  <View key={service.id || idx} style={{backgroundColor:'#fff', borderRadius:12, marginBottom:16, padding:14, shadowColor:'#6a0dad', shadowOpacity:0.06, shadowRadius:6, elevation:1}}>
                    {/* Service Header with Status */}
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                      <View style={{flex:1}}>
                        <Text style={{fontWeight:'bold', fontSize:16, color:'#222'}}>{service.title}</Text>
                        <Text style={{color:'#666', marginBottom:4}}>{service.category}</Text>
                      </View>
                      <View style={{
                        backgroundColor:'#e8f5e8', 
                        paddingHorizontal:8, 
                        paddingVertical:4, 
                        borderRadius:12,
                        flexDirection:'row',
                        alignItems:'center'
                      }}>
                        <View style={{width:6, height:6, backgroundColor:'#4caf50', borderRadius:3, marginRight:4}} />
                        <Text style={{color:'#4caf50', fontSize:12, fontWeight:'bold'}}>Active</Text>
                      </View>
                    </View>
                    
                    <Text style={{color:'#444', marginBottom:8}}>{service.description}</Text>
                    {service.basePrice && (
                      <Text style={{color:'#6a0dad', fontWeight:'bold', marginBottom:8}}>
                        Starting at ${service.basePrice}
                      </Text>
                    )}
                    
                    {/* Service Stats */}
                    <View style={{flexDirection:'row', marginBottom:8}}>
                      <View style={{flexDirection:'row', alignItems:'center', marginRight:16}}>
                        <Ionicons name="star" size={16} color="#ffc107" />
                        <Text style={{color:'#666', fontSize:12, marginLeft:4}}>
                          {service.rating || 'No rating'}
                        </Text>
                      </View>
                      <View style={{flexDirection:'row', alignItems:'center'}}>
                        <Ionicons name="eye" size={16} color="#999" />
                        <Text style={{color:'#666', fontSize:12, marginLeft:4}}>
                          {service.reviewCount || 0} orders
                        </Text>
                      </View>
                    </View>
                    
                    {(service.cover || (service.images && service.images.length > 0)) && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:4, marginBottom:12}}>
                        {service.cover ? (
                          <Image source={{ uri: service.cover }} style={{width:60, height:60, borderRadius:8, marginRight:8}} />
                        ) : (
                          service.images.map((img: string, i: number) => (
                            <Image key={i} source={{ uri: img }} style={{width:60, height:60, borderRadius:8, marginRight:8}} />
                          ))
                        )}
                      </ScrollView>
                    )}
                    
                    {/* Service Management Buttons - Only show for own profile */}
                    {isOwnProfile && (
                      <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:12}}>
                        <TouchableOpacity 
                          style={{
                            flex:1, 
                            backgroundColor:'#6a0dad', 
                            paddingVertical:10, 
                            paddingHorizontal:16, 
                            borderRadius:8, 
                            marginRight:8,
                            alignItems:'center'
                          }}
                          onPress={() => handleEditService(service.id)}
                        >
                          <Text style={{color:'#fff', fontWeight:'bold', fontSize:14}}>
                            <Ionicons name="create-outline" size={16} color="#fff" /> Edit Service
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={{
                            flex:1, 
                            backgroundColor:'#f8f9fa', 
                            borderWidth:1,
                            borderColor:'#6a0dad',
                            paddingVertical:10, 
                            paddingHorizontal:16, 
                            borderRadius:8, 
                            marginLeft:8,
                            alignItems:'center'
                          }}
                          onPress={() => handleViewServiceStats(service.id)}
                        >
                          <Text style={{color:'#6a0dad', fontWeight:'bold', fontSize:14}}>
                            <Ionicons name="analytics-outline" size={16} color="#6a0dad" /> View Stats
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Contact/Hire Buttons - Only show for other artists' profiles */}
                    {!isOwnProfile && (
                      <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:12}}>

                        
                        <TouchableOpacity 
                          style={{
                            flex:1, 
                            backgroundColor:'#f8f9fa', 
                            borderWidth:1,
                            borderColor:'#6a0dad',
                            paddingVertical:12, 
                            paddingHorizontal:16, 
                            borderRadius:8, 
                            marginLeft:8,
                            alignItems:'center'
                          }}
                          onPress={() => {
                            // Navigate to service details/booking
                            router.push(`/(client)/(hidden)/gig/${service.id}`);
                          }}
                        >
                          <Text style={{color:'#6a0dad', fontWeight:'bold', fontSize:14}}>
                            <Ionicons name="eye-outline" size={16} color="#6a0dad" /> View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
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
      
      {/* Floating Action Button for Quick Service Creation - Only show for own profile */}
      {isOwnProfile && (
        <TouchableOpacity 
          style={{
            position:'absolute',
            bottom:30,
            right:20,
            backgroundColor:'#6a0dad',
            width:56,
            height:56,
            borderRadius:28,
            justifyContent:'center',
            alignItems:'center',
            shadowColor:'#6a0dad',
            shadowOpacity:0.3,
            shadowRadius:8,
            elevation:8
          }}
          onPress={handleCreateNewService}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}


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
