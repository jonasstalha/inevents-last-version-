import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import {
  Activity,
  ChartBar as BarChart,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  Circle,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  Gift,
  Mail,
  Play,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Theme and firebase helpers
import { Theme } from '../../constants/theme';
import { debugFirebaseConnection } from '../../firebase/debugFirebase';
import { fetchAllServicesFromFirebase } from '../../firebase/fetchAllServices';
import { db, firebaseConfigObject } from '../../firebase/firebaseConfig';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  region?: string;
  revenue?: number;
  [key: string]: any;
};

type Service = {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  creator?: string;
  artistId?: string;
  status?: string;
  price?: number;
  basePrice?: number;
  views?: number;
  purchases?: number;
  createdAt?: Date;
  images?: string[];
  description?: string;
  type?: 'service' | 'ticket' | string;
  [key: string]: any;
};

type Coupon = {
  id?: string;
  name: string;
  code: string;
  discount: number | string;
  type: 'percentage' | 'fixed';
  expirationDate: any;
  usageCount?: number;
  maxUsage?: number;
  status?: 'active' | 'stopped';
  description?: string;
  minOrderAmount?: number;
  scope?: 'all' | 'services' | 'tickets' | 'selected';
  targetType?: 'all' | 'service' | 'ticket';
  targetIds?: string[];
  [key: string]: any;
};

type UserFilters = { role: string; status: string; region: string };
type ServiceFilters = { category: string; status: string; creator: string };

export interface AdminPanelProps {
  initialTab?: 'dashboard' | 'users' | 'services' | 'financial' | 'coupons';
  hideTabBar?: boolean;
}

export default function AdminPanel({ initialTab = 'dashboard', hideTabBar = false }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const [financialLoading, setFinancialLoading] = useState(false);
  const [financePeriod, setFinancePeriod] = useState<'week' | 'month' | 'year'>('month');
  const [serviceOrderCounts, setServiceOrderCounts] = useState<Record<string, number>>({});
  const [financialData, setFinancialData] = useState<any>({
    totalRevenue: 0,
    servicesRevenue: 0,
    ticketsRevenue: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    serviceOrders: 0,
    ticketOrders: 0,
    pendingPayouts: 0,
    topEarners: [],
    revenueData: [],
    periodRevenue: [],
    periodLabels: [],
  });

  const [activeTab, setActiveTab] = useState<'dashboard'|'users'|'services'|'financial'|'coupons'>(initialTab ?? 'dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState<'all' | 'active' | 'stopped' | 'expired'>('all');
  const [userFilters, setUserFilters] = useState<UserFilters>({ role: 'all', status: 'all', region: 'all' });
  const [serviceFilters, setServiceFilters] = useState<ServiceFilters>({ category: 'all', status: 'all', creator: 'all' });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'active',
    region: '',
    revenue: 0,
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBulkNotificationModal, setShowBulkNotificationModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({
    title: '',
    body: '',
    targetGroup: 'all'
  });
  const [newCoupon, setNewCoupon] = useState({
    name: '',
    code: '',
    discount: '',
    type: 'percentage' as 'percentage' | 'fixed',
    expirationDate: '',
    maxUsage: '',
    minOrderAmount: '',
    scope: 'all' as 'all' | 'specific',
    selectedServiceId: '',
    selectedServiceName: '',
  });
  const [couponExpiryDate, setCouponExpiryDate] = useState<Date | null>(null);
  const [showCouponExpiryPicker, setShowCouponExpiryPicker] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingServices = services.filter(s => s.status === 'pending').length;
  const totalRevenue = financialData.totalRevenue;
  const artists = users.filter(u => u?.role === 'artist');
  const gigs = services;
  const orders = financialData.totalOrders || 0;
  const tickets = services.filter(s => s.type === 'ticket');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = (userSearchQuery || '').toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone || '').toString().includes(searchLower);
      const matchesRole = userFilters.role === 'all' || (user?.role === userFilters.role);
      const matchesStatus = userFilters.status === 'all' || user.status === userFilters.status;
      const matchesRegion = userFilters.region === 'all' || user.region === userFilters.region;
      return matchesSearch && matchesRole && matchesStatus && matchesRegion;
    });
  }, [users, userSearchQuery, userFilters]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const searchLower = (serviceSearchQuery || '').toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        (service.name || service.title || '').toLowerCase().includes(searchLower) ||
        (service.category || '').toLowerCase().includes(searchLower) ||
        (service.creator || service.artistId || '').toLowerCase().includes(searchLower);
      const matchesCategory = serviceFilters.category === 'all' || service.category === serviceFilters.category;
      const matchesStatus = serviceFilters.status === 'all' || service.status === serviceFilters.status;
      const matchesCreator = serviceFilters.creator === 'all' || service.creator === serviceFilters.creator;
      return matchesSearch && matchesCategory && matchesStatus && matchesCreator;
    });
  }, [services, serviceSearchQuery, serviceFilters]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      const searchLower = (couponSearchQuery || '').toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        (coupon.name || '').toString().toLowerCase().includes(searchLower) ||
        (coupon.code || '').toString().toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
      const exp = coupon.expirationDate instanceof Date ? coupon.expirationDate : new Date(coupon.expirationDate);
      const isExp = !isNaN(exp.getTime()) && exp < new Date();
      if (couponStatusFilter === 'expired') return isExp;
      if (couponStatusFilter === 'active') return coupon.status === 'active' && !isExp;
      if (couponStatusFilter === 'stopped') return coupon.status === 'stopped';
      return true;
    });
  }, [coupons, couponSearchQuery, couponStatusFilter]);

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const q = query(collection(db, 'coupons'), where('artistId', '==', 'admin'));
      const snapshot = await getDocs(q);
      const fetched: Coupon[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.code || '',
          code: d.code || '',
          discount: d.discountValue || 0,
          type: d.discountType || 'percentage',
          expirationDate: d.expiryDate?.toDate?.() || new Date(d.expiryDate) || new Date(),
          usageCount: d.currentUses || 0,
          maxUsage: d.maxUses || 0,
          status: d.isActive ? 'active' : 'stopped',
          description: d.description || '',
          minOrderAmount: d.minOrderValue || 0,
          scope: d.serviceId === 'all' ? 'all' : 'selected',
          targetType: 'service',
          targetIds: d.serviceId && d.serviceId !== 'all' ? [d.serviceId] : [],
        } as Coupon;
      });
      setCoupons(fetched);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const clearAllFilters = () => {
    setUserSearchQuery('');
    setServiceSearchQuery('');
    setCouponSearchQuery('');
    setUserFilters({ role: 'all', status: 'all', region: 'all' });
    setServiceFilters({ category: 'all', status: 'all', creator: 'all' });
  };

  const updateUserFilter = (key: keyof UserFilters, value: string) => {
    setUserFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateServiceFilter = (key: keyof ServiceFilters, value: string) => {
    setServiceFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUniqueRoles = () => {
    const roles = [...new Set(users.map(user => user?.role).filter(Boolean))] as string[];
    return [{ label: 'All Roles', value: 'all' }, ...roles.map(role => ({ label: role.charAt(0).toUpperCase() + role.slice(1), value: role }))];
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(users.map(user => user.status).filter(Boolean))] as string[];
    return [{ label: 'All Statuses', value: 'all' }, ...statuses.map(status => ({ label: status.charAt(0).toUpperCase() + status.slice(1), value: status }))];
  };

  const getUniqueRegions = () => {
    const regions = [...new Set(users.map(user => user.region))];
    return [{ label: 'All Regions', value: 'all' }, ...regions.map(region => ({ label: region, value: region }))];
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(services.map(service => service.category))];
    return [{ label: 'All Categories', value: 'all' }, ...categories.map(category => ({ label: category, value: category }))];
  };

  const getUniqueCreators = () => {
    const creators = [...new Set(services.map(service => service.creator))];
    return [{ label: 'All Creators', value: 'all' }, ...creators.map(creator => ({ label: creator, value: creator }))];
  };

  const getUniqueServiceStatuses = () => {
    const statuses = [...new Set(services.map(service => service.status).filter(Boolean))] as string[];
    return [{ label: 'All Statuses', value: 'all' }, ...statuses.map(status => ({ label: status.charAt(0).toUpperCase() + status.slice(1), value: status }))];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered');
      await fetchUsers();
      await fetchServicesAndTickets();
      await fetchCoupons();
      await fetchFinancialData();
      // Refresh real order counts
      const ordersRef = collection(db, 'orders');
      const snap = await getDocs(ordersRef);
      const counts: Record<string, number> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        const sid = data.serviceId || data.service_id || '';
        if (sid) counts[sid] = (counts[sid] || 0) + 1;
      });
      setServiceOrderCounts(counts);
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const appConstants: any = Constants;
  const derivedCloudFunctionBaseUrl = `https://us-central1-${firebaseConfigObject.projectId}.cloudfunctions.net`;
  const CLOUD_FUNCTION_BASE_URL =
    appConstants.expoConfig?.extra?.cloudFunctionBaseUrl ||
    appConstants.manifest?.extra?.cloudFunctionBaseUrl ||
    derivedCloudFunctionBaseUrl;

  async function sendEmailToUser(user: User) {
    try {
      const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/sendEmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          name: user.name,
          userId: user.id,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error('Email send error:', errText);
        throw new Error('Failed to send email');
      }
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async function sendNotificationToUser(
    user: User,
    title = 'Admin Notification',
    body = `Hello ${user.name}, you have a new notification from admin.`
  ) {
    try {
      const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/sendNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          email: user.email,
          title,
          body,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error('Notification send error:', errText);
        throw new Error('Failed to send notification');
      }
      return true;
    } catch (error) {
      console.error('Notification send error:', error);
      return false;
    }
  }

  const handleSendEmail = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const ok = await sendEmailToUser(user);
    if (ok) {
      Alert.alert('Success', 'Email sent successfully!');
    } else {
      Alert.alert('Error', 'Failed to send email.');
    }
  };

  const handleSendNotification = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const ok = await sendNotificationToUser(user);
    if (ok) {
      Alert.alert('Success', 'Notification sent successfully!');
    } else {
      Alert.alert('Error', 'Failed to send notification.');
    }
  };

  const sendBulkNotificationToUser = async (user: User, title: string, body: string) => {
    return sendNotificationToUser(user, title, body);
  };

  const handleSendBulkNotification = async () => {
    if (!notificationMessage.title.trim() || !notificationMessage.body.trim()) {
      Alert.alert('Error', 'Please fill in both title and message');
      return;
    }

    let targetUsers: User[] = [];
    switch (notificationMessage.targetGroup) {
      case 'all':
        targetUsers = users;
        break;
      case 'filtered':
        targetUsers = filteredUsers;
        break;
      case 'selected':
        targetUsers = users.filter(user => selectedUsers.includes(user.id));
        break;
    }

    if (targetUsers.length === 0) {
      Alert.alert('Error', 'No users selected');
      return;
    }

    Alert.alert(
      'Confirm Bulk Notification',
      `Send notification to ${targetUsers.length} user(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            let successCount = 0;
            for (const user of targetUsers) {
              const success = await sendBulkNotificationToUser(user, notificationMessage.title, notificationMessage.body);
              if (success) successCount++;
            }
            setShowBulkNotificationModal(false);
            setNotificationMessage({ title: '', body: '', targetGroup: 'all' });
            setSelectedUsers([]);
            setIsSelectMode(false);
            Alert.alert(
              'Notification Results',
              `Successfully sent to ${successCount} out of ${targetUsers.length} users`
            );
          }
        }
      ]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const createTestUser = async () => {
    try {
      const testUser = {
        name: 'Test User',
        email: 'test@inevents.com',
        phone: '+1234567890',
        role: 'client',
        status: 'active',
        signupDate: new Date(),
        lastLogin: new Date(),
        revenue: 0,
        region: 'Test Region',
        createdAt: new Date(),
        isTestUser: true,
      };

      const docRef = await addDoc(collection(db, 'users'), testUser);
      console.log('✅ Test user created with ID:', docRef.id);
      Alert.alert('Success', `Test user created with ID: ${docRef.id}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error creating test user:', error);
      Alert.alert('Error', `Failed to create test user: ${(error as Error).message}`);
    }
  };

  const createTestData = async () => {
    try {
      console.log('=== CREATING TEST DATA ===');
      Alert.alert('Creating Test Data', 'Adding sample services and tickets... Please wait.');

      const testServices = [
        {
          name: 'Photography Service',
          title: 'Professional Event Photography',
          category: 'Photography',
          creator: 'Test Photographer',
          artistId: 'test-photographer-id',
          status: 'pending',
          price: 299,
          basePrice: 299,
          views: 15,
          purchases: 3,
          createdAt: new Date(),
          images: ['https://example.com/photo1.jpg'],
          description: 'Professional photography services for events and occasions.',
          type: 'service',
          isTestData: true,
        },
        {
          name: 'Wedding Planning',
          title: 'Complete Wedding Planning Service',
          category: 'Event Planning',
          creator: 'Test Planner',
          artistId: 'test-planner-id',
          status: 'approved',
          price: 1500,
          basePrice: 1500,
          views: 45,
          purchases: 8,
          createdAt: new Date(),
          images: ['https://example.com/wedding1.jpg'],
          description: 'Full wedding planning service from start to finish.',
          type: 'service',
          isTestData: true,
        },
      ];

      const testTickets = [
        {
          name: 'Music Concert Ticket',
          title: 'Live Music Event Ticket',
          category: 'Entertainment',
          creator: 'Test Organizer',
          artistId: 'test-organizer-id',
          status: 'approved',
          price: 75,
          basePrice: 75,
          views: 120,
          purchases: 25,
          createdAt: new Date(),
          images: ['https://example.com/concert1.jpg'],
          description: 'Ticket for an amazing live music concert.',
          type: 'ticket',
          isTestData: true,
        },
        {
          name: 'Art Exhibition',
          title: 'Modern Art Gallery Exhibition',
          category: 'Art',
          creator: 'Gallery Owner',
          artistId: 'test-gallery-id',
          status: 'pending',
          price: 25,
          basePrice: 25,
          views: 67,
          purchases: 12,
          createdAt: new Date(),
          images: ['https://example.com/art1.jpg'],
          description: 'Entry ticket to modern art exhibition.',
          type: 'ticket',
          isTestData: true,
        },
      ];

      let createdCount = 0;
      for (const service of testServices) {
        try {
          const docRef = await addDoc(collection(db, 'services'), service);
          console.log(`✅ Created test service: ${service.name} with ID: ${docRef.id}`);
          createdCount++;
        } catch (error) {
          console.error(`❌ Failed to create service ${service.name}:`, error);
        }
      }

      for (const ticket of testTickets) {
        try {
          const docRef = await addDoc(collection(db, 'tickets'), ticket);
          console.log(`✅ Created test ticket: ${ticket.name} with ID: ${docRef.id}`);
          createdCount++;
        } catch (error) {
          console.error(`❌ Failed to create ticket ${ticket.name}:`, error);
        }
      }

      console.log(`=== TEST DATA CREATION COMPLETE ===`);
      console.log(`Successfully created ${createdCount} test items`);

      Alert.alert(
        'Test Data Created',
        `✅ Successfully created ${createdCount} test items!

- ${testServices.length} test services (marked as test data)
- ${testTickets.length} test tickets (marked as test data)

These are clearly marked as test data and can be cleaned up later.
Click "Clean Test Data" to remove them when you're ready.`
      );

      await fetchServicesAndTickets();
    } catch (error) {
      console.error('❌ Error creating test data:', error);
      Alert.alert('Error', `Failed to create test data: ${(error as Error).message}`);
    }
  };

  const cleanupTestData = async () => {
    try {
      console.log('=== CLEANING UP TEST DATA ===');
      Alert.alert('Cleaning Test Data', 'Removing all test data... Please wait.');

      let deletedCount = 0;
      const servicesRef = collection(db, 'services');
      const servicesSnapshot = await getDocs(servicesRef);

      for (const doc of servicesSnapshot.docs) {
        const data = doc.data();
        const isTest = data.isTestData ||
          data.creator?.includes('Test') ||
          data.artistId?.includes('test-') ||
          data.name?.includes('Photography Service') ||
          data.name?.includes('Wedding Planning');
        if (isTest) {
          await deleteDoc(doc.ref);
          console.log(`🗑️ Deleted test service: ${data.name}`);
          deletedCount++;
        }
      }

      const ticketsRef = collection(db, 'tickets');
      const ticketsSnapshot = await getDocs(ticketsRef);

      for (const doc of ticketsSnapshot.docs) {
        const data = doc.data();
        const isTest = data.isTestData ||
          data.creator?.includes('Test') ||
          data.creator?.includes('Gallery Owner') ||
          data.artistId?.includes('test-') ||
          data.name?.includes('Music Concert Ticket') ||
          data.name?.includes('Art Exhibition');
        if (isTest) {
          await deleteDoc(doc.ref);
          console.log(`🗑️ Deleted test ticket: ${data.name}`);
          deletedCount++;
        }
      }

      console.log(`=== CLEANUP COMPLETE ===`);
      console.log(`Deleted ${deletedCount} test items`);

      Alert.alert(
        'Test Data Cleaned',
        `🗑️ Successfully removed ${deletedCount} test items!

Your database now only contains real data.
Click "Refresh Services" to see the updated list.`
      );

      await fetchServicesAndTickets();
    } catch (error) {
      console.error('❌ Error cleaning test data:', error);
      Alert.alert('Error', `Failed to clean test data: ${(error as Error).message}`);
    }
  };

  const createTestFinancialData = async () => {
    try {
      console.log('=== CREATING TEST FINANCIAL DATA ===');
      Alert.alert('Creating Test Orders', 'Adding sample orders for financial demonstration... Please wait.');

      const testOrders = [
        {
          clientId: 'client1',
          artistId: 'artist1',
          artistName: 'John Photographer',
          serviceId: 'service1',
          serviceName: 'Event Photography',
          price: 350,
          totalPrice: 350,
          status: 'completed',
          createdAt: new Date(2024, 0, 15),
          orderDate: new Date(2024, 0, 15),
          isTestData: true,
        },
        {
          clientId: 'client2',
          artistId: 'artist2',
          artistName: 'Sarah Event Planner',
          serviceId: 'service2',
          serviceName: 'Wedding Planning',
          price: 1200,
          totalPrice: 1200,
          status: 'completed',
          createdAt: new Date(2024, 1, 20),
          orderDate: new Date(2024, 1, 20),
          isTestData: true,
        },
        {
          clientId: 'client3',
          artistId: 'artist3',
          artistName: 'Mike Designer',
          serviceId: 'service3',
          serviceName: 'Logo Design',
          price: 275,
          totalPrice: 275,
          status: 'completed',
          createdAt: new Date(2024, 6, 10),
          orderDate: new Date(2024, 6, 10),
          isTestData: true,
        },
        {
          clientId: 'client4',
          artistId: 'artist1',
          artistName: 'John Photographer',
          serviceId: 'service4',
          serviceName: 'Portrait Session',
          price: 180,
          totalPrice: 180,
          status: 'completed',
          createdAt: new Date(2024, 6, 22),
          orderDate: new Date(2024, 6, 22),
          isTestData: true,
        },
        {
          clientId: 'client5',
          artistId: 'artist4',
          artistName: 'Lisa Musician',
          serviceId: 'service5',
          serviceName: 'Live Performance',
          price: 450,
          totalPrice: 450,
          status: 'pending_payout',
          createdAt: new Date(2024, 6, 25),
          orderDate: new Date(2024, 6, 25),
          isTestData: true,
        },
      ];

      let createdCount = 0;
      for (const order of testOrders) {
        try {
          const docRef = await addDoc(collection(db, 'orders'), order);
          console.log(`✅ Created test order: ${order.serviceName} - $${order.price}`);
          createdCount++;
        } catch (error) {
          console.error(`❌ Failed to create order:`, error);
        }
      }

      for (const order of testOrders) {
        try {
          const transaction = {
            ...order,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            paymentMethod: 'credit_card',
            currency: 'USD',
            platformFee: order.price * 0.2,
            artistPayout: order.price * 0.8,
          };
          const docRef = await addDoc(collection(db, 'transactions'), transaction);
          console.log(`✅ Created test transaction: ${transaction.transactionId}`);
          createdCount++;
        } catch (error) {
          console.error(`❌ Failed to create transaction:`, error);
        }
      }

      console.log(`=== TEST FINANCIAL DATA CREATION COMPLETE ===`);
      console.log(`Successfully created ${createdCount} financial records`);

      Alert.alert(
        'Test Financial Data Created',
        `✅ Successfully created ${createdCount} financial records!

- ${testOrders.length} orders
- ${testOrders.length} transactions
- Total revenue: $${testOrders.reduce((sum, order) => sum + order.price, 0).toLocaleString()}

Now refresh financial data to see the results.`
      );

      await fetchFinancialData();
    } catch (error) {
      console.error('❌ Error creating test financial data:', error);
      Alert.alert('Error', `Failed to create test financial data: ${(error as Error).message}`);
    }
  };

  const checkRulesDeployment = async () => {
    try {
      console.log('=== CHECKING FIREBASE RULES DEPLOYMENT ===');
      Alert.alert('Checking Rules', 'Testing if Firebase rules have been deployed... Check console for results.');

      const testResults: { collection: string; accessible: boolean; count: number }[] = [];
      const collectionsToTest = ['services', 'tickets', 'users', 'gigs', 'events'];

      for (const collectionName of collectionsToTest) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          testResults.push({ collection: collectionName, accessible: true, count: snapshot.docs.length });
          console.log(`✅ ${collectionName}: ${snapshot.docs.length} documents (accessible)`);
        } catch (error) {
          const errorCode = (error as any).code;
          testResults.push({ collection: collectionName, accessible: false, count: -1 });
          if (errorCode === 'permission-denied') {
            console.log(`❌ ${collectionName}: Permission denied - rules not deployed yet`);
          } else {
            console.log(`❌ ${collectionName}: ${(error as Error).message}`);
          }
        }
      }

      const accessibleCollections = testResults.filter(r => r.accessible);
      const deniedCollections = testResults.filter(r => !r.accessible);

      console.log('=== RULES DEPLOYMENT TEST RESULTS ===');
      console.log(`Accessible collections: ${accessibleCollections.length}/${testResults.length}`);
      console.log(`Permission denied: ${deniedCollections.length}/${testResults.length}`);

      if (deniedCollections.length === 0) {
        Alert.alert(
          '✅ Rules Deployed Successfully!',
          `Firebase rules are working correctly!

All ${accessibleCollections.length} collections are accessible:
${accessibleCollections.map(c => `• ${c.collection}: ${c.count} docs`).join('\n')}

You can now use all Firebase features.`
        );
      } else if (deniedCollections.length === testResults.length) {
        Alert.alert(
          '❌ Rules NOT Deployed Yet',
          `All collections are still blocked by old rules.

❌ Permission denied for:
${deniedCollections.map(c => `• ${c.collection}`).join('\n')}

🔧 ACTION REQUIRED:
1. Go to Firebase Console
2. Update the Firestore rules
3. Click PUBLISH
4. Test again`
        );
      } else {
        Alert.alert(
          '⚠️ Partial Access',
          `Some collections are accessible, others are not.

✅ Accessible:
${accessibleCollections.map(c => `• ${c.collection}: ${c.count} docs`).join('\n')}

❌ Still blocked:
${deniedCollections.map(c => `• ${c.collection}`).join('\n')}

This suggests the rules are partially deployed or cached.`
        );
      }
    } catch (error) {
      console.error('❌ Rules deployment check failed:', error);
      Alert.alert('Check Failed', `Failed to check rules deployment: ${(error as Error).message}`);
    }
  };

  const scanAllCollections = async () => {
    try {
      console.log('=== COMPREHENSIVE FIREBASE DATA SCAN ===');
      Alert.alert('Scanning All Collections', 'Performing deep scan of Firebase to find your data... This may take a moment. Check console for results.');

      const collectionsToCheck = [
        'services', 'tickets', 'gigs', 'events', 'listings', 'marketplace', 'items',
        'Services', 'Tickets', 'Gigs', 'Events', 'Listings', 'Marketplace', 'Items',
        'service', 'ticket', 'gig', 'event', 'listing', 'item',
        'bookings', 'reservations', 'appointments', 'offers', 'deals',
        'products', 'catalog', 'inventory', 'portfolio', 'gallery',
        'posts', 'content', 'data', 'records', 'documents',
        'eventServices', 'eventTickets', 'eventBookings', 'eventListings', 'artistServices', 'artistGigs', 'artistEvents',
        'marketplaceItems', 'marketplaceServices', 'marketplace_items',
        'store', 'shop', 'catalogue', 'offerings',
        'userServices', 'userTickets', 'userGigs', 'userEvents',
        'applications', 'submissions', 'requests', 'orders', 'bookings',
        'advertisements', 'ads', 'promotions', 'campaigns',
      ];

      const collectionsWithData: { name: string; count: number; sampleDoc?: any }[] = [];
      let totalCollectionsChecked = 0;

      for (const collectionName of collectionsToCheck) {
        try {
          totalCollectionsChecked++;
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          if (snapshot.docs.length > 0) {
            const sampleDoc = snapshot.docs[0].data();
            collectionsWithData.push({ name: collectionName, count: snapshot.docs.length, sampleDoc });
            console.log(`✅ FOUND: '${collectionName}' has ${snapshot.docs.length} documents`);
            console.log(`Sample document from '${collectionName}':`, sampleDoc);
            const hasServiceFields = sampleDoc.name || sampleDoc.title || sampleDoc.price || sampleDoc.category;
            const hasTicketFields = sampleDoc.eventName || sampleDoc.ticketPrice || sampleDoc.eventDate;
            if (hasServiceFields || hasTicketFields) {
              console.log(`🎯 POTENTIAL MATCH: '${collectionName}' contains service/ticket-like data!`);
            }
          } else {
            console.log(`⚪ Empty: '${collectionName}' (0 documents)`);
          }
        } catch (error) {
          console.log(`❌ Cannot access '${collectionName}':`, (error as Error).message);
        }
      }

      console.log('\n=== CHECKING USER SUBCOLLECTIONS ===');
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        if (usersSnapshot.docs.length > 0) {
          console.log(`Found ${usersSnapshot.docs.length} users, checking their subcollections...`);
          const usersToCheck = usersSnapshot.docs.slice(0, 3);
          for (const userDoc of usersToCheck) {
            const subcollectionsToCheck = ['services', 'tickets', 'gigs', 'events', 'bookings'];
            for (const subCollectionName of subcollectionsToCheck) {
              try {
                const subCollectionRef = collection(db, 'users', userDoc.id, subCollectionName);
                const subSnapshot = await getDocs(subCollectionRef);
                if (subSnapshot.docs.length > 0) {
                  const subCollectionPath = `users/${userDoc.id}/${subCollectionName}`;
                  collectionsWithData.push({ name: subCollectionPath, count: subSnapshot.docs.length, sampleDoc: subSnapshot.docs[0].data() });
                  console.log(`✅ FOUND SUBCOLLECTION: '${subCollectionPath}' has ${subSnapshot.docs.length} documents`);
                  console.log(`Sample from subcollection:`, subSnapshot.docs[0].data());
                }
              } catch (error) {
                // Silent fail for subcollections
              }
            }
          }
        }
      } catch (error) {
        console.log('Cannot check user subcollections:', (error as Error).message);
      }

      console.log('\n=== SCAN RESULTS SUMMARY ===');
      console.log(`Checked ${totalCollectionsChecked} top-level collections`);
      console.log(`Found ${collectionsWithData.length} collections with data:`);
      collectionsWithData.forEach(coll => {
        console.log(`- ${coll.name}: ${coll.count} documents`);
      });

      if (collectionsWithData.length === 0) {
        Alert.alert(
          '📭 No Data Found Anywhere',
          `Comprehensive scan complete!

❌ Checked ${totalCollectionsChecked} collections - all empty
❌ Checked user subcollections - no data found

This means:
1. 🆕 No services/tickets have been created yet
2. 📱 Data might be created through your app UI
3. 🔗 Data might be in external database/API

NEXT STEPS:
• Click "Create Test Data" to add sample data
• Create services/tickets through your app
• Check if data is stored elsewhere`,
          [
            { text: 'OK' },
            { text: 'Create Test Data', onPress: createTestData }
          ]
        );
      } else {
        const resultText = collectionsWithData
          .map(coll => `📁 ${coll.name}: ${coll.count} docs`)
          .join('\n');
        Alert.alert(
          '🎉 Data Found!',
          `✅ Found data in ${collectionsWithData.length} locations:

${resultText}

🔍 Check console for sample documents and data structure.

If this data should appear in your admin panel, we need to update the fetchServicesAndTickets function to use these collection names.`,
          [
            { text: 'View Details', onPress: () => {
              console.log('\n=== DETAILED FINDINGS ===');
              collectionsWithData.forEach(coll => {
                console.log(`\nCollection: ${coll.name}`);
                console.log(`Documents: ${coll.count}`);
                console.log('Sample document structure:', coll.sampleDoc);
              });
            } },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Collection scan failed:', error);
      Alert.alert('Scan Error', `Failed to scan collections: ${(error as Error).message}`);
    }
  };

  const handleDebugFirebase = async () => {
    console.log('Starting Firebase debug...');
    console.log('=== AUTHENTICATION DEBUG ===');
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    console.log('User role:', user?.role);
    console.log('User is authenticated:', !!user);
    await debugFirebaseConnection();
    Alert.alert('Debug Complete', 'Check console for Firebase debug information');
  };

  const handleDeployRules = () => {
    Alert.alert(
      '🚨 CRITICAL: Rules Not Deployed Yet!',
      `❌ Your local firestore.rules file has the correct rules, but they haven't been deployed to Firebase yet!

🔧 MANUAL DEPLOYMENT (2 minutes):

📱 STEP 1: Open Firebase Console
   https://console.firebase.google.com

📱 STEP 2: Select project "inevents-2fe56"

📱 STEP 3: Go to "Firestore Database" → "Rules" tab

📱 STEP 4: DELETE ALL existing rules and paste this:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

📱 STEP 5: Click "PUBLISH" button

⚠️ CRITICAL: Your app won't work until you do this!`,
      [
        { text: 'I understand', style: 'cancel' },
        { text: 'Copy Rules Now', onPress: () => {
            console.log('=== 🚨 URGENT: COPY THESE RULES TO FIREBASE CONSOLE 🚨 ===');
            console.log('1. Go to: https://console.firebase.google.com');
            console.log('2. Select project: inevents-2fe56');
            console.log('3. Go to: Firestore Database > Rules');
            console.log('4. DELETE ALL existing rules');
            console.log('5. PASTE these rules:');
            console.log('');
            console.log('rules_version = \'2\';');
            console.log('service cloud.firestore {');
            console.log('  match /databases/{database}/documents {');
            console.log('    match /{document=**} {');
            console.log('      allow read, write: if true;');
            console.log('    }');
            console.log('  }');
            console.log('}');
            console.log('');
            console.log('6. Click PUBLISH');
            console.log('7. Return to app and test');
            console.log('=== END RULES ===');
            Alert.alert('Rules Ready to Copy!', 'Check console output - copy the rules EXACTLY as shown to Firebase Console, then click PUBLISH.');
          } },
        { text: 'Show Firebase Console', onPress: () => {
            console.log('🌐 Open this URL: https://console.firebase.google.com');
            console.log('📋 Select project: inevents-2fe56');
            console.log('⚙️ Go to: Firestore Database > Rules');
            Alert.alert('Open Firebase Console', 'URL logged to console:\nhttps://console.firebase.google.com\n\nSelect project: inevents-2fe56\nGo to: Firestore Database > Rules');
          } }
      ]
    );
  };

  const getFilteredStats = () => {
    const userStats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      inactive: filteredUsers.filter(u => u.status === 'inactive').length,
      artists: filteredUsers.filter(u => u.role === 'artist').length,
      clients: filteredUsers.filter(u => u.role === 'client').length,
      totalRevenue: filteredUsers.reduce((sum, u) => sum + (u.revenue || 0), 0),
    };

    const serviceStats = {
      total: filteredServices.length,
      approved: filteredServices.filter(s => s.status === 'approved').length,
      pending: filteredServices.filter(s => s.status === 'pending').length,
      totalViews: filteredServices.reduce((sum, s) => sum + (s.views || 0), 0),
      totalPurchases: filteredServices.reduce((sum, s) => sum + (s.purchases || 0), 0),
    };

    return { userStats, serviceStats };
  };

  const handleApproveService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    try {
      setServicesLoading(true);
      const topLevelCollection = service.type === 'service' ? 'services' : 'tickets';
      const topDocRef = doc(db, topLevelCollection, serviceId);
      const topSnap = await getDoc(topDocRef);
      if (topSnap.exists()) {
        await updateDoc(topDocRef, { status: 'approved', updatedAt: new Date() } as any);
        console.log(`Updated status to approved at ${topLevelCollection}/${serviceId}`);
      } else {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        let updated = false;
        for (const userDoc of usersSnap.docs) {
          const userServiceRef = doc(db, 'users', userDoc.id, 'services', serviceId);
          const userServiceSnap = await getDoc(userServiceRef);
          if (userServiceSnap.exists()) {
            await updateDoc(userServiceRef, { status: 'approved', updatedAt: new Date() } as any);
            console.log(`Updated status to approved at users/${userDoc.id}/services/${serviceId}`);
            updated = true;
            break;
          }
          const userTicketRef = doc(db, 'users', userDoc.id, 'tickets', serviceId);
          const userTicketSnap = await getDoc(userTicketRef);
          if (userTicketSnap.exists()) {
            await updateDoc(userTicketRef, { status: 'approved', updatedAt: new Date() } as any);
            console.log(`Updated status to approved at users/${userDoc.id}/tickets/${serviceId}`);
            updated = true;
            break;
          }
        }
        if (!updated) {
          console.warn('Could not find document to approve in known locations');
        }
      }
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: 'approved' } : s));
      Alert.alert('Success', 'Service approved');
    } catch (error) {
      console.error('Error approving service:', error);
      Alert.alert('Error', 'Failed to approve service');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleRejectService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    Alert.alert(
      'Suspend (Delete)',
      `Are you sure you want to suspend (delete) this ${service.type}? This action will remove it from Firestore and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: async () => {
            try {
              setServicesLoading(true);
              const topLevelCollection = service.type === 'service' ? 'services' : 'tickets';
              try {
                const topDocRef = doc(db, topLevelCollection, serviceId);
                const topDocSnap = await getDoc(topDocRef);
                if (topDocSnap.exists()) {
                  await deleteDoc(topDocRef);
                  console.log(`Deleted from top-level ${topLevelCollection}/${serviceId}`);
                } else {
                  const usersRef = collection(db, 'users');
                  const usersSnap = await getDocs(usersRef);
                  let deletedFromUser = false;
                  for (const userDoc of usersSnap.docs) {
                    const userServiceRef = doc(db, 'users', userDoc.id, 'services', serviceId);
                    const userServiceSnap = await getDoc(userServiceRef);
                    if (userServiceSnap.exists()) {
                      await deleteDoc(userServiceRef);
                      console.log(`Deleted from users/${userDoc.id}/services/${serviceId}`);
                      deletedFromUser = true;
                      break;
                    }
                  }
                  if (!deletedFromUser) {
                    for (const userDoc of usersSnap.docs) {
                      const userTicketRef = doc(db, 'users', userDoc.id, 'tickets', serviceId);
                      const userTicketSnap = await getDoc(userTicketRef);
                      if (userTicketSnap.exists()) {
                        await deleteDoc(userTicketRef);
                        console.log(`Deleted from users/${userDoc.id}/tickets/${serviceId}`);
                        deletedFromUser = true;
                        break;
                      }
                    }
                  }
                  if (!deletedFromUser) {
                    console.warn('Could not find service/ticket document to delete in known locations');
                  }
                }
              } catch (err) {
                console.error('Error during deletion attempt:', err);
                throw err;
              }
              setServices(prev => prev.filter(s => s.id !== serviceId));
              Alert.alert('Success', `${service.type === 'service' ? 'Service' : 'Ticket'} suspended (deleted)`);
            } catch (error) {
              console.error('❌ Error suspending (deleting) service:', error);
              Alert.alert('Error', 'Failed to suspend/delete the item from Firestore');
            } finally {
              setServicesLoading(false);
            }
          } }
      ]
    );
  };

  const handleSuspendService = async (serviceId: string) => {
    await handleRejectService(serviceId);
  };

  const fetchFinancialData = async () => {
    try {
      setFinancialLoading(true);

      let totalRevenue = 0;
      let servicesRevenue = 0;
      let ticketsRevenue = 0;
      let totalOrders = 0;
      let serviceOrders = 0;
      let ticketOrders = 0;
      let pendingPayouts = 0;
      const orderValues: number[] = [];
      const artistRevenueMap = new Map<string, { name: string; revenue: number; artistId: string }>();
      const monthlyRevenue = new Map<string, number>();
      const weekRevenue = new Map<string, number>();
      const yearRevenue = new Map<string, number>();
      const now = new Date();
      const currentYear = now.getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const getWeekId = (d: Date) => {
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        return `${start.getMonth()+1}/${start.getDate()}`;
      };

      const processOrder = (orderData: any) => {
        const price = Number(orderData.totalPrice ?? orderData.clientPrice ?? orderData.price ?? orderData.totalAmount ?? orderData.amount ?? orderData.cost ?? 0);
        const createdAt = orderData.createdAt?.toDate?.() || orderData.date?.toDate?.() || orderData.timestamp?.toDate?.() || new Date(orderData.createdAt || orderData.date) || new Date();
        const artistId = orderData.artistId || orderData.sellerId || orderData.providerId;
        const artistName = orderData.artistName || orderData.sellerName || orderData.providerName || orderData.serviceName || `Artist ${artistId}`;
        const status = orderData.status || orderData.orderStatus || 'completed';
        const type = orderData.type || orderData.orderType || '';
        const isTicket = type === 'ticket' || type === 'Ticket' || !!orderData.ticketName || !!orderData.eventName;
        if (price <= 0) return;
        totalRevenue += price;
        totalOrders++;
        orderValues.push(price);
        if (isTicket) { ticketsRevenue += price; ticketOrders++; }
        else { servicesRevenue += price; serviceOrders++; }
        if (artistId) {
          const existing = artistRevenueMap.get(artistId) || { name: artistName, revenue: 0, artistId };
          artistRevenueMap.set(artistId, { ...existing, revenue: existing.revenue + price });
        }
        if (createdAt.getFullYear() === currentYear) {
          const monthName = months[createdAt.getMonth()];
          monthlyRevenue.set(monthName, (monthlyRevenue.get(monthName) || 0) + price);
        }
        const weekId = getWeekId(createdAt);
        weekRevenue.set(weekId, (weekRevenue.get(weekId) || 0) + price);
        const yearLabel = `${createdAt.getFullYear()}`;
        yearRevenue.set(yearLabel, (yearRevenue.get(yearLabel) || 0) + price);
        if (status === 'completed' || status === 'paid' || status === 'pending_payout') {
          pendingPayouts += price * 0.8;
        }
      };

      const rootCollectionsToScan = ['orders','transactions','payments','custom_orders','incomingCustomOrders','customOrders','bookings','incoming_custom_orders','clientOrders'];
      for (const colName of rootCollectionsToScan) {
        try {
          const ref = collection(db, colName);
          const snap = await getDocs(ref);
          snap.docs.forEach(d => processOrder(d.data()));
        } catch { /* ignore */ }
      }

      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const userSubcollectionsToScan = ['orders', 'incoming_orders', 'custom_orders', 'incomingCustomOrders', 'incoming_custom_orders', 'transactions', 'payments', 'bookings'];
        for (const userDoc of usersSnapshot.docs) {
          for (const subcol of userSubcollectionsToScan) {
            try {
              const ref = collection(db, 'users', userDoc.id, subcol);
              const snap = await getDocs(ref);
              snap.docs.forEach(d => processOrder({ ...d.data(), actorName: userDoc.data().name || userDoc.id }));
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }

      const averageOrderValue = orderValues.length > 0 ? totalRevenue / orderValues.length : 0;
      const currentMonth = months[now.getMonth()];
      const monthlyIncome = monthlyRevenue.get(currentMonth) || 0;
      const weeklyIncome = monthlyIncome / 4;

      let periodRevenue: number[] = [];
      let periodLabels: string[] = [];
      if (financePeriod === 'week') {
        const sortedWeeks = Array.from(weekRevenue.entries()).sort((a, b) => {
          const [mA, dA] = a[0].split('/').map(Number);
          const [mB, dB] = b[0].split('/').map(Number);
          return mA !== mB ? mA - mB : dA - dB;
        });
        periodLabels = sortedWeeks.map(([k]) => k);
        periodRevenue = sortedWeeks.map(([, v]) => v);
      } else if (financePeriod === 'month') {
        periodLabels = months;
        periodRevenue = months.map(m => monthlyRevenue.get(m) || 0);
      } else {
        periodLabels = [String(currentYear)];
        periodRevenue = [yearRevenue.get(String(currentYear)) || 0];
      }

      const topEarners = Array.from(artistRevenueMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      setFinancialData({
        totalRevenue, servicesRevenue, ticketsRevenue,
        weeklyIncome, monthlyIncome,
        averageOrderValue: Math.round(averageOrderValue),
        totalOrders, serviceOrders, ticketOrders,
        pendingPayouts: Math.round(pendingPayouts),
        topEarners,
        revenueData: months.map(month => ({ month, revenue: monthlyRevenue.get(month) || 0 })),
        periodRevenue, periodLabels,
      });
    } catch {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setFinancialData({
        totalRevenue: 0, servicesRevenue: 0, ticketsRevenue: 0,
        weeklyIncome: 0, monthlyIncome: 0,
        averageOrderValue: 0, totalOrders: 0, serviceOrders: 0, ticketOrders: 0,
        pendingPayouts: 0, topEarners: [],
        revenueData: months.map(m => ({ month: m, revenue: 0 })),
        periodRevenue: [], periodLabels: [],
      });
    } finally {
      setFinancialLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('=== FIREBASE USER FETCH DEBUG ===');
      console.log('Project ID: inevents-2fe56');
      console.log('Fetching users from Firebase...');
      console.log('Firebase app config:', db.app.options);
      const usersCollection = collection(db, 'users');
      console.log('Users collection reference created');
      const usersSnapshot = await getDocs(usersCollection);
      console.log(`Found ${usersSnapshot.docs.length} documents in 'users' collection`);
      if (usersSnapshot.empty) {
        console.warn('❌ Users collection is empty!');
        console.log('Checking if collection exists...');
        const possibleCollections = ['users', 'Users', 'user', 'accounts', 'profiles'];
        for (const collectionName of possibleCollections) {
          try {
            const testCollection = collection(db, collectionName);
            const testSnapshot = await getDocs(testCollection);
            console.log(`Collection '${collectionName}': ${testSnapshot.docs.length} documents`);
            if (!testSnapshot.empty) {
              console.log(`✅ Found data in '${collectionName}' collection`);
              console.log('Sample document:', testSnapshot.docs[0].data());
            }
          } catch (error) {
            console.log(`❌ Error checking '${collectionName}':`, (error as Error).message);
          }
        }
      }

      const usersData = usersSnapshot.docs.map((doc, index) => {
        const data = doc.data();
        console.log(`User ${index + 1} (ID: ${doc.id}):`, data);
        const userData = {
          id: doc.id,
          name: data.name || data.displayName || data.fullName || data.firstName || 'Unknown User',
          email: data.email || data.emailAddress || '',
          phone: data.phone || data.phoneNumber || data.mobile || '',
          role: data.role || data.userType || data.type || data.accountType || 'client',
          status: data.status || (data.isActive !== false ? 'active' : 'inactive') || (data.active !== false ? 'active' : 'inactive') || 'active',
          signupDate: data.signupDate?.toDate ? data.signupDate.toDate() : data.createdAt?.toDate ? data.createdAt.toDate() : data.dateCreated?.toDate ? data.dateCreated.toDate() : data.registrationDate?.toDate ? data.registrationDate.toDate() : new Date(),
          lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastSeen?.toDate ? data.lastSeen.toDate() : data.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(),
          revenue: data.revenue || data.totalEarnings || data.earnings || data.income || 0,
          region: data.region || data.location || data.country || data.city || data.area || 'Unknown',
        };
        console.log(`Processed user ${index + 1}:`, userData);
        return userData;
      });

      console.log('=== FINAL PROCESSED USERS ===');
      console.log(`Total processed users: ${usersData.length}`);
      console.log('All users data:', usersData);
      setUsers(usersData);

      if (usersData.length === 0) {
        console.warn('🚨 NO USERS FOUND - TROUBLESHOOTING INFO:');
        console.log('1. Check if users are registered in your app');
        console.log('2. Verify Firestore security rules allow reading');
        console.log('3. Ensure you are connected to the correct Firebase project (inevents-2fe56)');
        console.log('4. Check if users are stored in a different collection name');
        const sampleUsers: User[] = [
          { id: 'sample-inevents-1', name: 'Event Organizer', email: 'organizer@inevents.com', phone: '+1234567890', role: 'artist', status: 'active', signupDate: new Date('2024-01-15'), lastLogin: new Date(), revenue: 2500, region: 'North America' },
          { id: 'sample-inevents-2', name: 'Event Attendee', email: 'attendee@inevents.com', phone: '+1234567891', role: 'client', status: 'active', signupDate: new Date('2024-02-20'), lastLogin: new Date(), revenue: 0, region: 'Europe' },
          { id: 'sample-inevents-3', name: 'Event Manager', email: 'manager@inevents.com', phone: '+1234567892', role: 'artist', status: 'active', signupDate: new Date('2024-03-10'), lastLogin: new Date('2024-07-25'), revenue: 1800, region: 'Asia' },
        ];
        setUsers(sampleUsers);
        console.log('✅ Added sample inevents users for testing');
        console.log('Sample users:', sampleUsers);
      } else {
        console.log(`✅ Loaded ${usersData.length} real users from Firebase`);
      }
    } catch (error) {
      console.error('❌ FIREBASE ERROR:', error);
      const errorDetails = { message: (error as Error).message, code: (error as any).code, name: (error as Error).name, stack: (error as Error).stack };
      console.error('Error details:', errorDetails);
      let errorMessage = 'Unknown error occurred';
      let troubleshootingInfo = '';
      if (error instanceof Error) {
        const errorCode = (error as any).code;
        switch (errorCode) {
          case 'permission-denied':
            errorMessage = 'Permission denied - Check Firestore security rules';
            troubleshootingInfo = '\n\nSolution:\n1. Update Firestore rules in Firebase Console\n2. Ensure user is authenticated\n3. Check if rules allow read access';
            break;
          case 'unavailable':
            errorMessage = 'Firebase service unavailable - Check internet connection';
            troubleshootingInfo = '\n\nSolution:\n1. Check internet connection\n2. Verify Firebase project status\n3. Try again in a few moments';
            break;
          case 'not-found':
            errorMessage = 'Collection not found - Check collection name';
            troubleshootingInfo = '\n\nSolution:\n1. Create "users" collection in Firestore\n2. Verify collection name spelling\n3. Check if data exists in Firestore Console';
            break;
          case 'invalid-argument':
            errorMessage = 'Invalid query parameters';
            troubleshootingInfo = '\n\nSolution:\n1. Check query syntax\n2. Verify field names\n3. Review console logs for details';
            break;
          default:
            errorMessage = error.message || 'Failed to connect to Firebase';
            if (error.message.includes('network')) {
              troubleshootingInfo = '\n\nNetwork Error:\n1. Check internet connection\n2. Verify Firebase project settings\n3. Check if Firebase services are accessible';
            } else if (error.message.includes('auth')) {
              troubleshootingInfo = '\n\nAuthentication Error:\n1. Ensure user is logged in\n2. Check authentication configuration\n3. Verify Firebase Auth is enabled';
            } else {
              troubleshootingInfo = '\n\nGeneral Firebase Error:\n1. Check Firebase Console for issues\n2. Verify project configuration\n3. Review error logs for more details';
            }
        }
      }
      console.error('Firebase fetch error:', errorMessage, troubleshootingInfo);
      const sampleUsers: User[] = [{ id: 'error-sample-1', name: 'Test User (Error Mode)', email: 'test@inevents.com', phone: '+1234567890', role: 'client', status: 'active', signupDate: new Date(), lastLogin: new Date(), revenue: 0, region: 'Test Region' }];
      setUsers(sampleUsers);
    } finally {
      setUsersLoading(false);
      console.log('=== END FIREBASE FETCH ===');
    }
  };

  // Compute price from document data, checking all possible field names and arrays
  const resolveServicePrice = (data: any): number => {
    const p = Number(data?.price ?? data?.basePrice ?? data?.totalPrice ?? data?.amount ?? data?.budget ?? 0);
    if (p > 0) return p;
    const opts = data?.options ?? data?.items ?? data?.addOns ?? data?.extraServices ?? data?.gigOptions ?? data?.serviceItems ?? [];
    if (Array.isArray(opts)) {
      const total = opts.reduce((sum: number, o: any) => sum + Number(o.price ?? o.unitPrice ?? o.amount ?? 0), 0);
      if (total > 0) return total;
    }
    return p;
  };
  const resolveServiceBasePrice = (data: any): number => {
    const p = Number(data?.basePrice ?? data?.price ?? data?.totalPrice ?? data?.amount ?? data?.budget ?? 0);
    if (p > 0) return p;
    const opts = data?.options ?? data?.items ?? data?.addOns ?? data?.extraServices ?? data?.gigOptions ?? data?.serviceItems ?? [];
    if (Array.isArray(opts)) {
      const total = opts.reduce((sum: number, o: any) => sum + Number(o.price ?? o.unitPrice ?? o.amount ?? 0), 0);
      if (total > 0) return total;
    }
    return p;
  };

  const fetchServicesAndTickets = async () => {
    try {
      setServicesLoading(true);
      console.log('=== FETCHING SERVICES AND TICKETS ===');
      const mapDocToService = (d: any, inferredType: 'service' | 'ticket'): Service => {
        const data = d.data ? d.data() : d;
        const createdAtRaw = data?.createdAt;
        const createdAt = createdAtRaw
          ? (typeof createdAtRaw.toDate === 'function' ? createdAtRaw.toDate() : new Date(createdAtRaw))
          : new Date();
        return {
          ...data,
          id: d.id,
          name: data?.name ?? data?.title ?? '',
          title: data?.title ?? data?.name ?? '',
          category: data?.category ?? 'Uncategorized',
          creator: data?.creator ?? data?.artistId ?? data?.owner ?? 'Unknown',
          artistId: data?.artistId ?? data?.creator ?? undefined,
          status: data?.status ?? 'pending',
          price: resolveServicePrice(data),
          basePrice: resolveServiceBasePrice(data),
          views: Number(data?.viewCount ?? data?.views ?? 0),
          purchases: Number(data?.purchases ?? data?.sales ?? 0),
          createdAt,
          images: Array.isArray(data?.images) ? data.images : [],
          description: data?.description ?? '',
          type: data?.type ?? inferredType,
        };
      };
      const allItems: Service[] = [];
      const servicesSnapshot = await getDocs(collection(db, 'services'));
      servicesSnapshot.forEach((doc) => { allItems.push(mapDocToService(doc, 'service')); });
      const ticketsSnapshot = await getDocs(collection(db, 'tickets'));
      ticketsSnapshot.forEach((doc) => { allItems.push(mapDocToService(doc, 'ticket')); });
      try {
        const userStoredServices = await fetchAllServicesFromFirebase();
        const mappedUserServices: Service[] = userStoredServices.map((s: any) => {
          const createdAtRaw = s?.createdAt;
          const createdAt = createdAtRaw
            ? (typeof createdAtRaw.toDate === 'function' ? createdAtRaw.toDate() : new Date(createdAtRaw))
            : new Date();
          return {
            ...s,
            id: s.id,
            name: s.name ?? s.title ?? '',
            title: s.title ?? s.name ?? '',
            category: s.category ?? 'Uncategorized',
            creator: s.creator ?? s.artistId ?? s.userId ?? 'Unknown',
            artistId: s.artistId ?? s.userId ?? undefined,
            status: s.status ?? 'pending',
            price: resolveServicePrice(s),
            basePrice: resolveServiceBasePrice(s),
            views: Number(s.viewCount ?? s.views ?? 0),
            purchases: Number(s.purchases ?? s.sales ?? 0),
            createdAt,
            images: Array.isArray(s.images) ? s.images : [],
            description: s.description ?? '',
            type: s.type ?? 'service',
          } as Service;
        });
        const mergedById = new Map<string, Service>();
        allItems.forEach(item => mergedById.set(item.id, item));
        mappedUserServices.forEach(item => mergedById.set(item.id, item));
        setServices(Array.from(mergedById.values()));
        console.log(`✅ Successfully loaded ${Array.from(mergedById.values()).length} items (including user subcollection services)`);
      } catch (err) {
        setServices(allItems);
        console.warn('⚠️ Could not fetch services from user subcollections:', err);
        console.log(`✅ Successfully loaded ${allItems.length} items (top-level only)`);
      }
    } catch (error) {
      console.error('❌ Error fetching services and tickets:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices((prev) => {
        const merged = new Map(prev.map(s => [s.id, s]));
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAtRaw = data?.createdAt;
          const createdAt = createdAtRaw
            ? (typeof createdAtRaw.toDate === 'function' ? createdAtRaw.toDate() : new Date(createdAtRaw))
            : new Date();
          merged.set(doc.id, {
            id: doc.id,
            name: data?.name ?? data?.title ?? '',
            title: data?.title ?? data?.name ?? '',
            category: data?.category ?? 'Uncategorized',
            creator: data?.creator ?? data?.artistId ?? 'Unknown',
            artistId: data?.artistId ?? undefined,
            status: data?.status ?? 'pending',
            price: resolveServicePrice(data),
            basePrice: resolveServiceBasePrice(data),
            views: Number(data?.viewCount ?? data?.views ?? 0),
            purchases: Number(data?.purchases ?? data?.sales ?? 0),
            createdAt,
            images: Array.isArray(data?.images) ? data.images : [],
            description: data?.description ?? '',
            type: 'service',
          } as Service);
        });
        return Array.from(merged.values());
      });
    });

    const unsubscribeTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      setServices((prev) => {
        const merged = new Map(prev.map(s => [s.id, s]));
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAtRaw = data?.createdAt;
          const createdAt = createdAtRaw
            ? (typeof createdAtRaw.toDate === 'function' ? createdAtRaw.toDate() : new Date(createdAtRaw))
            : new Date();
          merged.set(doc.id, {
            id: doc.id,
            name: data?.name ?? data?.title ?? '',
            title: data?.title ?? data?.name ?? '',
            category: data?.category ?? 'Uncategorized',
            creator: data?.creator ?? data?.artistId ?? 'Unknown',
            artistId: data?.artistId ?? undefined,
            status: data?.status ?? 'pending',
            price: resolveServicePrice(data),
            basePrice: resolveServiceBasePrice(data),
            views: Number(data?.viewCount ?? data?.views ?? 0),
            purchases: Number(data?.purchases ?? data?.sales ?? 0),
            createdAt,
            images: Array.isArray(data?.images) ? data.images : [],
            description: data?.description ?? '',
            type: 'ticket',
          } as Service);
        });
        return Array.from(merged.values());
      });
    });

    return () => {
      unsubscribeServices();
      unsubscribeTickets();
    };
  }, []);

  // Fetch real order counts per service
  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const snap = await getDocs(ordersRef);
        const counts: Record<string, number> = {};
        snap.docs.forEach(d => {
          const data = d.data() as any;
          const sid = data.serviceId || data.service_id || '';
          if (sid) counts[sid] = (counts[sid] || 0) + 1;
        });
        setServiceOrderCounts(counts);
      } catch { /* ignore */ }
    };
    fetchOrderCounts();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              setUsersLoading(true);
              await deleteDoc(doc(db, 'users', userId));
              await fetchUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            } finally {
              setUsersLoading(false);
            }
          } }
      ]
    );
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      setUsersLoading(true);
      await updateDoc(doc(db, 'users', editUser.id), {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        status: editUser.status,
        region: editUser.region,
        revenue: editUser.revenue,
        updatedAt: new Date(),
      });
      setShowEditUserModal(false);
      setEditUser(null);
      await fetchUsers();
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Admin Panel useEffect triggered');
    const initializeData = async () => {
      console.log('🔄 Starting data initialization...');
      try {
        await fetchUsers();
        console.log('✅ Users fetch completed');
        await fetchServicesAndTickets();
        console.log('✅ Services and tickets fetch completed');
        await fetchCoupons();
        console.log('✅ Coupons fetch completed');
        await fetchFinancialData();
        console.log('✅ Financial data fetch completed');
      } catch (error) {
        console.error('❌ Error in data initialization:', error);
      }
    };
    initializeData();
    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh triggered');
      initializeData();
    }, 60000);
    return () => {
      console.log('🧹 Cleaning up interval');
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const listeners: Array<() => void> = [];
    const watchCollections = ['orders','transactions','payments','custom_orders','bookings','customOrders'];
    for (const col of watchCollections) {
      try {
        const q = collection(db, col);
        const unsub = onSnapshot(q, () => {
          fetchFinancialData().catch(err => console.warn('Error recomputing financials on snapshot', err));
        }, (err) => {
          console.warn('Snapshot error for', col, err);
        });
        listeners.push(unsub);
      } catch (err) {
      }
    }
    try {
      const unsubUsers = onSnapshot(collection(db, 'users'), () => {
        fetchFinancialData().catch(err => console.warn('Error recomputing financials on users snapshot', err));
      });
      listeners.push(unsubUsers);
    } catch (err) {
    }
    return () => {
      listeners.forEach(unsub => {
        try { unsub(); } catch (e) { }
      });
    };
  }, []);

  useEffect(() => { fetchFinancialData(); }, [financePeriod]);

  const renderDashboardTab = () => {
    const roleDistData = [
      { label: 'Artists', count: artists.length, color: Theme.colors.primary, pct: users.length ? Math.round((artists.length / users.length) * 100) : 0 },
      { label: 'Clients', count: users.filter(u => u?.role === 'client').length, color: Theme.colors.success, pct: users.length ? Math.round((users.filter(u => u?.role === 'client').length / users.length) * 100) : 0 },
      { label: 'Admins', count: users.filter(u => u?.role === 'admin').length, color: Theme.colors.warning, pct: users.length ? Math.round((users.filter(u => u?.role === 'admin').length / users.length) * 100) : 0 },
    ];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRev = months.map((m, i) => financialData.revenueData?.[i]?.revenue ?? 0);
    const maxMonthlyRev = Math.max(...monthlyRev, 1);
    const currentMonthIdx = new Date().getMonth();
    const prevMonthRev = currentMonthIdx > 0 ? monthlyRev[currentMonthIdx - 1] : 0;
    const thisMonthRev = monthlyRev[currentMonthIdx];
    const revTrend = prevMonthRev > 0 ? ((thisMonthRev - prevMonthRev) / prevMonthRev) * 100 : 0;

    return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#111', letterSpacing: -0.5 }}>Admin Dashboard</Text>
        <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setActiveTab('users')} style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, marginRight: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Users size={22} color={Theme.colors.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>{totalUsers}</Text>
            <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Total users</Text>
            <Text style={{ fontSize: 12, color: Theme.colors.success, fontWeight: '600', marginTop: 4 }}>{activeUsers} active</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('financial')} style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, marginLeft: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <DollarSign size={22} color={Theme.colors.success} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>${totalRevenue.toLocaleString()}</Text>
            <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Total revenue</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {revTrend >= 0
                ? <ArrowUp size={13} color={Theme.colors.success} />
                : <ArrowDown size={13} color={Theme.colors.error} />}
              <Text style={{ fontSize: 12, fontWeight: '600', color: revTrend >= 0 ? Theme.colors.success : Theme.colors.error, marginLeft: 3 }}>
                {Math.abs(revTrend).toFixed(1)}% this month
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => setActiveTab('services')} style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, marginRight: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <ClipboardCheck size={20} color={Theme.colors.warning} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>{pendingServices}</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Pending</Text>
            <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Need approval</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, marginHorizontal: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <BarChart3 size={20} color={Theme.colors.info} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>{orders}</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Orders</Text>
            <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{financialData.serviceOrders} svc · {financialData.ticketOrders} tkt</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, marginLeft: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fdf2f8', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <TrendingUp size={20} color="#db2777" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>{financialData.averageOrderValue.toLocaleString()}</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Avg order</Text>
            <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>${(financialData.monthlyIncome / 1000).toFixed(0)}k/month</Text>
          </View>
        </View>
      </View>

      <Card style={{ marginBottom: 20, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111' }}>Monthly Revenue</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{months[currentMonthIdx]} ${thisMonthRev.toLocaleString()} · {revTrend >= 0 ? '+' : ''}{Math.abs(revTrend).toFixed(0)}% MoM</Text>
          </View>
          <TouchableOpacity onPress={fetchFinancialData} style={{ backgroundColor: '#f5f5f5', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
            <Activity size={18} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, justifyContent: 'space-between', marginBottom: 8 }}>
          {months.slice(0, 12).map((m, i) => {
            const height = (monthlyRev[i] / maxMonthlyRev) * 85;
            const isCurrent = i === currentMonthIdx;
            return (
              <View key={m} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                <View style={{
                  width: '80%', height: Math.max(height, 4),
                  backgroundColor: isCurrent ? Theme.colors.primary : '#e5e7eb',
                  borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
                }} />
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
          {['J','F','M','A','M','J','J','A','S','O','N','D'].map((m, i) => (
            <Text key={`ml-${i}`} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: i === currentMonthIdx ? '700' : '400', color: i === currentMonthIdx ? Theme.colors.primary : '#bbb' }}>{m}</Text>
          ))}
        </View>
      </Card>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 14 }}>Platform Insights</Text>
        <Card style={{ padding: 20, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 16 }}>Users by Role</Text>
          {roleDistData.map(item => (
            <View key={item.label} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 8 }} />
                  <Text style={{ fontSize: 14, color: '#555' }}>{item.label}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111' }}>{item.count} · {item.pct}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </Card>
        <Card style={{ padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 16 }}>Revenue Breakdown</Text>
          {(() => {
            const svcPct = financialData.totalRevenue > 0 ? Math.round((financialData.servicesRevenue / financialData.totalRevenue) * 100) : 0;
            return (
              <View>
                <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
                  <View style={{ flex: svcPct, backgroundColor: Theme.colors.primary }} />
                  <View style={{ flex: 100 - svcPct, backgroundColor: '#f59e0b' }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.primary, marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>Services</Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>${(financialData.servicesRevenue / 1000).toFixed(1)}k</Text>
                    <Text style={{ fontSize: 12, color: '#888' }}>{svcPct}% · {financialData.serviceOrders} orders</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b', marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>Tickets</Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>${(financialData.ticketsRevenue / 1000).toFixed(1)}k</Text>
                    <Text style={{ fontSize: 12, color: '#888' }}>{100 - svcPct}% · {financialData.ticketOrders} orders</Text>
                  </View>
                </View>
              </View>
            );
          })()}
        </Card>
      </View>

      <Card style={{ padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 16 }}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setActiveTab('users')} style={{ alignItems: 'center', marginRight: 20, width: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Users size={24} color={Theme.colors.primary} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' }}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('services')} style={{ alignItems: 'center', marginRight: 20, width: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <ClipboardCheck size={24} color={Theme.colors.warning} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' }}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('financial')} style={{ alignItems: 'center', marginRight: 20, width: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <BarChart size={24} color={Theme.colors.success} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' }}>Financial</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('coupons')} style={{ alignItems: 'center', marginRight: 20, width: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Gift size={24} color={Theme.colors.info} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' }}>Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={{ alignItems: 'center', marginRight: 20, width: 80 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Activity size={24} color="#666" />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' }}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      </Card>
    </ScrollView>
    );
  };

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Theme.colors.textLight} />
          <TextInput style={styles.searchInput} placeholder="Search users..." value={userSearchQuery} onChangeText={setUserSearchQuery} />
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={16} color={Theme.colors.primary} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
        {(['all', 'artist', 'client'] as const).map(role => (
          <TouchableOpacity key={role} onPress={() => setUserFilters(prev => ({ ...prev, role }))} style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: userFilters.role === role ? Theme.colors.primary : '#f0f0f0' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: userFilters.role === role ? 'white' : '#666', textTransform: 'capitalize' }}>{role === 'all' ? 'All' : role === 'artist' ? 'Artist' : 'Customer'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bulkActionsContainer}>
        <View style={styles.bulkActionsRow}>
          <TouchableOpacity style={[styles.bulkActionButton, styles.notifyAllButton]} onPress={() => { setNotificationMessage({ ...notificationMessage, targetGroup: 'all' }); setShowBulkNotificationModal(true); }}>
            <Bell size={16} color="white" />
            <Text style={styles.bulkActionText}>Notify All ({users.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bulkActionButton, styles.notifyFilteredButton]} onPress={() => { setNotificationMessage({ ...notificationMessage, targetGroup: 'filtered' }); setShowBulkNotificationModal(true); }}>
            <Bell size={16} color="white" />
            <Text style={styles.bulkActionText}>Notify Filtered ({filteredUsers.length})</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bulkActionsRow}>
          <TouchableOpacity style={[styles.bulkActionButton, styles.selectModeButton]} onPress={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) { clearSelection(); } }}>
            <Users size={16} color="white" />
            <Text style={styles.bulkActionText}>{isSelectMode ? 'Exit Select' : 'Select Users'}</Text>
          </TouchableOpacity>
          {isSelectMode && (
            <>
              <TouchableOpacity style={[styles.bulkActionButton, styles.selectAllButton]} onPress={selectAllUsers}>
                <Check size={16} color="white" />
                <Text style={styles.bulkActionText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkActionButton, styles.clearButton]} onPress={clearSelection}>
                <X size={16} color="white" />
                <Text style={styles.bulkActionText}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {isSelectMode && selectedUsers.length > 0 && (
          <TouchableOpacity style={[styles.bulkActionButton, styles.notifySelectedButton]} onPress={() => { setNotificationMessage({ ...notificationMessage, targetGroup: 'selected' }); setShowBulkNotificationModal(true); }}>
            <Bell size={16} color="white" />
            <Text style={styles.bulkActionText}>Notify Selected ({selectedUsers.length})</Text>
          </TouchableOpacity>
        )}
      </View>
      {usersLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading users from Firebase...</Text>
        </View>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={Theme.colors.textLight} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyMessage}>{users.length === 0 ? 'No users are registered in the system yet.' : 'No users match your current search criteria.'}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.userItem, isSelectMode && selectedUsers.includes(item.id) && styles.selectedUserItem]}
                  onPress={() => {
                    if (isSelectMode) {
                      toggleUserSelection(item.id);
                    } else {
                      setSelectedUser(item);
                      setShowUserModal(true);
                    }
                  }}
                  onLongPress={() => { if (!isSelectMode) { setEditUser(item); setShowEditUserModal(true); } }}
                >
                  {isSelectMode && (
                    <View style={styles.checkboxContainer}>
                      <View style={[styles.checkbox, selectedUsers.includes(item.id) && styles.checkedBox]}>
                        {selectedUsers.includes(item.id) && <Check size={12} color="white" />}
                      </View>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={styles.userRole}>{item?.role ?? 'unknown'} • {item?.region ?? 'unknown'}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? Theme.colors.success : Theme.colors.warning }]}> 
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                    {!isSelectMode && (
                      <>
                        <TouchableOpacity onPress={() => handleSendNotification(item.id)} style={styles.notifyButton}>
                          <Bell size={16} color={Theme.colors.info} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.deleteButton}>
                          <Trash2 size={16} color={Theme.colors.error} />
                        </TouchableOpacity>
                        <ChevronRight size={16} color={Theme.colors.textLight} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          )}
        </>
      )}
    </View>
  );

  const handleDenyService = async (serviceId: string) => {
    Alert.alert('Deny Service', 'This will permanently delete this service. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const service = services.find(s => s.id === serviceId);
            if (!service) return;
            const topLevelCollection = service.type === 'service' ? 'services' : 'tickets';
            const topDocRef = doc(db, topLevelCollection, serviceId);
            const topSnap = await getDoc(topDocRef);
            if (topSnap.exists()) {
              await deleteDoc(topDocRef);
            }
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            for (const userDoc of usersSnap.docs) {
              const userServiceRef = doc(db, 'users', userDoc.id, 'services', serviceId);
              const userServiceSnap = await getDoc(userServiceRef);
              if (userServiceSnap.exists()) {
                await deleteDoc(userServiceRef);
              }
              const userTicketRef = doc(db, 'users', userDoc.id, 'tickets', serviceId);
              const userTicketSnap = await getDoc(userTicketRef);
              if (userTicketSnap.exists()) {
                await deleteDoc(userTicketRef);
              }
            }
            setServices(prev => prev.filter(s => s.id !== serviceId));
            Alert.alert('Deleted', 'Service has been permanently deleted.');
          } catch (err) {
            console.error('Failed to delete service:', err);
            Alert.alert('Error', 'Failed to delete service.');
          }
        },
      },
    ]);
  };

  const handleImproveService = (serviceId: string) => {
    handleApproveService(serviceId);
  };

  const renderServicesTab = () => {
    if (servicesLoading) {
      return (
        <View style={[styles.tabContent, { justifyContent: 'center', alignItems: 'center' }]}> 
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={[{ marginTop: 16, color: Theme.colors.text, fontSize: 16 }]}>Loading services from Firebase...</Text>
        </View>
      );
    }
    return (
      <View style={styles.tabContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md }}>
          <View style={styles.searchContainer}>
            <Search size={16} color={Theme.colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor={Theme.colors.textLight}
              value={serviceSearchQuery}
              onChangeText={setServiceSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => {
            Alert.alert('Filter Services', 'Filter by status', [
              { text: 'All', onPress: () => updateServiceFilter('status', 'all') },
              { text: 'Active', onPress: () => updateServiceFilter('status', 'active') },
              { text: 'Pending', onPress: () => updateServiceFilter('status', 'pending') },
              { text: 'Rejected', onPress: () => updateServiceFilter('status', 'rejected') },
            ]);
          }}>
            <Filter size={16} color={Theme.colors.primary} />
            <Text style={styles.filterText}>{serviceFilters.status === 'all' ? 'Status' : serviceFilters.status}</Text>
          </TouchableOpacity>
        </View>
        {services.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[{ color: Theme.colors.text, fontSize: 16, marginBottom: 16 }]}>No services posted by artists</Text>
            <TouchableOpacity style={[styles.approveButton, { marginTop: 16 }]} onPress={fetchServicesAndTickets}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const imageUri = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
              const statusColor = item.status === 'approved' || item.status === 'active' ? '#C59400' : item.status === 'rejected' ? Theme.colors.error : Theme.colors.warning;
              return (
                <Card style={[styles.serviceItem, (item.status === 'approved' || item.status === 'active') && { borderLeftWidth: 4, borderLeftColor: '#C59400' }]}>
                  <TouchableOpacity onPress={() => { setSelectedService(item); setShowServiceModal(true); }} activeOpacity={0.7}>
                    <View style={styles.serviceHeader}>
                      {imageUri && (
                        <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: Theme.spacing.md }} />
                      )}
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{item.name || item.title || 'Untitled'}</Text>
                        <Text style={styles.serviceCategory}>{item.category} &middot; {item.type}</Text>
                        <Text style={styles.serviceCreator}>By {item.creator || item.artistId || 'Unknown'}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{item.status || 'pending'}</Text>
                      </View>
                    </View>
                    {item.description && (
                      <Text numberOfLines={2} style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: Theme.spacing.sm }}>
                        {item.description}
                      </Text>
                    )}
                    <View style={styles.serviceStats}>
                      <View style={styles.serviceStat}>
                        <Eye size={14} color={Theme.colors.textLight} />
                        <Text style={styles.serviceStatText}>{item.views ?? 0}</Text>
                      </View>
                      <View style={styles.serviceStat}>
                        <ShoppingBag size={14} color={Theme.colors.textLight} />
                        <Text style={styles.serviceStatText}>{serviceOrderCounts[item.id] ?? item.purchases ?? 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.serviceActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleImproveService(item.id)}>
                      <Check size={16} color="white" />
                      <Text style={styles.actionButtonText}>Improve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleDenyService(item.id)}>
                      <X size={16} color="white" />
                      <Text style={styles.actionButtonText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            }}
            ListFooterComponent={filteredServices.length !== services.length ? (
              <Text style={{ textAlign: 'center', color: Theme.colors.textLight, padding: Theme.spacing.md }}>
                Showing {filteredServices.length} of {services.length} services
              </Text>
            ) : null}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    );
  };

  const renderServiceModal = () => {
    const service = selectedService;
    const allItems = [
      ...(Array.isArray(service?.items) ? service.items : []),
      ...(Array.isArray(service?.options) ? service.options : []),
      ...(Array.isArray(service?.ticketTypes) ? service.ticketTypes : []),
    ];
    const extras = [
      ...(Array.isArray(service?.extras) ? service.extras : []),
      ...(Array.isArray(service?.addOns) ? service.addOns : []),
    ];

    return (
    <Modal visible={showServiceModal} animationType="slide" onRequestClose={() => setShowServiceModal(false)} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, width: '90%', maxHeight: '85%', padding: 24 }}>
          {service && (
            <ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 20, flex: 1 }}>{service.name || service.title || 'Untitled'}</Text>
                <TouchableOpacity onPress={() => setShowServiceModal(false)}><X size={24} color={Theme.colors.textDark} /></TouchableOpacity>
              </View>
              {Array.isArray(service.images) && service.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {service.images.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={{ width: 200, height: 150, borderRadius: 8, marginRight: 8 }} />
                  ))}
                </ScrollView>
              )}
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={[styles.statusBadge, { backgroundColor: service.status === 'approved' || service.status === 'active' ? '#C59400' : service.status === 'rejected' ? Theme.colors.error : Theme.colors.warning }]}>
                  <Text style={styles.statusText}>{service.status || 'pending'}</Text>
                </View>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600', color: Theme.colors.textLight, fontSize: 12 }}>CATEGORY</Text>
                <Text style={{ fontSize: 16, color: Theme.colors.textDark }}>{service.category || 'N/A'} ({service.type})</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600', color: Theme.colors.textLight, fontSize: 12 }}>ARTIST</Text>
                <Text style={{ fontSize: 16, color: Theme.colors.textDark }}>{service.creator || service.artistId || 'Unknown'}</Text>
              </View>
              {service.description && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: Theme.colors.textLight, fontSize: 12 }}>DESCRIPTION</Text>
                  <Text style={{ fontSize: 14, color: Theme.colors.textDark, lineHeight: 20 }}>{service.description}</Text>
                </View>
              )}
              {allItems.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: Theme.colors.textLight, fontSize: 12, marginBottom: 4 }}>ITEMS ({allItems.length})</Text>
                  {allItems.map((it: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
                      <Text style={{ fontSize: 14, color: Theme.colors.textDark, flex: 1 }}>{it.title || it.name || it.type || `Item ${i + 1}`}</Text>
                    </View>
                  ))}
                </View>
              )}
              {extras.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: Theme.colors.textLight, fontSize: 12, marginBottom: 4 }}>EXTRAS ({extras.length})</Text>
                  {extras.map((ex: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
                      <Text style={{ fontSize: 14, color: Theme.colors.textDark, flex: 1 }}>{ex.title || ex.name || `Extra ${i + 1}`}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark }}>{service.views ?? service.viewCount ?? 0}</Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>Views</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark }}>{service.purchases ?? 0}</Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>Purchases</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark }}>{service.id ? service.id.slice(0, 6) : 'N/A'}</Text>
                  <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>ID</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
    );
  };

  const renderFinancialTab = () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRev = months.map((m, i) => financialData.revenueData?.[i]?.revenue ?? 0);
    const maxRevPeriod = Math.max(...financialData.periodRevenue, 1);
    const currentMonthIdx = new Date().getMonth();
    const prevMonthRev = currentMonthIdx > 0 ? monthlyRev[currentMonthIdx - 1] : 0;
    const thisMonthRev = monthlyRev[currentMonthIdx];
    const momGrowth = prevMonthRev > 0 ? ((thisMonthRev - prevMonthRev) / prevMonthRev) * 100 : 0;
    const svcPct = financialData.totalRevenue > 0 ? Math.round((financialData.servicesRevenue / financialData.totalRevenue) * 100) : 50;

    const periodLabels = financialData.periodLabels.length > 0 ? financialData.periodLabels : months;
    const periodRevenue = financialData.periodRevenue.length > 0 ? financialData.periodRevenue : monthlyRev;
    const maxRev = Math.max(...periodRevenue, 1);

    const totalRev = financialData.totalRevenue;

    return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#111', letterSpacing: -0.5 }}>Financial Overview</Text>
        <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          ${totalRev.toLocaleString()} total · {financialData.totalOrders} orders
          {financialLoading && ' · loading...'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 14, padding: 5 }}>
        {(['week', 'month', 'year'] as const).map(p => (
          <TouchableOpacity key={p} onPress={() => setFinancePeriod(p)} style={{ flex: 1, paddingVertical: 12, borderRadius: 11, backgroundColor: financePeriod === p ? Theme.colors.primary : 'transparent', alignItems: 'center', shadowColor: financePeriod === p ? Theme.colors.primary : 'transparent', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: financePeriod === p ? 4 : 0 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: financePeriod === p ? 'white' : '#888', textTransform: 'capitalize' }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {financialLoading ? (
        <View style={{ padding: 50, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 14, fontSize: 15, color: '#888' }}>Crunching numbers...</Text>
        </View>
      ) : (
        <>
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, marginRight: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <DollarSign size={20} color={Theme.colors.primary} />
                </View>
                <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Services Revenue</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>${financialData.servicesRevenue.toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{financialData.serviceOrders} orders · {svcPct}%</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, marginLeft: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef3e8', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <BarChart3 size={20} color="#f59e0b" />
                </View>
                <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Tickets Revenue</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>${financialData.ticketsRevenue.toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{financialData.ticketOrders} orders · {100 - svcPct}%</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Total Revenue</Text>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>${totalRev.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: momGrowth >= 0 ? '#ecfdf5' : '#fef2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    {momGrowth >= 0 ? <ArrowUp size={14} color={Theme.colors.success} /> : <ArrowDown size={14} color={Theme.colors.error} />}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: momGrowth >= 0 ? Theme.colors.success : Theme.colors.error, marginLeft: 4 }}>
                      {Math.abs(momGrowth).toFixed(1)}%
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>vs last month</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, marginRight: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Avg Order</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111' }}>${financialData.averageOrderValue.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>Per transaction</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, marginHorizontal: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Monthly</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111' }}>${financialData.monthlyIncome.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>Current month</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, marginLeft: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Payouts</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111' }}>${financialData.pendingPayouts.toLocaleString()}</Text>
              <Text style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>To artists</Text>
            </View>
          </View>

          <Card style={{ marginBottom: 20, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#111' }}>Revenue by {financePeriod}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{periodLabels.length} periods tracked</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.primary, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: '#888' }}>Revenue</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, justifyContent: 'space-between', marginBottom: 12 }}>
              {periodLabels.map((label: string, i: number) => {
                const value = periodRevenue[i] || 0;
                const height = (value / maxRev) * 130;
                return (
                  <View key={label} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: '#bbb', marginBottom: 4 }}>${(value / 1000).toFixed(value >= 1000 ? 0 : 1)}{value >= 1000 ? 'k' : ''}</Text>
                    <View style={{
                      width: '85%', height: Math.max(height, 3),
                      backgroundColor: Theme.colors.primary,
                      borderTopLeftRadius: 6, borderTopRightRadius: 6,
                      opacity: 0.85,
                    }} />
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
              {periodLabels.map((label: string) => (
                <Text key={label} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#999' }}>{label}</Text>
              ))}
            </View>
          </Card>

          <Card style={{ marginBottom: 20, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 20 }}>Revenue Breakdown</Text>
            <View style={{ flexDirection: 'row', height: 28, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              <View style={{ flex: svcPct, backgroundColor: Theme.colors.primary }} />
              <View style={{ flex: 100 - svcPct, backgroundColor: '#f59e0b' }} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, backgroundColor: '#eef2ff', borderRadius: 12, padding: 14, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Theme.colors.primary, marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>Services</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 4 }}>${(financialData.servicesRevenue / 1000).toFixed(1)}k</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{svcPct}% · {financialData.serviceOrders} orders</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#fef3e8', borderRadius: 12, padding: 14, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#f59e0b', marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>Tickets</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 4 }}>${(financialData.ticketsRevenue / 1000).toFixed(1)}k</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{100 - svcPct}% · {financialData.ticketOrders} orders</Text>
              </View>
            </View>
          </Card>

          <Card style={{ marginBottom: 20, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 20 }}>Top Earners</Text>
            {financialData.topEarners.length > 0 ? (
              financialData.topEarners.map((earner: { artistId: string; name: string; revenue: number }, index: number) => {
                const maxRevenue = financialData.topEarners[0]?.revenue || 1;
                const earnPct = (earner.revenue / maxRevenue) * 100;
                return (
                  <View key={earner.artistId} style={{ marginBottom: index < financialData.topEarners.length - 1 ? 16 : 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#e5e7eb' : index === 2 ? '#d97706' : '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <Text style={{ color: index <= 2 ? 'white' : Theme.colors.primary, fontSize: 13, fontWeight: '800' }}>{index + 1}</Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#333' }}>{earner.name}</Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>${earner.revenue.toLocaleString()}</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginLeft: 44 }}>
                      <View style={{ width: `${earnPct}%`, height: '100%', backgroundColor: index === 0 ? '#fbbf24' : Theme.colors.primary, borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#bbb' }}>No earner data yet</Text>
              </View>
            )}
          </Card>

          <TouchableOpacity onPress={fetchFinancialData} style={{ backgroundColor: Theme.colors.primary, paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
            <Activity size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Refresh Data</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginBottom: 24 }}>
            Data syncs from orders, transactions, and payments collections
          </Text>
        </>
      )}
    </ScrollView>
    );
  };

  const resetNewCouponForm = () => {
    setCouponExpiryDate(null);
    setShowCouponExpiryPicker(false);
    setNewCoupon({
      name: '',
      code: '',
      discount: '',
      type: 'percentage',
      expirationDate: '',
      maxUsage: '',
      minOrderAmount: '',
      scope: 'all',
      selectedServiceId: '',
      selectedServiceName: '',
    });
  };

  const handleCreateCoupon = async () => {
    const name = newCoupon.name.trim();
    const code = newCoupon.code.trim().toUpperCase();
    const discount = Number(newCoupon.discount);
    const maxUsage = Number(newCoupon.maxUsage);
    const minOrderAmount = Number(newCoupon.minOrderAmount || 0);
    const expirationDate = couponExpiryDate ? new Date(couponExpiryDate) : new Date(NaN);
    expirationDate.setHours(23, 59, 59, 999);

    if (!name || !code) {
      Alert.alert('Validation Error', 'Coupon name and code are required.');
      return;
    }

    if (!Number.isFinite(discount) || discount <= 0) {
      Alert.alert('Validation Error', 'Discount must be a valid number greater than 0.');
      return;
    }

    if (newCoupon.type === 'percentage' && discount > 100) {
      Alert.alert('Validation Error', 'Percentage discount cannot exceed 100%.');
      return;
    }

    if (!couponExpiryDate || Number.isNaN(expirationDate.getTime())) {
      Alert.alert('Validation Error', 'Please select a valid expiration date.');
      return;
    }

    if (newCoupon.scope === 'specific' && !newCoupon.selectedServiceId) {
      Alert.alert('Validation Error', 'Please select a service.');
      return;
    }

    const serviceId = newCoupon.scope === 'all' ? 'all' : newCoupon.selectedServiceId;
    const serviceName = newCoupon.scope === 'all' ? 'All Services' : newCoupon.selectedServiceName;

    const duplicateCodeExists = coupons.some(
      coupon => (coupon.code || '').toString().trim().toUpperCase() === code
    );

    if (duplicateCodeExists) {
      Alert.alert('Validation Error', 'A coupon with this code already exists.');
      return;
    }

    try {
      const couponData = {
        code,
        serviceId,
        serviceName,
        artistId: 'admin',
        artistName: 'Admin',
        discountType: newCoupon.type,
        discountValue: discount,
        maxUses: Number.isFinite(maxUsage) && maxUsage > 0 ? maxUsage : 999999,
        currentUses: 0,
        isActive: true,
        expiryDate: Timestamp.fromDate(expirationDate),
        createdAt: Timestamp.fromDate(new Date()),
        description: name,
        minOrderValue: minOrderAmount,
      };

      const docRef = await addDoc(collection(db, 'coupons'), couponData);

      const newCouponEntry: Coupon = {
        id: docRef.id,
        name,
        code,
        discount,
        type: newCoupon.type,
        expirationDate,
        usageCount: 0,
        maxUsage: Number.isFinite(maxUsage) && maxUsage > 0 ? maxUsage : 999999,
        status: 'active',
        description: name,
        minOrderAmount,
        scope: newCoupon.scope === 'all' ? 'all' : 'selected',
        targetType: 'service',
        targetIds: serviceId !== 'all' ? [serviceId] : [],
      };

      setCoupons(prev => [newCouponEntry, ...prev]);
      setShowCreateCouponModal(false);
      resetNewCouponForm();
      Alert.alert('Success', 'Coupon created successfully.');
    } catch (err) {
      console.error('Error creating coupon:', err);
      Alert.alert('Error', 'Failed to create coupon.');
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'stopped' ? 'active' : 'stopped';
    const newIsActive = newStatus === 'active';
    try {
      if (coupon.id) {
        await updateDoc(doc(db, 'coupons', coupon.id), { isActive: newIsActive });
      }
      setCoupons(prev =>
        prev.map(item =>
          item.id === coupon.id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      console.error('Error toggling coupon status:', err);
    }
  };

  const handleDeleteCoupon = (coupon: Coupon) => {
    Alert.alert('Delete Coupon', `Are you sure you want to delete "${coupon.code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (coupon.id) {
            await deleteDoc(doc(db, 'coupons', coupon.id));
          }
          setCoupons(prev => prev.filter(c => c.id !== coupon.id));
        } catch (err) {
          console.error('Error deleting coupon:', err);
        }
      }},
    ]);
  };

  const handleUseCoupon = async (coupon: Coupon) => {
    const expirationDate = coupon.expirationDate instanceof Date
      ? coupon.expirationDate
      : new Date(coupon.expirationDate);
    const isExpired = Number.isNaN(expirationDate.getTime()) ? false : expirationDate < new Date();
    const usageCount = coupon.usageCount ?? 0;
    const maxUsage = coupon.maxUsage ?? 0;

    if (coupon.status === 'stopped') {
      Alert.alert('Coupon Unavailable', 'This coupon is currently stopped.');
      return;
    }

    if (isExpired) {
      Alert.alert('Coupon Expired', 'This coupon has expired and cannot be used.');
      return;
    }

    if (maxUsage > 0 && usageCount >= maxUsage) {
      Alert.alert('Max Usage Reached', 'This coupon has reached its maximum usage.');
      return;
    }

    try {
      if (coupon.id) {
        await updateDoc(doc(db, 'coupons', coupon.id), { currentUses: usageCount + 1 });
      }
      setCoupons(prev =>
        prev.map(item =>
          item.id === coupon.id ? { ...item, usageCount: (item.usageCount ?? 0) + 1 } : item
        )
      );
    } catch (err) {
      console.error('Error using coupon:', err);
    }
  };

  const renderCouponsTab = () => {
    const statusOptions = ['all', 'active', 'stopped', 'expired'] as const;
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => {
      const exp = c.expirationDate instanceof Date ? c.expirationDate : new Date(c.expirationDate);
      return c.status === 'active' && (!isNaN(exp.getTime()) ? exp >= new Date() : true);
    }).length;
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);

    return (
    <View style={styles.tabContent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md }}>
        <View style={styles.searchContainer}>
          <Search size={16} color={Theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coupons..."
            placeholderTextColor={Theme.colors.textLight}
            value={couponSearchQuery}
            onChangeText={setCouponSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateCouponModal(true)}>
          <Plus size={16} color="white" />
          <Text style={styles.createButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.sm }}>
        <View style={{ flex: 1, backgroundColor: '#f0f4ff', borderRadius: 10, padding: 10, marginRight: 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary }}>{totalCoupons}</Text>
          <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Total</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, marginHorizontal: 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.success }}>{activeCoupons}</Text>
          <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Active</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginLeft: 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.error }}>{totalUsage}</Text>
          <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Used</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: Theme.spacing.md }}>
        {statusOptions.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => setCouponStatusFilter(opt)}
            style={{
              paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, marginRight: 6,
              backgroundColor: couponStatusFilter === opt ? Theme.colors.primary : '#f0f0f0',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: couponStatusFilter === opt ? '600' : '400', color: couponStatusFilter === opt ? 'white' : '#666', textTransform: 'capitalize' }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {couponsLoading && filteredCoupons.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : filteredCoupons.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Gift size={48} color="#ddd" />
          <Text style={{ marginTop: 12, fontSize: 16, color: Theme.colors.textLight }}>No coupons found</Text>
          <TouchableOpacity style={[styles.createButton, { marginTop: 16 }]} onPress={() => setShowCreateCouponModal(true)}>
            <Plus size={16} color="white" />
            <Text style={styles.createButtonText}>Create One</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <FlatList
        data={filteredCoupons}
        keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
        renderItem={({ item }) => {
          const expirationDate = item.expirationDate instanceof Date
            ? item.expirationDate
            : new Date(item.expirationDate);
          const hasValidExpirationDate = !Number.isNaN(expirationDate.getTime());
          const isExpired = hasValidExpirationDate ? expirationDate < new Date() : false;
          const isStopped = item.status === 'stopped';
          const usageCount = item.usageCount ?? 0;
          const maxUsage = item.maxUsage ?? 0;
          const isMaxed = maxUsage > 0 && usageCount >= maxUsage;
          const usagePercent = maxUsage > 0 ? Math.min(100, Math.round((usageCount / maxUsage) * 100)) : 0;
          let statusColor = Theme.colors.success;
          let statusBg = '#f0fdf4';
          let statusText = 'Active';
          if (isExpired) {
            statusColor = Theme.colors.error;
            statusBg = '#fef2f2';
            statusText = 'Expired';
          } else if (isStopped) {
            statusColor = Theme.colors.warning;
            statusBg = '#fffbeb';
            statusText = 'Stopped';
          }
          return (
            <Card style={[styles.couponItem, { borderLeftWidth: 0, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.couponName, { marginBottom: 2 }]}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.couponCode, { marginBottom: 0, marginRight: 8 }]}>{item.code}</Text>
                    <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>{statusText}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ backgroundColor: item.type === 'percentage' ? '#eef2ff' : '#ecfdf5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, alignItems: 'center', minWidth: 60 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: item.type === 'percentage' ? Theme.colors.primary : Theme.colors.success }}>
                    {item.type === 'percentage' ? `${item.discount}%` : `$${item.discount}`}
                  </Text>
                  <Text style={{ fontSize: 9, color: Theme.colors.textLight }}>OFF</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, color: '#666' }}>{item.scope === 'all' ? 'All services' : '1 service'}</Text>
                </View>
                {Number(item.minOrderAmount) > 0 && (
                  <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6 }}>
                    <Text style={{ fontSize: 11, color: '#666' }}>Min ${Number(item.minOrderAmount)}</Text>
                  </View>
                )}
                <View style={{ marginLeft: 'auto' }}>
                  <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>
                    {hasValidExpirationDate ? `Exp ${expirationDate.toLocaleDateString()}` : 'No expiry'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: '#888', marginRight: 8 }}>{usageCount}/{maxUsage === 999999 ? '∞' : maxUsage} used</Text>
                <View style={{ flex: 1, height: 5, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${usagePercent}%`, height: 5, backgroundColor: statusColor, borderRadius: 3 }} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 8, marginTop: 2 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: isStopped ? '#f0fdf4' : '#fffbeb', marginRight: 8, opacity: isExpired ? 0.4 : 1 }}
                  disabled={isExpired}
                  onPress={() => {
                    Alert.alert(isStopped ? 'Resume Coupon?' : 'Pause Coupon?', `"${item.code}" will be ${isStopped ? 'activated' : 'deactivated'}.`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: isStopped ? 'Resume' : 'Pause', style: 'destructive', onPress: () => handleToggleCouponStatus(item) },
                    ]);
                  }}
                >
                  <Play size={12} color={isStopped ? Theme.colors.success : Theme.colors.warning} />
                  <Text style={{ fontSize: 11, color: isStopped ? Theme.colors.success : Theme.colors.warning, marginLeft: 4, fontWeight: '500' }}>{isStopped ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#eff6ff', marginRight: 8, opacity: isMaxed || isExpired || isStopped ? 0.4 : 1 }}
                  disabled={isMaxed || isExpired || isStopped}
                  onPress={() => handleUseCoupon(item)}
                >
                  <ShoppingBag size={12} color={Theme.colors.info} />
                  <Text style={{ fontSize: 11, color: Theme.colors.info, marginLeft: 4, fontWeight: '500' }}>Use</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 4 }} onPress={() => handleDeleteCoupon(item)}>
                  <Trash2 size={16} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      )}
    </View>
    );
  };

  const renderUserModal = () => (
    <Modal visible={showUserModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowUserModal(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>User Details</Text>
          <TouchableOpacity onPress={() => setShowUserModal(false)}><X size={24} color={Theme.colors.textDark} /></TouchableOpacity>
        </View>
        {selectedUser && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.userDetailSection}><Text style={styles.userDetailLabel}>Name</Text><Text style={styles.userDetailValue}>{selectedUser.name}</Text></View>
            <View style={styles.userDetailSection}><Text style={styles.userDetailLabel}>Email</Text><Text style={styles.userDetailValue}>{selectedUser.email}</Text></View>
            <View style={styles.userDetailSection}><Text style={styles.userDetailLabel}>Phone</Text><Text style={styles.userDetailValue}>{selectedUser.phone}</Text></View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.emailButton]} onPress={() => handleSendEmail(selectedUser.id)}>
                <Mail size={16} color="white" />
                <Text style={styles.modalButtonText}>Send Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.notificationButton]} onPress={() => handleSendNotification(selectedUser.id)}>
                <Bell size={16} color="white" />
                <Text style={styles.modalButtonText}>Send Notification</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEditUserModal = () => (
    <Modal visible={showEditUserModal} animationType="slide" onRequestClose={() => setShowEditUserModal(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit User</Text>
          <TouchableOpacity onPress={() => setShowEditUserModal(false)}><X size={24} color={Theme.colors.textDark} /></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {editUser && ['name','email','phone','role','region','status'].map(field => (
            <View key={field} style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
              <TextInput style={styles.userDetailValue} value={editUser[field]} onChangeText={text => setEditUser(prev => prev ? { ...prev, [field]: text } : null)} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} />
            </View>
          ))}
          <TouchableOpacity style={[styles.modalButton, styles.emailButton]} onPress={handleUpdateUser}>
            <Check size={16} color="white" />
            <Text style={styles.modalButtonText}>Update</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderCreateCouponModal = () => {
    const previewDiscount = newCoupon.discount ? `${newCoupon.discount}${newCoupon.type === 'percentage' ? '%' : '$'}` : '—';
    return (
    <Modal visible={showCreateCouponModal} animationType="slide" onRequestClose={() => { setShowCreateCouponModal(false); resetNewCouponForm(); }} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, width: '88%', maxHeight: '92%', overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Create Coupon</Text>
            <TouchableOpacity onPress={() => { setShowCreateCouponModal(false); resetNewCouponForm(); }} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Coupon Details</Text>
            <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 4 }}>Name</Text>
            <TextInput placeholder="e.g. Summer Sale" value={newCoupon.name} onChangeText={text => setNewCoupon(prev => ({ ...prev, name: text }))} style={{ borderWidth: 1, borderColor: '#e0e0e0', padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 14, backgroundColor: '#fafafa' }} />
            <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 4 }}>Code</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TextInput placeholder="e.g. SUMMER20" value={newCoupon.code} onChangeText={text => setNewCoupon(prev => ({ ...prev, code: text.toUpperCase() }))} style={{ flex: 1, borderWidth: 1, borderColor: '#e0e0e0', padding: 10, borderRadius: 10, marginRight: 8, fontSize: 14, backgroundColor: '#fafafa', fontFamily: 'monospace' }} autoCapitalize="characters" />
              <TouchableOpacity onPress={() => { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let code = ''; for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]; setNewCoupon(prev => ({ ...prev, code })); }} style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>Generate</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Discount</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TextInput placeholder="0" keyboardType="numeric" value={String(newCoupon.discount)} onChangeText={text => setNewCoupon(prev => ({ ...prev, discount: text }))} style={{ flex: 1, borderWidth: 1, borderColor: '#e0e0e0', padding: 10, borderRadius: 10, marginRight: 8, fontSize: 14, backgroundColor: '#fafafa' }} />
              <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e0e0e0' }}>
                <TouchableOpacity onPress={() => setNewCoupon(prev => ({ ...prev, type: 'percentage' }))} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: newCoupon.type === 'percentage' ? Theme.colors.primary : '#fafafa' }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: newCoupon.type === 'percentage' ? 'white' : '#666' }}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNewCoupon(prev => ({ ...prev, type: 'fixed' }))} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: newCoupon.type === 'fixed' ? Theme.colors.primary : '#fafafa' }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: newCoupon.type === 'fixed' ? 'white' : '#666' }}>$</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 4 }}>Max Uses</Text>
                <TextInput placeholder="Unlimited" keyboardType="numeric" value={String(newCoupon.maxUsage)} onChangeText={text => setNewCoupon(prev => ({ ...prev, maxUsage: text }))} style={{ borderWidth: 1, borderColor: '#e0e0e0', padding: 10, borderRadius: 10, fontSize: 14, backgroundColor: '#fafafa' }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 4 }}>Expires</Text>
                <TouchableOpacity
                  onPress={() => setShowCouponExpiryPicker(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e0e0e0', padding: 10, borderRadius: 10, minHeight: 42, backgroundColor: '#fafafa' }}
                >
                  <Text style={{ color: newCoupon.expirationDate ? '#333' : '#999', fontSize: 14 }}>
                    {newCoupon.expirationDate || 'Select expiration date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={Theme.colors.primary} />
                </TouchableOpacity>
                {showCouponExpiryPicker && (
                  <DateTimePicker
                    value={couponExpiryDate || new Date()}
                    mode="date"
                    minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
                    onChange={(_, selectedDate) => {
                      setShowCouponExpiryPicker(false);
                      if (selectedDate) {
                        setCouponExpiryDate(selectedDate);
                        setNewCoupon(prev => ({
                          ...prev,
                          expirationDate: selectedDate.toLocaleDateString(),
                        }));
                      }
                    }}
                  />
                )}
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: Theme.colors.textLight, marginBottom: 4 }}>Min Order Amount (optional)</Text>
              <TextInput placeholder="0" keyboardType="numeric" value={String(newCoupon.minOrderAmount)} onChangeText={text => setNewCoupon(prev => ({ ...prev, minOrderAmount: text }))} style={{ borderWidth: 1, borderColor: '#e0e0e0', padding: 10, borderRadius: 10, fontSize: 14, backgroundColor: '#fafafa' }} />
            </View>
            <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Apply To</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setNewCoupon(prev => ({ ...prev, scope: 'all', selectedServiceId: '', selectedServiceName: '' }))} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: newCoupon.scope === 'all' ? Theme.colors.primary : '#e0e0e0', backgroundColor: newCoupon.scope === 'all' ? 'rgba(67,97,238,0.06)' : '#fafafa', marginRight: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginBottom: 2 }}>🌐</Text>
                <Text style={{ fontWeight: '600', fontSize: 13, color: newCoupon.scope === 'all' ? Theme.colors.primary : '#666' }}>All</Text>
                <Text style={{ fontSize: 11, color: newCoupon.scope === 'all' ? Theme.colors.primary : '#999' }}>Services</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNewCoupon(prev => ({ ...prev, scope: 'specific' }))} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: newCoupon.scope === 'specific' ? Theme.colors.primary : '#e0e0e0', backgroundColor: newCoupon.scope === 'specific' ? 'rgba(67,97,238,0.06)' : '#fafafa', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginBottom: 2 }}>🎯</Text>
                <Text style={{ fontWeight: '600', fontSize: 13, color: newCoupon.scope === 'specific' ? Theme.colors.primary : '#666' }}>Specific</Text>
                <Text style={{ fontSize: 11, color: newCoupon.scope === 'specific' ? Theme.colors.primary : '#999' }}>Service</Text>
              </TouchableOpacity>
            </View>
            {newCoupon.scope === 'specific' && (
              <View style={{ maxHeight: 160, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 10, marginBottom: 12, backgroundColor: '#fafafa' }}>
                {newCoupon.selectedServiceName ? (
                  <View style={{ backgroundColor: 'rgba(67,97,238,0.08)', padding: 8, borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Check size={14} color={Theme.colors.primary} />
                    <Text style={{ fontSize: 13, color: Theme.colors.primary, fontWeight: '500', marginLeft: 6, flex: 1 }}>{newCoupon.selectedServiceName}</Text>
                  </View>
                ) : (
                  <Text style={{ marginBottom: 6, color: Theme.colors.textLight, fontSize: 12 }}>Tap a service to select</Text>
                )}
                <ScrollView>
                  {services.filter(s => s.type === 'service').map(item => {
                    const selected = newCoupon.selectedServiceId === item.id;
                    return (
                      <TouchableOpacity key={item.id} onPress={() => setNewCoupon(prev => ({ ...prev, selectedServiceId: item.id, selectedServiceName: item.name || item.title || '' }))} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, backgroundColor: selected ? 'rgba(67,97,238,0.05)' : 'transparent', borderRadius: 8, paddingHorizontal: 6 }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? Theme.colors.primary : '#ccc', backgroundColor: selected ? Theme.colors.primary : 'white', marginRight: 10, justifyContent: 'center', alignItems: 'center' }}>
                          {selected && <Check size={12} color="white" />}
                        </View>
                        <Text style={{ flex: 1, fontSize: 13 }}>{item.name || item.title || 'Untitled'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
            <TouchableOpacity onPress={() => { setShowCreateCouponModal(false); resetNewCouponForm(); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center', marginRight: 10 }}>
              <Text style={{ color: '#666', fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateCoupon} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Theme.colors.primary, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Create Coupon</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    );
  };

  const renderBulkNotificationModal = () => (
    <Modal visible={showBulkNotificationModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBulkNotificationModal(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Send Bulk Notification</Text>
          <TouchableOpacity onPress={() => setShowBulkNotificationModal(false)}><X size={24} color={Theme.colors.textDark} /></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <View style={styles.userDetailSection}>
            <Text style={styles.userDetailLabel}>Target Group</Text>
            <View style={styles.targetGroupContainer}>
              <TouchableOpacity style={[styles.targetGroupButton, notificationMessage.targetGroup === 'all' && styles.activeTargetGroup]} onPress={() => setNotificationMessage(prev => ({ ...prev, targetGroup: 'all' }))}>
                <Text style={[styles.targetGroupText, notificationMessage.targetGroup === 'all' && styles.activeTargetGroupText]}>All Users ({users.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.targetGroupButton, notificationMessage.targetGroup === 'filtered' && styles.activeTargetGroup]} onPress={() => setNotificationMessage(prev => ({ ...prev, targetGroup: 'filtered' }))}>
                <Text style={[styles.targetGroupText, notificationMessage.targetGroup === 'filtered' && styles.activeTargetGroupText]}>Filtered Users ({filteredUsers.length})</Text>
              </TouchableOpacity>
              {selectedUsers.length > 0 && (
                <TouchableOpacity style={[styles.targetGroupButton, notificationMessage.targetGroup === 'selected' && styles.activeTargetGroup]} onPress={() => setNotificationMessage(prev => ({ ...prev, targetGroup: 'selected' }))}>
                  <Text style={[styles.targetGroupText, notificationMessage.targetGroup === 'selected' && styles.activeTargetGroupText]}>Selected Users ({selectedUsers.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.userDetailSection}>
            <Text style={styles.userDetailLabel}>Notification Title</Text>
            <TextInput style={styles.notificationInput} placeholder="Enter notification title..." value={notificationMessage.title} onChangeText={text => setNotificationMessage(prev => ({ ...prev, title: text }))} multiline={false} />
          </View>
          <View style={styles.userDetailSection}>
            <Text style={styles.userDetailLabel}>Notification Message</Text>
            <TextInput style={[styles.notificationInput, styles.messageInput]} placeholder="Enter your notification message..." value={notificationMessage.body} onChangeText={text => setNotificationMessage(prev => ({ ...prev, body: text }))} multiline numberOfLines={4} textAlignVertical="top" />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.notificationButton]} onPress={handleSendBulkNotification}>
              <Bell size={16} color="white" />
              <Text style={styles.modalButtonText}>Send Notification</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} onPress={() => setActiveTab('dashboard')}>
        <Activity size={20} color={activeTab === 'dashboard' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'users' && styles.activeTab]} onPress={() => setActiveTab('users')}>
        <Users size={20} color={activeTab === 'users' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'services' && styles.activeTab]} onPress={() => setActiveTab('services')}>
        <ClipboardCheck size={20} color={activeTab === 'services' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>Services</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'financial' && styles.activeTab]} onPress={() => setActiveTab('financial')}>
        <BarChart size={20} color={activeTab === 'financial' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'financial' && styles.activeTabText]}>Financial</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'coupons' && styles.activeTab]} onPress={() => setActiveTab('coupons')}>
        <Gift size={20} color={activeTab === 'coupons' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'coupons' && styles.activeTabText]}>Coupons</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardTab();
      case 'users': return renderUsersTab();
      case 'services': return renderServicesTab();
      case 'financial': return renderFinancialTab();
      case 'coupons': return renderCouponsTab();
      default: return renderDashboardTab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {renderTabContent()}
      {!hideTabBar && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: Theme.colors.background }}>
          {renderTabBar()}
        </SafeAreaView>
      )}
      {renderUserModal()}
      {renderEditUserModal()}
      {renderServiceModal()}
      {renderCreateCouponModal()}
      {renderBulkNotificationModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  tabContent: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  header: {
    marginBottom: Theme.spacing.xl,
  },
  greeting: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.xs,
  },
  date: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  metricIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  metricValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
  },
  metricLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
  },
  metricSubtext: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.success,
    marginTop: 2,
  },
  quickActionsCard: {
    marginBottom: Theme.spacing.lg,
  },
  cardTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
    marginBottom: Theme.spacing.sm,
  },
  quickActionText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: Theme.spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  statusItem: {
    width: '48%',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  statusLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  statusValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.primary,
    marginTop: Theme.spacing.xs,
  },
  statusSubtext: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginTop: 2,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.success,
    marginRight: Theme.spacing.xs,
  },
  healthText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.success,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginRight: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginLeft: Theme.spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  filterText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
    marginLeft: Theme.spacing.xs,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  userEmail: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.md / 2,
  },
  userRole: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
    marginRight: Theme.spacing.sm,
  },
  statusText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: 'white',
    textTransform: 'capitalize',
  },
  serviceItem: {
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  serviceCategory: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
  },
  serviceCreator: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
  },
  serviceStatus: {
    marginLeft: Theme.spacing.md,
  },
  serviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  serviceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  serviceStatText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginLeft: Theme.spacing.xs,
  },
  servicePrice: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
    marginLeft: 'auto',
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginLeft: Theme.spacing.sm,
  },
  approveButton: {
    backgroundColor: Theme.colors.success,
  },
  rejectButton: {
    backgroundColor: Theme.colors.error,
  },
  actionButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: 'white',
    marginLeft: Theme.spacing.xs,
  },
  financialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
  },
  revenueCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  revenueCard: {
    width: '48%',
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  revenueLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  revenueValue: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.xs,
  },
  revenueChange: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.success,
    marginTop: 2,
  },
  couponsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  createButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: 'white',
    marginLeft: Theme.spacing.xs,
  },
  couponItem: {
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  couponName: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  couponCode: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  couponDiscount: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.success,
    marginBottom: Theme.spacing.sm,
  },
  couponStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  couponStat: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
  },
  couponActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: Theme.spacing.sm,
    marginRight: Theme.spacing.sm,
  },
  deleteButton: {
    padding: Theme.spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
  },
  modalContent: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  userDetailSection: {
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  userDetailLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.xs,
  },
  userDetailValue: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.xl,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: Theme.colors.primary,
    marginRight: Theme.spacing.sm,
  },
  notificationButton: {
    backgroundColor: Theme.colors.info,
    marginLeft: Theme.spacing.sm,
  },
  modalButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: 'white',
    marginLeft: Theme.spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.background,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
  },
  activeTabText: {
    color: Theme.colors.primary,
  },
  bulkActionsContainer: {
    marginBottom: Theme.spacing.lg,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  bulkActionText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: 'white',
    marginLeft: Theme.spacing.xs,
  },
  notifyAllButton: {
    backgroundColor: Theme.colors.primary,
  },
  notifyFilteredButton: {
    backgroundColor: Theme.colors.info,
  },
  selectModeButton: {
    backgroundColor: Theme.colors.warning,
  },
  selectAllButton: {
    backgroundColor: Theme.colors.success,
  },
  clearButton: {
    backgroundColor: Theme.colors.error,
  },
  notifySelectedButton: {
    backgroundColor: Theme.colors.primary,
    marginTop: Theme.spacing.sm,
  },
  selectedUserItem: {
    backgroundColor: Theme.colors.background,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  checkboxContainer: {
    marginRight: Theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  notifyButton: {
    padding: Theme.spacing.sm,
    marginRight: Theme.spacing.sm,
  },
  targetGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Theme.spacing.sm,
  },
  targetGroupButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  activeTargetGroup: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  targetGroupText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textDark,
  },
  activeTargetGroupText: {
    color: 'white',
  },
  notificationInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.sm,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  loadingText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptyMessage: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  refreshButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  refreshButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: 'white',
  },
});
