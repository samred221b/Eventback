// Dynamic Expo config (takes precedence over app.json)
// Mirrors existing app.json to avoid breaking, adds env-driven extras and scheme

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://eventoback-1.onrender.com/api';
const IS_DEV = process.env.NODE_ENV === 'development';

export default {
  expo: {
    name: 'Eventopia',
    slug: 'EventopiaNew',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/adaptive-icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.eventopia.app',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'We need access to your photo library to let you upload event images.',
        NSPhotoLibraryAddUsageDescription: 'We need permission to save images to your photo library.',
        NSCameraUsageDescription: 'Camera access is used to take photos for your events.',
        UIStatusBarStyle: 'UIStatusBarStyleLightContent', // Ensure white text on black background
        UIViewControllerBasedStatusBarAppearance: false, // Allow app to control status bar
      },
    },
    androidStatusBar: {
      barStyle: 'light-content',
      backgroundColor: '#000000',
      translucent: false,
      hidden: false,
    },
    android: {
      package: 'com.eventopia.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: false, // Disable edge-to-edge to maintain status bar control
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'eventopia',
    updates: {
      enabled: true,
      url: 'https://u.expo.dev/dca1c3fb-f27c-4620-8f56-28b256d44d32',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      apiBaseUrl: API_BASE_URL,
      eas: {
        projectId: 'dca1c3fb-f27c-4620-8f56-28b256d44d32',
      },
      // Firebase config from environment variables
      firebase: {
        apiKey: "AIzaSyAPnbzGnBaOZmM1Iw6Tt7Yikr3cQvpy4ek",
  authDomain: "eventopia-a70ad.firebaseapp.com",
  projectId: "eventopia-a70ad",
  storageBucket: "eventopia-a70ad.firebasestorage.app",
  messagingSenderId: "82619158647",
  appId: "1:82619158647:android:1343e518bb088774017672",
      },
      // Feature flags
      debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
      analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED
        ? process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true'
        : !IS_DEV,
    },
  },
};
