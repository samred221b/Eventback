import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

export default function VerificationScreen({ navigation }) {
  const { user, organizerProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [applicationData, setApplicationData] = useState({
    organizationName: '',
    organizationType: 'individual',
    website: '',
    socialMedia: '',
    experience: '',
    eventTypes: [],
    documents: [],
    reason: '',
  });

  const organizationTypes = [
    { id: 'individual', label: 'Individual Organizer', icon: '👤' },
    { id: 'company', label: 'Company/Business', icon: '🏢' },
    { id: 'nonprofit', label: 'Non-Profit Organization', icon: '🤝' },
    { id: 'government', label: 'Government Agency', icon: '🏛️' },
    { id: 'educational', label: 'Educational Institution', icon: '🎓' },
  ];

  const eventTypeOptions = [
    { id: 'music', label: 'Music & Concerts', icon: '🎵' },
    { id: 'business', label: 'Business & Professional', icon: '💼' },
    { id: 'food', label: 'Food & Drink', icon: '🍽️' },
    { id: 'sports', label: 'Sports & Fitness', icon: '⚽' },
    { id: 'art', label: 'Arts & Culture', icon: '🎨' },
    { id: 'education', label: 'Education & Training', icon: '📚' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'community', label: 'Community & Social', icon: '🤝' },
  ];

  const handleSubmitApplication = () => {
    if (!applicationData.organizationName.trim()) {
      Alert.alert('Missing Information', 'Please enter your organization name');
      return;
    }

    if (!applicationData.reason.trim()) {
      Alert.alert('Missing Information', 'Please explain why you want verification');
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Status</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Verified Status */}
          <View style={styles.verifiedSection}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✅</Text>
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
                <Text style={styles.benefitIcon}>✅</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Verified</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Why Get Verified */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Why Get Verified?</Text>
          <Text style={styles.sectionDescription}>
            Verification helps build trust with attendees and gives you access to premium organizer features.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✅</Text>
              <Text style={styles.benefitText}>Verified badge on your profile</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔝</Text>
              <Text style={styles.benefitText}>Higher visibility in search results</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📊</Text>
              <Text style={styles.benefitText}>Advanced analytics and insights</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💬</Text>
              <Text style={styles.benefitText}>Priority customer support</Text>
            </View>
          </View>
        </View>

        {/* Application Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Verification Application</Text>
          
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
                  <Text style={styles.optionIcon}>{type.icon}</Text>
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
                  <Text style={styles.eventTypeIcon}>{type.icon}</Text>
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

          {/* Experience */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Experience & Background</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={applicationData.experience}
              onChangeText={(text) => setApplicationData({...applicationData, experience: text})}
              placeholder="Tell us about your experience organizing events..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Reason for Verification */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Why do you want to be verified? *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={applicationData.reason}
              onChangeText={(text) => setApplicationData({...applicationData, reason: text})}
              placeholder="Explain why verification is important for your events and attendees..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Verification Requirements</Text>
          
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>✓</Text>
              <Text style={styles.requirementText}>At least 3 successfully organized events</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>✓</Text>
              <Text style={styles.requirementText}>Positive attendee feedback and ratings</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>✓</Text>
              <Text style={styles.requirementText}>Complete and accurate profile information</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>✓</Text>
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
          <Text style={styles.noteText}>
            📝 Note: Our verification team will review your application within 3-5 business days. 
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
    backgroundColor: '#dcfce7',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  verifiedDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
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
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#3b82f6',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  eventTypeChipSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  eventTypeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  eventTypeTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 12,
    fontWeight: '700',
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
  },
});
