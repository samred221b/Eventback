import { registerRootComponent } from 'expo';

// Ensure Firebase Web app is initialized (Auth + base app) before Analytics uses getApp().
import './firebase.config';

// Initialize Firebase Web SDK (fallback since native SDK isn't working)
import { getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

console.log('[Firebase] Using existing Firebase Web SDK app for Analytics');

try {
  // Use existing Firebase app (initialized by firebase.config.js for Auth)
  const app = getApp();
  const analytics = getAnalytics(app);
  console.log('[Firebase] Firebase Web Analytics initialized successfully with existing app:', app.options.appId);
} catch (e) {
  console.log('[Firebase] Failed to initialize Firebase Web Analytics:', e.message);
}

import App from './App.js';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
