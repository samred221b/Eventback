import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import homeStyles from '../styles/homeStyles';

export default function TermsPrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8FF' }} edges={['top']}>
      {/* Header - Home Style */}
      <View style={homeStyles.homeHeaderContainer}>
        <LinearGradient
          colors={['#0277BD', '#01579B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={homeStyles.homeHeaderCard}
        >
          <View style={homeStyles.homeHeaderBg} pointerEvents="none">
            <View style={homeStyles.homeHeaderOrbOne} />
            <View style={homeStyles.homeHeaderOrbTwo} />
          </View>
          <View style={homeStyles.homeHeaderTopRow}>
            <View style={homeStyles.modernDashboardProfile}>
              <View style={homeStyles.modernDashboardAvatar}>
                <View style={homeStyles.modernDashboardAvatarInner}>
                  <Feather name="shield" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Legal</Text>
                <Text style={homeStyles.homeHeaderNameText}>Terms & Privacy</Text>
              </View>
            </View>
            <View style={homeStyles.homeHeaderActions}>
              <TouchableOpacity 
                style={homeStyles.homeHeaderIconButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={20} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>Terms of Service</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Privacy Policy</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>User Rights</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Terms of Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Terms of Service</Text>
          
          <Text style={styles.subsectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By using Eventopia, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </Text>

          <Text style={styles.subsectionTitle}>2. Event Creation and Management</Text>
          <Text style={styles.text}>
            • Event organizers are responsible for the accuracy of event information{'\n'}
            • All events must comply with local laws and regulations{'\n'}
            • Eventopia reserves the right to remove inappropriate content{'\n'}
            • Organizers must honor their event commitments to attendees
          </Text>

          <Text style={styles.subsectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.text}>
            • Provide accurate and up-to-date information{'\n'}
            • Respect other users and maintain appropriate conduct{'\n'}
            • Do not use the platform for illegal activities{'\n'}
            • Report any suspicious or inappropriate behavior
          </Text>

          <Text style={styles.subsectionTitle}>4. Event Promotion and Discovery</Text>
          <Text style={styles.text}>
            • Eventopia provides a platform for event discovery and promotion{'\n'}
            • All events are free to publish and attend through our platform{'\n'}
            • Organizers are responsible for their own event logistics and management{'\n'}
            • We reserve the right to feature quality events in our recommendations
          </Text>

          <Text style={styles.subsectionTitle}>5. Intellectual Property</Text>
          <Text style={styles.text}>
            • Users retain rights to their content but grant Eventopia usage rights{'\n'}
            • Do not upload copyrighted material without permission{'\n'}
            • Eventopia respects intellectual property rights{'\n'}
            • Report copyright violations to our support team
          </Text>
        </View>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy Policy</Text>
          
          <Text style={styles.subsectionTitle}>Information We Collect</Text>
          <Text style={styles.text}>
            • Account information (name, email, profile details){'\n'}
            • Event data and preferences{'\n'}
            • Usage analytics and app performance data{'\n'}
            • Location data (with your permission) for nearby events{'\n'}
            • Device information for app optimization
          </Text>

          <Text style={styles.subsectionTitle}>How We Use Your Information</Text>
          <Text style={styles.text}>
            • Provide and improve our services{'\n'}
            • Send event notifications and updates{'\n'}
            • Personalize your experience{'\n'}
            • Ensure platform security and prevent fraud{'\n'}
            • Analyze usage patterns to enhance features
          </Text>

          <Text style={styles.subsectionTitle}>Information Sharing</Text>
          <Text style={styles.text}>
            • We do not sell your personal information{'\n'}
            • Event organizers can see attendee information for their events{'\n'}
            • We may share data with service providers under strict agreements{'\n'}
            • Legal compliance may require information disclosure{'\n'}
            • Anonymous analytics may be shared with partners
          </Text>

          <Text style={styles.subsectionTitle}>Data Security</Text>
          <Text style={styles.text}>
            • We use industry-standard encryption{'\n'}
            • Regular security audits and updates{'\n'}
            • Secure payment processing through trusted providers{'\n'}
            • Limited access to personal data by authorized personnel{'\n'}
            • Incident response procedures for data breaches
          </Text>

          <Text style={styles.subsectionTitle}>Your Rights</Text>
          <Text style={styles.text}>
            • Access and download your data{'\n'}
            • Correct inaccurate information{'\n'}
            • Delete your account and data{'\n'}
            • Opt out of marketing communications{'\n'}
            • Control privacy settings and permissions
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact Us</Text>
          <Text style={styles.text}>
            If you have questions about these Terms or Privacy Policy, please contact us:
            {'\n\n'}
            📧 Email: samred221b@gmail.com{'\n'}
            🏢 Address: Addis Ababa, Ethiopia{'\n'}
            🌐 Website: www.eventopia.com
          </Text>

          {/* Social Media Icons */}
          <View style={styles.socialMediaContainer}>
            <TouchableOpacity style={styles.socialMediaIcon} onPress={() => Linking.openURL('https://facebook.com/eventopia')}>
              <Feather name="facebook" size={20} color="#0277BD" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaIcon} onPress={() => Linking.openURL('https://instagram.com/eventopia')}>
              <Feather name="instagram" size={20} color="#0277BD" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaIcon} onPress={() => Linking.openURL('https://twitter.com/eventopia')}>
              <Feather name="twitter" size={20} color="#0277BD" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaIcon} onPress={() => Linking.openURL('https://tiktok.com/@eventopia')}>
              <Feather name="video" size={20} color="#0277BD" />
            </TouchableOpacity>
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
    paddingTop: 44, // Add padding for status bar
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  socialMediaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(2, 119, 189, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(2, 119, 189, 0.2)',
  },
  footer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
