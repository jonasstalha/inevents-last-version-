import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore';
import {
  Activity,
  ChartBar as BarChart,
  Bell,
  Check,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Gift,
  Mail,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../src/firebase/firebaseConfig';

import { Card } from '@/src/components/common/Card';
import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { useAuth } from '@/src/context/AuthContext';

// Use getFirestore() for db
const db = getFirestore();

// Mock data for demo purposes
const mockServices = [
  {
    id: '1',
    name: 'Portrait Photography',
    category: 'Photography',
    creator: 'John Doe',
    status: 'approved',
    price: 150,
    views: 245,
    purchases: 12,
    createdAt: new Date('2024-11-01'),
  },
  {
    id: '2',
    name: 'Logo Design',
    category: 'Design',
    creator: 'Jane Smith',
    status: 'pending',
    price: 75,
    views: 89,
    purchases: 3,
    createdAt: new Date('2024-12-01'),
  },
];

const mockCoupons = [
  {
    id: '1',
    name: 'Holiday Special',
    code: 'HOLIDAY2024',
    discount: 20,
    type: 'percentage',
    expirationDate: new Date('2024-12-31'),
    usageCount: 45,
    maxUsage: 100,
    status: 'active',
  },
  {
    id: '2',
    name: 'New User Discount',
    code: 'NEWUSER50',
    discount: 50,
    type: 'fixed',
    expirationDate: new Date('2025-01-31'),
    usageCount: 23,
    maxUsage: 200,
    status: 'active',
  },
];

const mockFinancialData = {
  totalRevenue: 45670,
  weeklyIncome: 2340,
  monthlyIncome: 12450,
  averageOrderValue: 125,
  topEarners: [
    { name: 'John Doe', revenue: 2500 },
    { name: 'Bob Johnson', revenue: 1800 },
    { name: 'Alice Brown', revenue: 1600 },
  ],
  revenueData: [
    { month: 'Jan', revenue: 3400 },
    { month: 'Feb', revenue: 4200 },
    { month: 'Mar', revenue: 3800 },
    { month: 'Apr', revenue: 4600 },
    { month: 'May', revenue: 5200 },
    { month: 'Jun', revenue: 4800 },
  ],
};

// User type definition
type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  signupDate: Date;
  lastLogin: Date;
  revenue: number;
  region: string;
};

// Service type definition
type Service = {
  id: string;
  name: string;
  category: string;
  creator: string;
  status: string;
  price: number;
  views: number;
  purchases: number;
  createdAt: Date;
};

// Coupon type definition
type Coupon = {
  id: string;
  name: string;
  code: string;
  discount: number;
  type: string;
  expirationDate: Date;
  usageCount: number;
  maxUsage: number;
  status: string;
};

// Filter types
type UserFilters = {
  role: string;
  status: string;
  region: string;
};

type ServiceFilters = {
  category: string;
  status: string;
  creator: string;
};

export default function AdminPanelScreen() {
  const { user } = useAuth();
  const { artists, orders, gigs, tickets } = useApp();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  // Replace mockUsers with real users from Firebase
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
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
  
  // Search queries
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  
  // Filters
  const [userFilters, setUserFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    region: 'all',
  });
  
  const [serviceFilters, setServiceFilters] = useState<ServiceFilters>({
    category: 'all',
    status: 'all',
    creator: 'all',
  });

  // Computed values
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingServices = services.filter(s => s.status === 'pending').length;
  const totalRevenue = mockFinancialData.totalRevenue;

  // Enhanced filter functions
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = userSearchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' || 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchLower);
      
      // Role filter
      const matchesRole = userFilters.role === 'all' || user.role === userFilters.role;
      
      // Status filter
      const matchesStatus = userFilters.status === 'all' || user.status === userFilters.status;
      
      // Region filter
      const matchesRegion = userFilters.region === 'all' || user.region === userFilters.region;
      
      return matchesSearch && matchesRole && matchesStatus && matchesRegion;
    });
  }, [users, userSearchQuery, userFilters]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Search filter
      const searchLower = serviceSearchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' || 
        service.name.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower) ||
        service.creator.toLowerCase().includes(searchLower);
      
      // Category filter
      const matchesCategory = serviceFilters.category === 'all' || service.category === serviceFilters.category;
      
      // Status filter
      const matchesStatus = serviceFilters.status === 'all' || service.status === serviceFilters.status;
      
      // Creator filter
      const matchesCreator = serviceFilters.creator === 'all' || service.creator === serviceFilters.creator;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesCreator;
    });
  }, [services, serviceSearchQuery, serviceFilters]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      // Search filter
      const searchLower = couponSearchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' || 
        coupon.name.toLowerCase().includes(searchLower) ||
        coupon.code.toLowerCase().includes(searchLower);
      
      return matchesSearch;
    });
  }, [coupons, couponSearchQuery]);

  // Filter helper functions
  const clearAllFilters = () => {
    setUserSearchQuery('');
    setServiceSearchQuery('');
    setCouponSearchQuery('');
    setUserFilters({
      role: 'all',
      status: 'all',
      region: 'all',
    });
    setServiceFilters({
      category: 'all',
      status: 'all',
      creator: 'all',
    });
  };

  const updateUserFilter = (key: keyof UserFilters, value: string) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateServiceFilter = (key: keyof ServiceFilters, value: string) => {
    setServiceFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get unique values for filter options
  const getUniqueRoles = () => {
    const roles = [...new Set(users.map(user => user.role))];
    return [{ label: 'All Roles', value: 'all' }, ...roles.map(role => ({ label: role.charAt(0).toUpperCase() + role.slice(1), value: role }))];
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(users.map(user => user.status))];
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
    const statuses = [...new Set(services.map(service => service.status))];
    return [{ label: 'All Statuses', value: 'all' }, ...statuses.map(status => ({ label: status.charAt(0).toUpperCase() + status.slice(1), value: status }))];
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // --- EMAIL & NOTIFICATION SENDING HELPERS ---
  // IMPORTANT: Replace with your actual deployed Firebase Functions URL, e.g.:
  // const CLOUD_FUNCTION_BASE_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net';
  const CLOUD_FUNCTION_BASE_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net'; // <-- Set this to your real URL

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

  async function sendNotificationToUser(user: User) {
    try {
      const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/sendNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          email: user.email,
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

  // Statistics based on filtered data
  const getFilteredStats = () => {
    const userStats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      inactive: filteredUsers.filter(u => u.status === 'inactive').length,
      artists: filteredUsers.filter(u => u.role === 'artist').length,
      clients: filteredUsers.filter(u => u.role === 'client').length,
      totalRevenue: filteredUsers.reduce((sum, u) => sum + u.revenue, 0),
    };

    const serviceStats = {
      total: filteredServices.length,
      approved: filteredServices.filter(s => s.status === 'approved').length,
      pending: filteredServices.filter(s => s.status === 'pending').length,
      totalViews: filteredServices.reduce((sum, s) => sum + s.views, 0),
      totalPurchases: filteredServices.reduce((sum, s) => sum + s.purchases, 0),
    };

    return { userStats, serviceStats };
  };

 
  const handleApproveService = (serviceId: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, status: 'approved' }
          : service
      )
    );
  };

  const handleRejectService = (serviceId: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, status: 'rejected' }
          : service
      )
    );
  };

  // Fetch users from Firebase
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || '',
          status: data.status || 'active',
          signupDate: data.signupDate?.toDate ? data.signupDate.toDate() : new Date(),
          lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : new Date(),
          revenue: data.revenue || 0,
          region: data.region || '',
        };
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Delete user from Firebase
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    }
  };



  // UPDATE USER
  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      await updateDoc(doc(db, 'users', editUser.id), {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        status: editUser.status,
        region: editUser.region,
        revenue: editUser.revenue,
      });
      setShowEditUserModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  // Coupon creation state
  const [newCoupon, setNewCoupon] = useState({
    name: '',
    code: '',
    discount: '',
    type: 'percentage',
    expirationDate: '',
    maxUsage: '',
    status: 'active',
  });

  // Create coupon in Firestore
  const handleCreateCoupon = async () => {
    if (!newCoupon.name || !newCoupon.code || !newCoupon.discount || !newCoupon.expirationDate || !newCoupon.maxUsage) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      const couponData = {
        name: newCoupon.name,
        code: newCoupon.code,
        discount: Number(newCoupon.discount),
        type: newCoupon.type,
        expirationDate: new Date(newCoupon.expirationDate),
        usageCount: 0,
        maxUsage: Number(newCoupon.maxUsage),
        status: newCoupon.status,
      };
      const docRef = await addDoc(collection(db, 'coupons'), couponData);
      setCoupons(prev => [
        { ...couponData, id: docRef.id },
        ...prev,
      ]);
      setShowCreateCouponModal(false);
      setNewCoupon({
        name: '',
        code: '',
        discount: '',
        type: 'percentage',
        expirationDate: '',
        maxUsage: '',
        status: 'active',
      });
      Alert.alert('Success', 'Coupon created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create coupon');
    }
  };

  // Toggle coupon status (active <-> stopped)
  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      const newStatus = coupon.status === 'active' ? 'stopped' : 'active';
      await updateDoc(doc(db, 'coupons', coupon.id), { status: newStatus });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: newStatus } : c));
    } catch (error) {
      Alert.alert('Error', 'Failed to update coupon status');
    }
  };

  // Increment coupon usageCount (simulate usage)
  const handleUseCoupon = async (coupon: Coupon) => {
    if (coupon.usageCount >= coupon.maxUsage) {
      Alert.alert('Limit reached', 'This coupon has reached its max usage.');
      return;
    }
    try {
      const newUsage = coupon.usageCount + 1;
      await updateDoc(doc(db, 'coupons', coupon.id), { usageCount: newUsage });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, usageCount: newUsage } : c));
    } catch (error) {
      Alert.alert('Error', 'Failed to increment usage');
    }
  };

  // Fetch users on mount
  React.useEffect(() => {
    fetchUsers();
  }, []);

  const renderDashboardTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <Card variant="elevated" style={styles.metricCard}>
          <View style={styles.metricIconContainer}>
            <Users size={24} color={Theme.colors.primary} />
          </View>
          <Text style={styles.metricValue}>{totalUsers}</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
          <Text style={styles.metricSubtext}>{activeUsers} active</Text>
        </Card>

        <Card variant="elevated" style={styles.metricCard}>
          <View style={styles.metricIconContainer}>
            <DollarSign size={24} color={Theme.colors.success} />
          </View>
          <Text style={styles.metricValue}>${totalRevenue.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Total Revenue</Text>
          <Text style={styles.metricSubtext}>+12% this month</Text>
        </Card>

        <Card variant="elevated" style={styles.metricCard}>
          <View style={styles.metricIconContainer}>
            <ClipboardCheck size={24} color={Theme.colors.warning} />
          </View>
          <Text style={styles.metricValue}>{pendingServices}</Text>
          <Text style={styles.metricLabel}>Pending Services</Text>
          <Text style={styles.metricSubtext}>Need approval</Text>
        </Card>

        <Card variant="elevated" style={styles.metricCard}>
          <View style={styles.metricIconContainer}>
            <TrendingUp size={24} color={Theme.colors.info} />
          </View>
          <Text style={styles.metricValue}>{mockFinancialData.weeklyIncome}</Text>
          <Text style={styles.metricLabel}>Weekly Income</Text>
          <Text style={styles.metricSubtext}>+8% vs last week</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card variant="elevated" style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setActiveTab('users')}
          >
            <Users size={20} color={Theme.colors.primary} />
            <Text style={styles.quickActionText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setActiveTab('services')}
          >
            <ClipboardCheck size={20} color={Theme.colors.primary} />
            <Text style={styles.quickActionText}>Review Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setActiveTab('financial')}
          >
            <BarChart size={20} color={Theme.colors.primary} />
            <Text style={styles.quickActionText}>View Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => setActiveTab('coupons')}
          >
            <Gift size={20} color={Theme.colors.primary} />
            <Text style={styles.quickActionText}>Manage Coupons</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Platform Status */}
      <Card variant="elevated" style={styles.statusCard}>
        <Text style={styles.cardTitle}>Platform Status</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Artists</Text>
            <Text style={styles.statusValue}>{artists.length}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Services</Text>
            <Text style={styles.statusValue}>{gigs.length}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Orders</Text>
            <Text style={styles.statusValue}>{orders.length}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Tickets</Text>
            <Text style={styles.statusValue}>{tickets.length}</Text>
          </View>
        </View>
        <View style={styles.healthStatus}>
          <View style={styles.healthIndicator} />
          <Text style={styles.healthText}>System Operational</Text>
        </View>
      </Card>


    </ScrollView>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      
      {/* Search and Filters */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={userSearchQuery}
            onChangeText={setUserSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={16} color={Theme.colors.primary} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => {
              setSelectedUser(item);
              setShowUserModal(true);
            }}
            onLongPress={() => {
              setEditUser(item);
              setShowEditUserModal(true);
            }}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userRole}>{item.role} • {item.region}</Text>
            </View>
            <View style={styles.userActions}>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? Theme.colors.success : Theme.colors.warning }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.deleteButton}>
                <Trash2 size={16} color={Theme.colors.error} />
              </TouchableOpacity>
              <ChevronRight size={16} color={Theme.colors.textLight} />
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );

  const renderServicesTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.serviceItem}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceCategory}>{item.category}</Text>
                <Text style={styles.serviceCreator}>By {item.creator}</Text>
              </View>
              <View style={styles.serviceStatus}>
                <View style={[styles.statusBadge, { 
                  backgroundColor: item.status === 'approved' ? Theme.colors.success : 
                                 item.status === 'pending' ? Theme.colors.warning : Theme.colors.error 
                }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.serviceStats}>
              <View style={styles.serviceStat}>
                <Eye size={16} color={Theme.colors.textLight} />
                <Text style={styles.serviceStatText}>{item.views} views</Text>
              </View>
              <View style={styles.serviceStat}>
                <CreditCard size={16} color={Theme.colors.textLight} />
                <Text style={styles.serviceStatText}>{item.purchases} sales</Text>
              </View>
              <Text style={styles.servicePrice}>${item.price}</Text>
            </View>

            {item.status === 'pending' && (
              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveService(item.id)}
                >
                  <Check size={16} color="white" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectService(item.id)}
                >
                  <X size={16} color="white" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );

  const renderFinancialTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.financialHeader}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
      </View>
      {/* Revenue Cards */}
      <View style={styles.revenueCards}>
        <Card variant="elevated" style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>${mockFinancialData.totalRevenue.toLocaleString()}</Text>
          <Text style={styles.revenueChange}>+12% from last month</Text>
        </Card>
        <Card variant="elevated" style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Monthly Income</Text>
          <Text style={styles.revenueValue}>${mockFinancialData.monthlyIncome.toLocaleString()}</Text>
          <Text style={styles.revenueChange}>+8% from last month</Text>
        </Card>
        <Card variant="elevated" style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Average Order</Text>
          <Text style={styles.revenueValue}>${mockFinancialData.averageOrderValue}</Text>
          <Text style={styles.revenueChange}>+5% from last month</Text>
        </Card>
      </View>
      <View style={{marginTop: 24, alignItems: 'center'}}>
        <Text style={{fontSize: 16, color: Theme.colors.textLight, textAlign: 'center'}}>
          Track your platform's financial health at a glance. Export data for deeper analysis.
        </Text>
      </View>
    </View>
  );

  const renderCouponsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.couponsHeader}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateCouponModal(true)}
        >
          <Plus size={16} color="white" />
          <Text style={styles.createButtonText}>Create Coupon</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={coupons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isExpired = item.expirationDate < new Date();
          const isStopped = item.status === 'stopped';
          const isMaxed = item.usageCount >= item.maxUsage;
          const usagePercent = Math.min(100, Math.round((item.usageCount / item.maxUsage) * 100));
          let statusColor = Theme.colors.success;
          let statusText = 'Active';
          if (isExpired) {
            statusColor = Theme.colors.error;
            statusText = 'Expired';
          } else if (isStopped) {
            statusColor = Theme.colors.warning;
            statusText = 'Stopped';
          }
          return (
            <Card variant="elevated" style={[styles.couponItem, { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }]}> 
              <View style={styles.couponHeader}>
                <Text style={styles.couponName}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}> 
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
              </View>
              <Text style={styles.couponCode}>{item.code}</Text>
              <Text style={styles.couponDiscount}>
                {item.type === 'percentage' ? `${item.discount}%` : `$${item.discount}`} off
              </Text>
              <View style={styles.couponStats}>
                <Text style={styles.couponStat}>Used: {item.usageCount}/{item.maxUsage}</Text>
                <Text style={styles.couponStat}>
                  Expires: {item.expirationDate.toLocaleDateString()}
                </Text>
              </View>
              {/* Usage Progress Bar */}
              <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 8 }}>
                <View style={{ width: `${usagePercent}%`, height: 8, backgroundColor: statusColor, borderRadius: 4 }} />
              </View>
              <View style={styles.couponActions}>
                <TouchableOpacity
                  style={[styles.editButton, { opacity: isExpired ? 0.5 : 1 }]}
                  disabled={isExpired}
                  onPress={() => {
                    Alert.alert(
                      isStopped ? 'Continue Coupon?' : 'Stop Coupon?',
                      `Are you sure you want to ${isStopped ? 'continue' : 'stop'} this coupon?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: isStopped ? 'Continue' : 'Stop', style: 'destructive', onPress: () => handleToggleCouponStatus(item) },
                      ]
                    );
                  }}
                >
                  <Text style={{ color: Theme.colors.primary, marginRight: 8 }}>{isStopped ? 'Continue' : 'Stop'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { opacity: isMaxed || isStopped || isExpired ? 0.5 : 1 }]}
                  disabled={isMaxed || isStopped || isExpired}
                  onPress={() => handleUseCoupon(item)}
                >
                  <Text style={{ color: Theme.colors.info, marginRight: 8 }}>Use</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton}>
                  <Edit size={16} color={Theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Trash2 size={16} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
              {(isMaxed || isExpired) && (
                <Text style={{ color: Theme.colors.error, fontSize: 12, marginTop: 4 }}>
                  {isExpired ? 'This coupon is expired.' : 'Max usage reached.'}
                </Text>
              )}
            </Card>
          );
        }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );

  const renderUserModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowUserModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>User Details</Text>
          <TouchableOpacity onPress={() => setShowUserModal(false)}>
            <X size={24} color={Theme.colors.textDark} />
          </TouchableOpacity>
        </View>

        {selectedUser && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Name</Text>
              <Text style={styles.userDetailValue}>{selectedUser.name}</Text>
            </View>

            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Email</Text>
              <Text style={styles.userDetailValue}>{selectedUser.email}</Text>
            </View>

            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Phone</Text>
              <Text style={styles.userDetailValue}>{selectedUser.phone}</Text>
            </View>

            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Role</Text>
              <Text style={styles.userDetailValue}>{selectedUser.role}</Text>
            </View>

            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Signup Date</Text>
              <Text style={styles.userDetailValue}>
                {selectedUser.signupDate.toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Last Login</Text>
              <Text style={styles.userDetailValue}>
                {selectedUser.lastLogin.toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>Revenue Generated</Text>
              <Text style={styles.userDetailValue}>${selectedUser.revenue}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.emailButton]}
                onPress={() => handleSendEmail(selectedUser.id)}
              >
                <Mail size={16} color="white" />
                <Text style={styles.modalButtonText}>Send Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.notificationButton]}
                onPress={() => handleSendNotification(selectedUser.id)}
              >
                <Bell size={16} color="white" />
                <Text style={styles.modalButtonText}>Send Notification</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Edit User Modal
  const renderEditUserModal = () => (
    <Modal
      visible={showEditUserModal}
      animationType="slide"
      onRequestClose={() => setShowEditUserModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit User</Text>
          <TouchableOpacity onPress={() => setShowEditUserModal(false)}>
            <X size={24} color={Theme.colors.textDark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {/* Form fields */}
          {editUser && ['name','email','phone','role','region','status'].map(field => (
            <View key={field} style={styles.userDetailSection}>
              <Text style={styles.userDetailLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
              <TextInput
                style={styles.userDetailValue}
                value={editUser[field]}
                onChangeText={text => setEditUser(prev => prev ? { ...prev, [field]: text } : null)}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              />
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

  // Create Coupon Modal
  const renderCreateCouponModal = () => (
    <Modal
      visible={showCreateCouponModal}
      animationType="slide"
      onRequestClose={() => setShowCreateCouponModal(false)}
      transparent
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, width: '85%' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Create Coupon</Text>
          <TextInput
            placeholder="Name"
            value={newCoupon.name}
            onChangeText={text => setNewCoupon(prev => ({ ...prev, name: text }))}
            style={{ borderBottomWidth: 1, marginBottom: 12 }}
          />
          <TextInput
            placeholder="Code"
            value={newCoupon.code}
            onChangeText={text => setNewCoupon(prev => ({ ...prev, code: text }))}
            style={{ borderBottomWidth: 1, marginBottom: 12 }}
          />
          <TextInput
            placeholder="Discount"
            value={newCoupon.discount}
            onChangeText={text => setNewCoupon(prev => ({ ...prev, discount: text }))}
            keyboardType="numeric"
            style={{ borderBottomWidth: 1, marginBottom: 12 }}
          />
          <TextInput
            placeholder="Type (percentage/fixed)"
            value={newCoupon.type}
            onChangeText={text => setNewCoupon(prev => ({ ...prev, type: text }))}
            style={{ borderBottomWidth: 1, marginBottom: 12 }}
          />
          <TextInput
            placeholder="Expiration Date (YYYY-MM-DD)"
            value={newCoupon.expirationDate}
            onChangeText={text => setNewCoupon(prev => ({ ...prev, expirationDate: text }))}
            style={{ borderBottomWidth: 1, marginBottom: 12 }}
          />
          <TextInput
            placeholder="Max Usage"
            value={newCoupon.maxUsage}
            onChangeText={text => setNewCoupon(prev => ({ ...prev, maxUsage: text }))}
            keyboardType="numeric"
            style={{ borderBottomWidth: 1, marginBottom: 12 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <TouchableOpacity onPress={() => setShowCreateCouponModal(false)} style={{ marginRight: 12 }}>
              <Text style={{ color: Theme.colors.textDark }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateCoupon}>
              <Text style={{ color: Theme.colors.primary, fontWeight: 'bold' }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
        onPress={() => setActiveTab('dashboard')}
      >
        <Activity size={20} color={activeTab === 'dashboard' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'users' && styles.activeTab]}
        onPress={() => setActiveTab('users')}
      >
        <Users size={20} color={activeTab === 'users' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'services' && styles.activeTab]}
        onPress={() => setActiveTab('services')}
      >
        <ClipboardCheck size={20} color={activeTab === 'services' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>Services</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'financial' && styles.activeTab]}
        onPress={() => setActiveTab('financial')}
      >
        <BarChart size={20} color={activeTab === 'financial' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'financial' && styles.activeTabText]}>Financial</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'coupons' && styles.activeTab]}
        onPress={() => setActiveTab('coupons')}
      >
        <Gift size={20} color={activeTab === 'coupons' ? Theme.colors.primary : Theme.colors.textLight} />
        <Text style={[styles.tabText, activeTab === 'coupons' && styles.activeTabText]}>Coupons</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'users':
        return renderUsersTab();
      case 'services':
        return renderServicesTab();
      case 'financial':
        return renderFinancialTab();
      case 'coupons':
        return renderCouponsTab();
      default:
        return renderDashboardTab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {renderTabContent()}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: Theme.colors.background }}>
        {renderTabBar()}
      </SafeAreaView>
      {renderUserModal()}
      {renderEditUserModal()}
      {renderCreateCouponModal()}
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
  
  // Metrics Grid
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

  // Quick Actions
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

  // Status Card
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

  // Search and Filter
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

  // User List
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
    marginTop: 2,
  },
  userRole: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginTop: 2,
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

  // Services
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
    marginTop: 2,
  },
  serviceCreator: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textLight,
    marginTop: 2,
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

  // Financial
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
  topEarnersCard: {
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  earnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  earnerName: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  earnerRevenue: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  },
  chartCard: {
    padding: Theme.spacing.md,
    minHeight: 200,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.md,
  },
  chartPlaceholderText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.md,
  },

  // Coupons
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

  // Modal
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

  // Tab Bar
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
});