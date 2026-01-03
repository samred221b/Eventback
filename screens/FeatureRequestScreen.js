import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiService from '../services/api';
import { logger } from '../utils/logger';

export default function FeatureRequestScreen({ navigation }) {
  const [featureRequest, setFeatureRequest] = useState({
    title: '',
    description: '',
    email: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!featureRequest.title.trim() || !featureRequest.description.trim()) {
      Alert.alert('Missing Information', 'Please fill in both the title and description of your feature request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        ...featureRequest,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.2',
        platform: 'mobile'
      };
      
      logger.info('Feature request submitted:', requestData);
      
      Alert.alert('Feature Request Submitted', 'Thank you for your suggestion! We\'ll review your request and consider it for future updates.');
      
      setFeatureRequest({
        title: '',
        description: '',
        email: '',
        category: 'general'
      });
      navigation.goBack();
    } catch (error) {
      logger.error('Error submitting feature request:', error);
      Alert.alert('Error', 'Failed to submit feature request. Please try again later.');
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
          <Text style={styles.headerTitle}>Request a Feature</Text>
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
            {/* Feature Category */}
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

            {/* Feature Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Feature Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief description of your feature idea"
                value={featureRequest.title}
                onChangeText={(text) => setFeatureRequest(prev => ({ ...prev, title: text }))}
                maxLength={100}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Detailed description of your feature suggestion and why it would be useful"
                value={featureRequest.description}
                onChangeText={(text) => setFeatureRequest(prev => ({ ...prev, description: text }))}
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
                value={featureRequest.email}
                onChangeText={(text) => setFeatureRequest(prev => ({ ...prev, email: text }))}
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
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Helper Text */}
            <Text style={styles.helperText}>
              Have an idea to make Eventopia better? We'd love to hear it! We'll review your request and consider it for future updates.
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
