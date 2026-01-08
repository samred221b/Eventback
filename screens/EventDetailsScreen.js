import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Share, Image, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// StatusBar removed; use root StatusBar in App.js
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../providers/FavoritesProvider';
import { formatPrice, formatDate, formatTime } from '../utils/dataProcessor';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status
import { logger } from '../utils/logger';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [offline, setOffline] = useState(false); // State to track offline status
  const [userResponse, setUserResponse] = useState(null); // Track user response: 'interested', 'going', 'maybe'
  const [isPricingExpanded, setIsPricingExpanded] = useState(false); // State for pricing dropdown
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  const normalizeRemoteImageUri = (uri) => {
  if (!uri || typeof uri !== 'string') return null;

  const trimmed = uri.trim();
  if (!trimmed) return null;

  // If backend returns a relative uploads path like "/uploads/abc.jpg",
  // convert it to an absolute URL using the configured API base URL host.
  if (trimmed.startsWith('/uploads/')) {
    try {
      const extra = (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra) || {};
      const apiBaseUrl = extra?.apiBaseUrl || 'https://eventoback-1.onrender.com/api';
      const origin = apiBaseUrl.replace(/\/(api)\/?$/, '');
      return `${origin}${trimmed}`;
    } catch (e) {
      return `https://eventoback-1.onrender.com${trimmed}`;
    }
  }

  // In production builds, http images are frequently blocked or fail.
  // Prefer https when possible.
  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://');
  }

  return trimmed;
};

  const getOrganizerProfileImage = (organizer) => {
    if (!organizer) return null;
    return normalizeRemoteImageUri(
      organizer.profileImage ||
      organizer.avatar ||
      organizer.image ||
      organizer.photo ||
      organizer.profileImageUrl ||
      organizer.avatarUrl ||
      null
    );
  };

  const heroImageUri = normalizeRemoteImageUri(
    (typeof event?.imageUrl === 'string' && event.imageUrl) ||
      (typeof event?.image === 'string' && event.image) ||
      (typeof event?.imageUri === 'string' && event.imageUri) ||
      (typeof event?.imageURL === 'string' && event.imageURL) ||
      (typeof event?.image_url === 'string' && event.image_url) ||
      null
  );

  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setOffline(!netInfo.isConnected);
    };
    checkNetworkStatus();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n\n${event.description}\n\nLocation: ${event.location.name}\nDate: ${formatDate(event.date)}\nPrice: ${formatPrice(event.price, event.currency)}`,
        title: event.title,
      });
    } catch (error) {
      logger.error('Error sharing event:', error);
    }
  };

  const handleResponse = (response) => {
    if (offline) {
      Alert.alert('Offline', 'You need an internet connection to respond to events.');
      return;
    }
    
    setUserResponse(response);
    // Here you would typically save this to your backend
    // Enhanced feedback with animation potential
    Alert.alert(
      'Response Recorded',
      `You marked yourself as "${response.charAt(0).toUpperCase() + response.slice(1)}" for this event.`,
      [{ text: 'Awesome!' }]
    );
  };

  const getResponseStats = () => {
    // Mock stats - in real app, these would come from backend
    return {
      going: Math.floor(Math.random() * 50) + 10,
      interested: Math.floor(Math.random() * 30) + 5,
      maybe: Math.floor(Math.random() * 20) + 3,
    };
  };

  const handleOrganizerPress = () => {
    if (event.organizerId) {
      navigation.navigate('Organprofilescreenforusers', { 
        organizerId: event.organizerId._id || event.organizerId.id,
        organizerName: event.organizerName || event.organizer
      });
    }
  };

  const handleGetDirections = () => {
    try {
      // Check if location and coordinates exist and are valid
      if (!event.location) {
        Alert.alert('Location not available', 'This event does not have a valid location.');
        return;
      }

      // Handle different location formats
      let lat, lng;
      
      if (Array.isArray(event.location.coordinates) && event.location.coordinates.length >= 2) {
        // Handle array format: [lng, lat]
        [lng, lat] = event.location.coordinates;
      } else if (event.location.latitude && event.location.longitude) {
        // Handle object format: { latitude: x, longitude: y }
        lat = event.location.latitude;
        lng = event.location.longitude;
      } else if (event.location.lat && event.location.lng) {
        // Handle alternative object format
        lat = event.location.lat;
        lng = event.location.lng;
      } else {
        // Fallback to address-based search if coordinates aren't available
        const address = encodeURIComponent(
          [
            event.location.address,
            event.location.city,
            event.location.country
          ].filter(Boolean).join(', ')
        );
        
        if (!address) {
          throw new Error('No valid address or coordinates available');
        }
        
        const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
        openMapsWithUrl(url, event.location.name || 'Event Location');
        return;
      }
      
      // If we have valid coordinates, use them
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      openMapsWithUrl(url, event.location.name || 'Event Location');
      
    } catch (error) {
      logger.error('Error getting directions:', error);
      Alert.alert(
        'Error',
        'Could not get directions. The event location might be invalid or missing.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const openMapsWithUrl = (url, locationName) => {
    Alert.alert(
      'Open Maps',
      `Get directions to ${locationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Google Maps', 
          onPress: () => {
            import('react-native').then(({ Linking }) => {
              Linking.openURL(url).catch(err => {
                logger.error('Error opening maps:', err);
                Alert.alert('Error', 'Could not open maps. Please make sure you have Google Maps installed.');
              });
            });
          }
        },
      ]
    );
  };


  const getDaysLeft = () => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return null;
  };

  const daysLeft = getDaysLeft();

  const essentialDetails = [
    {
      key: 'date',
      icon: 'calendar',
      label: 'Date',
      value: formatDate(event.date),
    },
    {
      key: 'time',
      icon: 'clock',
      label: 'Time',
      value: formatTime(event.time),
    },
    {
      key: 'location',
      icon: 'map-pin',
      label: 'Location',
      value: event.location?.address || event.location?.city || event.location?.name || 'Location TBA',
    },
    {
      key: 'pricing',
      icon: 'tag',
      label: 'Entrance',
      value: formatPrice(event.price, event.currency),
    },
    ...(event.capacity ? [{
      key: 'capacity',
      icon: 'users',
      label: 'Capacity',
      value: `${event.capacity} attendees`
    }] : []),
  ];

  // Compact pricing grid - 2x2 layout
  const pricingGrid = [
    ...(event.vipPrice ? [{
      key: 'vip',
      icon: 'star',
      label: 'VIP',
      value: formatPrice(event.vipPrice, event.currency),
      color: '#8B5CF6'
    }] : []),
    ...(event.vvipPrice ? [{
      key: 'vvip',
      icon: 'award',
      label: 'VVIP',
      value: formatPrice(event.vvipPrice, event.currency),
      color: '#7C3AED'
    }] : []),
    ...(event.earlyBirdPrice ? [{
      key: 'earlyBird',
      icon: 'zap',
      label: 'Early Bird',
      value: formatPrice(event.earlyBirdPrice, event.currency),
      color: '#10B981'
    }] : []),
    ...(event.onDoorPrice ? [{
      key: 'onDoor',
      icon: 'clock',
      label: 'On Door',
      value: formatPrice(event.onDoorPrice, event.currency),
      color: '#F59E0B'
    }] : []),
  ];

  // Additional info - now merged with essential details
  const additionalInfo = [
    ...(event.ticketsAvailableAt ? [{
      key: 'ticketsAvailableAt',
      icon: 'shopping-bag',
      label: 'Tickets Available At',
      value: event.ticketsAvailableAt,
    }] : []),
  ];

  // Merge essential details with ticketing information
  const allDetails = [...essentialDetails, ...additionalInfo];

  const vibeBadges = [
    event.category,
    event.isOnline ? 'Stream Friendly' : 'On-Site Experience',
    event.requiresRegistration ? 'Secure Entry' : 'Open Invitation',
    event.location?.city,
  ].filter(Boolean);

  // Function to get related hashtags based on category
  const getRelatedHashtags = (category) => {
    const hashtags = {
      education: ['Learning', 'Knowledge', 'EducationMatters'],
      food: ['Foodie', 'Delicious', 'Culinary'],
      music: ['Concert', 'LiveMusic', 'MusicLovers'],
      sports: ['Fitness', 'Athlete', 'SportsEvent'],
      art: ['Artistic', 'Creative', 'ArtExhibition'],
      technology: ['TechTalk', 'Innovation', 'Future'],
      business: ['Networking', 'Entrepreneur', 'BusinessGrowth'],
      health: ['Wellness', 'HealthyLiving', 'HealthCare'],
      religious: ['Faith', 'Spiritual', 'ReligiousEvent'],
      conference: ['Conference', 'Professional', 'Networking'],
      culture: ['Cultural', 'Heritage', 'Tradition'],
      workshop: ['Workshop', 'HandsOn', 'Learning'],
      networking: ['Networking', 'Connections', 'Community'],
      photography: ['Photography', 'Visual', 'Creative'],
      gaming: ['Gaming', 'Esports', 'Competition'],
      automotive: ['Automotive', 'Cars', 'Showcase'],
      charity: ['Charity', 'Giving', 'Community'],
      travel: ['Travel', 'Adventure', 'Exploration'],
      fashion: ['Fashion', 'Style', 'Trends'],
      // Add more categories as needed
    };
    return hashtags[category.toLowerCase()] || ['Eventopia'];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* StatusBar moved to App.js */}
      
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline: Some features may be limited</Text>
        </View>
      )}
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          {heroImageUri ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setShowFullScreenImage(true)}
              style={{ flex: 1 }}
            >
              <Image 
                source={{ uri: heroImageUri }} 
                style={styles.heroImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              style={styles.heroPlaceholder}
            >
              <Feather name="image" size={80} color="rgba(255, 255, 255, 0.5)" />
            </LinearGradient>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.mainContentCard}>
            <Text style={styles.detailsEyebrow}>Event Spotlight</Text>
            <Text style={styles.detailsTitle}>{event.title}</Text>
            <Text style={styles.detailsMeta}>
              {formatDate(event.date)} • {event.location?.city || event.location?.country || 'Location'}{event.category ? ` • ${event.category}` : ''}
            </Text>
            <Text style={styles.detailsMeta}>Related: {getRelatedHashtags(event.category).join(', ')}</Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>About the Experience</Text>
            <Text style={styles.detailsSubtitle}>
              {event.description || 'Stay tuned for a closer look at what makes this gathering special.'}
            </Text>
          </View>

          <View style={styles.essentialsCard}>
            <View style={styles.essentialsHeader}>
              <LinearGradient
                colors={['#0277BD', '#01579B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.essentialsHeaderGradient}
              >
                <Feather name="info" size={20} color="#FFFFFF" />
                <Text style={styles.essentialsHeaderText}>Key Details</Text>
              </LinearGradient>
            </View>
            <View style={styles.essentialsContent}>
              {allDetails.map((detail, index) => (
                <View key={detail.key} style={[styles.detailItem, index === allDetails.length - 1 && styles.detailItemLast]}>
                  <View style={styles.detailIconContainer}>
                    <LinearGradient
                      colors={['#0277BD', '#01579B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.detailIconGradient}
                    >
                      <Feather name={detail.icon} size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{detail.label}</Text>
                    <Text style={styles.detailValue}>{detail.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Compact Pricing Grid - Only show if there are pricing options */}
          {pricingGrid.length > 0 && (
            <View style={styles.essentialsCard}>
              <TouchableOpacity 
                style={styles.essentialsHeader}
                onPress={() => setIsPricingExpanded(!isPricingExpanded)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#0277BD', '#01579B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.essentialsHeaderGradient}
                >
                  <Feather name="tag" size={20} color="#FFFFFF" />
                  <Text style={styles.essentialsHeaderText}>Pricing Options</Text>
                  <Feather 
                    name={isPricingExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#FFFFFF" 
                    style={{ marginLeft: 'auto' }}
                  />
                </LinearGradient>
              </TouchableOpacity>
              
              {isPricingExpanded && (
                <View style={styles.pricingGridContent}>
                  <View style={styles.pricingGrid}>
                    {pricingGrid.map((item, index) => (
                      <View key={item.key} style={[styles.pricingGridItem, { borderLeftColor: item.color }]}>
                        <View style={[styles.pricingGridIconContainer, { backgroundColor: item.color + '20' }]}>
                          <Feather name={item.icon} size={14} color={item.color} />
                        </View>
                        <View style={styles.pricingGridTextContainer}>
                          <Text style={[styles.pricingGridLabel, { color: item.color }]}>{item.label}</Text>
                          <Text style={styles.pricingGridValue}>{item.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Additional Info Section */}
          {(event.importantInfo || event.importantinfo) && (
            <View style={{
              backgroundColor: '#FEE2E2',
              borderRadius: 16,
              padding: 18,
              marginBottom: 18,
              borderLeftWidth: 5,
              borderLeftColor: '#DC2626',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <Feather name="info" size={22} color="#DC2626" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 16, marginBottom: 2 }}>Important Information</Text>
                <Text style={{ color: '#1E293B', fontSize: 14 }}>{event.importantInfo || event.importantinfo}</Text>
              </View>
            </View>
          )}

          {/* User Response Card */}
          <View style={styles.advancedResponseCard}>
            {/* User Response Section */}
            <View style={styles.userResponseSection}>
              {/* Organizer Info Above Response Question */}
              <TouchableOpacity style={styles.organizerNameContainer} onPress={handleOrganizerPress}>
                <Text style={styles.hostedByText}>Hosted By</Text>
                <View style={styles.organizerNameRow}>
                  <View style={styles.organizerAvatarSmall}>
                    {getOrganizerProfileImage(event.organizerId) ? (
                      <Image 
                        source={{ uri: getOrganizerProfileImage(event.organizerId) }} 
                        style={styles.organizerAvatarImageSmall}
                        resizeMode="cover"
                      />
                    ) : (
                      <Feather name="user" size={20} color="#FFFFFF" />
                    )}
                    {event.organizerId?.isVerified && (
                      <View style={styles.verifiedOverlaySmall}>
                        <Feather name="check-circle" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.organizerNameInfo}>
                    <Text style={styles.organizerNameText}>
                      {event.organizerName || event.organizer || 'To be announced'}
                    </Text>
                    {event.organizerId?.isVerified && (
                      <View style={styles.verifiedBadgeSmall}>
                        <Feather name="check-circle" size={10} color="#FFFFFF" />
                        <Text style={styles.verifiedBadgeTextSmall}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Feather name="chevron-right" size={16} color="#6b7280" />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.userResponseQuestion}>Your Response?</Text>
              
              <View style={styles.advancedResponseButtons}>
                <TouchableOpacity 
                  style={[
                    styles.advancedResponseButton, 
                    styles.goingAdvancedButton,
                    userResponse === 'going' && styles.advancedResponseButtonActive
                  ]} 
                  onPress={() => handleResponse('going')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={userResponse === 'going' ? ['#0277BD', '#01579B'] : ['#E0F2FE', '#BAE6FD']}
                    style={styles.advancedButtonGradient}
                  >
                    <Feather name="check-circle" size={18} color={userResponse === 'going' ? '#FFFFFF' : '#0277BD'} />
                    <Text style={[
                      styles.advancedButtonText,
                      userResponse === 'going' && styles.advancedButtonTextActive
                    ]}>Going</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.advancedResponseButton, 
                    styles.interestedAdvancedButton,
                    userResponse === 'interested' && styles.advancedResponseButtonActive
                  ]} 
                  onPress={() => handleResponse('interested')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={userResponse === 'interested' ? ['#F59E0B', '#D97706'] : ['#FEF3C7', '#FDE68A']}
                    style={styles.advancedButtonGradient}
                  >
                    <Feather name="star" size={18} color={userResponse === 'interested' ? '#FFFFFF' : '#F59E0B'} />
                    <Text style={[
                      styles.advancedButtonText,
                      userResponse === 'interested' && styles.advancedButtonTextActive
                    ]}>Interested</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.advancedResponseButton, 
                    styles.maybeAdvancedButton,
                    userResponse === 'maybe' && styles.advancedResponseButtonActive
                  ]} 
                  onPress={() => handleResponse('maybe')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={userResponse === 'maybe' ? ['#6B7280', '#4B5563'] : ['#F3F4F6', '#E5E7EB']}
                    style={styles.advancedButtonGradient}
                  >
                    <Feather name="help-circle" size={18} color={userResponse === 'maybe' ? '#FFFFFF' : '#6B7280'} />
                    <Text style={[
                      styles.advancedButtonText,
                      userResponse === 'maybe' && styles.advancedButtonTextActive
                    ]}>Maybe</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <Text style={styles.actionSectionTitle}>Get Involved</Text>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.actionPrimaryButton} onPress={handleGetDirections}>
                  <LinearGradient colors={['#0277BD', '#01579B']} style={styles.actionButtonGradient}>
                    <Feather name="navigation" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionSecondaryButton} onPress={handleShare}>
                  <View style={styles.actionSecondaryButtonInner}>
                    <Feather name="share-2" size={18} color="#0277BD" />
                    <Text style={styles.actionSecondaryButtonText}>Share</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => toggleFavorite(event.id)}>
            <Feather 
              name="heart" 
              size={18} 
              color={isFavorite(event.id) ? "#FBBF24" : "#FFFFFF"} 
              fill={isFavorite(event.id) ? "#FBBF24" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showFullScreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullScreenImage(false)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.fullScreenBackground}
            activeOpacity={1}
            onPress={() => setShowFullScreenImage(false)}
          >
            {!!heroImageUri && (
              <Image
                source={{ uri: heroImageUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setShowFullScreenImage(false)}
            activeOpacity={0.85}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
  },
  heroContainer: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(180deg, rgba(2,119,189,0.1) 0%, rgba(2,119,189,0.3) 70%, rgba(1,87,155,0.8) 100%)',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(135deg, rgba(2,119,189,0.2) 0%, rgba(1,87,155,0.2) 100%)',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  mainContentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 28,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: -60,
    position: 'relative',
    zIndex: 10,
  },
  detailsEyebrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0277BD',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 42,
    marginBottom: 16,
  },
  detailsMeta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(2, 119, 189, 0.2)',
    marginVertical: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
  },
  detailsSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    color: '#475569',
    fontWeight: '500',
  },
  essentialsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: 'blur(15px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  essentialsHeader: {
    marginBottom: 0,
  },
  essentialsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  essentialsHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  essentialsContent: {
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(2, 119, 189, 0.1)',
    gap: 16,
  },
  detailItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0277BD',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
  },
  clickableValue: {
    color: '#0277BD',
    textDecorationLine: 'underline',
  },
  noticeCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 16,
  },
  noticeBody: {
    fontSize: 14,
    color: '#334155',
  },
  ctaCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: 20,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  ctaHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  ctaButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0277BD',
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  ctaSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0277BD',
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaSecondaryText: {
    color: '#0277BD',
    fontWeight: '600',
    fontSize: 15,
  },
  headerBar: {
    position: 'absolute',
    top: 50,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    alignItems: 'center',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
  },
  // Compact Pricing Grid Styles (using essentialsCard for consistency)
  pricingGridContent: {
    padding: 20,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  pricingGridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  pricingGridIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  pricingGridTextContainer: {
    alignItems: 'center',
  },
  pricingGridLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  pricingGridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  // Minimal Organizer Section Styles
  minimalOrganizerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  minimalOrganizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  minimalOrganizerProfileContainer: {
    marginRight: 12,
  },
  minimalOrganizerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  minimalOrganizerProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  minimalOrganizerDetails: {
    flex: 1,
  },
  minimalOrganizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalOrganizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  verifiedOrganizerText: {
    color: '#0277BD',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  verifiedOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0277BD',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedOverlayPlaceholder: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0277BD',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  // Advanced Response & Actions Card Styles
  advancedResponseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  responseHeaderLeft: {
    flex: 1,
  },
  responseHeadline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  responseSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  responseStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 45,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 16,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userResponseSection: {
    marginBottom: 20,
  },
  userResponseQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  advancedResponseButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  advancedResponseButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  advancedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    minHeight: 52,
  },
  advancedButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  advancedButtonTextActive: {
    color: '#FFFFFF',
  },
  advancedResponseButtonActive: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  actionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPrimaryButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSecondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  actionSecondaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
  },
  actionSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0277BD',
  },
  // Organizer Name Styles
  organizerNameContainer: {
    gap: 8,
    marginBottom: 16,
  },
  hostedByText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizerAvatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  organizerAvatarImageSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  verifiedOverlaySmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0277BD',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  organizerNameInfo: {
    flex: 1,
    gap: 4,
  },
  organizerNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  verifiedBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0277BD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    alignSelf: 'flex-start',
  },
  verifiedBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width,
    height,
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
});
