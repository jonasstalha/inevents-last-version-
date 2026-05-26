import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { Order, OrderStatus, OrderType } from '../models/types';
import { db } from './firebaseConfig';

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
  totalPrice: number;
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
  };
  priceProposal?: {
    proposedPrice?: string;
    budgetRange?: string;
    priceJustification?: string;
  };
  orderReference?: string;
  totalQuantity?: number;
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
  const now = serverTimestamp();
  const orderPayload = {
    id: orderRef.id,
    ...input,
    status: 'pending' as OrderStatus,
    paymentStatus: input.paymentStatus || 'unpaid',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(orderRef, orderPayload as any);
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
  return updateOrderStatus(orderId, 'confirmed');
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
