import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, getFirestore, limit, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  message: string;
  type: 'order' | 'system' | 'payment' | 'review';
  read: boolean;
  createdAt: Date;
}

const NotificationsPanel = ({ onClose }: { onClose: () => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        const db = getFirestore();
        const notificationsRef = collection(db, 'users', user.id, 'notifications');
        const notificationsQuery = query(
          notificationsRef,
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(notificationsQuery);
        const notificationsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message || 'New notification',
            type: data.type || 'system',
            read: data.read || false,
            createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
          };
        });
        
        setNotifications(notificationsList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fall back to demo notifications
        setNotifications([
          {
            id: '1',
            message: 'You have a new order request',
            type: 'order',
            read: false,
            createdAt: new Date(),
          },
          {
            id: '2',
            message: 'Payment received for Order #1234',
            type: 'payment',
            read: true,
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            id: '3',
            message: 'New review from Sarah P.',
            type: 'review',
            read: false,
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id]);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return { name: 'cart', color: '#2563eb' };
      case 'payment':
        return { name: 'cash', color: '#059669' };
      case 'review':
        return { name: 'star', color: '#d97706' };
      default:
        return { name: 'notifications', color: '#6a0dad' };
    }
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }
    
    return date.toLocaleDateString();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6a0dad" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.notificationList}>
          {notifications.map((notification) => {
            const { name: iconName, color: iconColor } = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity 
                key={notification.id}
                style={[styles.notificationItem, notification.read ? styles.readNotification : styles.unreadNotification]}
              >
                <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}15` }]}>
                  <Ionicons name={iconName as any} size={20} color={iconColor} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>{formatDate(notification.createdAt)}</Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff',
  },
  readNotification: {
    backgroundColor: '#fff',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6a0dad',
    marginLeft: 8,
  },
});

export default NotificationsPanel;
