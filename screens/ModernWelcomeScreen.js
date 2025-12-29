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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function ModernWelcomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } catch (e) {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
    } catch (e) {
      if (__DEV__) {
        console.warn('Failed to set hasSeenWelcome flag:', e);
      }
    } finally {
      navigation.navigate('Main');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Eventopia</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0277BD', '#01579B', '#014A7F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <LinearGradient
        colors={['rgba(11,18,32,0)', 'rgba(11,18,32,0.75)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.depthOverlay}
      />

      <View pointerEvents="none" style={styles.decorations}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.orb3} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Eventopia</Text>
          <Text style={styles.tagline}>Where Extraordinary Moments Happen</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.25)' }]}>
              <Feather name="search" size={20} color="#E0F2FE" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Discover</Text>
              <Text style={styles.featureDesc}>Find events near you</Text>
            </View>
          </View>
          <View style={styles.featureRowDivider} />
          <View style={styles.featureRow}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(2, 119, 189, 0.28)' }]}>
              <Feather name="calendar" size={20} color="#E0F2FE" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Create</Text>
              <Text style={styles.featureDesc}>Host and manage your events</Text>
            </View>
          </View>
          <View style={styles.featureRowDivider} />
          <View style={styles.featureRow}>
            <View style={[styles.featureIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.22)' }]}>
              <Feather name="users" size={20} color="#E0F2FE" />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Connect</Text>
              <Text style={styles.featureDesc}>Meet people and build community</Text>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>200+</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={[styles.statPill, styles.statPillMid]}>
              <Text style={styles.statNumber}>30K</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>10+</Text>
              <Text style={styles.statLabel}>Cities</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#38BDF8', '#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0277BD',
  },
  
  loadingText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 2,
  },
  
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  depthOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  decorations: {
    ...StyleSheet.absoluteFillObject,
  },

  orb1: {
    position: 'absolute',
    top: height * 0.12,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  orb2: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
  orb3: {
    position: 'absolute',
    top: height * 0.55,
    left: width * 0.35,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  
  hero: {
    alignItems: 'center',
    marginBottom: 18,
  },

  bottomSection: {
    marginTop: 'auto',
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: -10,
  },
  
  appName: {
    fontSize: 46,
    fontWeight: '100',
    color: '#FFFFFF',
    letterSpacing: 3
  },
  
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(226, 232, 240, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  featuresCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginTop: 16,
    marginBottom: 16,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  featureRowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  featureTextCol: {
    flex: 1,
  },
  
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  
  featureDesc: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(226, 232, 240, 0.75)',
    lineHeight: 16,
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },

  statPillMid: {
    marginHorizontal: 10,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  statLabel: {
    marginTop: 2,
    fontSize: 10,
    color: 'rgba(226, 232, 240, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },

  ctaButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },

  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: 'rgba(2, 119, 189, 0.35)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },

  ctaText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginRight: 10,
  },
});
