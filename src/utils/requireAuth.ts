import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_PENDING_REDIRECT_KEY = '@auth_pending_redirect';

export async function requireAuthOrRedirect(
  router?: { push?: (path: string) => void },
  redirectPayload?: { pathname: string; params?: Record<string, string> },
) {
  let requiresVerification = false;
  try {
    const { getAuth, reload } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) return true;
      requiresVerification = true;
    }
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
      requiresVerification ? 'Verification Required' : 'Login Required',
      requiresVerification
        ? 'Please verify your email before continuing.'
        : 'You need to be logged in to continue. Would you like to login or register?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: requiresVerification ? 'Verify email' : 'Login',
          onPress: () => {
            try {
              router?.push?.(requiresVerification ? '/email-verification' : '/auth');
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
