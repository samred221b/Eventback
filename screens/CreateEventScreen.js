import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/api';
import createEventStyles from '../styles/createEventStyles';
import homeStyles from '../styles/homeStyles';
import DatePickerModal from '../components/DatePickerModal';
import TimePickerModal from '../components/TimePickerModal';

const CreateEventScreen = ({ navigation, route }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { user, organizerProfile, backendConnected, verifyOrganizerIfNeeded } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'conference',
    mode: 'In-person',
    address: '',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    lat: 9.0320,
    lng: 38.7469,
    date: '',
    time: '',
    capacity: '',
    price: '0',
    featured: false,
    imageUrl: null,
    organizerName: '',
    importantInfo: '',
  });
  const [imageUri, setImageUri] = useState(null);

  // Populate form when editing an event
  useEffect(() => {
    if (route?.params?.editEvent) {
      const event = route.params.editEvent;
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'conference',
        mode: event.mode || 'In-person',
        address: event.address || '',
        city: event.city || 'Addis Ababa',
        country: event.country || 'Ethiopia',
        lat: event.lat || 9.0320,
        lng: event.lng || 38.7469,
        date: event.date || '',
        time: event.time || '',
        capacity: event.capacity || '',
        price: event.price || '0',
        featured: event.featured || false,
        imageUrl: event.imageUrl || null,
        organizerName: event.organizerName || '',
        importantInfo: event.importantInfo || '',
      });
      setImageUri(event.imageUrl || null);
    }
  }, [route?.params?.editEvent]);

  const categories = [
    'music', 'culture', 'education', 'sports', 'art', 'business', 
    'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
    'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference'
  ];

  const connectionStatus = backendConnected
    ? {
        icon: 'wifi',
        color: '#10B981',
        title: 'Connected to backend',
        subtitle: 'Changes sync automatically',
      }
    : {
        icon: 'wifi-off',
        color: '#F59E0B',
        title: 'Offline mode',
        subtitle: 'Saved locally until online',
      };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setImageUri(localUri); // Show local preview immediately

        Alert.alert('Uploading...', 'Please wait while your image is uploaded.');

        // Prepare form data for Cloudinary
        const formData = new FormData();
        formData.append('file', {
          uri: localUri,
          type: 'image/jpeg', // You can use result.assets[0].type if available
          name: 'upload.jpg',
        });
        formData.append('upload_preset', 'Eventopia'); // your upload preset

        try {
          const response = await axios.post(
            'https://api.cloudinary.com/v1_1/dqme0oqap/image/upload',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );
          if (response.data.secure_url) {
            setFormData(prev => ({
              ...prev,
              imageUrl: response.data.secure_url,
            }));
            Alert.alert('Success!', 'Image uploaded successfully and is now globally available.');
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          Alert.alert('Upload Failed', 'Failed to upload image to Cloudinary. Please try again or use an image URL.');
          removeImage();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: null
    }));
  };

  const validateForm = () => {
    const { title, description, address, date, time } = formData;
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter an event description');
      return false;
    }
    
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an event address');
      return false;
    }
    
    if (!date) {
      Alert.alert('Error', 'Please enter an event date (YYYY-MM-DD)');
      return false;
    }
    
    if (!time) {
      Alert.alert('Error', 'Please enter an event time (HH:MM)');
      return false;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return false;
    }
    
    // Validate time format (accepts only hh:mm AM/PM)
    const time12Regex = /^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i;
    if (!time12Regex.test(time)) {
      Alert.alert('Error', 'Please enter time in hh:mm AM/PM format');
      return false;
    }
    
    // Validate future date
    const eventDate = new Date(`${date}T${time}`);
    if (eventDate <= new Date()) {
      Alert.alert('Error', 'Event date must be in the future');
      return false;
    }
    
    return true;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;
    
    if (!backendConnected) {
      Alert.alert('Error', 'Backend not available. Please check your connection.');
      return;
    }

    // Ensure organizer session is verified before privileged action
    try {
      const verify = await verifyOrganizerIfNeeded();
      if (!verify?.success) {
        Alert.alert('Verification required', 'Please sign in again to create events.');
        return;
      }
    } catch (e) {
      Alert.alert('Verification error', 'Could not verify your organizer session. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        mode: formData.mode,
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          country: formData.country.trim(),
          coordinates: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng)
          }
        },
        date: new Date(`${formData.date}T00:00:00.000Z`).toISOString(),
        time: formData.time,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        price: parseFloat(formData.price) || 0,
        featured: formData.featured,
        image: formData.imageUrl || undefined,  // Backend uses 'image' not 'imageUrl'
        organizerName: formData.organizerName.trim(),
        importantInfo: formData.importantInfo.trim() || undefined  // Optional field
      };

      const response = await apiService.createEvent(eventData);

      if (response && response.success) {
        Alert.alert(
          'Success!',
          'Event created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  title: '',
                  description: '',
                  category: 'conference',
                  address: '',
                  city: 'Addis Ababa',
                  country: 'Ethiopia',
                  lat: 9.0320,
                  lng: 38.7469,
                  date: '',
                  time: '',
                  capacity: '',
                  price: '0',
                  featured: false,
                  imageUrl: null,
                  organizerName: '',
                  importantInfo: '',
                });
                setImageUri(null);
                // Navigate back to dashboard (this will trigger refresh)
                navigation.navigate('OrganizerDashboard');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create event');
      }
    } catch (error) {
      const rawMessage = error?.response?.data?.message || error?.message || '';
      const messageLower = String(rawMessage).toLowerCase();
      const isTimeout = error?.name === 'AbortError' || messageLower.includes('timeout');

      if (typeof rawMessage === 'string' && messageLower.includes('too many requests')) {
        Alert.alert('Rate Limit Exceeded', 'You have made too many requests. Please wait a few minutes and try again.');
      } else if (isTimeout) {
        Alert.alert('Request Timeout', 'The server is taking too long to respond. Please check your internet connection or try again later.');
      } else {
        Alert.alert('Error', rawMessage || 'Failed to create event. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={createEventStyles.container}>
        <View style={createEventStyles.errorContainer}>
          <Text style={createEventStyles.errorText}>Please login to create events</Text>
          <TouchableOpacity
            style={createEventStyles.loginButton}
            onPress={() => navigation.navigate('Organizer')}
          >
            <Text style={createEventStyles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={createEventStyles.container}>
      {/* Home-style Header */}
      <View style={homeStyles.homeHeaderContainer}>
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
                <Text style={homeStyles.homeHeaderWelcomeText}>Welcome,</Text>
                <Text style={homeStyles.homeHeaderNameText}>{organizerProfile?.name || user?.displayName || 'Organizer'}</Text>
              </View>
            </View>
            <View style={homeStyles.homeHeaderActions}>
              <TouchableOpacity style={homeStyles.homeHeaderIconButton} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={20} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>Create Event</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Share Moments</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={createEventStyles.scrollView} showsVerticalScrollIndicator={false}>

        <View style={createEventStyles.form}>
          {/* Progress Indicator */}
          <View style={createEventStyles.progressContainer}>
            <View style={createEventStyles.progressBar}>
              <LinearGradient
                colors={['#0277BD', '#01579B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[createEventStyles.progressFill, { width: '20%' }]}
              />
            </View>
            <Text style={createEventStyles.progressText}>Step 1 of 5</Text>
          </View>

          {/* Event Title */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="type" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Event Title *</Text>
            </View>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={createEventStyles.input}
                placeholder="What's your event called?"
                placeholderTextColor="#9CA3AF"
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                maxLength={200}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
          </View>

          {/* Event Description */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="file-text" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Tell us about your event *</Text>
            </View>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={[createEventStyles.input, createEventStyles.textArea]}
                placeholder="Paint a picture with words... What makes your event special?"
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                maxLength={2000}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
          </View>

          {/* Event Image Upload */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="image" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Make it visual ✨</Text>
            </View>
            {imageUri ? (
              <View style={createEventStyles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={createEventStyles.imagePreview} resizeMode="contain" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={createEventStyles.imageOverlay}
                />
                <TouchableOpacity 
                  style={createEventStyles.removeImageButton}
                  onPress={removeImage}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={createEventStyles.removeButtonGradient}
                  >
                    <Feather name="x" size={16} color="#FFFFFF" />
                    <Text style={createEventStyles.removeImageText}>Remove</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={createEventStyles.uploadButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <View style={createEventStyles.uploadContent}>
                  <View style={createEventStyles.uploadIconContainer}>
                    <LinearGradient
                      colors={['#0277BD', '#01579B']}
                      style={createEventStyles.uploadIconGradient}
                    >
                      <Feather name="camera" size={32} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={createEventStyles.uploadText}>Add a stunning photo</Text>
                  <Text style={createEventStyles.uploadHint}>Choose from gallery • Max 10MB</Text>
                  <View style={createEventStyles.uploadBorder} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Image URL Alternative */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="link" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Or use an image URL</Text>
            </View>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={createEventStyles.input}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#9CA3AF"
                value={formData.imageUrl && formData.imageUrl.startsWith('http') ? formData.imageUrl : ''}
                onChangeText={(value) => {
                  handleInputChange('imageUrl', value);
                  if (value.startsWith('http')) {
                    setImageUri(null); // Clear local image if URL is provided
                  }
                }}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
            <Text style={createEventStyles.inputHint}>
              💡 Tip: Use image URLs from Unsplash, Google Drive, or other web sources for better compatibility
            </Text>
          </View>


          {/* Category */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="tag" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Choose your category *</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={createEventStyles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    createEventStyles.categoryButton,
                    formData.category === category && createEventStyles.categoryButtonActive
                  ]}
                  onPress={() => handleInputChange('category', category)}
                  activeOpacity={0.8}
                >
                  {formData.category === category ? (
                    <LinearGradient
                      colors={['#0277BD', '#01579B']}
                      style={createEventStyles.categoryGradient}
                    >
                      <Text style={createEventStyles.categoryTextActive}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={createEventStyles.categoryText}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Mode Picker */}
          <View style={createEventStyles.inputGroup}>
            <Text style={createEventStyles.label}>Mode *</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              {['In-person', 'Online'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    {
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 20,
                      borderWidth: 2,
                      marginRight: 8,
                      borderColor: formData.mode === option ? '#0277BD' : '#E5E7EB',
                      backgroundColor: formData.mode === option ? '#0277BD' : '#fff',
                    }
                  ]}
                  onPress={() => handleInputChange('mode', option)}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: formData.mode === option ? '#fff' : '#1F2937', fontWeight: '700', fontSize: 16 }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="map-pin" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Where's the magic happening? *</Text>
            </View>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={createEventStyles.input}
                placeholder="Event venue address"
                placeholderTextColor="#9CA3AF"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                maxLength={200}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
          </View>

          <View style={createEventStyles.row}>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>City *</Text>
              <TextInput
                style={createEventStyles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
            </View>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Country *</Text>
              <TextInput
                style={createEventStyles.input}
                placeholder="Country"
                value={formData.country}
                onChangeText={(value) => handleInputChange('country', value)}
              />
            </View>
          </View>

          {/* Date and Time */}
          <View style={createEventStyles.row}>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Date *</Text>
              <TouchableOpacity
                style={createEventStyles.input}
                activeOpacity={0.8}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: formData.date ? '#1F2937' : '#9CA3AF', fontSize: 16 }}>
                  {formData.date || 'Select date'}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                visible={showDatePicker}
                initialDate={formData.date}
                onCancel={() => setShowDatePicker(false)}
                onConfirm={dateObj => {
                  const yyyy = dateObj.getFullYear();
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const dd = String(dateObj.getDate()).padStart(2, '0');
                  handleInputChange('date', `${yyyy}-${mm}-${dd}`);
                  setShowDatePicker(false);
                }}
              />
            </View>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Time * (hh:mm AM/PM)</Text>
              <TouchableOpacity
                style={createEventStyles.input}
                activeOpacity={0.8}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: formData.time ? '#1F2937' : '#9CA3AF', fontSize: 16 }}>
                  {formData.time || 'Select time'}
                </Text>
              </TouchableOpacity>
              <TimePickerModal
                visible={showTimePicker}
                initialTime={formData.time}
                onCancel={() => setShowTimePicker(false)}
                onConfirm={dateObj => {
                  let hours = dateObj.getHours();
                  let minutes = dateObj.getMinutes();
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12; // the hour '0' should be '12'
                  const mm = String(minutes).padStart(2, '0');
                  const hh = String(hours).padStart(2, '0');
                  handleInputChange('time', `${hh}:${mm} ${ampm}`);
                  setShowTimePicker(false);
                }}
              />
            </View>
          </View>

          {/* Capacity and Price */}
          <View style={createEventStyles.row}>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Capacity (Optional)</Text>
              <TextInput
                style={createEventStyles.input}
                placeholder="100"
                value={formData.capacity}
                onChangeText={(value) => handleInputChange('capacity', value)}
                keyboardType="numeric"
              />
            </View>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Price (ETB)</Text>
              <TextInput
                style={createEventStyles.input}
                placeholder="0"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Organizer Name */}
          <View style={createEventStyles.inputGroup}>
            <Text style={createEventStyles.label}>Organizer Name</Text>
            <TextInput
              style={createEventStyles.input}
              placeholder="Your name or organization"
              value={formData.organizerName}
              onChangeText={(value) => handleInputChange('organizerName', value)}
              maxLength={100}
            />
          </View>

          {/* Important Information */}
          <View style={createEventStyles.inputGroup}>
            <Text style={createEventStyles.label}>Important Information (Optional)</Text>
            <TextInput
              style={[createEventStyles.input, createEventStyles.textArea]}
              placeholder="Add any important notes for attendees (e.g., arrival time, dress code, refund policy)..."
              value={formData.importantInfo}
              onChangeText={(value) => handleInputChange('importantInfo', value)}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Featured Toggle */}
          <View style={createEventStyles.inputGroup}>
            <TouchableOpacity
              style={createEventStyles.checkboxContainer}
              onPress={() => handleInputChange('featured', !formData.featured)}
              activeOpacity={0.8}
            >
              <View style={[createEventStyles.checkbox, formData.featured && createEventStyles.checkboxActive]}>
                {formData.featured && <Feather name="check" size={16} color="#FFFFFF" />}
              </View>
              <View style={createEventStyles.checkboxLabelContainer}>
                <Text style={createEventStyles.checkboxLabel}>Make it featured ⭐</Text>
                <Text style={createEventStyles.checkboxHint}>Featured events get more visibility</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[createEventStyles.createButton, isLoading && createEventStyles.createButtonDisabled]}
            onPress={handleCreateEvent}
            disabled={isLoading || !backendConnected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading || !backendConnected ? ['#9CA3AF', '#6B7280'] : ['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={createEventStyles.createButtonGradient}
            >
              {isLoading ? (
                <View style={createEventStyles.loadingContainer}>
                  <Feather name="loader" size={20} color="#FFFFFF" />
                  <Text style={createEventStyles.createButtonText}>Creating Event...</Text>
                </View>
              ) : (
                <View style={createEventStyles.buttonContent}>
                  <Feather name="plus-circle" size={20} color="#FFFFFF" />
                  <Text style={createEventStyles.createButtonText}>Create Event</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateEventScreen;
