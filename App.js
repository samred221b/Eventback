// App.js - CLEAN VERSION (HomeScreen fully extracted)
import { View, AppState, StatusBar } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';

import analyticsService from './services/analyticsService';

import { QueryProvider } from './providers/QueryProvider';
import { FavoritesProvider } from './providers/FavoritesProvider';
import { AuthProvider } from './providers/AuthProvider';

import { useExpoUpdates, UpdatePrompt } from './utils/updates';

import ModernWelcomeScreen from './screens/ModernWelcomeScreen';
import HomeScreen from './screens/HomeScreen';                    // ← Now imported cleanly
import EventsScreen from './screens/EventsScreen';
import CalendarScreen from './screens/CalendarScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import EventDetailsScreen from './screens/EventDetailsScreen';
import OrganizerLoginScreen from './screens/OrganizerLoginScreen';
import OrganizerDashboardScreen from './screens/OrganizerDashboard';
import CreateEventScreen from './screens/CreateEventScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import UpdateProfileScreen from './screens/UpdateProfileScreen';
import VerificationScreen from './screens/VerificationScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import TermsPrivacyScreen from './screens/TermsPrivacyScreen';
import PricingScreen from './screens/PricingScreen';
import AboutScreen from './screens/AboutScreen';
import BugReportScreen from './screens/BugReportScreen';
import FeatureRequestScreen from './screens/FeatureRequestScreen';
import AdminAnalyticsScreen from './screens/AdminAnalyticsScreen';
import AdminEventsScreen from './screens/AdminEventsScreen';
import AdminOrganizersScreen from './screens/AdminOrganizersScreen';
import AdminOrganizerDetailsScreen from './screens/AdminOrganizerDetailsScreen';
import AdminMessagingScreen from './screens/AdminMessagingScreen';
import UsageStatisticsScreen from './screens/UsageStatisticsScreen';
import OrganizerProfileScreen from './screens/OrganizerProfileScreen';
import Organprofilescreenforusers from './screens/Organprofilescreenforusers';
import OrganizerEventsScreen from './screens/OrganizerEventsScreen';
import OrganizerMessageInbox from './components/OrganizerMessageInbox';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import ScreenBackground from './components/ScreenBackground';
import ErrorBoundary from './components/ErrorBoundary';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://0c1e979aaaad1fbe62132b1617719ce8@o4510617427705856.ingest.de.sentry.io/4510617430589520',
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
});

Sentry.addBreadcrumb({
  message: 'App launched',
  category: 'app',
  level: 'info',
  timestamp: new Date()
});

Sentry.setUser({
  id: 'anonymous',
  username: 'eventopia_user',
  ip_address: '{{auto}}'
});

Sentry.captureMessage('User session started', {
  tags: {
    section: 'user_tracking',
    action: 'session_start'
  }
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Organizer Stack
function OrganizerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrganizerLogin" component={OrganizerLoginScreen} />
      <Stack.Screen name="OrganizerDashboard" component={OrganizerDashboardScreen} />
      <Stack.Screen name="OrganizerInbox" component={OrganizerMessageInbox} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="UsageStatistics" component={UsageStatisticsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="BugReport" component={BugReportScreen} />
      <Stack.Screen name="FeatureRequest" component={FeatureRequestScreen} />
    </Stack.Navigator>
  );
}

// Individual Screen Stacks
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="OrganizerProfile" component={OrganizerProfileScreen} />
      <Stack.Screen name="Organprofilescreenforusers" component={Organprofilescreenforusers} />
      <Stack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="OrganizerProfile" component={OrganizerProfileScreen} />
      <Stack.Screen name="Organprofilescreenforusers" component={Organprofilescreenforusers} />
      <Stack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarList" component={CalendarScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="OrganizerProfile" component={OrganizerProfileScreen} />
      <Stack.Screen name="Organprofilescreenforusers" component={Organprofilescreenforusers} />
      <Stack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoritesList" component={FavoritesScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="OrganizerProfile" component={OrganizerProfileScreen} />
      <Stack.Screen name="Organprofilescreenforusers" component={Organprofilescreenforusers} />
      <Stack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabHeight = 65 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabHeight,
          paddingBottom: insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          zIndex: 100,
          elevation: 10,
        },
        tabBarActiveTintColor: '#0277BD',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="calendar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="clock" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStack}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="heart" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Organizer"
        component={OrganizerStack}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="plus-circle" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root App Component
function App() {
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [appReady, setAppReady] = useState(false);
  const navigationRef = React.useRef(null);
  const routeNameRef = React.useRef(null);
  const appStateRef = React.useRef(AppState.currentState);

  // Expo Updates hook
  const { showUpdatePrompt, applyUpdate, dismissUpdate } = useExpoUpdates();

  // Function to ensure status bar is always black with white text
  const setStatusBar = () => {
    try {
      // Use React Native StatusBar API
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor('#000000', true);
      StatusBar.setTranslucent(false);
      console.log('Status bar set to black with white text (opaque)');
    } catch (error) {
      console.warn('Error setting status bar:', error);
    }
  };

  // Set status bar immediately on component mount
  React.useEffect(() => {
    setStatusBar();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed to:', nextAppState);

      if (nextAppState === 'active') {
        // App came to foreground, ensure status bar is correct
        setStatusBar();
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set initial status bar
    setStatusBar();

    return () => {
      subscription?.remove();
    };
  }, []);

  const getActiveRouteName = (state) => {
    if (!state) return undefined;

    const route = state.routes?.[state.index ?? 0];
    if (!route) return undefined;

    if (route.state) {
      return getActiveRouteName(route.state);
    }

    return route.name;
  };

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      try {
        // Set status bar immediately at app start
        setStatusBar();
        
        await SplashScreen.preventAutoHideAsync();

        // Always start at Welcome on each app launch
        if (isMounted) setInitialRoute('Welcome');

        // Preload critical assets
        await Asset.loadAsync([
          require('./assets/Logo.png'),
        ]);
      } catch (e) {
        console.warn('App prepare error:', e);
      } finally {
        if (isMounted) setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!appReady || !initialRoute) {
    // Keep native splash until ready
    return null;
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <ScreenBackground />
        <StatusBar
          style="light"
          backgroundColor="#000000"
          translucent={false}
          hidden={false}
        />
        <UpdatePrompt 
          visible={showUpdatePrompt}
          onApply={applyUpdate}
          onDismiss={dismissUpdate}
        />
        <NavigationContainer
          ref={navigationRef}
          onReady={async () => {
            try {
              // Ensure status bar is set when navigation is ready
              setStatusBar();
              
              const currentRoute = navigationRef.current?.getRootState?.();
              const currentName = getActiveRouteName(currentRoute);
              routeNameRef.current = currentName;
              await analyticsService.logEvent('app_open');
              if (currentName) {
                await analyticsService.logScreenView(currentName);
              }
            } catch (e) {
              // no-op
            }
          }}
          onStateChange={async (state) => {
            try {
              // Ensure status bar is set on navigation state change
              setStatusBar();
              
              const previousRouteName = routeNameRef.current;
              const currentRouteName = getActiveRouteName(state);

              if (currentRouteName && previousRouteName !== currentRouteName) {
                await analyticsService.logScreenView(currentRouteName);
              }

              routeNameRef.current = currentRouteName;
            } catch (e) {
              // no-op
            }
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            <Stack.Screen name="Welcome" component={ModernWelcomeScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="OrganizerProfile" component={OrganizerProfileScreen} />
            <Stack.Screen name="Organprofilescreenforusers" component={Organprofilescreenforusers} />
            <Stack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} />
            <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
            <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
            <Stack.Screen name="AdminOrganizers" component={AdminOrganizersScreen} />
            <Stack.Screen name="AdminOrganizerDetails" component={AdminOrganizerDetailsScreen} />
            <Stack.Screen name="AdminMessaging" component={AdminMessagingScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </ErrorBoundary>
  );
}

// Final Wrapper with Providers
export default function AppWrapper() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <QueryProvider>
            <AuthProvider>
              <FavoritesProvider>
                <App />
              </FavoritesProvider>
            </AuthProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}