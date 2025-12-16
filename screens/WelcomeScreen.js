import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Hide the splash screen
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        // Simulate loading time (replace with actual data loading if needed)
        setTimeout(() => {
          setIsLoading(false);
          setIsAppReady(true);
        }, 1000);
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
        setIsLoading(false);
        setIsAppReady(true);
      }
    };

    hideSplash();
  }, []);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
    } catch (e) {
      if (__DEV__) console.warn('Failed to set hasSeenWelcome flag:', e);
    } finally {
      navigation.navigate('Main');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Blue Gradient Background */}
      <LinearGradient
        colors={['#0277BD', '#01579B', '#014A7F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Decorative Circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/Logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Eventopia</Text>
            <View style={styles.taglineContainer}>
              <Feather name="star" size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.tagline}>
                Discover Amazing Events Near You
              </Text>
              <Feather name="star" size={16} color="rgba(255, 255, 255, 0.8)" />
            </View>
          </View>

          {/* VIP Highlight */}
          <Image
            source={require('../assets/vip.png')}
            style={styles.vipImage}
            resizeMode="contain"
          />

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Feather name="calendar" size={24} color="#0277BD" />
              <Text style={styles.statNumber}>200+</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            
            <View style={styles.statCard}>
              <Feather name="users" size={24} color="#0277BD" />
              <Text style={styles.statNumber}>30K</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            
            <View style={styles.statCard}>
              <Feather name="map-pin" size={24} color="#0277BD" />
              <Text style={styles.statNumber}>10+</Text>
              <Text style={styles.statLabel}>Cities</Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <Feather name="arrow-right-circle" size={24} color="#0277BD" />
              <Text style={styles.buttonText}>Get Started</Text>
            </View>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Feather name="check-circle" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.footerText}>
              Join thousands discovering events daily
            </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0277BD',
  },
  container: {
    flex: 1,
    backgroundColor: '#3986b3f6',
    margin: 0,
    padding: 0,
  },
  
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  
  // Decorative Elements
  decorativeCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -80,
    right: -80,
  },
  
  decorativeCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 50,
    left: -50,
  },
  
  decorativeCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: height * 0.35,
    right: 20,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  
  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 3,
  },
  
 
  
  logo: {
    width: 105,
    height: 105,
  },
  
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // VIP Image
  vipImage: {
    width: 550,
    height: 300,
    marginBottom: 10,
  },
  
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0277BD',
    marginTop: 6,
    marginBottom: 2,
  },
  
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  
  // Button
  getStartedButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  
  buttonContent: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  
  buttonText: {
    color: '#0277BD',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});
