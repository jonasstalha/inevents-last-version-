import { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { onSnapshot, query, where, orderBy, collection } from 'firebase/firestore';
import { Order } from '../models/types';
import { useAuth } from '../context/AuthContext';

export function useOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setOrders([]);
      setError(null);
      setLoading(false);
      return;
    }

    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const nextOrders: Order[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            createdAt: normalizeTimestamp(data.createdAt),
            updatedAt: normalizeTimestamp(data.updatedAt),
          } as Order;
        });
        setOrders(nextOrders);
        setLoading(false);
      },
      (err) => {
        console.error('useOrders listener error:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  return { orders, loading, error };
}

function normalizeTimestamp(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value.toDate) return value.toDate().toISOString();
  if (value.seconds) return new Date(value.seconds * 1000).toISOString();
  return new Date().toISOString();
}
