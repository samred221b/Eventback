import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Alert,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { useFavorites } from '../providers/FavoritesProvider';
import { SafeScrollView, SafeTouchableOpacity } from '../components/SafeComponents';
import EnhancedSearch from '../components/EnhancedSearch';
import ConnectionErrorBanner from '../components/ConnectionErrorBanner';

import homeStyles from '../styles/homeStyles';
import { makeEventSerializable, formatPrice } from '../utils/dataProcessor';
import apiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';


const HOME_EVENTS_CACHE_KEY = '@eventopia_home_events';

const cacheHomeEvents = async (events) => {
  try {
    await AsyncStorage.setItem(HOME_EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch (e) {
    logger.error('Failed to cache home events:', e);
  }
};

const loadHomeEventsFromCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(HOME_EVENTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    logger.error('Failed to load cached home events:', e);
    return [];
  }
};

const HOME_BANNERS_CACHE_KEY = '@eventopia_home_banners';

const cacheHomeBanners = async (banners) => {
  try {
    await AsyncStorage.setItem(HOME_BANNERS_CACHE_KEY, JSON.stringify(banners));
  } catch (e) {
    logger.error('Failed to cache home banners:', e);
  }
};

const loadHomeBannersFromCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(HOME_BANNERS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    logger.error('Failed to load cached home banners:', e);
    return [];
  }
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [processedEvents, setProcessedEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoadingRef = useRef(false);
  const lastRefreshTime = useRef(Date.now());
  const [backendError, setBackendError] = useState({
    message: '',
    details: '',
    type: 'error', // 'error', 'warning', 'info'
    showRefresh: true
  });

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      const REFRESH_COOLDOWN = 30000;

      if (hasInitialLoad && !isLoadingRef.current && timeSinceLastRefresh > REFRESH_COOLDOWN) {
        lastRefreshTime.current = now;
        // Background refresh on focus without blocking UI
        loadEventsFromBackend({ background: true });
      }
    }, [hasInitialLoad])
  );

  useEffect(() => {
    // Prefill from cache and refresh in background on first mount
    loadEventsFromBackend({ background: true });
  }, []);

  const loadEventsFromBackend = async ({ isRefresh = false, background = false } = {}) => {
    try {
      isLoadingRef.current = true;
      // Show loading indicator for initial load or manual refresh
      if (!background || isRefresh) {
        setIsLoading(true);
      }

      // Only clear errors for user-initiated actions
      if (!background) {
        setBackendError(null);
      }

      // Prefill from cache for instant UI
      const cachedEventsPrefill = await loadHomeEventsFromCache();
      if (cachedEventsPrefill.length > 0) {
        setProcessedEvents(cachedEventsPrefill);
        setFeaturedEvents(cachedEventsPrefill.filter(e => e.featured).slice(0, 6));
        
        const nowPrefill = new Date();
        const upcomingPrefill = cachedEventsPrefill
          .filter(event => new Date(event.date) >= nowPrefill)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingEvents(upcomingPrefill.slice(0, 3));
        
        // Set trending events to ALL upcoming events
        setTrendingEvents(upcomingPrefill);
      }

      // Check network status first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        if (!background) {
          setBackendError({
            message: 'You appear to be offline',
            details: 'Showing cached events if available',
            type: 'error',
            showRefresh: true
          });
        }
        return;
      }

      try {
        // Use apiService's internal AbortController timeout
        const response = await apiService.getEvents();

        if (response.success && response.data) {
          const transformedEvents = response.data
            .filter(event => event._id && event.title && event.date)
            .map(event => ({
              id: event._id,
              title: event.title,
              description: event.description,
              date: event.date,
              time: event.time,
              location: event.location,
              price: event.price || 0,
              currency: event.currency || 'ETB',
              category: event.category,
              featured: event.featured || false,
              imageUrl: event.imageUrl || event.image || null,
              organizerName: event.organizerName || event.organizer || '',
              importantInfo: event.importantInfo || '',
            }));

          setProcessedEvents(transformedEvents);
          setFeaturedEvents(transformedEvents.filter(e => e.featured).slice(0, 6));
          
          const now = new Date();
          const upcoming = transformedEvents
            .filter(event => new Date(event.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingEvents(upcoming.slice(0, 3));
          
          // Set trending events to ALL upcoming events
          setTrendingEvents(upcoming);

          await cacheHomeEvents(transformedEvents);
          setBackendError(null); 
        }
      } catch (apiError) {
        logger.error('API Error:', apiError);
        
        // Format a user-friendly error message
        let errorMessage = 'Failed to load events';
        let errorDetails = 'Please try again later';
        let errorType = 'error';
        
        const messageLower = String(apiError?.message || '').toLowerCase();
        const isTimeout = apiError?.name === 'AbortError' || messageLower.includes('timeout');
        if (isTimeout) {
          errorMessage = 'Request Timeout';
          errorDetails = 'The server is taking too long to respond. Please check your internet connection or try again later.';
          // Show a user-friendly alert
          Alert.alert('Request Timeout', 'The server is taking too long to respond. Please check your internet connection or try again later.');
        } else if (apiError.message.includes('Network request failed')) {
          errorMessage = 'Network Error';
          errorDetails = 'Unable to connect to the server';
        }
        
        setBackendError({
          message: errorMessage,
          details: errorDetails,
          type: errorType,
          showRefresh: true
        });
        
        // Only show error if this isn't a background refresh and we have a network-related error
        if (!background && (errorType === 'error' || errorMessage.includes('Network'))) {
          setBackendError({
            message: errorMessage,
            details: errorDetails,
            type: 'error',
            showRefresh: true
          });
          
          // If we don't have any cached data, clear the UI
          if (cachedEventsPrefill.length === 0) {
            setProcessedEvents([]);
            setFeaturedEvents([]);
            setUpcomingEvents([]);
          }
        }
      }
    } catch (error) {
      logger.error('Unexpected error in loadEventsFromBackend:', error);
      setBackendError({
        message: 'An unexpected error occurred',
        details: 'Please try again later',
        type: 'error',
        showRefresh: true
      });
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setHasInitialLoad(true);
    }
  };

  const handleRetry = useCallback(() => {
    if (isLoadingRef.current) return;
    loadEventsFromBackend({ background: false });
  }, [isLoadingRef.current]);

  const handleRefresh = async () => {
    const now = Date.now();
    const REFRESH_COOLDOWN = 30000;

    if (isLoadingRef.current || now - lastRefreshTime.current < REFRESH_COOLDOWN) {
      return;
    }

    try {
      setIsRefreshing(true);
      lastRefreshTime.current = now;
      await loadEventsFromBackend({ isRefresh: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEventPress = (event) => {
    const serializable = makeEventSerializable(event);
    serializable.organizerName = event.organizerName || event.organizer || '';
    serializable.importantInfo = event.importantInfo || '';
    navigation.navigate('EventDetails', { event: serializable });
  };

  const formatDateTimeShort = (dateString, timeString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = timeString || '2:00 PM';
    return `${dateStr} • ${timeStr}`;
  };

  const filteredEvents = searchQuery.trim()
    ? processedEvents.filter(event =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : processedEvents;

  if (isLoading && !isRefreshing && hasInitialLoad) {
    return (
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
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
                  <Text style={homeStyles.homeHeaderWelcomeText}>Welcome Back,</Text>
                  <Text style={homeStyles.homeHeaderNameText}>User</Text>
                </View>
              </View>
              <View style={homeStyles.homeHeaderActions}>
                <SafeTouchableOpacity
                  style={homeStyles.homeHeaderIconButton}
                  onPress={() => setShowSearch(!showSearch)}
                >
                  <Feather name="search" size={20} color="rgba(255, 255, 255, 1)" />
                </SafeTouchableOpacity>
              </View>
            </View>

            <View style={homeStyles.homeHeaderMetaRow}>
              <Text style={homeStyles.homeHeaderMetaText}>Discover Events</Text>
              <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
              <Text style={homeStyles.homeHeaderMetaText}>Create Memories</Text>
              <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
              <Text style={homeStyles.homeHeaderMetaText}>Share Moments</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={homeStyles.skeletonContainer}>
          {/* Skeleton Header */}
          <View style={homeStyles.skeletonHeader}>
            <View style={homeStyles.skeletonTitle} />
            <View style={homeStyles.skeletonSubtitle} />
          </View>

          {/* Skeleton Event Cards */}
          <View style={homeStyles.skeletonEventsContainer}>
            {[1, 2, 3].map((index) => (
              <View key={index} style={homeStyles.skeletonEventCard}>
                <View style={homeStyles.skeletonImage} />
                <View style={homeStyles.skeletonContent}>
                  <View style={homeStyles.skeletonTitle} />
                  <View style={homeStyles.skeletonMeta} />
                  <View style={homeStyles.skeletonMeta} />
                  <View style={homeStyles.skeletonButton} />
                </View>
              </View>
            ))}
          </View>

          {/* Skeleton Stats */}
          <View style={homeStyles.skeletonStatsContainer}>
            {[1, 2, 3, 4].map((index) => (
              <View key={index} style={homeStyles.skeletonStatCard}>
                <View style={homeStyles.skeletonIcon} />
                <View style={homeStyles.skeletonValue} />
                <View style={homeStyles.skeletonLabel} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>

      <SafeScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {backendError && (
          <ConnectionErrorBanner
            message={"We couldn't reach the server."}
            details={backendError}
            retryIn={10}
            onRetry={handleRetry}
            disabled={isLoadingRef.current}
          />
        )}
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
                  <Text style={homeStyles.homeHeaderWelcomeText}>Welcome Back,</Text>
                  <Text style={homeStyles.homeHeaderNameText}>User</Text>
                </View>
              </View>
              <View style={homeStyles.homeHeaderActions}>
                <SafeTouchableOpacity
                  style={homeStyles.homeHeaderIconButton}
                  onPress={() => setShowSearch(!showSearch)}
                >
                  <Feather name="search" size={20} color="rgba(255, 255, 255, 1)" />
                </SafeTouchableOpacity>
              </View>
            </View>

            <View style={homeStyles.homeHeaderMetaRow}>
              <Text style={homeStyles.homeHeaderMetaText}>Discover Events</Text>
              <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
              <Text style={homeStyles.homeHeaderMetaText}>Create Memories</Text>
              <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
              <Text style={homeStyles.homeHeaderMetaText}>Share Moments</Text>
            </View>
          </LinearGradient>
        </View>

        {showSearch && (
          <View style={homeStyles.homeSearchSection}>
            <EnhancedSearch
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events by name, location, category..."
              events={processedEvents}
              onEventSelect={handleEventPress}
            />
          </View>
        )}

        <View style={homeStyles.promotionalBannersSection}>
          <AutoScrollingPromoCarousel navigation={navigation} />
        </View>

        {/* Trending Events Section */}
        {trendingEvents.length > 0 && (
          <View style={homeStyles.trendingEventsSection}>
            <View style={homeStyles.trendingEventsHeader}>
              <View style={homeStyles.trendingTitleContainer}>
                <Feather name="trending-up" size={20} color="#EF4444" />
                <Text style={homeStyles.trendingEventsTitle}>Trending Events</Text>
              </View>
              <SafeTouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={homeStyles.seeAllLink}>See All</Text>
              </SafeTouchableOpacity>
            </View>

            <View style={homeStyles.trendingEventsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={homeStyles.trendingEventsScrollContainer}
              >
                {trendingEvents.map((event, index) => (
                  <SafeTouchableOpacity
                    key={event.id}
                    style={homeStyles.trendingEventCard}
                    onPress={() => handleEventPress(event)}
                    activeOpacity={0.95}
                  >
                  <View style={homeStyles.trendingEventImageContainer}>
                    {event.imageUrl ? (
                      <Image
                        source={{ uri: event.imageUrl }}
                        style={homeStyles.trendingEventImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#E0E7FF', '#C7D2FE']}
                        style={homeStyles.trendingEventPlaceholder}
                      >
                        <Feather name="image" size={24} color="#6366F1" />
                      </LinearGradient>
                    )}
                  </View>

                  <View style={homeStyles.trendingEventContent}>
                    <View style={homeStyles.trendingEventHeader}>
                      <Text style={homeStyles.trendingEventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(event.id)}
                        style={homeStyles.trendingHeartButton}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name="heart"
                          size={16}
                          color={isFavorite(event.id) ? "#EF4444" : "#64748B"}
                          fill={isFavorite(event.id) ? "#EF4444" : "none"}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={homeStyles.trendingEventMeta}>
                      <View style={homeStyles.trendingMetaItem}>
                        <Feather name="calendar" size={12} color="#64748B" />
                        <Text style={homeStyles.trendingMetaText}>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={homeStyles.trendingMetaItem}>
                        <Feather name="clock" size={12} color="#64748B" />
                        <Text style={homeStyles.trendingMetaText}>{event.time || 'TBD'}</Text>
                      </View>
                    </View>

                    <View style={homeStyles.trendingEventFooter}>
                      <View style={homeStyles.trendingLocationItem}>
                        <Feather name="map-pin" size={12} color="#64748B" />
                        <Text style={homeStyles.trendingLocationText} numberOfLines={1}>
                          {typeof event.location === 'string' ? event.location : event.location?.name || 'Location TBA'}
                        </Text>
                      </View>
                      <View style={homeStyles.trendingPriceBadge}>
                        <Text style={homeStyles.trendingPriceText}>
                          {event.price === 0 ? 'Free' : `${event.currency} ${event.price}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </SafeTouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        
        {/* Empty State */}
        {trendingEvents.length === 0 && !isLoading && (
          <View style={homeStyles.emptyStateContainer}>
            <View style={homeStyles.emptyStateIllustration}>
              <Feather name="calendar" size={64} color="#9CA3AF" />
            </View>
            <Text style={homeStyles.emptyStateTitle}>No Events Yet</Text>
            <Text style={homeStyles.emptyStateDescription}>
              {searchQuery.trim() 
                ? `No events found for "${searchQuery}"`
                : "Be the first to create amazing events in your area!"
              }
            </Text>
            {searchQuery.trim() && (
              <SafeTouchableOpacity 
                style={homeStyles.emptyStateButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.9}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
                <Text style={homeStyles.emptyStateButtonText}>Clear Search</Text>
              </SafeTouchableOpacity>
            )}
            {!searchQuery.trim() && (
              <SafeTouchableOpacity 
                style={homeStyles.emptyStateButton}
                onPress={() => navigation.navigate('Events')}
                activeOpacity={0.9}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={homeStyles.emptyStateButtonText}>Create Event</Text>
              </SafeTouchableOpacity>
            )}
          </View>
        )}

        <View style={homeStyles.featuredEventsSection}>
          <View style={homeStyles.featuredEventsHeader}>
            <Text style={homeStyles.featuredEventsTitle}>Featured Events</Text>
            <SafeTouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={homeStyles.seeAllLink}>See All</Text>
            </SafeTouchableOpacity>
          </View>

          <View style={homeStyles.premiumFeaturedContainer}>
            {featuredEvents.map((event, index) => (
              <SafeTouchableOpacity
                key={event.id}
                style={homeStyles.horizontalEventCard}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.95}
              >
                <View style={homeStyles.premiumFeaturedBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={homeStyles.premiumBadgeGradient}
                  >
                    <Feather name="star" size={10} color="#FFFFFF" />
                    <Text style={homeStyles.premiumBadgeText}>FEATURED</Text>
                  </LinearGradient>
                </View>

                <View style={homeStyles.horizontalEventImageContainer}>
                  {event.imageUrl ? (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={homeStyles.horizontalEventImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={
                        index % 3 === 0 ? ['#0277BD', '#01579B'] :
                        index % 3 === 1 ? ['#8B5CF6', '#7C3AED'] :
                        ['#059669', '#047857']
                      }
                      style={homeStyles.horizontalEventImagePlaceholder}
                    >
                      <Feather name="image" size={24} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                  )}
                </View>

                <View style={homeStyles.horizontalEventDetailsContainer}>
                  <View style={homeStyles.horizontalEventTopSection}>
                    <Text style={homeStyles.horizontalEventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="map-pin" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText} numberOfLines={1}>
                        {event.location?.city || event.location?.name || 'Location TBA'}
                      </Text>
                    </View>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="calendar" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText}>
                        {formatDateTimeShort(event.date, event.time)}
                      </Text>
                    </View>
                  </View>

                  <View style={homeStyles.horizontalEventBottomRow}>
                    <Text style={homeStyles.horizontalEventPrice}>
                      {formatPrice(event.price, event.currency)}
                    </Text>

                    <SafeTouchableOpacity
                      style={homeStyles.horizontalEventViewButton}
                      onPress={() => handleEventPress(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={homeStyles.horizontalEventViewButtonText}>View Details</Text>
                    </SafeTouchableOpacity>
                  </View>
                </View>
              </SafeTouchableOpacity>
            ))}
          </View>
        </View>

        <View style={homeStyles.featuredEventsSection}>
          <View style={homeStyles.featuredEventsHeader}>
            <Text style={homeStyles.featuredEventsTitle}>Upcoming Events</Text>
            <SafeTouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={homeStyles.seeAllLink}>See All</Text>
            </SafeTouchableOpacity>
          </View>

          <View style={homeStyles.premiumFeaturedContainer}>
            {upcomingEvents.map((event, index) => (
              <SafeTouchableOpacity
                key={event.id}
                style={homeStyles.horizontalEventCard}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.95}
              >

                <View style={homeStyles.horizontalEventImageContainer}>
                  {event.imageUrl ? (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={homeStyles.horizontalEventImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={
                        index % 3 === 0 ? ['#0277BD', '#01579B'] :
                        index % 3 === 1 ? ['#8B5CF6', '#7C3AED'] :
                        ['#059669', '#047857']
                      }
                      style={homeStyles.horizontalEventImagePlaceholder}
                    >
                      <Feather name="image" size={24} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                  )}
                </View>

                <View style={homeStyles.horizontalEventDetailsContainer}>
                  <View style={homeStyles.horizontalEventTopSection}>
                    <Text style={homeStyles.horizontalEventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="map-pin" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText} numberOfLines={1}>
                        {event.location?.city || event.location?.name || 'Location TBA'}
                      </Text>
                    </View>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="calendar" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText}>
                        {formatDateTimeShort(event.date, event.time)}
                      </Text>
                    </View>
                  </View>

                  <View style={homeStyles.horizontalEventBottomRow}>
                    <Text style={homeStyles.horizontalEventPrice}>
                      {formatPrice(event.price, event.currency)}
                    </Text>

                    <SafeTouchableOpacity
                      style={homeStyles.horizontalEventViewButton}
                      onPress={() => handleEventPress(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={homeStyles.horizontalEventViewButtonText}>View Details</Text>
                    </SafeTouchableOpacity>
                  </View>
                </View>
              </SafeTouchableOpacity>
            ))}
          </View>
        </View>

        <View style={homeStyles.creativeElementsSection}>
          <View style={homeStyles.statsCardsContainer}>
            <View style={homeStyles.statsCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={homeStyles.statsCardGradient}
              >
                <Feather name="calendar" size={24} color="#FFFFFF" />
                <Text style={homeStyles.statsCardNumber}>{processedEvents.length}</Text>
                <Text style={homeStyles.statsCardLabel}>Total Events</Text>
              </LinearGradient>
            </View>
            <View style={homeStyles.statsCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={homeStyles.statsCardGradient}
              >
                <Feather name="star" size={24} color="#FFFFFF" />
                <Text style={homeStyles.statsCardNumber}>{featuredEvents.length}</Text>
                <Text style={homeStyles.statsCardLabel}>Featured</Text>
              </LinearGradient>
            </View>
            <View style={homeStyles.statsCard}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={homeStyles.statsCardGradient}
              >
                <Feather name="heart" size={24} color="#FFFFFF" />
                <Text style={homeStyles.statsCardNumber}>{processedEvents.filter(event => isFavorite(event.id)).length}</Text>
                <Text style={homeStyles.statsCardLabel}>Favorites</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={homeStyles.organizerBox}>
            <LinearGradient
              colors={['#1F2937', '#111827']}
              style={homeStyles.organizerBoxGradient}
            >
              <View style={homeStyles.organizerContent}>
                <View style={homeStyles.organizerTextSection}>
                  <Text style={homeStyles.organizerTitle}>Are you an organizer?</Text>
                  <Text style={homeStyles.organizerSubtitle}>Create and manage amazing events</Text>
                </View>
                <SafeTouchableOpacity
                  style={homeStyles.organizerButton}
                  onPress={() => navigation.navigate('Organizer', { screen: 'OrganizerLogin' })}
                  activeOpacity={0.8}
                >
                  <Feather name="user-plus" size={18} color="#FFFFFF" />
                  <Text style={homeStyles.organizerButtonText}>Get Started</Text>
                </SafeTouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </SafeScrollView>

    </View>
  );
}

function AutoScrollingPromoCarousel({ navigation }) {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [remoteBanners, setRemoteBanners] = useState([]);

  const banners = remoteBanners;

  const bannerImageStyles = [
    homeStyles.heroBannerImage1,
    homeStyles.heroBannerImage2,
    homeStyles.heroBannerImage3,
    // Add more styles as needed
  ];

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * Dimensions.get('window').width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cached = await loadHomeBannersFromCache();
        if (isMounted && cached?.length) {
          setRemoteBanners(cached);
        }

        const response = await apiService.getBanners();
        if (response?.success && Array.isArray(response.data)) {
          const mapped = response.data
            .filter(b => b && b.imageUrl)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((b, idx) => ({
              id: b._id || `remote-${idx}`,
              image: { uri: b.imageUrl },
              action: null,
            }));
          if (isMounted) {
            setRemoteBanners(mapped);
            await cacheHomeBanners(mapped);
          }
        }
      } catch (_) {
        // ignore and rely on cache/fallback
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const onScroll = (event) => {
    const newIndex = Math.round(
      event.nativeEvent.contentOffset.x / Dimensions.get('window').width
    );
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <View style={homeStyles.promotionalBannersContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ width: Dimensions.get('window').width }}
      >
        {banners.map((banner, index) => (
          <View
            key={banner.id}
            style={{ width: Dimensions.get('window').width, paddingHorizontal: 6 }}
          >
            <ImageBackground
              source={banner.image}
              style={[homeStyles.heroBanner, { overflow: 'hidden' }]}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>
      <View style={homeStyles.paginationContainer}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[homeStyles.paginationDot, index === currentIndex && homeStyles.paginationDotActive]}
          />
        ))}
      </View>
    </View>
  );
}