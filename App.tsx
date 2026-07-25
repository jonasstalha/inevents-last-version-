import { registerRootComponent } from 'expo';
import RootLayout from './app/_layout';

// Install global JS error handlers early so uncaught exceptions show a friendly alert
import './src/utils/globalErrorHandler';

registerRootComponent(RootLayout);
