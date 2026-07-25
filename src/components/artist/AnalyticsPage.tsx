import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const db = getFirestore();

interface FirebaseOrder {
  id: string;
  price: number;
  date: any;
  orderDate?: any;
  createdAt?: any;
  updatedAt?: any;
  customerId: string;
  artistId: string;
  rating?: number;
  gigId?: string;
  gigTitle?: string;
  status?: string;
  type?: 'service' | 'ticket';
  quantity?: number;
  clientName?: string;
}

interface FirebaseService {
  id: string;
  title?: string;
  basePrice?: number;
  createdAt?: any;
  artistId?: string;
  rating?: number;
  category?: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const parseFirestoreDate = (value: any): Date | null => {
  if (!value) return null;
  if (value?._methodName === 'serverTimestamp') return null;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate();
      } catch {
        /* fall through */
      }
    }
    const seconds = value.seconds ?? value._seconds;
    if (seconds != null) return new Date(seconds * 1000);
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'number') return new Date(value);
  return null;
};

const pickDate = (d: any): any => {
  // createdAt/updatedAt are always real Timestamps; date might be a serverTimestamp sentinel
  if (d.createdAt && d.createdAt?._methodName !== 'serverTimestamp') return d.createdAt;
  if (d.updatedAt && d.updatedAt?._methodName !== 'serverTimestamp') return d.updatedAt;
  if (d.date && d.date?._methodName !== 'serverTimestamp') return d.date;
  if (d.orderDate && d.orderDate?._methodName !== 'serverTimestamp') return d.orderDate;
  if (d.timestamp && d.timestamp?._methodName !== 'serverTimestamp') return d.timestamp;
  if (d.eventDate && d.eventDate?._methodName !== 'serverTimestamp') return d.eventDate;
  return d.createdAt || d.updatedAt || d.date || null;
};

const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const p = Number(value);
    return Number.isNaN(p) ? 0 : p;
  }
  return 0;
};

const formatMAD = (value: number): string => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k MAD`;
  return `${value.toFixed(0)} MAD`;
};

// Treat any status that isn't explicitly cancelled/rejected as confirmed
const REJECTED_STATUSES = new Set(['cancelled', 'rejected', 'refunded', 'failed', 'declined']);
const isConfirmed = (status: string) => !REJECTED_STATUSES.has(status.toLowerCase().trim());

// ─── component ──────────────────────────────────────────────────────────────

const AnalyticsPage: React.FC<{ gigs?: any[] }> = ({ gigs = [] }) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'services' | 'tickets'>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [services, setServices] = useState<FirebaseService[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string>('');

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setArtistId(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const safeGetDocs = async (q: any) => {
    try { return await getDocs(q); }
    catch { return { docs: [] } as any; }
  };

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      try {
        const id = artistId;
        const artistIdFields = ['artistId', 'sellerId', 'providerId', 'userId'];
        const orderQueries = artistIdFields.map(f =>
          safeGetDocs(query(collection(db, 'orders'), where(f, '==', id)))
        );

        const servicesProm = safeGetDocs(query(collection(db, 'services'), where('artistId', '==', id)));
        const userSubProm = safeGetDocs(collection(db, 'users', id, 'orders'));

        const additionalCollections = ['customOrders', 'bookings', 'transactions'];
        const additionalPromises = additionalCollections.map(col =>
          safeGetDocs(query(collection(db, col), where('artistId', '==', id)))
        );

        const allResults = await Promise.all([
          servicesProm,
          ...orderQueries,
          userSubProm,
          ...additionalPromises,
        ]);

        const servicesSnap = allResults[0];
        const orderSnaps = allResults.slice(1);

        const orderMap = new Map<string, any>();
        for (const snap of orderSnaps) {
          if (snap && typeof snap.docs !== 'undefined') {
            snap.docs.forEach(d => orderMap.set(d.id, d));
          }
        }

        const mapped: FirebaseOrder[] = Array.from(orderMap.values()).map(doc => {
          const d = doc.data() as any;
          const rawStatus = (d.status || d.orderStatus || 'pending').toString();
          const normalizedStatus =
            rawStatus === 'accepted' ? 'confirmed' :
            rawStatus === 'declined' ? 'rejected' :
            rawStatus === 'completed' ? 'confirmed' :
            rawStatus === 'paid' ? 'confirmed' : rawStatus;

          const priceVal = safeNumber(
            d.totalPrice ?? d.clientPrice ?? d.price ??
            d.basePrice ?? d.amount ?? d.totalAmount ?? d.cost ?? 0
          );

          return {
            id: doc.id,
            price: priceVal,
            date: pickDate(d),
            customerId: d.customerId || d.clientId || d.buyerId || 'unknown',
            artistId: d.artistId || d.sellerId || d.providerId || id,
            rating: safeNumber(d.rating) || undefined,
            gigId: d.gigId || d.serviceId || d.ticketId || doc.id,
            gigTitle: d.gigTitle || d.title || d.name || d.service || d.ticketName || d.eventName || 'Untitled',
            status: normalizedStatus,
            type: d.type === 'ticket' || d.type === 'Ticket' ? 'ticket' : 'service',
            quantity: safeNumber(d.quantity) || 1,
            clientName: d.clientName || d.customerName || d.buyerName || 'Unknown',
          };
        });

        const mappedServices: FirebaseService[] = servicesSnap.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            title: d.title || d.name || 'Untitled',
            basePrice: safeNumber(d.basePrice ?? d.price ?? 0),
            createdAt: d.createdAt,
            artistId: d.artistId,
            rating: safeNumber(d.rating) || 0,
            category: d.category || d.type,
          };
        });

        setOrders(mapped);
        setServices(mappedServices);
      } catch (err) {
        console.error('[Analytics] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      doFetch();
    }
  }, [artistId]);

  // ─── derived data ──────────────────────────────────────────────────────────

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return filter === 'services' ? o.type === 'service' : o.type === 'ticket';
  });

  const filteredServices = services.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'services') return s.category?.toLowerCase() !== 'ticket';
    return s.category?.toLowerCase() === 'ticket';
  });

  const confirmedOrders = filteredOrders.filter(o => isConfirmed(o.status || ''));

  const totalRevenue = confirmedOrders.reduce((sum, o) => {
    return sum + safeNumber(o.price) * (safeNumber(o.quantity) || 1);
  }, 0);

  const activeCustomers = new Set(filteredOrders.map(o => o.customerId)).size;

  const serviceRatings = filteredServices.map(s => safeNumber(s.rating)).filter(r => r > 0);
  const avgRating = serviceRatings.length
    ? (serviceRatings.reduce((a, b) => a + b, 0) / serviceRatings.length).toFixed(1)
    : null;

  // Last 12 months
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return d;
  });

  const monthLabels = months.map(month =>
    month.toLocaleString('default', { month: 'short' })
  );

  const revenueByMonth = months.map(month =>
    confirmedOrders
      .filter(o => {
        const d = parseFirestoreDate(o.date);
        if (!d) return false;
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
      })
      .reduce((sum, o) => sum + safeNumber(o.price) * (safeNumber(o.quantity) || 1), 0)
  );

  const ordersCountByMonth = months.map(month =>
    confirmedOrders.filter(o => {
      const d = parseFirestoreDate(o.date);
      if (!d) return false;
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    }).length
  );

  const revenueInPeriod = revenueByMonth.reduce((sum, v) => sum + v, 0);
  const maxRevenue = Math.max(...revenueByMonth, 1);
  const hasRevenue = revenueInPeriod > 0;
  const noRevenueInRange = totalRevenue > 0 && revenueInPeriod === 0;
  const BAR_MAX_H = 110;

  const growthPercent =
    revenueByMonth[0] > 0
      ? (((revenueByMonth[revenueByMonth.length - 1] - revenueByMonth[0]) / revenueByMonth[0]) * 100).toFixed(1)
      : revenueByMonth[revenueByMonth.length - 1] > 0
      ? '∞'
      : '0.0';

  console.log('[Analytics] revenueByMonth:', revenueByMonth);
  console.log('[Analytics] confirmedOrders count:', confirmedOrders.length);
  if (confirmedOrders[0]) {
    console.log('date keys:', Object.keys(confirmedOrders[0].date || {}));
    try {
      console.log('date raw:', JSON.stringify(confirmedOrders[0].date));
    } catch (err) {
      console.log('date raw: [unserializable]', err);
    }
  }
  confirmedOrders.forEach((order, index) => {
    const parsed = parseFirestoreDate(order.date);
    console.log(`  order[${index}] id=${order.id} price=${order.price} quantity=${order.quantity} date=${order.date} parsed=${parsed?.toISOString()}`);
  });

  // ─── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color="#6a0dad" />
        <Text style={styles.loadingText}>Loading analytics…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 180 : 160 }}
    >
      {/* Filter pills */}
      <View style={styles.filterRow}>
        {(['all', 'services', 'tickets'] as const).map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, filter === opt && styles.pillActive]}
            onPress={() => setFilter(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, filter === opt && styles.pillTextActive]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="receipt-outline"
          iconColor="#6a0dad"
          value={String(filteredOrders.length)}
          label={filter === 'services' ? 'Services Sold' : filter === 'tickets' ? 'Tickets Sold' : 'Total Orders'}
        />
        <StatCard
          icon="cash-outline"
          iconColor="#4CAF50"
          value={formatMAD(totalRevenue)}
          label="Revenue (confirmed)"
        />
        <StatCard
          icon="people-outline"
          iconColor="#2196F3"
          value={String(activeCustomers)}
          label="Unique Customers"
        />
        <StatCard
          icon="star-outline"
          iconColor="#FFC107"
          value={avgRating ?? 'N/A'}
          label="Average Rating"
        />
      </View>

      {/* Revenue trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Revenue Trend</Text>
            <Text style={styles.cardSubtitle}>
              {months[0].toLocaleString('default', { month: 'short' })} — {months[months.length-1].toLocaleString('default', { month: 'short' })} · {hasRevenue ? `${formatMAD(revenueInPeriod)} total` : 'No confirmed revenue'}
            </Text>
          </View>
          {hasRevenue && (
            <TouchableOpacity onPress={() => setShowDetails(v => !v)}>
              <Text style={styles.toggleLink}>{showDetails ? 'Hide' : 'Details'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!hasRevenue && totalRevenue === 0 && (
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={48} color="#ddd" />
            <Text style={styles.emptyTitle}>No revenue data yet</Text>
            <Text style={styles.emptyHint}>
              Once you have confirmed orders, your revenue trend will appear here.
            </Text>
          </View>
        )}

        {noRevenueInRange && (
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={44} color="#ddd" />
            <Text style={styles.emptyTitle}>Revenue exists but not in the last 12 months</Text>
            <Text style={styles.emptyHint}>
              Your confirmed orders are outside the displayed 12-month range.
            </Text>
          </View>
        )}

        <View style={styles.chart}>
          {revenueByMonth.map((val, i) => {
            const isZero = val === 0;
            const barH = Math.max(16, (val / maxRevenue) * BAR_MAX_H);
            const isLast = i === revenueByMonth.length - 1;
            const labelValue = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val.toFixed(0)}`;
            return (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barValue, isZero && styles.barValueZero]} numberOfLines={1}>
                  {labelValue}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: isZero
                        ? '#f0f0f0'
                        : isLast
                        ? '#00b894'
                        : '#6a0dad',
                      opacity: isZero ? 0.35 : 1,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, isLast && { color: '#00b894', fontWeight: '700' }]}>{monthLabels[i]}</Text>
                <Text style={styles.barCount}>{ordersCountByMonth[i]}</Text>
              </View>
            );
          })}
        </View>

        {showDetails && hasRevenue && (
          <View style={styles.detailBox}>
            <DetailRow label="Highest month" value={formatMAD(Math.max(...revenueByMonth))} />
            <DetailRow label="Lowest month" value={formatMAD(Math.min(...revenueByMonth.filter(v => v > 0), 0))} />
            <DetailRow
              label={`Growth (${months[0].toLocaleString('default', { month: 'short' })} → ${months[months.length-1].toLocaleString('default', { month: 'short' })})`}
              value={`${growthPercent}%`}
            />
            <DetailRow label="Confirmed orders (12 mo)" value={String(confirmedOrders.length)} />
            <DetailRow label="Avg monthly revenue" value={formatMAD(revenueByMonth.reduce((a, b) => a + b, 0) / Math.max(1, revenueByMonth.filter(v => v > 0).length))} />
            <DetailRow label="Statuses found" value={[...new Set(filteredOrders.map(o => o.status))].join(', ') || '—'} />
          </View>
        )}
      </View>

      {/* Orders by month - secondary chart */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 4 }]}>Orders by Month</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 14 }]}>
          {confirmedOrders.length} confirmed · {filteredOrders.length - confirmedOrders.length} other
        </Text>
        <View style={styles.chart}>
          {ordersCountByMonth.map((val, i) => {
            const maxCount = Math.max(...ordersCountByMonth, 1);
            const barH = Math.max(12, (val / maxCount) * 70);
            return (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barValue, val === 0 && styles.barValueZero]}>{val}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      width: 22,
                      backgroundColor: val === 0 ? '#f0f0f0' : '#2196F3',
                      opacity: val === 0 ? 0.35 : 0.85,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{monthLabels[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Service performance */}
      {filteredServices.length > 0 && (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 14 }]}>Services · {filteredServices.length} total</Text>
          {filteredServices.slice(0, 5).map(s => {
            const orderCount = confirmedOrders.filter(o => o.gigId === s.id).length;
            return (
              <View key={s.id} style={styles.serviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.serviceMeta}>{s.category} · ${s.basePrice}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.serviceOrders}>{orderCount} order{orderCount !== 1 ? 's' : ''}</Text>
                  <Text style={styles.serviceRevenue}>{formatMAD(orderCount * s.basePrice)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Summary stat row */}
      {hasRevenue && (
        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 10 }}>
          <View style={[styles.card, { flex: 1, marginBottom: 0, padding: 14, alignItems: 'center' }]}>
            <Text style={styles.summaryNum}>{confirmedOrders.length}</Text>
            <Text style={styles.summaryLabel}>Order{confirmedOrders.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginBottom: 0, padding: 14, alignItems: 'center' }]}>
            <Text style={styles.summaryNum}>{activeCustomers}</Text>
            <Text style={styles.summaryLabel}>Customer{activeCustomers !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginBottom: 0, padding: 14, alignItems: 'center' }]}>
            <Text style={styles.summaryNum}>{avgRating ?? '—'}</Text>
            <Text style={styles.summaryLabel}>Rating</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ─── sub-components ──────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: any;
  iconColor: string;
  value: string;
  label: string;
}) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={24} color={iconColor} />
    <Text style={styles.statValue} numberOfLines={2} ellipsizeMode="tail">
      {value}
    </Text>
    <Text style={styles.statLabel} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#888',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pillActive: {
    backgroundColor: '#6a0dad',
    borderColor: '#6a0dad',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a0dad',
  },
  pillTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 120,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: '100%',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    maxWidth: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222',
  },
  toggleLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6a0dad',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  serviceMeta: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  serviceOrders: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2196F3',
  },
  serviceRevenue: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  // chart
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginVertical: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  bar: {
    width: 28,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 6,
  },
  barValue: {
    fontSize: 10,
    color: '#555',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  barLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  barCount: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  barValueZero: {
    color: '#bbb',
  },
  // detail box
  detailBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
  },
  // empty
  empty: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#999',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  debugHint: {
    fontSize: 11,
    color: '#e07b00',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});

export default AnalyticsPage;