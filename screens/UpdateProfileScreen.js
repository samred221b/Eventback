import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import apiService from '../services/api';
import homeStyles from '../styles/homeStyles';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';

export default function UpdateProfileScreen({ navigation }) {
  const { user, organizerProfile, updateOrganizerProfile, deleteOrganizerAccount, signOut } = useAuth();
  const { mode, setThemeMode, colors } = useTheme();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    organization: '',
    website: '',
    address: '',
    city: '',
    country: 'Ethiopia',
    profileImage: '',
  });

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = [
      profileData.name,
      profileData.phone,
      profileData.bio,
      profileData.organization,
      profileData.website,
      profileData.address,
      profileData.city,
      profileData.profileImage,
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    const completionPercentage = Math.round((completedFields / fields.length) * 100);
    
    return completionPercentage;
  };

  useEffect(() => {
    // Initialize form with existing profile data
    if (organizerProfile) {
      setProfileData({
        name: organizerProfile.name || '',
        email: organizerProfile.email || user?.email || '',
        phone: organizerProfile.phone || '',
        bio: organizerProfile.bio || '',
        organization: organizerProfile.organization || '',
        website: organizerProfile.website || '',
        address: organizerProfile.address || '',
        city: organizerProfile.city || '',
        country: organizerProfile.country || 'Ethiopia',
        profileImage: organizerProfile.profileImage || '',
      });
    } else if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
      }));
    }
  }, [organizerProfile, user]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will:\n\n• Delete your profile information\n• Cancel all your upcoming events\n• Remove all your data from our system\n\nThis action is irreversible.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsLoading(true);
    
    try {
      const result = await deleteOrganizerAccount();
      
      if (result.success) {
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted. You will now be logged out.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Sign out and navigate to welcome screen
                await signOut();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }
            }
          ]
        );
      } else {
        setError(toAppError(new Error(result.error || 'Failed to delete account'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
      }
    } catch (error) {
      logger.error('UpdateProfileScreen confirmDeleteAccount error:', error);
      setError(toAppError(error, { fallbackMessage: 'An unexpected error occurred while deleting your account' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setError(null); // Clear any previous errors
    if (!profileData.name.trim()) {
      setError(toAppError(new Error('Name is required'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }

    // Email is no longer required for validation (comes from Firebase)
    // All other fields are optional

    setIsLoading(true);

    try {
      const result = await updateOrganizerProfile(profileData);
      
      if (result.success) {
        setError(null); // Clear any previous errors
        setError(toAppError(new Error('Your profile has been updated successfully.'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
        setTimeout(() => navigation.goBack(), 1500); // Auto-navigate after showing success
      } else {
        setError(toAppError(new Error(result.error || 'Failed to update profile'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
      }
    } catch (error) {
      logger.error('UpdateProfileScreen handleUpdateProfile error:', error);
      setError(toAppError(error, { fallbackMessage: 'An unexpected error occurred' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError(toAppError(new Error('Camera roll permission is required to upload images.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Show loading state
        setIsUploadingImage(true);
        
        try {
          // Upload image to server
          const uploadResult = await apiService.uploadImage(imageUri);
          
          if (uploadResult.success) {
            // Use the returned URL from server
            const imageUrl = uploadResult.url || uploadResult.data?.url;
            setProfileData(prev => ({
              ...prev,
              profileImage: imageUrl
            }));
            setError(null); // Clear any previous errors
            setError(toAppError(new Error('Profile image uploaded successfully!'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
          } else {
            setError(toAppError(new Error(uploadResult.error || 'Failed to upload image'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
          }
        } catch (uploadError) {
          logger.error('Error uploading image:', uploadError);
          setError(toAppError(uploadError, { fallbackMessage: 'Failed to upload image to server' }));
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      setError(toAppError(error, { fallbackMessage: 'Failed to pick image' }));
      setIsUploadingImage(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
                  <Feather name="user" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Organizer Profile</Text>
                <Text style={homeStyles.homeHeaderNameText}>{profileData.name || 'Organizer'}</Text>
              </View>
            </View>
            <View style={homeStyles.homeHeaderActions}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleUpdateProfile}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>Edit Profile</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Update Info</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Save Changes</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <AppErrorBanner error={error} onRetry={() => setError(null)} disabled={isLoading || isUploadingImage} />

        {/* Profile Completion Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Profile Completion</Text>
            <Text style={styles.progressPercentage}>{calculateProfileCompletion()}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${calculateProfileCompletion()}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {calculateProfileCompletion() === 100 
              ? '🎉 Excellent! Your profile is complete.' 
              : `Complete your profile to get ${100 - calculateProfileCompletion()}% more visibility`
            }
          </Text>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={handleImagePicker}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <View style={[styles.profileImage, styles.uploadingContainer]}>
                <ActivityIndicator size="small" color="#0277BD" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Feather name="user" size={40} color="#0277BD" />
              </View>
            )}
            <View style={styles.editImageBadge}>
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.profileImageText}>Tap to change profile picture</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Full Name *</Text>
            <TextInput
              style={styles.formInput}
              value={profileData.name}
              onChangeText={(text) => setProfileData({...profileData, name: text})}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email Address *</Text>
            <TextInput
              style={[styles.formInput, styles.disabledInput]}
              value={profileData.email}
              editable={false}
              placeholder="your.email@example.com"
            />
            <Text style={styles.formNote}>Email cannot be changed</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              value={profileData.phone}
              onChangeText={(text) => setProfileData({...profileData, phone: text})}
              placeholder="+251-11-123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bio</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={profileData.bio}
              onChangeText={(text) => setProfileData({...profileData, bio: text})}
              placeholder="Tell people about yourself and your events..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Organization Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Name</Text>
            <TextInput
              style={styles.formInput}
              value={profileData.organization}
              onChangeText={(text) => setProfileData({...profileData, organization: text})}
              placeholder="Your company or organization name"
            />
          </View>

          {/* Website */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Website</Text>
            <TextInput
              style={styles.formInput}
              value={profileData.website}
              onChangeText={(text) => setProfileData({...profileData, website: text})}
              placeholder="https://www.yourwebsite.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <View style={styles.socialMediaContainer}>
            <View style={styles.socialMediaRow}>
              <View style={styles.socialMediaInputContainer}>
                <Text style={styles.socialMediaLabel}>Facebook</Text>
                <TextInput
                  style={styles.socialMediaInput}
                  value={profileData.facebook || ''}
                  onChangeText={(text) => setProfileData({...profileData, facebook: text})}
                  placeholder="https://facebook.com/yourprofile"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
            
            <View style={styles.socialMediaRow}>
              <View style={styles.socialMediaInputContainer}>
                <Text style={styles.socialMediaLabel}>Instagram</Text>
                <TextInput
                  style={styles.socialMediaInput}
                  value={profileData.instagram || ''}
                  onChangeText={(text) => setProfileData({...profileData, instagram: text})}
                  placeholder="https://instagram.com/yourprofile"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
            
            <View style={styles.socialMediaRow}>
              <View style={styles.socialMediaInputContainer}>
                <Text style={styles.socialMediaLabel}>Telegram</Text>
                <TextInput
                  style={styles.socialMediaInput}
                  value={profileData.telegram || ''}
                  onChangeText={(text) => setProfileData({...profileData, telegram: text})}
                  placeholder="https://t.me/yourprofile"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
            
            <View style={styles.socialMediaRow}>
              <View style={styles.socialMediaInputContainer}>
                <Text style={styles.socialMediaLabel}>TikTok</Text>
                <TextInput
                  style={styles.socialMediaInput}
                  value={profileData.tiktok || ''}
                  onChangeText={(text) => setProfileData({...profileData, tiktok: text})}
                  placeholder="https://tiktok.com/@yourprofile"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Address</Text>
            <TextInput
              style={styles.formInput}
              value={profileData.address}
              onChangeText={(text) => setProfileData({...profileData, address: text})}
              placeholder="Street address"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={profileData.city}
                onChangeText={(text) => setProfileData({...profileData, city: text})}
                placeholder="Addis Ababa"
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={styles.formLabel}>Country</Text>
              <TextInput
                style={styles.formInput}
                value={profileData.country}
                onChangeText={(text) => setProfileData({...profileData, country: text})}
                placeholder="Ethiopia"
              />
            </View>
          </View>
        </View>

        
        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="lock" size={20} color="#0277BD" style={styles.actionButtonIcon} />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Change Password</Text>
              <Text style={styles.actionButtonSubtitle}>Update your account password</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#94A3B8" style={styles.actionButtonArrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Feather name="trash-2" size={20} color="#DC2626" style={styles.actionButtonIcon} />
            <View style={styles.actionButtonContent}>
              <Text style={[styles.actionButtonTitle, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.actionButtonSubtitle}>Permanently delete your account</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#94A3B8" style={styles.actionButtonArrow} />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButtonLarge, isLoading && styles.saveButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonLargeText}>
            {isLoading ? 'Updating Profile...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  saveButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#0277BD',
  },
  profileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0277BD',
  },
  profileImageIcon: {
    fontSize: 44,
    color: '#0277BD',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0277BD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editImageIcon: {
    fontSize: 18,
  },
  profileImageText: {
    fontSize: 14,
    color: '#0277BD',
    fontWeight: '600',
  },
  uploadingContainer: {
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '600',
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
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  formInput: {
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'System',
  },
  disabledInput: {
    fontSize: 16,
    color: '#94A3B8',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'System',
  },
  formNote: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'System',
    marginTop: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  socialMediaContainer: {
    marginBottom: 24,
  },
  socialMediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  socialMediaInputContainer: {
    flex: 1,
  },
  socialMediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
    width: 80,
  },
  socialMediaInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'System',
  },
  socialMediaBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionButtonIcon: {
    marginRight: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  dangerText: {
    color: '#DC2626',
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButtonArrow: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  saveButtonLarge: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressSection: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0277BD',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0277BD',
    borderRadius: 4,
    minWidth: '2%',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  themeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  themeOptionActive: {
    backgroundColor: '#0277BD',
    borderColor: '#0277BD',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  themeOptionTextActive: {
    color: '#FFFFFF',
  },
});
