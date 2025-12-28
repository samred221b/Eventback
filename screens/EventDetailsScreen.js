import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Share, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// StatusBar removed; use root StatusBar in App.js
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../providers/FavoritesProvider';
import { formatPrice, formatDate, formatTime } from '../utils/dataProcessor';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [offline, setOffline] = useState(false); // State to track offline status

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
      key: 'schedule',
      icon: 'calendar',
      label: 'Schedule',
      value: `${formatDate(event.date)}${event.time ? ` • ${formatTime(event.time)}` : ''}`,
    },
    {
      key: 'mode',
      icon: event.mode === 'Online' ? 'wifi' : 'map',
      label: 'Mode',
      value: event.mode || 'In-person',
    },
    {
      key: 'venue',
      icon: 'map-pin',
      label: 'Venue',
      value: event.location?.address || event.location?.city || event.location?.name || 'Location TBA',
    },
    {
      key: 'pricing',
      icon: 'tag',
      label: 'Entrance',
      value: formatPrice(event.price, event.currency),
    },
    {
      key: 'host',
      icon: 'user',
      label: 'Organizer',
      value: event.organizerName || event.organizer || 'To be announced',
    },
  ];

  const vibeBadges = [
    event.category,
    event.isOnline ? 'Stream Friendly' : 'On-Site Experience',
    event.requiresRegistration ? 'Secure Entry' : 'Open Invitation',
    event.location?.city,
  ].filter(Boolean);

  // Function to get related hashtags based on category
  const getRelatedHashtags = (category) => {
    const hashtags = {
      education: ['#Learning', '#Knowledge', '#EducationMatters'],
      food: ['#Foodie', '#Delicious', '#Culinary'],
      music: ['#Concert', '#LiveMusic', '#MusicLovers'],
      sports: ['#Fitness', '#Athlete', '#SportsEvent'],
      art: ['#Artistic', '#Creative', '#ArtExhibition'],
      technology: ['#TechTalk', '#Innovation', '#Future'],
      business: ['#Networking', '#Entrepreneur', '#BusinessGrowth'],
      health: ['#Wellness', '#HealthyLiving', '#HealthCare'],
      // Add more categories as needed
    };
    return hashtags[category.toLowerCase()] || ['#Eventopia'];
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
          {event.imageUrl ? (
            <Image 
              source={{ uri: event.imageUrl }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
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
            <Text style={styles.detailsMeta}>Related: {getRelatedHashtags(event.category).join(' ')}</Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>About the Experience</Text>
            <Text style={styles.detailsSubtitle}>
              {event.description || 'Stay tuned for a closer look at what makes this gathering special.'}
            </Text>
          </View>

          <View style={styles.essentialsCard}>
            <Text style={styles.cardTitle}>Key Details</Text>
            {essentialDetails.map((detail, index) => (
              <View key={detail.key} style={[styles.detailListItem, index === essentialDetails.length - 1 && { borderBottomWidth: 0 }]}>
                <Feather name={detail.icon} size={20} color="#0284C7" style={styles.detailListItemIcon} />
                <View style={styles.detailListItemTextWrapper}>
                  <Text style={styles.detailListItemLabel}>{detail.label}</Text>
                  <Text style={styles.detailListItemValue}>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {(event.importantInfo || event.importantinfo) && (
            <View style={{
              backgroundColor: '#DBEAFE',
              borderRadius: 16,
              padding: 18,
              marginBottom: 18,
              borderLeftWidth: 5,
              borderLeftColor: '#2563EB',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <Feather name="info" size={22} color="#2563EB" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#1E40AF', fontWeight: '700', fontSize: 16, marginBottom: 2 }}>Important Information</Text>
                <Text style={{ color: '#1E293B', fontSize: 14 }}>{event.importantInfo || event.importantinfo}</Text>
              </View>
            </View>
          )}

          <View style={styles.ctaCard}>
            <Text style={styles.ctaHeadline}>Get Involved</Text>
            <View style={styles.ctaButtonRow}>
              <TouchableOpacity style={styles.ctaPrimaryButton} onPress={handleGetDirections}>
                <Feather name="navigation" size={16} color="#FFFFFF" />
                <Text style={styles.ctaPrimaryText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaSecondaryButton} onPress={handleShare}>
                <Feather name="share-2" size={16} color="#0369A1" />
                <Text style={styles.ctaSecondaryText}>Share</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: 'blur(15px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  detailListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(2, 119, 189, 0.15)',
  },
  detailListItemIcon: {
    marginRight: 16,
  },
  detailListItemTextWrapper: {
    flex: 1,
  },
  detailListItemLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0277BD',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailListItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 22,
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
});
