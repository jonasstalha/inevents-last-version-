import { Alert, Platform } from 'react-native';

function showFriendlyAlert() {
  try {
    Alert.alert(
      'Unexpected Error',
      'An unexpected error occurred. Please try again or restart the app.',
      [{ text: 'OK' }],
      { cancelable: true },
    );
  } catch (e) {
    // ignore — Alert may not be available in some environments
    if (Platform.OS === 'web') console.error('UI alert failed', e);
  }
}

export function installGlobalErrorHandler() {
  try {
    // JS uncaught exceptions
    const defaultHandler = (ErrorUtils && (ErrorUtils.getGlobalHandler?.() || (ErrorUtils as any)._globalHandler)) || undefined;

    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      console.error('Global JS error caught:', error, 'isFatal:', isFatal);
      showFriendlyAlert();
      if (typeof defaultHandler === 'function') {
        try {
          defaultHandler(error, isFatal);
        } catch (e) {
          console.error('Default error handler failed', e);
        }
      }
    });
  } catch (e) {
    console.warn('Could not set ErrorUtils handler:', e);
  }

  // Unhandled promise rejections
  try {
    const anyGlobal: any = global;
    if (anyGlobal?.process?.on) {
      anyGlobal.process.on('unhandledRejection', (reason: any) => {
        console.error('Unhandled promise rejection:', reason);
        showFriendlyAlert();
      });
    } else {
      // Fallback for environments exposing window.addEventListener
      if (typeof (global as any).addEventListener === 'function') {
        (global as any).addEventListener('unhandledrejection', (evt: any) => {
          console.error('Unhandled rejection event:', evt);
          showFriendlyAlert();
        });
      }
    }
  } catch (e) {
    console.warn('Could not set unhandledRejection handler:', e);
  }
}

// Auto-install when imported
installGlobalErrorHandler();
