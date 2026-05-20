import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Invoice {
  id: string;
  orderId: string;
  orderType: 'ticket' | 'service';
  userId: string;
  downloadURL: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
}

interface Order {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'declined' | 'rejected' | 'completed';
  orderType: 'ticket' | 'service';
  amount: number;
  currency: string;
  clientId: string;
  artistId?: string;
}

interface AppNotification {
  id: string;
  userId?: string;
  artistId?: string;
  orderId?: string;
  orderType?: 'ticket' | 'service';
  status?: string;
  title: string;
  message: string;
  icon: string;
  createdAt: string;
  isRead: boolean;
  type: 'celebration' | 'promo' | 'info' | 'reminder' | 'order_status';
}

// ─── Mock Data ───────────────────────────────────────────────────────────────



// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ApprovalBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { bg: string; color: string; icon: any; label: string }> = {
    pending:   { bg: '#fef9c3', color: '#ca8a04', icon: 'time'             as const, label: 'Pending'   },
    accepted:  { bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-circle' as const, label: 'Accepted'  },
    confirmed: { bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-circle' as const, label: 'Confirmed' },
    declined:  { bg: '#fee2e2', color: '#dc2626', icon: 'close-circle'     as const, label: 'Declined'  },
    rejected:  { bg: '#fee2e2', color: '#dc2626', icon: 'close-circle'     as const, label: 'Rejected'  },
    completed: { bg: '#dbeafe', color: '#2563eb', icon: 'checkmark-done'   as const, label: 'Completed' },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <View style={[styles.approvalBadge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={14} color={cfg.color} />
      <Text style={[styles.approvalBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function OrderCard({ item }: { item: Order }) {
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={item.orderType === 'ticket' ? 'ticket' : 'briefcase'}
            size={22}
            color="#6366f1"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>{item.description}</Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountText}>{item.amount}</Text>
          <Text style={styles.amountCurrency}>{item.currency}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <ApprovalBadge status={item.status} />
      </View>
    </View>
  );
}

function NotificationCard({ item }: { item: AppNotification }) {
  const notifAccent: Record<AppNotification['type'], string> = {
    celebration: '#6366f1',
    promo:       '#f59e0b',
    info:        '#3b82f6',
    reminder:    '#8b5cf6',
    order_status:'#10b981',
  };
  const accent = notifAccent[item.type] || '#6366f1';

  return (
    <View style={[styles.card, !item.isRead && styles.cardUnread]}>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
          <Text style={styles.notifEmoji}>{item.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.notifMessage}>{item.message}</Text>
          <Text style={[styles.cardDate, { marginTop: 6 }]}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Tab = 'orders' | 'notifications';

export default function InvoicesScreen() {
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>('orders');
  const db = getFirestore();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ── Firebase listeners ──────────────────────────────────────────────────────
  const fetchInvoices = () => {
    try {
      setLoading(true);
      const auth        = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You need to be logged in to view invoices.');
        return () => {};
      }
      const invoicesRef = collection(db, 'invoices');
      const q           = query(
        invoicesRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[];
        setInvoices(invoicesData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching invoices:', error);
        setLoading(false);
      });
      return unsub;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setLoading(false);
      return () => {};
    }
  };

  const fetchOrders = () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return () => {};
      }
      // Fetch orders where the user is the client (sent orders) or artist (for approval)
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('clientId', '==', currentUser.uid), // Only show orders sent by this client
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map((dc) => {
          const d = dc.data() as any;
          const rawCreatedAt = d.createdAt as any;
          return {
            id: dc.id,
            ...d,
            createdAt:
              typeof rawCreatedAt === 'string'
                ? rawCreatedAt
                : rawCreatedAt?.toDate
                  ? rawCreatedAt.toDate().toISOString()
                  : new Date().toISOString(),
          };
        }) as Order[];
        setOrders(ordersData);
      }, (error) => {
        console.error('Error fetching orders:', error);
      });
      return unsub;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return () => {};
    }
  };

  const fetchNotifications = () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return () => {};

      // Per-user subcollection — matches the path written by sendOrderUpdateNotification
      const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((dc) => {
          const d = dc.data() as any;
          const rawCreatedAt = d.createdAt;
          const createdAt =
            typeof rawCreatedAt === 'string'
              ? rawCreatedAt
              : rawCreatedAt?.toDate
                ? rawCreatedAt.toDate().toISOString()
                : new Date().toISOString();
          return { id: dc.id, ...d, createdAt } as AppNotification;
        });
        setNotifications(data);
      }, (error) => {
        console.error('Error fetching notifications:', error);
      });

      return unsub;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return () => {};
    }
  };

  useEffect(() => {
    const unsubscribeInvoices = fetchInvoices();
    const unsubscribeOrders = fetchOrders();
    const unsubscribeNotifications = fetchNotifications();
    return () => {
      unsubscribeInvoices && unsubscribeInvoices();
      unsubscribeOrders && unsubscribeOrders();
      unsubscribeNotifications && unsubscribeNotifications();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // ── Invoice download / share ───────────────────────────────────────────────
  const downloadInvoice = async (invoice: Invoice) => {
    try {
      Alert.alert(
        'Download Invoice',
        'Would you like to download or share this invoice?',
        [
          { text: 'Download', onPress: async () => downloadAndSave(invoice.downloadURL, `invoice_${invoice.id}.pdf`) },
          { text: 'Share',    onPress: async () => shareInvoice(invoice.downloadURL, `invoice_${invoice.id}.pdf`)    },
          { text: 'Cancel',   style: 'cancel' },
        ],
      );
    } catch {
      Alert.alert('Error', 'Failed to download invoice. Please try again.');
    }
  };

  const downloadAndSave = async (url: string, filename: string) => {
    try {
      const dir = FileSystem.documentDirectory;
      if (!dir) { Alert.alert('Error', 'Cannot access file system.'); return; }
      await FileSystem.downloadAsync(url, dir + filename);
      Alert.alert('Download Complete', 'Invoice saved successfully!');
    } catch { Alert.alert('Error', 'Failed to save invoice.'); }
  };

  const shareInvoice = async (url: string, filename: string) => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) { Alert.alert('Error', 'Cannot access file system.'); return; }
      const fileUri = cacheDir + filename;
      await FileSystem.downloadAsync(url, fileUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(fileUri);
      else Alert.alert('Not Available', 'Sharing is not available on this device.');
    } catch { Alert.alert('Error', 'Failed to share invoice.'); }
  };

  // ── Render invoice card ────────────────────────────────────────────────────
  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text" size={22} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Invoice #{item.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.cardDate}>{date}</Text>
            <Text style={styles.cardSub}>
              {item.orderType === 'service' ? '🛍️ Service' : '🎫 Ticket'}
            </Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountText}>{item.amount}</Text>
            <Text style={styles.amountCurrency}>{item.currency}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.approvalBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
            <Text style={[styles.approvalBadgeText, { color: '#16a34a' }]}>Paid</Text>
          </View>
          <TouchableOpacity style={styles.downloadButton} onPress={() => downloadInvoice(item)} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={16} color="#6366f1" />
            <Text style={styles.downloadButtonText}>Download / Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading invoices…</Text>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
    
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'orders' ? 'receipt' : 'receipt-outline'}
            size={16}
            color={activeTab === 'orders' ? '#ffffff' : '#6366f1'}
          />
          <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
          onPress={() => setActiveTab('notifications')}
          activeOpacity={0.8}
        >
          <View>
            <Ionicons
              name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
              size={16}
              color={activeTab === 'notifications' ? '#ffffff' : '#6366f1'}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}>
            Notifications
          </Text>
        </TouchableOpacity>
      </View>

       {/* ── Orders tab ── */}
       {activeTab === 'orders' && (
         <FlatList
           data={orders}
           keyExtractor={(item) => item.id}
           renderItem={({ item }) => <OrderCard item={item} />}
           contentContainerStyle={styles.listContainer}
           showsVerticalScrollIndicator={false}
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
           }
           ListEmptyComponent={
             <View style={styles.emptyContainer}>
               <Ionicons name="receipt-outline" size={72} color="#d1d5db" />
               <Text style={styles.emptyTitle}>No Orders Yet</Text>
               <Text style={styles.emptyText}>Your orders will appear here once placed.</Text>
             </View>
           }
         />
       )}

       {/* ── Notifications tab ── */}
       {activeTab === 'notifications' && (
         <FlatList
           data={notifications}
           keyExtractor={(item) => item.id}
           renderItem={({ item }) => <NotificationCard item={item} />}
           contentContainerStyle={styles.listContainer}
           showsVerticalScrollIndicator={false}
           refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
           }
           ListEmptyComponent={
             <View style={styles.emptyContainer}>
               <Ionicons name="notifications-off-outline" size={72} color="#d1d5db" />
               <Text style={styles.emptyTitle}>No Notifications</Text>
               <Text style={styles.emptyText}>We'll notify you about offers and updates.</Text>
             </View>
           }
         />
       )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 14,
  },

  // ── Tab row ──────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#eef2ff',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#6366f1',
    borderRadius: 11,
    margin: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  tabLabelActive: {
    color: '#ffffff',
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notifMessage: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 19,
  },
  amountBox: {
    alignItems: 'flex-end',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369a1',
  },
  amountCurrency: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },

  // ── Approval badge ────────────────────────────────────────────────────────
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    backgroundColor: '#dcfce7',
  },
  approvalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Download button ───────────────────────────────────────────────────────
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 5,
  },
  downloadButtonText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },

  // ── List padding ──────────────────────────────────────────────────────────
  listContainer: {
    paddingBottom: 20,
  },
});