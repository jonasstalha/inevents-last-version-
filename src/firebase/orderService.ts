import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, setDoc, updateDoc, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Order, OrderStatus, OrderType } from '../models/types';
import { db, firebaseConfigObject } from './firebaseConfig';

const CLOUD_FUNCTION_BASE_URL = `https://us-central1-${firebaseConfigObject.projectId}.cloudfunctions.net`;

async function sendPhoneNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_BASE_URL}/sendNotification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `sendNotification failed with ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed sending phone push notification:', error);
  }
}

async function createInAppNotification(
  userId: string,
  title: string,
  body: string,
  actorId?: string,
): Promise<void> {
  try {
    const payload: Record<string, any> = {
      title,
      body,
      isRead: false,
      createdAt: serverTimestamp(),
    };
    if (actorId) payload.artistId = actorId;
    await addDoc(collection(db, 'users', userId, 'notifications'), payload);
  } catch (error) {
    console.warn('Failed creating in-app notification:', error);
  }
}

export interface CreateOrderInput {
  clientId: string;
  clientName?: string;
  clientPhoto?: string;
  artistId: string;
  artistName?: string;
  artistPhoto?: string;
  gigId?: string;
  gigTitle?: string;
  ticketName?: string;
  serviceId?: string;
  serviceTitle?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceImage?: string;
  description?: string;
  notes?: string;
  attachments?: string[];
  type: OrderType;
  price?: number;
  totalPrice: number;
  clientPrice?: number;
  currency?: string;
  paymentStatus?: 'unpaid' | 'paid';
  selectedOptions?: string[];
  selectedPackage?: string;
  budget?: number;
  specialRequests?: string;
  items?: Array<{ id: string; title: string; quantity: number; price: number }>;
  ticketQuantities?: Array<{ type: string; price: number; quantity: number }>;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    additionalNotes?: string;
  };
  clientInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  customization?: {
    eventDate?: string;
    eventTime?: string;
    duration?: string;
    location?: string;
    guestCount?: string;
    specificRequests?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  priceProposal?: {
    proposedPrice?: string;
    budgetRange?: string;
    priceJustification?: string;
  };
  orderReference?: string;
  totalQuantity?: number;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function normalizeTimestamp(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value?.toDate) return value.toDate().toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  return new Date().toISOString();
}

function normalizeStatus(status: any): OrderStatus {
  if (!status) return 'pending';
  if (status === 'accepted') return 'confirmed';
  if (status === 'declined') return 'rejected';
  return status as OrderStatus;
}

function normalizeOrderType(type: any, data: any): OrderType {
  if (type === 'ticket' || type === 'service') return type;
  if (data?.serviceId || data?.serviceName || data?.customization) return 'service';
  return 'ticket';
}

function mapOrderDoc(docSnapshot: any): Order {
  const data = docSnapshot.data() as any;
  return {
    id: docSnapshot.id,
    clientId: data.clientId,
    clientName: data.clientName,
    clientPhoto: data.clientPhoto,
    artistId: data.artistId,
    artistName: data.artistName,
    artistPhoto: data.artistPhoto,
    gigId: data.gigId,
    gigTitle: data.gigTitle,
    ticketName: data.ticketName,
    serviceId: data.serviceId,
    serviceTitle: data.serviceTitle,
    serviceName: data.serviceName,
    serviceCategory: data.serviceCategory,
    serviceImage: data.serviceImage,
    description: data.description,
    notes: data.notes,
    attachments: data.attachments || [],
    selectedPackage: data.selectedPackage,
    budget: data.budget,
    type: normalizeOrderType(data.type, data),
    status: normalizeStatus(data.status),
    totalPrice: data.totalPrice || 0,
    currency: data.currency || 'MAD',
    paymentStatus: data.paymentStatus || 'unpaid',
    invoiceId: data.invoiceId,
    invoiceUrl: data.invoiceUrl,
    selectedOptions: data.selectedOptions || [],
    specialRequests: data.specialRequests,
    items: data.items || [],
    ticketQuantities: data.ticketQuantities || [],
    personalInfo: data.personalInfo || undefined,
    clientInfo: data.clientInfo || undefined,
    customization: data.customization || undefined,
    priceProposal: data.priceProposal || undefined,
    orderReference: data.orderReference,
    totalQuantity: data.totalQuantity,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    completedAt: normalizeTimestamp(data.completedAt),
  };
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const orderRef = doc(collection(db, 'orders'));
  const now = Timestamp.now();
  const orderPayload = stripUndefinedDeep({
    id: orderRef.id,
    ...input,
    status: 'pending' as OrderStatus,
    paymentStatus: input.paymentStatus || 'unpaid',
    createdAt: now,
    updatedAt: now,
  });
  await setDoc(orderRef, orderPayload as any);

  // Notify the artist about the new order
  const clientName = input.clientName || input.personalInfo?.fullName || 'A client';
  await createInAppNotification(
    input.artistId,
    'New Order Received',
    `${clientName} placed a new order: ${input.serviceName || input.gigTitle || input.ticketName || 'Order'}`,
    input.clientId,
  );
  await sendPhoneNotificationToUser(
    input.artistId,
    'New Order',
    `You have a new order from ${clientName}!`,
  );

  return orderRef.id;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orderRef = doc(db, 'orders', orderId);
  const snapshot = await getDoc(orderRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapOrderDoc(snapshot);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  try {
    const snapshot = await getDoc(orderRef);
    const existing = snapshot.exists() ? snapshot.data() : null;
    console.log('Updating order status - before update', {
      orderId,
      status,
      existingArtistId: existing?.artistId,
    });

    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    console.log('SUCCESS STATUS UPDATE:', status);
    console.log('Order status updated successfully', { orderId, status });
  } catch (error) {
    console.error('FIREBASE UPDATE ERROR:', JSON.stringify(error));
    console.error('Failed updating order status:', error);
    throw error;
  }
}

export async function confirmOrder(orderId: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const snap = await getDoc(orderRef);
  const data = snap.data() as any;
  const acceptedPrice = data?.counterOfferPrice ?? data?.price ?? data?.clientPrice ?? data?.budget ?? data?.totalPrice;
  await updateDoc(orderRef, {
    status: 'confirmed',
    price: acceptedPrice,
    updatedAt: serverTimestamp(),
  });

  // Notify the artist that the customer accepted
  const artistId = data?.artistId;
  const clientId = data?.clientId;
  if (artistId) {
    await createInAppNotification(
      artistId,
      'Order Confirmed',
      `${data?.clientName || 'A client'} accepted your offer${data?.serviceName || data?.title ? ` for ${data.serviceName || data.title}` : ''}!`,
      clientId,
    );
    await sendPhoneNotificationToUser(
      artistId,
      'Order Confirmed',
      `A client accepted your offer!`,
    );
  }
}

export async function rejectOrder(orderId: string): Promise<void> {
  return updateOrderStatus(orderId, 'rejected');
}

export async function warnClientCancellation(clientId: string, orderId?: string): Promise<boolean> {
  const userRef = doc(db, 'users', clientId);

  try {
    await setDoc(
      userRef,
      {
        cancellationAlerts: increment(1),
        lastCancellationWarningAt: serverTimestamp(),
        ...(orderId ? { lastRejectedOrderId: orderId } : {}),
      },
      { merge: true },
    );

    const snapshot = await getDoc(userRef);
    const alertCount = snapshot.exists() ? ((snapshot.data() as any).cancellationAlerts || 0) : 0;

    if (alertCount >= 3) {
      await deleteDoc(userRef);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to warn client cancellation:', error);
    throw error;
  }
}

export async function completeOrder(orderId: string): Promise<void> {
  return updateOrderStatus(orderId, 'completed');
}

export async function sendCounterOffer(
  orderId: string,
  counterPrice: number,
): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: 'counter_offered',
    counterOfferPrice: counterPrice,
    price: counterPrice,
    updatedAt: serverTimestamp(),
  });
}

export async function acceptCounterOffer(orderId: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const snap = await getDoc(orderRef);
  const counterPrice = snap.data()?.counterOfferPrice;
  await updateDoc(orderRef, {
    status: 'confirmed',
    ...(counterPrice != null ? { price: counterPrice } : {}),
    updatedAt: Timestamp.now(),
  });
}

export async function rejectCounterOffer(orderId: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: 'rejected',
    updatedAt: Timestamp.now(),
  });
}

export function listenOrdersByClient(
  clientId: string,
  onNext: (orders: Order[]) => void,
  onError?: (error: any) => void,
) {
  const ordersRef = collection(db, 'orders');
  const ordersQuery = query(ordersRef, where('clientId', '==', clientId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const nextOrders = snapshot.docs.map(mapOrderDoc);
      onNext(nextOrders);
    },
    onError,
  );
}

export function listenOrdersByArtist(
  artistId: string,
  onNext: (orders: Order[]) => void,
  onError?: (error: any) => void,
) {
  const ordersRef = collection(db, 'orders');
  const ordersQuery = query(ordersRef, where('artistId', '==', artistId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const nextOrders = snapshot.docs.map(mapOrderDoc);
      onNext(nextOrders);
    },
    onError,
  );
}

export async function sendOrderUpdateNotification(
  clientUid: string,
  artistUid: string,
  orderId: string,
  orderType: OrderType,
  status: OrderStatus,
  title: string,
  body: string,
) {
  const notificationsRef = collection(db, 'users', clientUid, 'notifications');
  try {
    console.log('Creating notification', { clientUid, artistUid, orderId, status });
    await addDoc(notificationsRef, {
      orderId,
      artistId: artistUid,
      orderType,
      status,
      title,
      body,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    console.log('Notification created', { clientUid, orderId, status });

    await sendPhoneNotificationToUser(clientUid, title, body, {
      type: 'order_status',
      orderId,
      status,
      orderType,
      artistUid,
    });
  } catch (err) {
    console.error('Failed creating order notification:', err, { clientUid, artistUid, orderId, status });
    throw err;
  }
}

export function getClientCustomOrdersRealtime(
  clientId: string,
  onNext: (orders: Order[]) => void,
  onError?: (error: any) => void,
) {
  const ordersRef = collection(db, 'orders');
  const ordersQuery = query(ordersRef, where('clientId', '==', clientId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const nextOrders = snapshot.docs
        .map(mapOrderDoc)
        .filter((order) => order.type === 'service');
      onNext(nextOrders);
    },
    onError,
  );
}

export async function getOrderTraceability(dbInstance: any, uid: string, orderId: string) {
  const notifsRef = collection(dbInstance, 'users', uid, 'notifications');
  const q = query(notifsRef, where('orderId', '==', orderId));
  const snap = await getDocs(q);
  const result: any[] = [];

  const allArtistIds = [...new Set(snap.docs.map((d) => (d.data() as any).artistId).filter(Boolean) as string[])];
  const artistNameMap: Record<string, string> = {};

  if (allArtistIds.length) {
    const usersSnap = await getDocs(collection(dbInstance, 'users'));
    usersSnap.docs.forEach((u) => {
      const data = u.data() as any;
      if (allArtistIds.includes(u.id)) {
        artistNameMap[u.id] = data.storeName || data.name || data.displayName || `Artist ${u.id.slice(0, 6)}`;
      }
    });
  }

  snap.docs.forEach((dc) => {
    const d = dc.data() as any;
    const stat = d.status || 'pending';
    result.push({
      id: dc.id,
      status: stat,
      title: d.title || SERVICE_STATUS_LABEL[stat] || stat,
      body: d.body || '',
      isRead: !!d.isRead,
      createdAt: normalizeTimestamp(d.createdAt),
      artistId: d.artistId || '',
      artistName: artistNameMap[d.artistId] || 'Service Provider',
      displayLabel: SERVICE_STATUS_LABEL[stat] || stat,
    });
  });

  result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return result;
}

const SERVICE_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  completed: 'Completed',
};
