import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Initialize welcome screen state (splash is controlled in App.js)
    const init = async () => {
      try {
        // Simulate loading time (replace with actual data loading if needed)
        setTimeout(() => {
          setIsLoading(false);
          setIsAppReady(true);
        }, 1000);
      } catch (e) {
        logger.warn('Error during welcome initialization:', e);
        setIsLoading(false);
        setIsAppReady(true);
      }
    };

    init();
  }, []);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
    } catch (e) {
      logger.warn('Failed to set hasSeenWelcome flag:', e);
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
        
        {/* Top Section - Logo and Brand */}
        <View style={styles.topSection}>
          <Image 
            source={require('../assets/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Eventopia</Text>
          <Text style={styles.brandTagline}>Where Extraordinary Moments Happen</Text>
        </View>

        {/* Middle Section - App Features */}
        <View style={styles.middleSection}>
          <View style={styles.appDescriptionContainer}>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Feather name="search" size={20} color="#0277BD" style={styles.featureIcon} />
                <Text style={styles.featureText}>Discover events near you</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="calendar" size={20} color="#0277BD" style={styles.featureIcon} />
                <Text style={styles.featureText}>Create and manage your events</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="users" size={20} color="#0277BD" style={styles.featureIcon} />
                <Text style={styles.featureText}>Connect with event organizers</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.simpleStatsContainer}>
            <View style={styles.simpleStatCard}>
              <Text style={styles.simpleStatNumber}>200+</Text>
              <Text style={styles.simpleStatLabel}>Events</Text>
            </View>
            
            <View style={styles.simpleStatCard}>
              <Text style={styles.simpleStatNumber}>30K</Text>
              <Text style={styles.simpleStatLabel}>Users</Text>
            </View>
            
            <View style={styles.simpleStatCard}>
              <Text style={styles.simpleStatNumber}>10+</Text>
              <Text style={styles.simpleStatLabel}>Cities</Text>
            </View>
          </View>
        </View>

        {/* Bottom Section - CTA */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.simpleButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.simpleButtonText}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#0277BD" style={styles.simpleButtonIcon} />
          </TouchableOpacity>
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
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  
  // Three Section Layout
  topSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 2,
    position: 'relative',
  },
  logo: {
    width: 80,
    height: 80,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFD700',
    letterSpacing: 6,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica Neue',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: 'Helvetica Neue',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  middleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  vipImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  circleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  circleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsSection: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  simpleStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  simpleStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  simpleStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  simpleStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  unifiedCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 24,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    width: '100%',
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
    flex: 1,
  },
  
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  simpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  simpleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0277BD',
    letterSpacing: 0.3,
  },
  simpleButtonIcon: {
    marginLeft: 6,
  },
  modernStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  modernStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  modernStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernStatNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  modernStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    gap: 4,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 100, 100, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(4px)',
    flex: 1,
    shadowColor: 'rgba(0, 0, 0, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  statIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.1,
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
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 0,
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
  
  // App Description Section
  appDescriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 0,
    width: '100%',
  },
  
  appDescriptionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  
  appDescriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  
  featureList: {
    width: '100%',
    gap: 8,
    maxWidth: 350,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  featureIcon: {
    marginRight: 12,
  },
  
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#0277BD',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
