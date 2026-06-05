import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/firebaseConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId(): string | undefined {
  const constants: any = Constants;
  return (
    constants?.expoConfig?.extra?.eas?.projectId ||
    constants?.easConfig?.projectId
  );
}

export async function registerPushTokenForUser(userId: string): Promise<void> {
  if (!userId) return;

  if (!Device.isDevice) {
    console.log('[push] Skipping push token registration on simulator');
    return;
  }

  try {
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
    const expoTokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const expoPushToken = expoTokenResponse.data;

    let nativePushToken = '';
    try {
      const nativeTokenResponse = await Notifications.getDevicePushTokenAsync();
      nativePushToken = String(nativeTokenResponse.data || '');
    } catch (nativeTokenError) {
      console.warn('[push] Unable to get native push token', nativeTokenError);
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken,
      pushToken: expoPushToken,
      ...(nativePushToken ? { fcmToken: nativePushToken } : {}),
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
