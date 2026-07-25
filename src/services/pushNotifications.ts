import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/firebaseConfig';

function getProjectId(): string {
  const constants: any = Constants;
  return (
    constants?.expoConfig?.extra?.eas?.projectId ||
    constants?.easConfig?.projectId ||
    'd079d504-69ff-40fc-8cf5-aab12017a523'
  );
}

export async function registerPushTokenForUser(userId: string): Promise<void> {
  if (!userId) return;

  if (Constants.appOwnership === 'expo') {
    console.warn(
      '[push] Running in Expo Go — skipping push registration. Use a development build instead.',
    );
    return;
  }

  if (!Device.isDevice) {
    console.log('[push] Skipping push token registration on simulator');
    return;
  }

  try {
    const Notifications = (await import('expo-notifications')) as typeof import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[push] Notification permission was not granted');
      return;
    }

    const projectId = getProjectId();
    const expoTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = expoTokenResponse.data;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken,
      pushTokenUpdatedAt: new Date().toISOString(),
    });

    if (Device.osName === 'Android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4f46e5',
        sound: 'default',
      });
    }

    console.log('[push] Push token registered for user:', userId);
  } catch (error) {
    console.warn('[push] Failed to register push token', error);
  }
}
