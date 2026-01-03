import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal } from 'react-native';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';
import homeStyles from '../styles/homeStyles';

export default function AboutScreen({ navigation }) {
  const [showBugModal, setShowBugModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [bugReport, setBugReport] = useState({
    title: '',
    description: '',
    email: '',
    category: 'general'
  });
  const [featureRequest, setFeatureRequest] = useState({
    title: '',
    description: '',
    email: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailPress = () => {
    Linking.openURL('mailto:samred221b@gmail.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://eventopia.com');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('TermsPrivacy');
  };

  const handleBugSubmit = async () => {
    if (!bugReport.title.trim() || !bugReport.description.trim()) {
      setError(toAppError(new Error('Please fill in both the title and description of the bug.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // In a real app, this would send to your bug tracking system
      const reportData = {
        ...bugReport,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.2',
        platform: 'mobile'
      };
      
      // For now, we'll just log it and show success
      logger.info('Bug report submitted:', reportData);
      
      // You could send this to your backend/API
      // await apiService.submitBugReport(reportData);
      
      Alert.alert('Bug Report Submitted', 'Thank you for helping us improve Eventopia. We\'ll review your report and get back to you if needed.');
      
      // Reset form
      setBugReport({
        title: '',
        description: '',
        email: '',
        category: 'general'
      });
      setShowBugModal(false);
    } catch (error) {
      logger.error('Error submitting bug report:', error);
      setError(toAppError(error, { fallbackMessage: 'Failed to submit bug report. Please try again later.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureSubmit = async () => {
    if (!featureRequest.title.trim() || !featureRequest.description.trim()) {
      setError(toAppError(new Error('Please fill in both the title and description of your feature request.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // In a real app, this would send to your feature tracking system
      const requestData = {
        ...featureRequest,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.2',
        platform: 'mobile'
      };
      
      // For now, we'll just log it and show success
      logger.info('Feature request submitted:', requestData);
      
      // You could send this to your backend/API
      // await apiService.submitFeatureRequest(requestData);
      
      Alert.alert('Feature Request Submitted', 'Thank you for your suggestion! We\'ll review your request and consider it for future updates.');
      
      // Reset form
      setFeatureRequest({
        title: '',
        description: '',
        email: '',
        category: 'general'
      });
      setShowFeatureModal(false);
    } catch (error) {
      logger.error('Error submitting feature request:', error);
      setError(toAppError(error, { fallbackMessage: 'Failed to submit feature request. Please try again later.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching HomeScreen */}
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
                  <Feather name="info" size={20} color="#0277BD" />
                </View>
              </View>
              <View style={homeStyles.modernDashboardText}>
                <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>About</Text>
                <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Eventopia</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={homeStyles.modernDashboardBell}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <AppErrorBanner error={error} />
      
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

          <View style={styles.section}>
            <TouchableOpacity style={styles.bugReportButton} onPress={() => navigation.navigate('BugReport')}>
              <Feather name="alert-triangle" size={18} color="#FFFFFF" />
              <Text style={styles.bugReportButtonText}>Report a Bug</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.featureRequestButton} onPress={() => navigation.navigate('FeatureRequest')}>
              <Feather name="star" size={18} color="#FFFFFF" />
              <Text style={styles.featureRequestButtonText}>Request a Feature</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2025 Eventopia. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              Sam Tech.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bug Report Modal */}
      <Modal
        visible={showBugModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBugModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <Feather name="alert-triangle" size={20} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Report a Bug</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  console.log('Bug modal close button pressed');
                  setShowBugModal(false);
                }}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Form Content */}
            <View style={styles.modalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Bug Category</Text>
                <View style={styles.categoryButtons}>
                  {['general', 'crash', 'ui', 'performance', 'feature'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        bugReport.category === cat && styles.categoryButtonActive
                      ]}
                      onPress={() => {
                    console.log('Category selected:', cat);
                    setBugReport(prev => ({ ...prev, category: cat }));
                  }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        bugReport.category === cat && styles.categoryButtonTextActive
                      ]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Bug Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description of the issue"
                  value={bugReport.title}
                  onChangeText={(text) => setBugReport(prev => ({ ...prev, title: text }))}
                  maxLength={100}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Detailed description of what went wrong"
                  value={bugReport.description}
                  onChangeText={(text) => setBugReport(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Your Email (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="your.email@example.com"
                  value={bugReport.email}
                  onChangeText={(text) => setBugReport(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  console.log('Cancel button pressed');
                  setShowBugModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleBugSubmit}
                activeOpacity={0.9}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#0277BD', '#01579B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Submit Report</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feature Request Modal */}
      <Modal
        visible={showFeatureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeatureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <Feather name="star" size={20} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Request a Feature</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFeatureModal(false)}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Form Content */}
            <View style={styles.modalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Feature Category</Text>
                <View style={styles.categoryButtons}>
                  {['general', 'ui', 'performance', 'integration', 'new'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        featureRequest.category === cat && styles.categoryButtonActive
                      ]}
                      onPress={() => setFeatureRequest(prev => ({ ...prev, category: cat }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        featureRequest.category === cat && styles.categoryButtonTextActive
                      ]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Feature Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description of your feature idea"
                  value={featureRequest.title}
                  onChangeText={(text) => setFeatureRequest(prev => ({ ...prev, title: text }))}
                  maxLength={100}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Detailed description of your feature suggestion and why it would be useful"
                  value={featureRequest.description}
                  onChangeText={(text) => setFeatureRequest(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Your Email (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="your.email@example.com"
                  value={featureRequest.email}
                  onChangeText={(text) => setFeatureRequest(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowFeatureModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleFeatureSubmit}
                activeOpacity={0.9}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#0277BD', '#01579B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Submit Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0277BD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0277BD',
    marginBottom: 4,
  },
  version: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  featureList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  linkButtonText: {
    fontSize: 15,
    color: '#0277BD',
    fontWeight: '600',
  },
  bugReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  bugReportButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featureRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0277BD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  featureRequestButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    height: 'auto',
    maxHeight: '80%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  formSection: {
    paddingVertical: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: 60,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0277BD',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#0277BD',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
