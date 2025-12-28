import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function AboutScreen({ navigation }) {
  const handleEmailPress = () => {
    Linking.openURL('mailto:samred221b@gmail.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://eventopia.com');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('TermsPrivacy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0277BD', '#01579B', '#014373']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Eventopia</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Image 
                source={require('../assets/Logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Eventopia</Text>
            <Text style={styles.version}>Version 1.0.2</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Eventopia</Text>
            <Text style={styles.sectionText}>
              Eventopia is your premier event discovery and management platform. 
              Whether you're looking for exciting events in your area or an organizer 
              wanting to reach a wider audience, Eventopia makes it simple and enjoyable.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Feather name="search" size={20} color="#0277BD" />
                <Text style={styles.featureText}>Discover local events</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="heart" size={20} color="#0277BD" />
                <Text style={styles.featureText}>Save favorite events</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="map-pin" size={20} color="#0277BD" />
                <Text style={styles.featureText}>Location-based recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="calendar" size={20} color="#0277BD" />
                <Text style={styles.featureText}>Personalized event calendar</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="users" size={20} color="#0277BD" />
                <Text style={styles.featureText}>Organizer tools and analytics</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
              <Feather name="mail" size={20} color="#0277BD" />
              <Text style={styles.contactText}>samred221b@gmail.com</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
              <Feather name="globe" size={20} color="#0277BD" />
              <Text style={styles.contactText}>www.eventopia.com</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPress}>
              <Text style={styles.linkButtonText}>Privacy Policy & Terms</Text>
              <Feather name="chevron-right" size={20} color="#0277BD" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2024 Eventopia. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              Made with ❤️ for event enthusiasts
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0277BD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  logoImage: {
    width: 100,
    height: 100
    ,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0277BD',
    marginBottom: 5,
  },
  version: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  featureList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  contactText: {
    fontSize: 16,
    color: '#0277BD',
    textDecorationLine: 'underline',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#0277BD',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 5,
  },
});
