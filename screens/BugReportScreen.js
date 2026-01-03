import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiService from '../services/api';
import { logger } from '../utils/logger';

export default function BugReportScreen({ navigation }) {
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
      
      logger.info('Bug report submitted:', reportData);
      
      Alert.alert('Bug Report Submitted', 'Thank you for helping us improve Eventopia. We\'ll review your report and get back to you if needed.');
      
      setBugReport({
        title: '',
        description: '',
        email: '',
        category: 'general'
      });
      navigation.goBack();
    } catch (error) {
      logger.error('Error submitting bug report:', error);
      Alert.alert('Error', 'Failed to submit bug report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
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
          <Text style={styles.headerTitle}>Report a Bug</Text>
        </View>
      </LinearGradient>

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
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: 70,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0277BD',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#0277BD',
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
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
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
