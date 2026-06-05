import { createInvoiceForOrder } from '@/src/firebase/invoiceService';
import { completeOrder, confirmOrder, getOrderById, rejectOrder, sendOrderUpdateNotification, warnClientCancellation } from '@/src/firebase/orderService';
import { Order } from '@/src/models/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#fbbf24';
    case 'confirmed':
      return '#34d399';
    case 'completed':
      return '#60a5fa';
    case 'rejected':
      return '#f87171';
    default:
      return '#9ca3af';
  }
};

const parseCoordinatesFromString = (location?: string) => {
  if (!location) return undefined;
  const trimmed = location.trim();
  const commaParts = trimmed.split(/[,;]+/).map((part) => part.trim());
  if (commaParts.length === 2) {
    const latitude = parseFloat(commaParts[0]);
    const longitude = parseFloat(commaParts[1]);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      return { latitude, longitude };
    }
  }

  const regex = /(-?\d+(?:\.\d+)?)[^\d-]+(-?\d+(?:\.\d+)?)/;
  const match = trimmed.match(regex);
  if (match) {
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      return { latitude, longitude };
    }
  }

  return undefined;
};

const getOrderLocation = (order: Order) => {
  const coordinates = order.customization?.locationCoordinates;
  if (coordinates?.latitude != null && coordinates?.longitude != null) {
    return coordinates;
  }
  if (order.customization?.latitude != null && order.customization?.longitude != null) {
    return {
      latitude: order.customization.latitude,
      longitude: order.customization.longitude,
    };
  }
  return parseCoordinatesFromString(order.customization?.location);
};

const getOrderLocationLabel = (order: Order) => {
  if (!order.customization) return 'Location not specified';
  const locationText = order.customization.location?.trim();
  const parsed = parseCoordinatesFromString(locationText);
  if (parsed) {
    return 'Pinned location from coordinates';
  }
  if (locationText) {
    return locationText;
  }
  return 'Location not specified';
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const orderLocation = order ? getOrderLocation(order) : undefined;
  const orderLocationLabel = order ? getOrderLocationLabel(order) : 'Location not specified';

  useEffect(() => {
    const orderId = params.orderId as string | undefined;
    if (orderId) {
      loadOrder(orderId);
    } else {
      Alert.alert('Error', 'Missing order identifier');
      router.back();
    }
  }, [params.orderId]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const fetched = await getOrderById(orderId);
      if (!fetched) {
        Alert.alert('Order not found');
        router.back();
        return;
      }
      setOrder(fetched);
    } catch (error) {
      console.error('Unable to load order', error);
      Alert.alert('Unable to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'confirm' | 'reject' | 'complete') => {
    if (!order) return;
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be signed in to perform this action');
      return;
    }

    setSaving(true);
    try {
      if (action === 'confirm') {
        await confirmOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type,
          'confirmed',
          'Order Confirmed',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} is confirmed.`,
        );
        await createInvoiceForOrder(order);
      }
      if (action === 'reject') {
        await rejectOrder(order.id);

        let clientDeleted = false;
        if (order.clientId) {
          try {
            clientDeleted = await warnClientCancellation(order.clientId, order.id);
          } catch (warningError) {
            console.warn('Cancellation alert update failed:', warningError);
          }
        }

        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type,
          'rejected',
          'Order Rejected',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} has been rejected.`,
        );

        if (clientDeleted) {
          Alert.alert('Client Removed', 'This client account has been removed after 3 cancellation alerts.');
        }
      }
      if (action === 'complete') {
        await completeOrder(order.id);
        await sendOrderUpdateNotification(
          order.clientId,
          currentUser.uid,
          order.id,
          order.type,
          'completed',
          'Order Completed',
          `Your order for ${order.serviceTitle || order.gigTitle || order.ticketName || 'the service'} is completed.`,
        );
        await createInvoiceForOrder(order);
      }
      loadOrder(order.id);
      const successMessage = action === 'reject' && order.clientId
        ? 'Order rejected successfully.'
        : 'Order status updated successfully.';
      Alert.alert('Success', successMessage);
    } catch (error) {
      console.error('Order update failed', error);
      Alert.alert('Unable to update order status');
    } finally {
      setSaving(false);
    }
  };

  const renderActionButtons = () => {
    if (!order) return null;
    if (order.status === 'pending') {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('confirm')} disabled={saving}>
            <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Accept Order'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleAction('reject')} disabled={saving}>
            <Text style={styles.secondaryText}>Refuse Order</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (order.status === 'confirmed') {
      return (
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('complete')} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Mark as Completed'}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Order details were not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Title and Status */}
        <View style={styles.section}>
          <Text style={styles.label}>{order.serviceTitle || order.gigTitle || order.ticketName || 'Order'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.orderType}>{order.type === 'service' ? 'Service Order' : 'Ticket Order'}</Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Offered Price:</Text>
            <Text style={styles.priceAmount}>{order.totalPrice?.toFixed(2)} MAD</Text>
          </View>
          {order.budget ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Client Budget:</Text>
              <Text style={styles.priceAmount}>{order.budget?.toFixed(2)} MAD</Text>
            </View>
          ) : null}
          {order.priceProposal?.proposedPrice ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Proposed Price:</Text>
              <Text style={styles.priceAmount}>{order.priceProposal.proposedPrice} MAD</Text>
            </View>
          ) : null}
          {order.priceProposal?.budgetRange ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Budget Range:</Text>
              <Text style={styles.priceText}>{order.priceProposal.budgetRange}</Text>
            </View>
          ) : null}
          {order.priceProposal?.priceJustification ? (
            <>
              <Text style={styles.fieldLabel}>Price Justification</Text>
              <Text style={styles.fieldText}>{order.priceProposal.priceJustification}</Text>
            </>
          ) : null}
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.fieldLabel}>Name</Text>
            <Text style={styles.fieldText}>{order.clientName || order.clientInfo?.fullName || order.personalInfo?.fullName || 'Not provided'}</Text>
          </View>
          {(order.clientInfo?.email || order.personalInfo?.email) ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldText}>{order.clientInfo?.email || order.personalInfo?.email}</Text>
            </View>
          ) : null}
          {(order.clientInfo?.phone || order.personalInfo?.phone) ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldText}>{order.clientInfo?.phone || order.personalInfo?.phone}</Text>
            </View>
          ) : null}
          {(order.clientInfo?.address || order.personalInfo?.address) ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Text style={styles.fieldText}>{order.clientInfo?.address || order.personalInfo?.address}</Text>
            </View>
          ) : null}
          {(order.clientInfo?.city || order.personalInfo?.city) ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>City</Text>
              <Text style={styles.fieldText}>{order.clientInfo?.city || order.personalInfo?.city}</Text>
            </View>
          ) : null}
          {(order.clientInfo?.country || order.personalInfo?.country) ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Country</Text>
              <Text style={styles.fieldText}>{order.clientInfo?.country || order.personalInfo?.country}</Text>
            </View>
          ) : null}
          {order.personalInfo?.additionalNotes ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Additional Notes</Text>
              <Text style={styles.fieldText}>{order.personalInfo.additionalNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Service Requirements */}
        {order.customization ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Requirements</Text>
            {order.customization.eventDate ? (
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Event Date</Text>
                <Text style={styles.fieldText}>{order.customization.eventDate}</Text>
              </View>
            ) : null}
            {order.customization.eventTime ? (
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Event Time</Text>
                <Text style={styles.fieldText}>{order.customization.eventTime}</Text>
              </View>
            ) : null}
            {order.customization.duration ? (
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Duration</Text>
                <Text style={styles.fieldText}>{order.customization.duration}</Text>
              </View>
            ) : null}
            {order.customization.location ? (
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Location</Text>
                <Text style={styles.fieldText}>{order.customization.location}</Text>
              </View>
            ) : null}
            {order.customization.guestCount ? (
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Number of Guests</Text>
                <Text style={styles.fieldText}>{order.customization.guestCount}</Text>
              </View>
            ) : null}
            {order.customization.specificRequests ? (
              <View style={styles.infoBlock}>
                <Text style={styles.fieldLabel}>Specific Requests</Text>
                <Text style={styles.fieldText}>{order.customization.specificRequests}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {orderLocation ? (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Location Preview</Text>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: orderLocation.latitude,
                longitude: orderLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={orderLocation}
                title={orderLocationLabel}
              />
            </MapView>
            <Text style={styles.locationText}>{orderLocationLabel}</Text>
          </View>
        ) : order.customization?.location ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.fieldText}>{order.customization.location}</Text>
          </View>
        ) : null}

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.fieldLabel}>Order ID</Text>
            <Text style={styles.fieldText}>{order.id}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.fieldLabel}>Created</Text>
            <Text style={styles.fieldText}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          {order.description ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldText}>{order.description}</Text>
            </View>
          ) : null}
          {order.notes ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <Text style={styles.fieldText}>{order.notes}</Text>
            </View>
          ) : null}
          {order.specialRequests ? (
            <View style={styles.infoBlock}>
              <Text style={styles.fieldLabel}>Special Requests</Text>
              <Text style={styles.fieldText}>{order.specialRequests}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>{renderActionButtons()}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '600',
  },
  fieldText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4338ca',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#991b1b',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  orderType: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338ca',
  },
  priceText: {
    fontSize: 14,
    color: '#4b5563',
  },
  infoBlock: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mapSection: {
    marginBottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginTop: 12,
  },
  locationText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
  },
});
