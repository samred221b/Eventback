// Firebase Configuration for Web SDK (compatible with Expo Go)
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPnbzGnBaOZmM1Iw6Tt7Yikr3cQvpy4ek",
  authDomain: "eventopia-a70ad.firebaseapp.com",
  projectId: "eventopia-a70ad",
  storageBucket: "eventopia-a70ad.firebasestorage.app",
  messagingSenderId: "82619158647",
  appId: "1:82619158647:android:1343e518bb088774017672"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export default app;

/* 
TO GET YOUR FIREBASE CONFIG:
1. Go to https://console.firebase.google.com/
2. Select your project
3. Click the gear icon (Project Settings)
4. Scroll down to "Your apps" section
5. If you haven't added an app yet, click "Add app" and choose Web
6. Copy the config object and replace the values above

IMPORTANT: 
- Make sure Authentication is enabled in your Firebase Console
- Go to Authentication > Sign-in method
- Enable Email/Password sign-in method
- Optionally enable Google sign-in if you want social login
*/
