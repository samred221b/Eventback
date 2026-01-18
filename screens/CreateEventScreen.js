import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Animated,
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
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { logger } from '../utils/logger';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';

const CreateEventScreen = ({ navigation, route }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { user, organizerProfile, backendConnected, verifyOrganizerIfNeeded } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
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
    vipPrice: '',
    vvipPrice: '',
    onDoorPrice: '',
    earlyBirdPrice: '',
    featured: false,
    imageUrl: null,
    organizerName: '',
    importantInfo: '',
    ticketsAvailableAt: '', // New field for where tickets can be purchased
  });
  const [imageUri, setImageUri] = useState(null);
  const [isPricingExpanded, setIsPricingExpanded] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Animation values
  const pricingHeight = useState(new Animated.Value(0))[0];
  const pricingOpacity = useState(new Animated.Value(0))[0];
  const iconRotation = useState(new Animated.Value(0))[0];

  // Event templates
  const eventTemplates = [
    {
      id: 'concert',
      name: 'Music Concert',
      icon: 'music',
      color: '#EF4444',
      description: 'Perfect for live music events',
      defaults: {
        category: 'music',
        mode: 'In-person',
        price: '500',
        vipPrice: '1000',
        vvipPrice: '2000',
        earlyBirdPrice: '400',
        capacity: '500',
        description: 'Join us for an unforgettable night of live music featuring amazing performances.',
        importantInfo: 'Doors open 1 hour before showtime. No outside food or drinks allowed.',
        ticketsAvailableAt: 'Available at the venue and online'
      }
    },
    {
      id: 'workshop',
      name: 'Workshop',
      icon: 'tool',
      color: '#3B82F6',
      description: 'Educational and skill-building events',
      defaults: {
        category: 'education',
        mode: 'In-person',
        price: '200',
        vipPrice: '300',
        capacity: '50',
        description: 'Learn new skills and gain valuable knowledge from industry experts.',
        importantInfo: 'Bring your laptop and notebook. Materials will be provided.',
        ticketsAvailableAt: 'Available online only'
      }
    },
    {
      id: 'conference',
      name: 'Conference',
      icon: 'users',
      color: '#10B981',
      description: 'Professional gatherings and networking',
      defaults: {
        category: 'business',
        mode: 'In-person',
        price: '1000',
        vipPrice: '2000',
        capacity: '200',
        description: 'Connect with industry leaders and expand your professional network.',
        importantInfo: 'Business casual dress code. Networking lunch included.',
        ticketsAvailableAt: 'Available online and at the venue'
      }
    },
    {
      id: 'party',
      name: 'Party/Social',
      icon: 'coffee',
      color: '#F59E0B',
      description: 'Social gatherings and celebrations',
      defaults: {
        category: 'culture',
        mode: 'In-person',
        price: '300',
        earlyBirdPrice: '200',
        capacity: '150',
        description: 'Join us for a fun-filled evening of entertainment and socializing.',
        importantInfo: 'Dress to impress! Valid ID required for entry.',
        ticketsAvailableAt: 'Available at the venue'
      }
    },
    {
      id: 'sports',
      name: 'Sports Event',
      icon: 'activity',
      color: '#8B5CF6',
      description: 'Sports competitions and fitness events',
      defaults: {
        category: 'sports',
        mode: 'In-person',
        price: '100',
        capacity: '100',
        description: 'Exciting sports competition and activities for all fitness levels.',
        importantInfo: 'Wear comfortable sports attire. Bring water bottle.',
        ticketsAvailableAt: 'Available online and at the venue'
      }
    },
    {
      id: 'webinar',
      name: 'Webinar/Online',
      icon: 'monitor',
      color: '#06B6D4',
      description: 'Online events and virtual meetings',
      defaults: {
        category: 'education',
        mode: 'Online',
        price: '0',
        capacity: '1000',
        description: 'Join our online session from anywhere in the world.',
        importantInfo: 'Link will be sent 24 hours before the event. Stable internet required.',
        ticketsAvailableAt: 'Free registration online'
      }
    }
  ];

  // Auto-populate organizer name from profile
  useEffect(() => {
    if (organizerProfile && organizerProfile.name) {
      setFormData(prev => ({
        ...prev,
        organizerName: organizerProfile.name
      }));
    } else if (user && user.displayName) {
      setFormData(prev => ({
        ...prev,
        organizerName: user.displayName
      }));
    }
  }, [organizerProfile, user]);

  // Populate form when editing an event
  useEffect(() => {
    if (route?.params?.editEvent) {
      const event = route.params.editEvent;
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'music',
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
        vipPrice: event.vipPrice || '',
        vvipPrice: event.vvipPrice || '',
        onDoorPrice: event.onDoorPrice || '',
        earlyBirdPrice: event.earlyBirdPrice || '',
        featured: event.featured || false,
        imageUrl: event.imageUrl || null,
        organizerName: event.organizerName || '',
        importantInfo: event.importantInfo || '',
        ticketsAvailableAt: event.ticketsAvailableAt || '',
      });
      setImageUri(event.imageUrl || null);
    }
  }, [route?.params?.editEvent]);

  // Animation functions
  const togglePricingSection = () => {
    setIsPricingExpanded(!isPricingExpanded);
    
    if (!isPricingExpanded) {
      // Expand animation
      Animated.parallel([
        Animated.timing(pricingHeight, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(pricingOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Collapse animation
      Animated.parallel([
        Animated.timing(pricingHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(pricingOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const categories = [
    'music', 'culture', 'education', 'sports', 'art', 'business', 
    'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
    'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference', 'religious'
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

  const handleTemplateSelect = (template) => {
    // Apply template defaults to form data
    setFormData(prev => ({
      ...prev,
      ...template.defaults
    }));
    setShowTemplateModal(false);
    
    setError(null); // Clear any previous errors
    setError(toAppError(new Error(`${template.name} template has been applied. You can customize all fields as needed.`), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
  };

  const extractPickerUri = (result) => {
    if (!result || result.canceled) return null;
    if (result.assets && result.assets[0]) return result.assets[0].uri;
    if (result.images && result.images[0]) return result.images[0].uri;
    if (result.uri) return result.uri;
    return null;
  };

  const uploadImageToCloudinary = async (localUri) => {
    setImageUri(localUri); // Show local preview immediately
    setError(toAppError(new Error('Please wait while your image is uploaded.'), { kind: 'INFO', severity: APP_ERROR_SEVERITY.INFO }));

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', {
      uri: localUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    cloudinaryFormData.append('upload_preset', 'Eventopia');

    try {
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dqme0oqap/image/upload',
        cloudinaryFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.secure_url) {
        setFormData(prev => ({
          ...prev,
          imageUrl: response.data.secure_url,
        }));
        setError(null);
        // Show success popup instead of banner
        Alert.alert(
          'Success!',
          'Image uploaded successfully and is now globally available.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to upload image to Cloudinary. Please try again or use an image URL.' }));
      removeImage();
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError(toAppError(new Error('Camera roll permission is required to upload images.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      const localUri = extractPickerUri(result);
      if (localUri) {
        await uploadImageToCloudinary(localUri);
      }
    } catch (error) {
      logger.error('Error in pickImage:', error);
      setError(toAppError(error, { fallbackMessage: 'An unexpected error occurred. Please try again.' }));
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
      setError(toAppError(new Error('Your event needs a title to stand out. Add a catchy title that describes your event clearly.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    if (!description.trim()) {
      setError(toAppError(new Error('Tell people what makes your event special! Describe what attendees can expect, activities, or highlights.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    if (!address.trim()) {
      setError(toAppError(new Error('Where will your amazing event take place? Enter the venue address so attendees know where to go.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    if (!date) {
      setError(toAppError(new Error('When is your event happening? Select a date so people can mark their calendars!'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    if (!time) {
      setError(toAppError(new Error('What time should everyone arrive? Set the time so attendees can plan accordingly.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setError(toAppError(new Error('Please use the correct date format. Example: 2024-12-25 (YYYY-MM-DD)'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    // Validate time format (accepts only hh:mm AM/PM)
    const time12Regex = /^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i;
    if (!time12Regex.test(time)) {
      setError(toAppError(new Error('Please use the correct time format. Example: 7:30 PM or 02:15 AM'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    // Validate future date
    const eventDate = new Date(`${date}T${time}`);
    if (eventDate <= new Date()) {
      setError(toAppError(new Error('Events must be scheduled for the future! Pick a date and time that hasn\'t passed yet.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return false;
    }
    
    return true;
  };

  const handleCreateEvent = async () => {
    setError(null); // Clear any previous errors
    if (!validateForm()) return;
    
    if (!backendConnected) {
      setError(toAppError(new Error('Backend not available. Please check your connection.'), { kind: 'NETWORK_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
      return;
    }

    // Ensure organizer session is verified before privileged action
    try {
      const verify = await verifyOrganizerIfNeeded();
      if (!verify?.success) {
        setError(toAppError(new Error('Please sign in again to create events.'), { kind: 'AUTH_REQUIRED', severity: APP_ERROR_SEVERITY.WARNING }));
        return;
      }
    } catch (e) {
      setError(toAppError(new Error('Could not verify your organizer session. Please try again.'), { kind: 'AUTH_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
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
          },
          geo: {
            type: 'Point',
            coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)]
          }
        },
        date: new Date(`${formData.date}T00:00:00.000Z`).toISOString(),
        time: formData.time,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        price: parseFloat(formData.price) || 0,
        vipPrice: formData.vipPrice ? parseFloat(formData.vipPrice) : undefined,
        vvipPrice: formData.vvipPrice ? parseFloat(formData.vvipPrice) : undefined,
        onDoorPrice: formData.onDoorPrice ? parseFloat(formData.onDoorPrice) : undefined,
        earlyBirdPrice: formData.earlyBirdPrice ? parseFloat(formData.earlyBirdPrice) : undefined,
        featured: formData.featured,
        image: formData.imageUrl || undefined,  // Backend uses 'image' not 'imageUrl'
        organizerName: formData.organizerName.trim(),
        importantInfo: formData.importantInfo.trim() || undefined,  // Optional field
        ticketsAvailableAt: formData.ticketsAvailableAt.trim() || undefined  // Optional field
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
                  category: 'music',
                  address: '',
                  city: 'Addis Ababa',
                  country: 'Ethiopia',
                  lat: 9.0320,
                  lng: 38.7469,
                  date: '',
                  time: '',
                  capacity: '',
                  price: '0',
                  vipPrice: '',
                  vvipPrice: '',
                  onDoorPrice: '',
                  earlyBirdPrice: '',
                  featured: false,
                  imageUrl: null,
                  organizerName: '',
                  importantInfo: '',
                  ticketsAvailableAt: '',
                });
                setImageUri(null);
                // Navigate back to dashboard (this will trigger refresh)
                navigation.navigate('OrganizerDashboard', { refresh: true });
              }
            }
          ]
        );
      } else {
        setError(toAppError(new Error(response.message || 'Failed to create event'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
      }
    } catch (error) {
      logger.error('CreateEventScreen handleCreateEvent error:', error);
      const rawMessage = error?.response?.data?.message || error?.message || '';
      const messageLower = String(rawMessage).toLowerCase();
      const isTimeout = error?.name === 'AbortError' || messageLower.includes('timeout');

      if (typeof rawMessage === 'string' && messageLower.includes('too many requests')) {
        setError(toAppError(new Error('You have made too many requests. Please wait a few minutes and try again.'), { kind: 'RATE_LIMIT', severity: APP_ERROR_SEVERITY.ERROR }));
      } else if (isTimeout) {
        setError(toAppError(new Error('The server is taking too long to respond. Please check your internet connection or try again later.'), { kind: 'TIMEOUT', severity: APP_ERROR_SEVERITY.ERROR }));
      } else {
        setError(toAppError(error, { fallbackMessage: 'Failed to create event. Please try again.' }));
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
          <View style={homeStyles.homeHeaderBg} pointerEvents="none">
            <View style={homeStyles.homeHeaderOrbOne} />
            <View style={homeStyles.homeHeaderOrbTwo} />
          </View>
          <View style={homeStyles.modernDashboardHeaderTop}>
            <View style={homeStyles.modernDashboardProfile}>
              <View style={homeStyles.modernDashboardAvatar}>
                {organizerProfile?.profileImage ? (
                  <Image 
                    source={{ uri: organizerProfile.profileImage }} 
                    style={homeStyles.modernDashboardAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Feather name="user" size={30} color="#FFFFFF" />
                )}
              </View>
              <View style={homeStyles.modernDashboardProfileInfo}>
                <Text style={homeStyles.modernDashboardWelcome}>Create Event</Text>
                <View style={homeStyles.modernDashboardNameRow}>
                  <Text style={homeStyles.modernDashboardName} numberOfLines={1}>{organizerProfile?.name || user?.displayName || 'Organizer'}</Text>
                  {organizerProfile?.isVerified && (
                    <View style={homeStyles.modernDashboardVerifiedChip}>
                      <Feather name="check" size={12} color="#0F172A" />
                      <Text style={homeStyles.modernDashboardVerifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                {!!organizerProfile?.email && (
                  <Text style={homeStyles.modernDashboardEmail} numberOfLines={1}>{organizerProfile.email}</Text>
                )}
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

        <AppErrorBanner error={error} onRetry={() => setError(null)} disabled={isLoading} />

        {/* Template Selection Button */}
        <View style={createEventStyles.templateButtonContainer}>
          <TouchableOpacity 
            style={createEventStyles.templateButton}
            onPress={() => setShowTemplateModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              style={createEventStyles.templateButtonGradient}
            >
              <Text style={createEventStyles.templateButtonText}>Use Event Template</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={createEventStyles.templateHelperText}>Start with a pre-configured template for faster setup</Text>
        </View>

        <View style={createEventStyles.form}>

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
                placeholder="Describe your event?"
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
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="wifi" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Mode *</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={createEventStyles.categoryScroll}>
              {['In-person', 'Online'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    createEventStyles.categoryButton,
                    formData.mode === option && createEventStyles.categoryButtonActive
                  ]}
                  onPress={() => handleInputChange('mode', option)}
                  activeOpacity={0.8}
                >
                  {formData.mode === option ? (
                    <LinearGradient
                      colors={['#0277BD', '#01579B']}
                      style={createEventStyles.categoryGradient}
                    >
                      <Text style={createEventStyles.categoryTextActive}>
                        {option}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={createEventStyles.categoryText}>
                      {option}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Location */}
          <View style={createEventStyles.inputGroup}>
            <View style={createEventStyles.labelContainer}>
              <View style={createEventStyles.iconContainer}>
                <Feather name="map-pin" size={18} color="#FFFFFF" />
              </View>
              <Text style={createEventStyles.label}>Place? *</Text>
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
              <View style={createEventStyles.inputContainer}>
                <TextInput
                  style={createEventStyles.input}
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                />
                <View style={createEventStyles.inputAccent} />
              </View>
            </View>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Country *</Text>
              <View style={createEventStyles.inputContainer}>
                <TextInput
                  style={[createEventStyles.input, { backgroundColor: '#F3F4F6', color: '#9CA3AF' }]}
                  placeholder="Country"
                  value={formData.country}
                  onChangeText={(value) => handleInputChange('country', value)}
                  editable={false}
                />
                <View style={[createEventStyles.inputAccent, { backgroundColor: '#E5E7EB' }]} />
              </View>
            </View>
          </View>

          {/* Date and Time */}
          <View style={createEventStyles.row}>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Date *</Text>
              <View style={createEventStyles.inputContainer}>
                <TouchableOpacity
                  style={createEventStyles.input}
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: formData.date ? '#1F2937' : '#9CA3AF', fontSize: 16 }}>
                    {formData.date || 'Select date'}
                  </Text>
                </TouchableOpacity>
                <View style={createEventStyles.inputAccent} />
              </View>
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
              <View style={createEventStyles.inputContainer}>
                <TouchableOpacity
                  style={createEventStyles.input}
                  activeOpacity={0.8}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ color: formData.time ? '#1F2937' : '#9CA3AF', fontSize: 16 }}>
                    {formData.time || 'Select time'}
                  </Text>
                </TouchableOpacity>
                <View style={createEventStyles.inputAccent} />
              </View>
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
              <View style={createEventStyles.inputContainer}>
                <TextInput
                  style={createEventStyles.input}
                  placeholder="100"
                  value={formData.capacity}
                  onChangeText={(value) => handleInputChange('capacity', value)}
                  keyboardType="numeric"
                />
                <View style={createEventStyles.inputAccent} />
              </View>
            </View>
            <View style={createEventStyles.halfInput}>
              <Text style={createEventStyles.label}>Price (ETB)</Text>
              <View style={createEventStyles.inputContainer}>
                <TextInput
                  style={createEventStyles.input}
                  placeholder="0"
                  value={formData.price}
                  onChangeText={(value) => handleInputChange('price', value)}
                  keyboardType="numeric"
                />
                <View style={createEventStyles.inputAccent} />
              </View>
            </View>
          </View>

          {/* Additional Pricing Options - Collapsible */}
          <View style={[createEventStyles.pricingSection, isPricingExpanded && createEventStyles.pricingSectionExpanded]}>
            <TouchableOpacity 
              style={createEventStyles.pricingHeader}
              onPress={togglePricingSection}
              activeOpacity={0.8}
            >
              <View style={createEventStyles.pricingHeaderLeft}>
                <LinearGradient
                  colors={['#0277BD', '#01579B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={createEventStyles.pricingIconContainer}
                >
                  <Feather name="tag" size={16} color="#FFFFFF" />
                </LinearGradient>
                <View style={createEventStyles.pricingHeaderText}>
                  <Text style={createEventStyles.pricingTitle}>Additional Pricing Options</Text>
                  <Text style={createEventStyles.pricingSubtitle}>VIP, VVIP, Early Bird & On Door pricing</Text>
                </View>
              </View>
              <Animated.View
                style={[
                  createEventStyles.pricingChevron,
                  {
                    transform: [{
                      rotate: iconRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg']
                      })
                    }]
                  }
                ]}
              >
                <Feather name="chevron-down" size={20} color="#64748B" />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={[
                createEventStyles.pricingContent,
                {
                  height: pricingHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 400] // Adjust height for full-width layout
                  }),
                  opacity: pricingOpacity
                }
              ]}
            >
              {/* VIP Price */}
              <View style={createEventStyles.inputGroup}>
                <View style={createEventStyles.pricingLabelContainer}>
                  <Feather name="star" size={16} color="#F59E0B" />
                  <Text style={createEventStyles.label}>VIP Price (ETB)</Text>
                </View>
                <View style={createEventStyles.inputContainer}>
                  <TextInput
                    style={createEventStyles.input}
                    placeholder="0"
                    value={formData.vipPrice}
                    onChangeText={(value) => handleInputChange('vipPrice', value)}
                    keyboardType="numeric"
                  />
                  <View style={createEventStyles.inputAccent} />
                </View>
              </View>

              {/* VVIP Price */}
              <View style={createEventStyles.inputGroup}>
                <View style={createEventStyles.pricingLabelContainer}>
                  <Feather name="award" size={16} color="#8B5CF6" />
                  <Text style={createEventStyles.label}>VVIP Price (ETB)</Text>
                </View>
                <View style={createEventStyles.inputContainer}>
                  <TextInput
                    style={createEventStyles.input}
                    placeholder="0"
                    value={formData.vvipPrice}
                    onChangeText={(value) => handleInputChange('vvipPrice', value)}
                    keyboardType="numeric"
                  />
                  <View style={createEventStyles.inputAccent} />
                </View>
              </View>

              {/* Early Bird Price */}
              <View style={createEventStyles.inputGroup}>
                <View style={createEventStyles.pricingLabelContainer}>
                  <Feather name="zap" size={16} color="#10B981" />
                  <Text style={createEventStyles.label}>Early Bird Price (ETB)</Text>
                </View>
                <View style={createEventStyles.inputContainer}>
                  <TextInput
                    style={createEventStyles.input}
                    placeholder="0"
                    value={formData.earlyBirdPrice}
                    onChangeText={(value) => handleInputChange('earlyBirdPrice', value)}
                    keyboardType="numeric"
                  />
                  <View style={createEventStyles.inputAccent} />
                </View>
              </View>

              {/* On Door Price */}
              <View style={createEventStyles.inputGroup}>
                <View style={createEventStyles.pricingLabelContainer}>
                  <Feather name="clock" size={16} color="#EF4444" />
                  <Text style={createEventStyles.label}>On Door Price (ETB)</Text>
                </View>
                <View style={createEventStyles.inputContainer}>
                  <TextInput
                    style={createEventStyles.input}
                    placeholder="0"
                    value={formData.onDoorPrice}
                    onChangeText={(value) => handleInputChange('onDoorPrice', value)}
                    keyboardType="numeric"
                  />
                  <View style={createEventStyles.inputAccent} />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Organizer Name */}
          <View style={createEventStyles.inputGroup}>
            <Text style={createEventStyles.label}>Organizer Name</Text>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={[createEventStyles.input, createEventStyles.readOnlyInput]}
                placeholder="Your name or organization"
                value={formData.organizerName}
                editable={false}
                maxLength={100}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
          </View>

          {/* Tickets Available At */}
          <View style={createEventStyles.inputGroup}>
            <Text style={createEventStyles.label}>Tickets Available At</Text>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={createEventStyles.input}
                placeholder="e.g., Eventopia App, Venue Box Office, Online at www.example.com"
                value={formData.ticketsAvailableAt}
                onChangeText={(value) => handleInputChange('ticketsAvailableAt', value)}
                maxLength={200}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
          </View>

          {/* Important Information */}
          <View style={createEventStyles.inputGroup}>
            <Text style={createEventStyles.label}>Important Information (Optional)</Text>
            <View style={createEventStyles.inputContainer}>
              <TextInput
                style={[createEventStyles.input, createEventStyles.textArea]}
                placeholder="Add any important notes for attendees (e.g., arrival time, dress code, Identification required, etc.)..."
                value={formData.importantInfo}
                onChangeText={(value) => handleInputChange('importantInfo', value)}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <View style={createEventStyles.inputAccent} />
            </View>
          </View>

          {/* Featured Toggle */}
          <View style={createEventStyles.inputGroup}>
            <TouchableOpacity
              style={createEventStyles.checkboxContainer}
              onPress={() => handleInputChange('featured', !formData.featured)}
              activeOpacity={0.8}
            >
              <View style={homeStyles.organizerBoxDepthLayer} pointerEvents="none">
                <View style={homeStyles.organizerBoxGlowOrbOne} />
                <View style={homeStyles.organizerBoxGlowOrbTwo} />
                <View style={homeStyles.organizerBoxHighlight} />
              </View>
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

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <View style={createEventStyles.modalOverlay}>
          <View style={createEventStyles.modalContainer}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={createEventStyles.modalHeader}
            >
              <Text style={createEventStyles.modalTitle}>Choose Event Template</Text>
              <TouchableOpacity 
                style={createEventStyles.modalCloseButton}
                onPress={() => setShowTemplateModal(false)}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
            
            <Text style={createEventStyles.modalSubtitle}>
              Select a template to pre-fill your event details
            </Text>

            <ScrollView style={createEventStyles.templateList} showsVerticalScrollIndicator={false}>
              {eventTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={createEventStyles.templateCard}
                    onPress={() => handleTemplateSelect(template)}
                    activeOpacity={0.8}
                  >
                    <View style={createEventStyles.templateContent}>
                      <Text style={createEventStyles.templateName}>{template.name}</Text>
                      <Text style={createEventStyles.templateDescription}>{template.description}</Text>
                      
                      <View style={createEventStyles.templateFeatures}>
                        <View style={createEventStyles.templateFeatureItem}>
                          <Text style={createEventStyles.templateFeatureText}>
                            {template.defaults.category}
                          </Text>
                        </View>
                        <View style={createEventStyles.templateFeatureItem}>
                          <Text style={createEventStyles.templateFeatureText}>
                            {template.defaults.mode}
                          </Text>
                        </View>
                        <View style={createEventStyles.templateFeatureItem}>
                          <Text style={createEventStyles.templateFeatureText}>
                            {template.defaults.price === '0' ? 'Free' : `ETB ${template.defaults.price}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CreateEventScreen;
