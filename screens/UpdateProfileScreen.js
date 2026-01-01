import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/api';
import homeStyles from '../styles/homeStyles';

export default function UpdateProfileScreen({ navigation }) {
  const { user, organizerProfile, updateOrganizerProfile, deleteOrganizerAccount, signOut } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
        Alert.alert('Error', result.error || 'Failed to delete account');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while deleting your account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    // Email is no longer required for validation (comes from Firebase)
    // All other fields are optional

    setIsLoading(true);

    try {
      const result = await updateOrganizerProfile(profileData);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your profile has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
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
            Alert.alert('Success', 'Profile image uploaded successfully!');
          } else {
            Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image');
          }
        } catch (uploadError) {
          logger.error('Error uploading image:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload image to server');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
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
          <View style={homeStyles.homeHeaderTopRow}>
            <View style={homeStyles.modernDashboardProfile}>
              <View style={homeStyles.modernDashboardAvatar}>
                <View style={homeStyles.modernDashboardAvatarInner}>
                  <Feather name="user" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Update Profile</Text>
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
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={handleImagePicker}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <View style={[styles.profileImage, styles.uploadingContainer]}>
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageIcon}>👤</Text>
              </View>
            )}
            <View style={styles.editImageBadge}>
              <Text style={styles.editImageIcon}>{isUploadingImage ? '⏳' : '📷'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileImageText}>Tap to change profile picture</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Basic Information</Text>
          
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
          <Text style={styles.sectionTitle}>🏢 Organization Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Name</Text>
            <TextInput
              style={styles.formInput}
              value={profileData.organization}
              onChangeText={(text) => setProfileData({...profileData, organization: text})}
              placeholder="Your company or organization name"
            />
          </View>

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

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location Information</Text>
          
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
          <Text style={styles.sectionTitle}>⚙️ Account Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>🔒</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Change Password</Text>
              <Text style={styles.actionButtonSubtitle}>Update your account password</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.actionButtonIcon}>🗑️</Text>
            <View style={styles.actionButtonContent}>
              <Text style={[styles.actionButtonTitle, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.actionButtonSubtitle}>Permanently delete your account</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
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
    backgroundColor: 'transparent',
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
    backgroundColor: '#3b82f6',
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
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageIcon: {
    fontSize: 40,
    color: '#9ca3af',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  editImageIcon: {
    fontSize: 16,
  },
  profileImageText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  uploadingContainer: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
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
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  dangerText: {
    color: '#dc2626',
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtonArrow: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '700',
  },
  saveButtonLarge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
