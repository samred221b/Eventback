import { registerRootComponent } from 'expo';

// Initialize Firebase App first (before any other code)
import { initializeApp, firebase } from '@react-native-firebase/app';

console.log('[Firebase] @react-native-firebase/app imported in index.js, firebase object:', typeof firebase);

// Initialize Firebase with default config (will use google-services.json)
try {
  const firebaseApp = initializeApp();
  console.log('[Firebase] Firebase App initialized successfully in index.js:', firebaseApp.options.appId);
} catch (e) {
  console.log('[Firebase] Failed to initialize Firebase App in index.js:', e.message);
}

import App from './App.js';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
