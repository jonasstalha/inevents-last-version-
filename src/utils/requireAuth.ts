import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_PENDING_REDIRECT_KEY = '@auth_pending_redirect';

export async function requireAuthOrRedirect(
  router?: { push?: (path: string) => void },
  redirectPayload?: { pathname: string; params?: Record<string, string> },
) {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) return true;
  } catch (e) {
    // ignore — we'll treat as unauthenticated
  }

  if (redirectPayload) {
    try {
      await AsyncStorage.setItem(AUTH_PENDING_REDIRECT_KEY, JSON.stringify(redirectPayload));
    } catch (e) {
      console.warn('Failed to save pending redirect:', e);
    }
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Login Required',
      'You need to be logged in to continue. Would you like to login or register?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Login',
          onPress: () => {
            try {
              router?.push?.('/auth');
            } catch (e) {
              /* noop */
            }
            resolve(false);
          },
        },
      ],
      { cancelable: true },
    );
  });
}
