import { registerRootComponent } from 'expo';

// Initialize Firebase Web SDK (fallback since native SDK isn't working)
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

console.log('[Firebase] Initializing Firebase Web SDK in index.js');

// Firebase Web SDK config
const firebaseConfig = {
  apiKey: "AIzaSyAPnbzGnBaOZmM1Iw6Tt7Yikr3cQvpy4ek",
  authDomain: "eventopia-a70ad.firebaseapp.com",
  projectId: "eventopia-a70ad",
  storageBucket: "eventopia-a70ad.firebasestorage.app",
  messagingSenderId: "82619158647",
  appId: "1:82619158647:android:1848815bb2cb3e88017672"
};

try {
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  console.log('[Firebase] Firebase Web SDK initialized successfully:', app.options.appId);
} catch (e) {
  console.log('[Firebase] Failed to initialize Firebase Web SDK:', e.message);
}

import App from './App.js';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
