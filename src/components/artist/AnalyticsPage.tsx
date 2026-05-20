import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toTimestampString } from '@/src/utils/timestampUtils';

const db = getFirestore();

interface AnalyticsPageProps {
  gigs: any[];
}

interface FirebaseOrder {
  id: string;
  price: number;
  date: any;
  customerId: string;
  artistId: string;
  rating?: number;
  gigId?: string;
  gigTitle?: string;
  gigImages?: string[];
  status: string;
  type: 'service' | 'ticket';
  service?: string;
  ticketType?: string;
  quantity?: number;
  clientName?: string;
}

interface FirebaseService {
  id: string;
  title: string;
  price?: number;
  basePrice: number;
  date?: any;
  createdAt: any;
  artistId: string;
  rating?: number;
  images?: string[];
  cover?: string;
  category: string;
  orders?: FirebaseOrder[];
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ gigs }) => {
  const insets = useSafeAreaInsets();
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'services' | 'tickets'>('all');
  const [showDetails, setShowDetails] = useState(false);
  
  // State for real Firebase data
  const [firebaseOrders, setFirebaseOrders] = useState<FirebaseOrder[]>([]);
  const [firebaseServices, setFirebaseServices] = useState<FirebaseService[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentArtistId, setCurrentArtistId] = useState<string>('');

  // Get current artist ID
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setCurrentArtistId(user.uid);
    }
  }, []);

  // Fetch real analytics data from Firestore
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!currentArtistId) return;
      
      setLoading(true);
      try {
        // Fetch orders for current artist
        const ordersQuery = query(
          collection(db, "orders"), 
          where("artistId", "==", currentArtistId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        // Fetch services for current artist
        const servicesQuery = query(
          collection(db, "services"), 
          where("artistId", "==", currentArtistId)
        );
        const servicesSnapshot = await getDocs(servicesQuery);

        const orders = ordersSnapshot.docs.map(doc => {
          const rawCreatedAt = doc.data().createdAt;
          return {
            id: doc.id,
            ...doc.data(),
            price: doc.data().price || doc.data().basePrice || 0,
            date: toTimestampString(doc.data().date) || toTimestampString(rawCreatedAt) || new Date().toISOString(),
            customerId: doc.data().customerId || doc.data().clientId || "Unknown",
            rating: doc.data().rating || null,
            gigId: doc.data().gigId || doc.data().serviceId || doc.id,
            gigTitle: doc.data().gigTitle || doc.data().title || doc.data().service || "Untitled",
            gigImages: doc.data().gigImages || doc.data().images || [],
            type: doc.data().type || 'service',
            status: doc.data().status || 'pending',
            clientName: doc.data().clientName || 'Unknown Client',
          };
        }) as FirebaseOrder[];

        const services = servicesSnapshot.docs.map(doc => {
          const rawCreatedAt = doc.data().createdAt;
          return {
            id: doc.id,
            ...doc.data(),
            basePrice: doc.data().basePrice || doc.data().price || 0,
            createdAt: toTimestampString(rawCreatedAt) || new Date().toISOString(),
            rating: doc.data().rating || 0,
            images: doc.data().images || [],
          };
        }) as FirebaseService[];

        setFirebaseOrders(orders);
        setFirebaseServices(services);
        
        console.log("Fetched Orders:", orders);
        console.log("Fetched Services:", services);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [currentArtistId]);

  // Analytics calculations using real Firebase data
  const filteredOrders = firebaseOrders.filter(order => {
    if (analyticsFilter === 'all') return true;
    if (analyticsFilter === 'services') return order.type === 'service';
    if (analyticsFilter === 'tickets') return order.type === 'ticket';
    return true;
  });

  const filteredServices = firebaseServices.filter(service => {
    if (analyticsFilter === 'all') return true;
    if (analyticsFilter === 'services') return service.category?.toLowerCase() !== 'ticket';
    if (analyticsFilter === 'tickets') return service.category?.toLowerCase() === 'ticket';
    return true;
  });

  // Calculate analytics metrics from real data
  const totalSales = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.price || 0), 0);
  const activeCustomers = Array.from(new Set(filteredOrders.map(order => order.customerId))).length;
  
  // Average rating from services
  const serviceRatings = filteredServices.filter(service => service.rating && service.rating > 0);
  const avgRating = serviceRatings.length > 0 
    ? (serviceRatings.reduce((sum, service) => sum + (service.rating || 0), 0) / serviceRatings.length).toFixed(1)
    : 'N/A';
  
  // Conversion rate (orders vs services)
  const conversionRate = filteredServices.length > 0 
    ? ((filteredOrders.length / filteredServices.length) * 100).toFixed(1) + '%' 
    : '0%';
  
  // Average order value
  const avgOrderValue = filteredOrders.length > 0 
    ? (totalRevenue / filteredOrders.length).toFixed(2) 
    : '0.00';

  // Revenue trend (last 6 months) using real Firebase data
  const now = new Date();
  const months = Array.from({length: 6}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return d;
  });
  
  const revenueByMonth = months.map(month => {
    const monthOrders = filteredOrders.filter(order => {
      if (!order.date) return false;
      const orderDate = order.date.toDate ? order.date.toDate() : new Date(order.date);
      return orderDate.getFullYear() === month.getFullYear() && orderDate.getMonth() === month.getMonth();
    });
    return monthOrders.reduce((sum, order) => sum + (order.price || 0), 0);
  });

  // Most popular service/ticket from real data
  const serviceSales: Record<string, number> = {};
  const ticketSales: Record<string, number> = {};
  
  filteredOrders.forEach(order => {
    if (order.type === 'service' && order.service) {
      serviceSales[order.service] = (serviceSales[order.service] || 0) + 1;
    } else if (order.type === 'ticket' && order.ticketType) {
      ticketSales[order.ticketType] = (ticketSales[order.ticketType] || 0) + (order.quantity || 1);
    }
  });
  
  const mostPopularService = Object.entries(serviceSales).sort((a, b) => b[1] - a[1])[0];
  const mostPopularTicket = Object.entries(ticketSales).sort((a, b) => b[1] - a[1])[0];

  // Recent orders (last 3) from real data
  const recentOrders = filteredOrders
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  // Popular events (top service by orders) from real data
  const serviceOrderCounts = filteredServices.map(service => {
    const serviceOrders = filteredOrders.filter(order => 
      order.gigId === service.id || order.gigTitle === service.title
    );
    return {
      service,
      sales: serviceOrders.length,
      revenue: serviceOrders.reduce((sum, order) => sum + (order.price || 0), 0)
    };
  }).sort((a, b) => b.sales - a.sales);
  
  const popularEvent = serviceOrderCounts[0];

  // Loading state
  if (loading) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          <Text style={{ fontSize: 18, color: '#666' }}>Loading analytics data...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}> 
      {/* Filter Options */}
      <View style={{flexDirection:'row',justifyContent:'center',marginBottom:18}}>
        {['all','services','tickets'].map(opt => (
          <TouchableOpacity
            key={opt}
            style={{
              backgroundColor: analyticsFilter === opt ? '#6a0dad' : '#fff',
              paddingVertical:10,paddingHorizontal:22,borderRadius:22,marginHorizontal:6,
              borderWidth:1,
              borderColor: analyticsFilter === opt ? '#6a0dad' : '#e0e0e0',
              shadowColor: analyticsFilter === opt ? '#6a0dad' : '#000',
              shadowOpacity: analyticsFilter === opt ? 0.15 : 0.05,
              shadowRadius: 4,
              elevation: analyticsFilter === opt ? 3 : 1,
            }}
            onPress={() => setAnalyticsFilter(opt as any)}
            activeOpacity={0.85}
          >
            <Text style={{color: analyticsFilter === opt ? 'white' : '#6a0dad',fontWeight:'bold',fontSize:15}}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Overview Stats */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 18,
      }}>
        {/* Stat boxes with real data */}
        <View style={[styles.statCard, {alignItems:'center',backgroundColor:'#fff',borderRadius:16,margin:8,minWidth:'44%',maxWidth:'44%',flexBasis:'44%',elevation:2,shadowColor:'#6a0dad',shadowOpacity:0.08,shadowRadius:8}]}> 
          <View style={styles.statIconContainer}><Ionicons name="ticket" size={24} color="#6a0dad" /></View>
          <Text style={styles.statNumber}>{totalSales}</Text>
          <Text style={styles.statLabel}>{`Total ${analyticsFilter === 'services' ? 'Services' : analyticsFilter === 'tickets' ? 'Tickets' : 'Sales'}`}</Text>
        </View>
        <View style={[styles.statCard, {alignItems:'center',backgroundColor:'#fff',borderRadius:16,margin:8,minWidth:'44%',maxWidth:'44%',flexBasis:'44%',elevation:2,shadowColor:'#6a0dad',shadowOpacity:0.08,shadowRadius:8}]}> 
          <View style={styles.statIconContainer}><Ionicons name="cash" size={24} color="#4CAF50" /></View>
          <Text style={styles.statNumber}>{`$${totalRevenue}`}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.statCard, {alignItems:'center',backgroundColor:'#fff',borderRadius:16,margin:8,minWidth:'44%',maxWidth:'44%',flexBasis:'44%',elevation:2,shadowColor:'#6a0dad',shadowOpacity:0.08,shadowRadius:8}]}> 
          <View style={styles.statIconContainer}><Ionicons name="people" size={24} color="#2196F3" /></View>
          <Text style={styles.statNumber}>{activeCustomers}</Text>
          <Text style={styles.statLabel}>Active Customers</Text>
        </View>
        <View style={[styles.statCard, {alignItems:'center',backgroundColor:'#fff',borderRadius:16,margin:8,minWidth:'44%',maxWidth:'44%',flexBasis:'44%',elevation:2,shadowColor:'#6a0dad',shadowOpacity:0.08,shadowRadius:8}]}> 
          <View style={styles.statIconContainer}><Ionicons name="star" size={24} color="#FFC107" /></View>
          <Text style={styles.statNumber}>{avgRating}</Text>
          <Text style={styles.statLabel}>Average Rating</Text>
        </View>
        <View style={[styles.statCard, {alignItems:'center',backgroundColor:'#fff',borderRadius:16,margin:8,minWidth:'44%',maxWidth:'44%',flexBasis:'44%',elevation:2,shadowColor:'#6a0dad',shadowOpacity:0.08,shadowRadius:8}]}> 
          <View style={styles.statIconContainer}><Ionicons name="trending-up" size={24} color="#00b894" /></View>
          <Text style={styles.statNumber}>{conversionRate}</Text>
          <Text style={styles.statLabel}>Conversion Rate</Text>
        </View>
        <View style={[styles.statCard, {alignItems:'center',backgroundColor:'#fff',borderRadius:16,margin:8,minWidth:'44%',maxWidth:'44%',flexBasis:'44%',elevation:2,shadowColor:'#6a0dad',shadowOpacity:0.08,shadowRadius:8}]}> 
          <View style={styles.statIconContainer}><Ionicons name="pricetag" size={24} color="#fdcb6e" /></View>
          <Text style={styles.statNumber}>{`$${avgOrderValue}`}</Text>
          <Text style={styles.statLabel}>Avg. Order Value</Text>
        </View>
      </View>
      <View style={{height:1,backgroundColor:'#eee',marginVertical:10}} />
      
      {/* Revenue Trend Chart */}
      <View style={[styles.sectionCard, {marginBottom:18, shadowColor:'#6a0dad', shadowOpacity:0.08, shadowRadius:8, elevation:2}]}> 
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <Text style={[styles.sectionTitle, {fontSize:17}]}>Revenue Trend (Last 6 Months)</Text>
          <TouchableOpacity onPress={()=>setShowDetails(v=>!v)}>
            <Text style={{color:'#6a0dad',fontWeight:'bold',fontSize:14}}>{showDetails ? 'Hide Details' : 'Show Details'}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.chartContainer, {paddingVertical:8}]}> 
          {revenueByMonth.map((h, i) => (
            <View key={i} style={[styles.chartBar, {marginHorizontal:4}]}> 
              <View style={{
                height: `${h / Math.max(...revenueByMonth, 1) * 100}%`,
                backgroundColor: i === revenueByMonth.length - 1 ? '#00b894' : '#6a0dad',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                shadowColor: '#6a0dad',
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
                width: 22,
                alignSelf:'center',
              }} />
              <Text style={[styles.chartLabel, {fontSize:12,marginTop:4}]}>{months[i].toLocaleString('default', { month: 'short' })}</Text>
            </View>
          ))}
        </View>
        {showDetails && (
          <View style={{marginTop:12}}>
            <Text style={{color:'#888',fontSize:13,marginBottom:2}}>Highest: ${Math.max(...revenueByMonth)} • Lowest: ${Math.min(...revenueByMonth)}</Text>
            <Text style={{color:'#888',fontSize:13}}>Growth: {revenueByMonth[0] ? `+${(((revenueByMonth[revenueByMonth.length-1] - revenueByMonth[0]) / revenueByMonth[0]) * 100).toFixed(1)}%` : 'N/A'} since {months[0].toLocaleString('default', { month: 'short' })}</Text>
          </View>
        )}
      </View>
      <View style={{height:1,backgroundColor:'#eee',marginVertical:10}} />

      <View style={{height:1,backgroundColor:'#eee',marginVertical:10}} />

      <View style={{height:1,backgroundColor:'#eee',marginVertical:10}} />
      
      {/* Popular Events */}
      <View style={[styles.sectionCard, {marginBottom:24, shadowColor:'#6a0dad', shadowOpacity:0.08, shadowRadius:8, elevation:2}]}> 
        <Text style={[styles.sectionTitle, {fontSize:17,marginBottom:8}]}>Popular Services</Text>
        {popularEvent && popularEvent.service ? (
          <View style={styles.popularEventCard}>
            <Image 
              source={{ 
                uri: popularEvent.service.cover
                  ? popularEvent.service.cover
                  : popularEvent.service.images && popularEvent.service.images[0] 
                  ? popularEvent.service.images[0] 
                  : 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3' 
              }}
              style={styles.popularEventImage}
            />
            <View style={styles.popularEventInfo}>
              <Text style={[styles.popularEventTitle, {fontSize:15}]}>{popularEvent.service.title}</Text>
              <Text style={[styles.popularEventStats, {fontSize:13}]}>
                {popularEvent.sales} orders • ${popularEvent.revenue} revenue
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 14 }}>No services data available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  statCard: {
    padding: 16,
    marginBottom: 8,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartLabel: {
    color: '#666',
    textAlign: 'center',
  },
  popularEventCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  popularEventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  popularEventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  popularEventTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  popularEventStats: {
    color: '#666',
  },
});

export default AnalyticsPage;
