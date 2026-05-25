import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrders } from '@/src/hooks/useOrders';
import { Order } from '@/src/models/types';
import { OrderStatusBadge } from '@/src/components/orders/OrderStatusBadge';

const orderTabs = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ClientOrdersScreen() {
  const router = useRouter();
  const { orders, loading, error } = useOrders();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'rejected'>('all');

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((order) => order.status === activeTab);
  }, [orders, activeTab]);

  const openInvoice = async (invoiceUrl?: string) => {
    if (!invoiceUrl) {
      Alert.alert('Invoice not available yet');
      return;
    }
    const supported = await Linking.canOpenURL(invoiceUrl);
    if (supported) {
      await Linking.openURL(invoiceUrl);
    } else {
      Alert.alert('Cannot open invoice URL');
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.serviceTitle || item.gigTitle || item.ticketName || 'Order'}</Text>
            <Text style={styles.cardSubtitle}>{item.type === 'service' ? 'Service Request' : 'Ticket Booking'}</Text>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>

        <Text style={styles.descriptionText}>{item.notes || item.description || 'No additional notes'}</Text>
        <Text style={styles.priceText}>{item.totalPrice?.toFixed(2)} MAD</Text>
        <Text style={styles.metaText}>Payment: {item.paymentStatus || 'unpaid'}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.detailsButton} onPress={() => router.push(`/(client)/order/${item.id}`)}>
            <Text style={styles.detailsButtonText}>View details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.invoiceButton, !item.invoiceUrl && styles.disabledButton]}
            onPress={() => openInvoice(item.invoiceUrl)}
            disabled={!item.invoiceUrl}
          >
            <Text style={styles.invoiceButtonText}>{item.invoiceUrl ? 'Download invoice' : 'Pending invoice'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to load orders.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>My Orders</Text>
      <View style={styles.tabRow}>
        {orderTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You have no orders yet.</Text>
            <TouchableOpacity onPress={() => router.push('/(client)/search')}>
              <Text style={styles.browseText}>Browse artists</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1f2937',
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#6b7280',
    fontSize: 13,
  },
  descriptionText: {
    color: '#4b5563',
    marginBottom: 12,
    minHeight: 40,
  },
  priceText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  invoiceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
  },
  invoiceButtonText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 10,
  },
  browseText: {
    fontSize: 15,
    color: '#4338ca',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#4b5563',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 16,
  },
});
