import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import homeStyles from '../styles/homeStyles';

export default function VerificationScreen({ navigation }) {
  const { user, organizerProfile } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [isLoading, setIsLoading] = useState(false);
  const [applicationData, setApplicationData] = useState({
    organizationName: '',
    organizationType: 'individual',
    website: '',
    socialMedia: '',
    eventTypes: [],
    documents: [],
  });

  const organizationTypes = [
    { id: 'individual', label: 'Individual Organizer', icon: 'user' },
    { id: 'company', label: 'Company/Business', icon: 'building' },
    { id: 'nonprofit', label: 'Non-Profit Organization', icon: 'heart' },
    { id: 'government', label: 'Government Agency', icon: 'flag' },
    { id: 'educational', label: 'Educational Institution', icon: 'book-open' },
  ];

  const eventTypeOptions = [
    { id: 'music', label: 'Music & Concerts', icon: 'music' },
    { id: 'business', label: 'Business & Professional', icon: 'briefcase' },
    { id: 'food', label: 'Food & Drink', icon: 'coffee' },
    { id: 'sports', label: 'Sports & Fitness', icon: 'target' },
    { id: 'art', label: 'Arts & Culture', icon: 'palette' },
    { id: 'education', label: 'Education & Training', icon: 'book' },
    { id: 'technology', label: 'Technology', icon: 'cpu' },
    { id: 'community', label: 'Community & Social', icon: 'users' },
  ];

  const handleSubmitApplication = () => {
    if (!applicationData.organizationName.trim()) {
      Alert.alert('Missing Information', 'Please enter your organization name');
      return;
    }

    Alert.alert(
      'Application Submitted!',
      'Your verification application has been submitted successfully. Our team will review it within 3-5 business days and contact you via email.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const toggleEventType = (typeId) => {
    setApplicationData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(typeId)
        ? prev.eventTypes.filter(id => id !== typeId)
        : [...prev.eventTypes, typeId]
    }));
  };

  const isVerified = organizerProfile?.isVerified || false;

  if (isVerified) {
    return (
      <View style={styles.container}>
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
                    <Feather name="user" size={20} color="#0277BD" />
                  </View>
                </View>
                <View style={homeStyles.modernDashboardText}>
                  <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>Verification</Text>
                  <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Status</Text>
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Verified Status */}
          <View style={styles.verifiedSection}>
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={40} color="#0277BD" />
            </View>
            <Text style={styles.verifiedTitle}>You're Verified!</Text>
            <Text style={styles.verifiedDescription}>
              Congratulations! Your organizer account has been verified. You now have access to premium features and increased visibility.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎉 Verification Benefits</Text>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Feather name="check-circle" size={18} color="#0277BD" style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Verified Badge</Text>
                  <Text style={styles.benefitDescription}>Blue checkmark on your profile and events</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🔝</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Priority Listing</Text>
                  <Text style={styles.benefitDescription}>Your events appear higher in search results</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📊</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Advanced Analytics</Text>
                  <Text style={styles.benefitDescription}>Detailed insights and performance metrics</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🎯</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Featured Events</Text>
                  <Text style={styles.benefitDescription}>Opportunity to be featured on homepage</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💬</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Priority Support</Text>
                  <Text style={styles.benefitDescription}>Faster response times from our team</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header matching HomeScreen */}
      <View style={[homeStyles.homeHeaderContainer, { paddingTop: insets.top }]}>
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
                <Text style={homeStyles.homeHeaderWelcomeText}>Get Verified</Text>
                <Text style={homeStyles.homeHeaderNameText}>Apply for Verification</Text>
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
            <Text style={homeStyles.homeHeaderMetaText}>Verification</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Trust Badge</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Premium Features</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Why Get Verified */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Get Verified?</Text>
          <Text style={styles.sectionDescription}>
            Verification helps build trust with attendees and gives you access to premium organizer features.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Feather name="check-circle" size={20} color="#0277BD" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Verified badge on your profile</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="trending-up" size={20} color="#0277BD" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Higher visibility in search results</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="bar-chart-2" size={20} color="#0277BD" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Advanced analytics and insights</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="message-circle" size={20} color="#0277BD" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Priority customer support</Text>
            </View>
          </View>
        </View>

        {/* Application Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Application</Text>
          
          {/* Organization Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Name *</Text>
            <TextInput
              style={styles.formInput}
              value={applicationData.organizationName}
              onChangeText={(text) => setApplicationData({...applicationData, organizationName: text})}
              placeholder="Enter your organization or business name"
            />
          </View>

          {/* Organization Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Type *</Text>
            <View style={styles.optionsGrid}>
              {organizationTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.optionButton,
                    applicationData.organizationType === type.id && styles.optionButtonSelected
                  ]}
                  onPress={() => setApplicationData({...applicationData, organizationType: type.id})}
                >
                  <Feather name={type.icon} size={20} color={applicationData.organizationType === type.id ? "#FFFFFF" : "#0277BD"} />
                  <Text style={[
                    styles.optionText,
                    applicationData.organizationType === type.id && styles.optionTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Website */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Website/Social Media</Text>
            <TextInput
              style={styles.formInput}
              value={applicationData.website}
              onChangeText={(text) => setApplicationData({...applicationData, website: text})}
              placeholder="https://yourwebsite.com or @yoursocial"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Event Types */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Types You Organize</Text>
            <View style={styles.eventTypesGrid}>
              {eventTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.eventTypeChip,
                    applicationData.eventTypes.includes(type.id) && styles.eventTypeChipSelected
                  ]}
                  onPress={() => toggleEventType(type.id)}
                >
                  <Feather name={type.icon} size={16} color={applicationData.eventTypes.includes(type.id) ? "#FFFFFF" : "#0277BD"} />
                  <Text style={[
                    styles.eventTypeText,
                    applicationData.eventTypes.includes(type.id) && styles.eventTypeTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Requirements</Text>
          
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Feather name="check" size={18} color="#0277BD" style={styles.requirementIcon} />
              <Text style={styles.requirementText}>At least 3 successfully organized events</Text>
            </View>
            <View style={styles.requirementItem}>
              <Feather name="star" size={18} color="#0277BD" style={styles.requirementIcon} />
              <Text style={styles.requirementText}>Positive attendee feedback and ratings</Text>
            </View>
            <View style={styles.requirementItem}>
              <Feather name="user-check" size={18} color="#0277BD" style={styles.requirementIcon} />
              <Text style={styles.requirementText}>Complete and accurate profile information</Text>
            </View>
            <View style={styles.requirementItem}>
              <Feather name="mail" size={18} color="#0277BD" style={styles.requirementIcon} />
              <Text style={styles.requirementText}>Valid contact information and website</Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmitApplication}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Submitting Application...' : 'Submit Verification Application'}
          </Text>
        </TouchableOpacity>

        {/* Note */}
        <View style={styles.noteSection}>
          <Feather name="info" size={16} color="#0277BD" style={styles.noteIcon} />
          <Text style={styles.noteText}>
            Our verification team will review your application within 3-5 business days. 
            You'll receive an email notification with the decision and any additional requirements.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  verifiedSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedIcon: {
    fontSize: 40,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0277BD',
    marginBottom: 8,
  },
  verifiedDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0277BD',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#0277BD',
    backgroundColor: '#F0F7FF',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#0277BD',
    fontWeight: '600',
  },
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  eventTypeChipSelected: {
    borderColor: '#0277BD',
    backgroundColor: '#F0F7FF',
  },
  eventTypeIcon: {
    marginRight: 6,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  eventTypeTextSelected: {
    color: '#0277BD',
    fontWeight: '600',
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    marginRight: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#0277BD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  noteSection: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  noteText: {
    fontSize: 12,
    color: '#0277BD',
    lineHeight: 18,
    flex: 1,
  },
});
