import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function TermsPrivacyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
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
            📱 Phone: +251904577804{'\n'}
            🏢 Address: Addis Ababa, Ethiopia{'\n'}
            🌐 Website: www.eventopia.com
          </Text>
        </View>

        {/* Creative Footer */}
        <View style={styles.creativeFooter}>
          <View style={styles.footerGradient}>
            <Text style={styles.footerIcon}>🛡️</Text>
            <Text style={styles.footerTitle}>Your Privacy, Our Priority</Text>
            <Text style={styles.footerSubtitle}>
              Trusted by 10,000+ organizers worldwide
            </Text>
            <View style={styles.footerInfo}>
              <View style={styles.footerInfoItem}>
                <Text style={styles.footerInfoIcon}>📅</Text>
                <Text style={styles.footerInfoText}>Updated Jan 2025</Text>
              </View>
              <View style={styles.footerInfoDivider} />
              <View style={styles.footerInfoItem}>
                <Text style={styles.footerInfoIcon}>🚀</Text>
                <Text style={styles.footerInfoText}>v1.0.0 Premium</Text>
              </View>
            </View>
            <Text style={styles.footerTagline}>
              ✨ Building trust, one event at a time
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
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
  // Creative Footer Styles
  creativeFooter: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  footerGradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    padding: 24,
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  footerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  footerInfoIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  footerInfoText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  footerInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  footerTagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
