// App.js - CLEAN VERSION (HomeScreen fully extracted)
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';

import { QueryProvider } from './providers/QueryProvider';
import { FavoritesProvider } from './providers/FavoritesProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';

import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';                    // ← Now imported cleanly
import EventsScreen from './screens/EventsScreen';
import CalendarScreen from './screens/CalendarScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import EventDetailsScreen from './screens/EventDetailsScreen';
import OrganizerLoginScreen from './screens/OrganizerLoginScreen';
import OrganizerDashboardScreen from './screens/OrganizerDashboard';
import CreateEventScreen from './screens/CreateEventScreen';
import UpdateProfileScreen from './screens/UpdateProfileScreen';
import VerificationScreen from './screens/VerificationScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import TermsPrivacyScreen from './screens/TermsPrivacyScreen';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import ScreenBackground from './components/ScreenBackground';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Organizer Stack
function OrganizerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrganizerLogin" component={OrganizerLoginScreen} />
      <Stack.Screen name="OrganizerDashboard" component={OrganizerDashboardScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
    </Stack.Navigator>
  );
}

// Individual Screen Stacks
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarList" component={CalendarScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoritesList" component={FavoritesScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
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

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        // Always start at Welcome on each app launch
        if (isMounted) setInitialRoute('Welcome');

        // Preload critical assets
        await Asset.loadAsync([
          require('./assets/Logo.png'),
          require('./assets/vip.png'),
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
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <StatusBar
        barStyle="light"
        backgroundColor="#011d5883"
        translucent={false}
      />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
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