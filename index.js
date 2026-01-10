import { registerRootComponent } from 'expo';

// Initialize Firebase App first (before any other code)
import { initializeApp, firebase } from '@react-native-firebase/app';

console.log('[Firebase] @react-native-firebase/app imported in index.js, firebase object:', typeof firebase);

// Explicit Firebase config (matching google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyAPnbzGnBaOZmM1Iw6Tt7Yikr3cQvpy4ek",
  authDomain: "eventopia-a70ad.firebaseapp.com",
  projectId: "eventopia-a70ad",
  storageBucket: "eventopia-a70ad.firebasestorage.app",
  messagingSenderId: "82619158647",
  appId: "1:82619158647:android:1848815bb2cb3e88017672"
};

// Initialize Firebase with explicit config
try {
  const firebaseApp = initializeApp(firebaseConfig);
  console.log('[Firebase] Firebase App initialized successfully in index.js:', firebaseApp.options.appId);
} catch (e) {
  console.log('[Firebase] Failed to initialize Firebase App in index.js:', e.message);
}

import App from './App.js';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
