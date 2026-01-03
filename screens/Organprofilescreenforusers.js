import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import apiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';
import homeStyles from '../styles/homeStyles';

const { width } = require('react-native').Dimensions;

// Cache keys and constants
const ORGANIZER_CACHE_KEY = (organizerId) => `organizer_${organizerId}`;
const ORGANIZER_EVENTS_CACHE_KEY = (organizerId) => `organizer_events_${organizerId}`;
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// Cache functions
const cacheOrganizerData = async (organizerId, organizerData, eventsData) => {
  try {
    const cacheData = {
      organizer: organizerData,
      events: eventsData,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(ORGANIZER_CACHE_KEY(organizerId), JSON.stringify(cacheData));
    await AsyncStorage.setItem(ORGANIZER_EVENTS_CACHE_KEY(organizerId), JSON.stringify({
      events: eventsData,
      timestamp: Date.now()
    }));
  } catch (error) {
    logger.warn('Failed to cache organizer data:', error);
  }
};

const getCachedOrganizerData = async (organizerId) => {
  try {
    const cachedData = await AsyncStorage.getItem(ORGANIZER_CACHE_KEY(organizerId));
    if (!cachedData) return null;
    
    const { organizer, events, timestamp } = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
      await AsyncStorage.removeItem(ORGANIZER_CACHE_KEY(organizerId));
      await AsyncStorage.removeItem(ORGANIZER_EVENTS_CACHE_KEY(organizerId));
      return null;
    }
    
    return { organizer, events };
  } catch (error) {
    logger.warn('Failed to get cached organizer data:', error);
    return null;
  }
};

function Organprofilescreenforusers({ route, navigation }) {
  const { organizerId } = route.params;
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (organizerId) {
      fetchOrganizerProfile();
    } else {
      setError(toAppError(new Error('No organizer ID provided'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      setLoading(false);
    }
  }, [organizerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    setIsFromCache(false); // Reset cache indicator on refresh
    await fetchOrganizerProfile(true); // Force refresh
    setRefreshing(false);
  };

  const fetchOrganizerProfile = async (forceRefresh = false) => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      if (!forceRefresh) {
        const cachedData = await getCachedOrganizerData(organizerId);
        if (cachedData) {
          setOrganizer(cachedData.organizer);
          setEvents(cachedData.events);
          setIsFromCache(true);
          if (!refreshing) {
            setLoading(false);
          }
          return;
        }
      }

      setIsFromCache(false);

      const organizerResponse = await apiService.get(`/organizers/${organizerId}`);
      const organizerData = organizerResponse.data.success ? organizerResponse.data.data : organizerResponse.data;
      
      if (!organizerData) {
        setError(toAppError(new Error('Organizer not found'), { kind: 'NOT_FOUND', severity: APP_ERROR_SEVERITY.WARNING }));
        return;
      }
      
      setOrganizer(organizerData);

      let eventsData = [];
      try {
        const eventsResponse = await apiService.get(`/events?organizerId=${organizerId}&limit=10`);
        eventsData = eventsResponse.data.success ? eventsResponse.data.data : eventsResponse.data;
        setEvents(eventsData);
      } catch (eventsError) {
        logger.warn('Failed to fetch events:', eventsError);
      }

      await cacheOrganizerData(organizerId, organizerData, eventsData);

    } catch (err) {
      logger.error('Error fetching organizer profile:', err);
      
      if (err.response?.status === 404) {
        setError(toAppError(new Error('Organizer not found'), { kind: 'NOT_FOUND', severity: APP_ERROR_SEVERITY.WARNING }));
      } else {
        setError(toAppError(err, { fallbackMessage: 'Failed to load organizer profile' }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (!refreshing) {
        setLoading(false);
      }
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `Check out ${organizer.name} on Eventopia!\n\n${organizer.bio || 'Amazing event organizer'}`;
      await Share.share({
        message: shareContent,
        title: `${organizer.name} - Eventopia`,
      });
    } catch (error) {
      logger.warn('Share failed:', error);
      setError(toAppError(error, { kind: 'SHARE_ERROR', severity: APP_ERROR_SEVERITY.WARNING, fallbackMessage: 'Share failed' }));
    }
  };

  const handleContactPress = () => {
    if (organizer.phone) {
      Alert.alert(
        'Contact Organizer',
        'How would you like to contact them?',
        [
          {
            text: 'Call',
            onPress: () => {
              Linking.openURL(`tel:${organizer.phone}`);
            },
          },
          {
            text: 'Email',
            onPress: () => {
              Linking.openURL(`mailto:${organizer.email}`);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        'Contact Organizer',
        `Would you like to email ${organizer.email}?`,
        [
          {
            text: 'Email',
            onPress: () => {
              Linking.openURL(`mailto:${organizer.email}`);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleWebsitePress = (url) => {
    Linking.openURL(url);
  };

  const handleLocationPress = (location) => {
    if (location.address) {
      const query = `${location.address}, ${location.city || ''}, ${location.country || ''}`;
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (price, currency = 'ETB') => {
    if (price === 0 || !price) return 'Free';
    return `${currency} ${price}`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header matching HomeScreen */}
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
                    <Feather name="user" size={20} color="#0277BD" />
                  </View>
                </View>
                <View style={homeStyles.modernDashboardText}>
                  <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>Organizer</Text>
                  <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Profile</Text>
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
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={{ marginTop: 16, color: '#64748B' }}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !organizer) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header matching HomeScreen */}
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
                    <Feather name="user" size={20} color="#0277BD" />
                  </View>
                </View>
                <View style={homeStyles.modernDashboardText}>
                  <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>Organizer</Text>
                  <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Profile</Text>
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
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AppErrorState 
            error={error || { message: 'Organizer not found' }}
            onRetry={() => fetchOrganizerData(true)}
          />
        </View>
      </View>
    );
  }
          return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <AppErrorBanner error={error} onRetry={() => fetchOrganizerProfile(true)} />
      {/* Header matching HomeScreen */}
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
                  <Feather name="user" size={20} color="#0277BD" />
                </View>
              </View>
              <View style={homeStyles.modernDashboardText}>
                <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>Organizer</Text>
                <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Profile</Text>
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

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Cache Indicator */}
        {isFromCache && !loading && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            marginHorizontal: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            marginTop: 0
          }}>
            <Feather name="info" size={14} color="#FFFFFF" />
            <Text style={{ 
              marginLeft: 6, 
              fontSize: 12, 
              color: '#FFFFFF',
              fontWeight: '500'
            }}>
              Cached data from {new Date(Date.now() - CACHE_EXPIRY_TIME).toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Profile Header */}
        <View style={{ 
          backgroundColor: '#FFFFFF', 
          padding: 24,
          marginHorizontal: 16,
          marginTop: 8,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40,
              backgroundColor: '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}>
              {organizer.profileImage ? (
                <Image 
                  source={{ uri: organizer.profileImage }} 
                  style={{ width: 80, height: 80 }} 
                />
              ) : (
                <Feather name="user" size={32} color="#9CA3AF" />
              )}
            </View>
            
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: '600', 
                  color: '#1F2937',
                  flex: 1
                }}>
                  {organizer.name}
                </Text>
                {organizer.isVerified && (
                  <View style={{
                    backgroundColor: '#0277BD',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginLeft: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                    <Text style={{
                      fontSize: 11,
                      color: '#FFFFFF',
                      fontWeight: '600'
                    }}>
                      Verified
                    </Text>
                  </View>
                )}
              </View>
              
              {organizer.organization && (
                <Text style={{ 
                  fontSize: 14, 
                  color: '#64748B', 
                  marginTop: 4 
                }}>
                  {organizer.organization}
                </Text>
              )}
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={14} color="#64748B" />
                  <Text style={{ 
                    fontSize: 13, 
                    color: '#64748B', 
                    marginLeft: 4 
                  }}>
                    {organizer.totalEvents || 0} Events
                  </Text>
                </View>
                
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginLeft: 16 
                }}>
                  <Feather name="star" size={14} color="#64748B" />
                  <Text style={{ 
                    fontSize: 13, 
                    color: '#64748B', 
                    marginLeft: 4 
                  }}>
                    {organizer.rating || 0}.0
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {organizer.bio && (
            <Text style={{ 
              fontSize: 14, 
              color: '#4B5563', 
              marginTop: 16, 
              lineHeight: 20 
            }}>
              {organizer.bio}
            </Text>
          )}
          
          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0277BD',
                paddingVertical: 12,
                borderRadius: 8
              }}
              onPress={handleShare}
            >
              <Feather name="share-2" size={16} color="#FFFFFF" />
              <Text style={{ 
                marginLeft: 6, 
                fontSize: 14, 
                fontWeight: '500', 
                color: '#FFFFFF' 
              }}>
                Share
              </Text>
            </TouchableOpacity>
            
            {organizer.website && (
              <TouchableOpacity 
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 12,
                  borderRadius: 8
                }}
                onPress={() => Linking.openURL(organizer.website)}
              >
                <Feather name="globe" size={16} color="#374151" />
                <Text style={{ 
                  marginLeft: 6, 
                  fontSize: 14, 
                  fontWeight: '500', 
                  color: '#374151' 
                }}>
                  Website
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contact Info */}
        <View style={{ 
          backgroundColor: '#FFFFFF', 
          padding: 20,
          marginHorizontal: 16,
          marginTop: 8,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: '#1F2937',
            marginBottom: 16 
          }}>
            Contact Information
          </Text>
          
          {/* Email */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingVertical: 8,
            marginBottom: 8
          }}>
            <Feather name="mail" size={16} color="#64748B" />
            {organizer?.email && organizer.email.trim() !== '' ? (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${organizer.email}`)}>
                <Text style={{ 
                  marginLeft: 12, 
                  fontSize: 14, 
                  color: '#374151',
                  textDecorationLine: 'underline'
                }}>
                  {organizer.email}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ 
                marginLeft: 12, 
                fontSize: 14, 
                color: '#9CA3AF',
                fontStyle: 'italic'
              }}>
                Email not provided
              </Text>
            )}
          </View>
          
          {/* Phone */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingVertical: 8,
            marginBottom: 8
          }}>
            <Feather name="phone" size={16} color="#64748B" />
            {organizer?.phone && organizer.phone.trim() !== '' ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${organizer.phone}`)}>
                <Text style={{ 
                  marginLeft: 12, 
                  fontSize: 14, 
                  color: '#374151',
                  textDecorationLine: 'underline'
                }}>
                  {organizer.phone}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ 
                marginLeft: 12, 
                fontSize: 14, 
                color: '#9CA3AF',
                fontStyle: 'italic'
              }}>
                Phone not provided
              </Text>
            )}
          </View>
          
          {organizer.location && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'flex-start', 
              paddingVertical: 8 
            }}>
              <Feather name="map-pin" size={16} color="#64748B" style={{ marginTop: 2 }} />
              <Text style={{ 
                marginLeft: 12, 
                fontSize: 14, 
                color: '#374151', 
                flex: 1 
              }}>
                {[organizer.location.address, organizer.location.city, organizer.location.country].filter(Boolean).join(', ') || 'Location not specified'}
              </Text>
            </View>
          )}
        </View>

        {/* Events Section */}
        {events.length > 0 && (
          <View style={{ 
            backgroundColor: '#FFFFFF', 
            padding: 20,
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 20,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: '#1F2937',
              marginBottom: 16 
            }}>
              Upcoming Events ({events.length})
            </Text>
            
            {events.slice(0, 3).map((event) => (
              <TouchableOpacity
                key={event._id}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6'
                }}
                onPress={() => navigation.navigate('EventDetails', { event })}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}>
                  {event.image ? (
                    <Image 
                      source={{ uri: event.image }} 
                      style={{ width: 48, height: 48 }} 
                    />
                  ) : (
                    <Feather name="calendar" size={20} color="#9CA3AF" />
                  )}
                </View>
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '500', 
                    color: '#1F2937',
                    marginBottom: 4 
                  }}>
                    {event.title}
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#64748B',
                    marginBottom: 2 
                  }}>
                    {new Date(event.date).toLocaleDateString()} • {event.time || 'TBD'}
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#64748B' 
                  }}>
                    {event.location?.name || event.location?.city || 'Location TBA'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {events.length > 3 && (
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  paddingVertical: 12,
                  marginTop: 8
                }}
              >
                <Text style={{ 
                  fontSize: 14, 
                  color: '#0277BD', 
                  fontWeight: '500' 
                }}>
                  View all events
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default Organprofilescreenforusers;
