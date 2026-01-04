import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import homeStyles from '../styles/homeStyles';

export default function BugReportScreen({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  
  const [bugReport, setBugReport] = useState({
    title: '',
    description: '',
    email: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!bugReport.title.trim() || !bugReport.description.trim()) {
      Alert.alert('Missing Information', 'Please fill in both the title and description of the bug.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        ...bugReport,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.2',
        platform: 'mobile'
      };
      
      // Send bug report to backend
      const response = await apiService.submitBugReport(reportData);
      
      if (response.success) {
        Alert.alert('Bug Report Submitted', 'Thank you for helping us improve Eventopia. We\'ll review your report and get back to you if needed.');
        
        setBugReport({
          title: '',
          description: '',
          email: '',
          category: 'general'
        });
        navigation.goBack();
      } else {
        throw new Error(response.error || 'Failed to submit bug report');
      }
    } catch (error) {
      logger.error('Error submitting bug report:', error);
      Alert.alert('Error', 'Failed to submit bug report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
                  <Feather name="alert-triangle" size={20} color="#0F172A" />
                </View>
              </View>
              <View style={homeStyles.modernDashboardText}>
                <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>Support</Text>
                <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Bug Report</Text>
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            {/* Bug Category */}
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
                    onPress={() => setBugReport(prev => ({ ...prev, category: cat }))}
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

            {/* Bug Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Bug Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief description of the issue"
                value={bugReport.title}
                onChangeText={(text) => setBugReport(prev => ({ ...prev, title: text }))}
                maxLength={100}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Detailed description of what went wrong"
                value={bugReport.description}
                onChangeText={(text) => setBugReport(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={6}
                maxLength={500}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>

            {/* Email */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Your Email (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="your.email@example.com"
                value={bugReport.email}
                onChangeText={(text) => setBugReport(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
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

            {/* Helper Text */}
            <Text style={styles.helperText}>
              Your feedback helps us improve Eventopia. We'll review your report and get back to you if needed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#0277BD',
    borderColor: '#0277BD',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 32,
    marginBottom: 20,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helperText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
