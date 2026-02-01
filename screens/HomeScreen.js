import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Feather } from '@expo/vector-icons';

import { useFavorites } from '../providers/FavoritesProvider';
import { useTheme } from '../providers/ThemeProvider';
import { SafeScrollView, SafeTouchableOpacity } from '../components/SafeComponents';
import EnhancedSearch from '../components/EnhancedSearch';
import AppErrorBanner from '../components/AppErrorBanner';
import EmptyState from '../components/EmptyState';

import homeStyles from '../styles/homeStyles';
import { makeEventSerializable, formatPrice, standardizeEventForDetails } from '../utils/dataProcessor';
import apiService from '../services/api';
import cacheService, { TTL } from '../utils/cacheService';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';
import { toAppError, createOfflineCachedNotice } from '../utils/appError';

const HOME_EVENTS_CACHE_KEY = 'home:events';
const HOME_BANNERS_CACHE_KEY = 'home:banners';
const HOME_NOTIFICATIONS_CLEARED_AT_KEY = 'home:notifications:clearedAt';

const cacheHomeEvents = async (events) => {
  try {
    await cacheService.set(HOME_EVENTS_CACHE_KEY, events, { ttlMs: TTL.ONE_DAY });
  } catch (e) {
    logger.error('Failed to cache home events:', e);
  }
};

const loadHomeEventsFromCache = async () => {
  try {
    const { data } = await cacheService.get(HOME_EVENTS_CACHE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    logger.error('Failed to load cached home events:', e);
    return [];
  }
};

const cacheHomeBanners = async (banners) => {
  try {
    await cacheService.set(HOME_BANNERS_CACHE_KEY, banners, { ttlMs: TTL.ONE_DAY });
  } catch (e) {
    logger.error('Failed to cache home banners:', e);
  }
};

const loadHomeBannersFromCache = async () => {
  try {
    const { data } = await cacheService.get(HOME_BANNERS_CACHE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    logger.error('Failed to load cached home banners:', e);
    return [];
  }
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const { isFavorite, toggleFavorite } = useFavorites();
  const { mode, setThemeMode, isDark } = useTheme();

  const [processedEvents, setProcessedEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const [showRecentEventsModal, setShowRecentEventsModal] = useState(false);
  const [recentEventsAnchor, setRecentEventsAnchor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoadingRef = useRef(false);
  const lastRefreshTime = useRef(Date.now());
  const loadingBellAnchorRef = useRef(null);
  const bellAnchorRef = useRef(null);

  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [broadcastNotifications, setBroadcastNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsClearedAt, setNotificationsClearedAt] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationDetailModal, setShowNotificationDetailModal] = useState(false);
  const [nextEvent, setNextEvent] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [promotionEvents, setPromotionEvents] = useState([]);

  const promotionShineAnim = useRef(new Animated.Value(0)).current;
  const cardGlowAnim = useRef(new Animated.Value(0)).current;
  const countdownRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(promotionShineAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(promotionShineAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );

    shineLoop.start();

    return () => {
      shineLoop.stop();
    };
  }, [promotionShineAnim]);

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlowAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(cardGlowAnim, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, [cardGlowAnim]);

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(countdownRotateAnim, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotateLoop.start();

    return () => {
      rotateLoop.stop();
    };
  }, [countdownRotateAnim]);

  const curatedChips = [
    { key: 'popular_venues', icon: 'map-pin', label: 'Popular Venues' },
    { key: 'city_spotlight', icon: 'map', label: 'City Spotlight' },
    { key: 'sports_types', icon: 'activity', label: 'Sports Types' },
    { key: 'workshops', icon: 'tool', label: 'Workshops' },
    { key: 'music_genres', icon: 'music', label: 'Music Genres' },
    { key: 'organizer_spotlight', icon: 'users', label: 'Organizer Spotlight' },
    { key: 'weekly_editorial', icon: 'book-open', label: 'Weekly Editorial' },
  ];

  const popularOrganizers = useMemo(() => {
    const map = new Map();

    for (const event of processedEvents) {
      const organizerName = (event?.organizerName || '').trim();
      const organizerKeyRaw = event?.organizerId?._id || event?.organizerId?.id || event?.organizerId || organizerName;
      const organizerKey = organizerKeyRaw ? String(organizerKeyRaw) : '';
      if (!organizerKey || !organizerName) continue;

      const existing = map.get(organizerKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(organizerKey, { id: organizerKey, name: organizerName, count: 1 });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name))
      .slice(0, 10);
  }, [processedEvents]);

  const filteredEvents = searchQuery.trim()
    ? processedEvents.filter(event =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : processedEvents;

  const recentEventsForModal = [...processedEvents]
    .filter(e => e?.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

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
    (async () => {
      try {
        const { data } = await cacheService.get(HOME_NOTIFICATIONS_CLEARED_AT_KEY);
        const clearedAt = typeof data === 'number' ? data : 0;
        if (clearedAt) {
          setNotificationsClearedAt(clearedAt);
        }
        refreshNotifications({ background: true, clearedAtOverride: clearedAt });
      } catch (e) {
        refreshNotifications({ background: true });
      }
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshNotifications({ background: true });
    }, [])
  );

  // Find next upcoming event
  useEffect(() => {
    if (processedEvents.length === 0) return;

    const now = new Date();
    const upcoming = processedEvents
      .filter(event => {
        if (!event.date) return false;
        const eventDateTime = new Date(event.date);
        const isValid = !isNaN(eventDateTime.getTime());
        const isFuture = eventDateTime > now;
        return isValid && isFuture;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      })[0];

    setNextEvent(upcoming);
  }, [processedEvents]);

  // Countdown timer for next event
  useEffect(() => {
    if (!nextEvent) return;

    const updateCountdown = () => {
      const now = new Date();
      const eventTime = new Date(nextEvent.date);
      const diff = eventTime - now;

      if (diff <= 0) {
        setCountdown('Event Started!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextEvent]);

  const refreshNotifications = async ({ background = false, clearedAtOverride } = {}) => {
    try {
      if (!background) {
        setIsNotificationsLoading(true);
      }

      const [countRes, listRes] = await Promise.all([
        apiService.getUnreadNotificationsCount(),
        apiService.getBroadcastNotifications(30),
      ]);

      const nextUnread = countRes?.data?.unreadCount;
      if (typeof nextUnread === 'number') {
        setUnreadCount(nextUnread);
      }

      const nextList = Array.isArray(listRes?.data) ? listRes.data : [];
      const effectiveClearedAt = typeof clearedAtOverride === 'number' ? clearedAtOverride : notificationsClearedAt;
      // UI behavior: only show unread notifications in the bell popover.
      // ("Clear All" marks everything as read; this prevents read items from reappearing on next refresh.)
      setBroadcastNotifications(
        nextList
          .filter((n) => !n?.isRead)
          .filter((n) => {
            if (!effectiveClearedAt) return true;
            const createdAtMs = new Date(n?.createdAt).getTime();
            if (Number.isNaN(createdAtMs)) return true;
            return createdAtMs > effectiveClearedAt;
          })
          .slice(0, 5)
      );
    } catch (e) {
      // Silent fail: notifications are non-blocking
    } finally {
      if (!background) {
        setIsNotificationsLoading(false);
      }
    }
  };

  const handleBellPress = () => {
    refreshNotifications({ background: true });
    const anchorRef = hasInitialLoad ? bellAnchorRef : loadingBellAnchorRef;
    const anchorNode = anchorRef?.current;

    if (anchorNode && typeof anchorNode.measureInWindow === 'function') {
      anchorNode.measureInWindow((x, y, width, height) => {
        setRecentEventsAnchor({ x, y, width, height });
        setShowRecentEventsModal(true);
      });
      return;
    }

    setRecentEventsAnchor(null);
    setShowRecentEventsModal(true);
  };

  const handleCloseRecentEventsModal = () => {
    setShowRecentEventsModal(false);
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (!notification?.id) return;
      setSelectedNotification(notification);
      setShowNotificationDetailModal(true);

      if (notification.isRead) return;

      await apiService.markNotificationRead(notification.id);

      // Keep the popover list to unread-only items (max 5) for clean UX.
      // Remove the notification immediately once it is marked read.
      setBroadcastNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // Silent fail
    }
  };

  const handleCloseNotificationDetailModal = () => {
    setShowNotificationDetailModal(false);
    setSelectedNotification(null);
  };

  const handleClearNotifications = async () => {
    try {
      if (broadcastNotifications.length === 0) return;
      const clearedAt = Date.now();
      setNotificationsClearedAt(clearedAt);
      setBroadcastNotifications([]);
      setUnreadCount(0);
      await cacheService.set(HOME_NOTIFICATIONS_CLEARED_AT_KEY, clearedAt);

      try {
        await apiService.markAllNotificationsRead();
      } catch (_) {
        // Silent fail
      }
    } catch (e) {
      // Silent fail
    }
  };

  const loadEventsFromBackend = async ({ isRefresh = false, background = false } = {}) => {
    try {
      isLoadingRef.current = true;
      // Show loading indicator for initial load or manual refresh
      if (!background || isRefresh) {
        setIsLoading(true);
      }

      // Only clear errors for user-initiated actions
      if (!background) {
        setError(null);
      }

      // Prefill from cache for instant UI
      const cachedEventsPrefill = await loadHomeEventsFromCache();
      if (cachedEventsPrefill.length > 0) {
        setProcessedEvents(cachedEventsPrefill);
        setFeaturedEvents(cachedEventsPrefill.filter(e => e.featured).slice(0, 10));

        const featuredIdsPrefill = new Set(cachedEventsPrefill.filter(e => e.featured).map(e => e.id));
        const nowRecommendedPrefill = new Date();
        const recommendedPrefill = cachedEventsPrefill
          .filter(e => !featuredIdsPrefill.has(e.id) || e.featured)
          .filter(e => e.date && new Date(e.date) >= nowRecommendedPrefill)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .reduce((acc, event) => {
            const cat = event.category || 'general';
            if (!acc[cat]) acc[cat] = [];
            if (acc[cat].length < 2) acc[cat].push(event);
            return acc;
          }, {});
        setRecommendedEvents([...Object.values(recommendedPrefill).flat()].slice(0, 7));

        const nowPrefill = new Date();
        const upcomingPrefill = cachedEventsPrefill
          .filter(event => new Date(event.date) >= nowPrefill)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingEvents(upcomingPrefill.slice(0, 5));

        // Set trending events to ALL upcoming events
        setTrendingEvents(upcomingPrefill.slice(0, 10));

        // Set promotion events (featured events for promotion)
        setPromotionEvents(cachedEventsPrefill.filter(e => e.featured).slice(0, 3));
      }

      // Check network status first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        if (!background) {
          if (cachedEventsPrefill.length > 0) {
            setError(createOfflineCachedNotice('Showing cached events if available'));
          } else {
            setError(toAppError(new Error('You appear to be offline')));
          }
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
              // Pricing fields
              price: event.price || 0,
              vipPrice: event.vipPrice || null,
              vvipPrice: event.vvipPrice || null,
              earlyBirdPrice: event.earlyBirdPrice || null,
              onDoorPrice: event.onDoorPrice || null,
              ticketsAvailableAt: event.ticketsAvailableAt || null,
              currency: event.currency || 'ETB',
              // Event details
              category: event.category,
              featured: event.featured || false,
              capacity: event.capacity || null,
              imageUrl: event.imageUrl || event.image || null,
              // Organizer info
              organizerName: event.organizerName || event.organizer || '',
              organizerId: event.organizerId || null,
              // Additional info
              importantInfo: event.importantInfo || '',
              // Status and mode
              status: event.status || 'published',
              mode: event.mode || 'In-person',
              requiresRegistration: event.requiresRegistration || false,
              isOnline: event.isOnline || false,
            }));

          setProcessedEvents(transformedEvents);
          setFeaturedEvents(transformedEvents.filter(e => e.featured).slice(0, 10));

          const featuredIds = new Set(transformedEvents.filter(e => e.featured).map(e => e.id));
          const nowRecommended = new Date();
          const recommended = transformedEvents
            .filter(e => !featuredIds.has(e.id) || e.featured)
            .filter(e => e.date && new Date(e.date) >= nowRecommended)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .reduce((acc, event) => {
              const cat = event.category || 'general';
              if (!acc[cat]) acc[cat] = [];
              if (acc[cat].length < 2) acc[cat].push(event);
              return acc;
            }, {});
          setRecommendedEvents([...Object.values(recommended).flat()].slice(0, 7));

          const now = new Date();
          const upcoming = transformedEvents
            .filter(event => new Date(event.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingEvents(upcoming.slice(0, 5));

          // Set trending events to ALL upcoming events
          setTrendingEvents(upcoming.slice(0, 10));

          // Set promotion events (featured events for promotion)
          setPromotionEvents(transformedEvents.filter(e => e.featured).slice(0, 3));

          await cacheHomeEvents(transformedEvents);
          setError(null);
        }
      } catch (apiError) {
        logger.error('API Error:', apiError);

        if (!background) {
          setError(toAppError(apiError, { fallbackMessage: 'Failed to load events' }));

          if (cachedEventsPrefill.length === 0) {
            setProcessedEvents([]);
            setFeaturedEvents([]);
            setRecommendedEvents([]);
            setUpcomingEvents([]);
          }
        }
      }
    } catch (error) {
      logger.error('Unexpected error in loadEventsFromBackend:', error);
      if (!background) {
        setError(toAppError(error, { fallbackMessage: 'An unexpected error occurred' }));
      }
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
    } catch (error) {
      logger.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEventPress = (event) => {
    const standardizedEvent = standardizeEventForDetails(event);
    navigation.navigate('EventDetails', { event: standardizedEvent });
  };

  const formatDateTimeShort = (dateString, timeString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = timeString || '2:00 PM';
    return `${dateStr} • ${timeStr}`;
  };

  const getEventLocationLabel = (location) => {
    if (!location) return 'Location TBA';
    if (typeof location === 'string') return location;
    return location?.venue || location?.name || location?.address || location?.formattedAddress || location?.city || 'Location TBA';
  };

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const popoverWidth = Math.min(280, Math.max(240, screenWidth - 40));
  const popoverMaxHeight = Math.min(600, Math.max(240, screenHeight * 0.65));
  const popoverMargin = 12;

  const popoverLeft = (() => {
    if (!recentEventsAnchor) return (screenWidth - popoverWidth) / 2;
    const preferredLeft = recentEventsAnchor.x + recentEventsAnchor.width - popoverWidth;
    return Math.max(popoverMargin, Math.min(preferredLeft, screenWidth - popoverWidth - popoverMargin));
  })();

  const popoverTop = (() => {
    if (!recentEventsAnchor) return 110;
    const preferredTop = recentEventsAnchor.y + recentEventsAnchor.height + 10;
    return Math.max(popoverMargin, Math.min(preferredTop, screenHeight - popoverMaxHeight - popoverMargin));
  })();

  const arrowLeft = (() => {
    if (!recentEventsAnchor) return popoverWidth - 40;
    const bellCenterX = recentEventsAnchor.x + recentEventsAnchor.width / 2;
    const raw = bellCenterX - popoverLeft - 7;
    return Math.max(18, Math.min(raw, popoverWidth - 32));
  })();

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Background Decoratives */}
      <View style={homeStyles.backgroundDecorative} />
      <View style={homeStyles.backgroundOrbOne} />
      <View style={homeStyles.backgroundOrbTwo} />
      <View style={homeStyles.backgroundOrbThree} />
      <View style={homeStyles.backgroundPatternOne} />
      <View style={homeStyles.backgroundPatternTwo} />

      <Modal
        visible={showNotificationDetailModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseNotificationDetailModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCloseNotificationDetailModal}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            justifyContent: 'center',
            paddingHorizontal: 18,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              overflow: 'hidden',
              maxHeight: '80%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 24,
              elevation: 14,
            }}
          >
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="mail" size={16} color="#FFFFFF" />
              </View>
              <View style={{ width: 12 }} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', flex: 1 }} numberOfLines={1}>
                Eventopia Admin
              </Text>
              <TouchableOpacity
                onPress={handleCloseNotificationDetailModal}
                style={{ padding: 6 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={{ paddingHorizontal: 18, paddingVertical: 18 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={{ color: '#1F2937', fontSize: 15, lineHeight: 24, fontWeight: '500' }}>
                {selectedNotification?.message || ''}
              </Text>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showRecentEventsModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseRecentEventsModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCloseRecentEventsModal}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.42)',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              position: 'absolute',
              top: popoverTop,
              left: popoverLeft,
              width: popoverWidth,
              maxHeight: popoverMaxHeight,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              shadowColor: '#0277BD',
              shadowOpacity: 0.28,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 16,
              transform: [{ scale: showRecentEventsModal ? 1 : 0.9 }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -8,
                left: arrowLeft,
                width: 16,
                height: 16,
                backgroundColor: '#FFFFFF',
                transform: [{ rotate: '45deg' }],
                shadowColor: '#0277BD',
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            />

            <LinearGradient
              colors={['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="bell" size={14} color="#FFFFFF" />
              </View>
              <View style={{ width: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
                Notifications
              </Text>
              <TouchableOpacity
                onPress={handleCloseRecentEventsModal}
                style={{ marginLeft: 'auto', padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={{ paddingHorizontal: 12, paddingBottom: 12, flex: 1 }}>
              <View style={{ height: 8 }} />

              <View style={{ flex: 1 }}>
                {isNotificationsLoading ? (
                  <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 8 }}>
                    <ActivityIndicator size="small" color="#0277BD" />
                  </View>
                ) : broadcastNotifications.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 24 }}>
                    <Feather name="bell" size={32} color="#CBD5E1" />
                    <Text style={{ color: '#64748B', marginTop: 8, fontSize: 13 }}>No notifications yet.</Text>
                  </View>
                ) : (
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {broadcastNotifications.map((n) => (
                      <TouchableOpacity
                        key={n.id}
                        onPress={() => handleNotificationPress(n)}
                        activeOpacity={0.84}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 10,
                          borderRadius: 12,
                          backgroundColor: n.isRead ? '#F8FAFC' : '#EFF6FF',
                          marginBottom: 6,
                          borderWidth: 1,
                          borderColor: n.isRead ? '#E2E8F0' : '#BFDBFE',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: n.isRead ? '#E2E8F0' : '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="volume-2" size={12} color={n.isRead ? '#475569' : '#FFFFFF'} />
                          </View>
                          <View style={{ width: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                              {n.title || 'Announcement'}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }} numberOfLines={2}>
                              {n.message}
                            </Text>
                          </View>
                          {!n.isRead && (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {broadcastNotifications.length > 0 && (
                <View style={{ paddingTop: 10, alignItems: 'flex-end' }}>
                  <LinearGradient
                    colors={['#0277BD', '#01579B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                    }}
                  >
                    <TouchableOpacity onPress={handleClearNotifications} activeOpacity={0.8}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Clear All</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <SafeScrollView
        style={{ flex: 1, backgroundColor: '#f4f3f8ff' }}
        contentContainerStyle={{ paddingTop: insets.top, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={{ flex: 1 }}>
          {/* Background Decorative Elements */}
          <View style={homeStyles.backgroundDecorative}>
            <View style={homeStyles.backgroundOrbOne} />
            <View style={homeStyles.backgroundOrbFour} />
            <View style={homeStyles.backgroundOrbSix} />
            <View style={homeStyles.backgroundOrbEight} />
            <View style={homeStyles.backgroundOrbNine} />
            <View style={homeStyles.backgroundOrbEleven} />
            <View style={homeStyles.backgroundOrbTwelve} />
            <View style={homeStyles.creativeBlobBlue} />
            <View style={homeStyles.creativeBlobGreen} />
            <View style={homeStyles.creativeBlobYellow} />
          </View>
          
          <AppErrorBanner
            error={error}
            onRetry={handleRetry}
            disabled={isLoadingRef.current}
          />

          {!hasInitialLoad && isLoading && processedEvents.length === 0 && (
            <View style={{ paddingTop: 18, paddingBottom: 18 }}>
              {/* Event Cards Skeleton */}
              <View style={homeStyles.trendingEventsContainer}>
                <View style={homeStyles.trendingEventsHeader}>
                  <View style={homeStyles.trendingTitleContainer}>
                    <View style={[homeStyles.skeleton, { width: 120, height: 20, borderRadius: 10 }]} />
                    <View style={[homeStyles.skeleton, { width: 60, height: 16, borderRadius: 8, marginLeft: 12 }]} />
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[1, 2, 3].map((index) => (
                    <View key={index} style={[homeStyles.trendingEventCard, { marginLeft: index === 0 ? 0 : 12 }]}>
                      <View style={[homeStyles.skeleton, { width: '100%', height: 120, borderRadius: 8 }]} />
                      <View style={homeStyles.trendingEventContent}>
                        <View style={[homeStyles.skeleton, { width: '80%', height: 16, borderRadius: 4, marginBottom: 8 }]} />
                        <View style={homeStyles.trendingEventMeta}>
                          <View style={[homeStyles.skeleton, { width: 60, height: 12, borderRadius: 4 }]} />
                          <View style={[homeStyles.skeleton, { width: 40, height: 12, borderRadius: 4, marginLeft: 8 }]} />
                        </View>
                        <View style={homeStyles.trendingEventFooter}>
                          <View style={[homeStyles.skeleton, { width: 100, height: 12, borderRadius: 4 }]} />
                          <View style={[homeStyles.skeleton, { width: 50, height: 20, borderRadius: 10, marginLeft: 'auto' }]} />
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Featured Events Skeleton */}
              <View style={homeStyles.featuredEventsSection}>
                <View style={homeStyles.featuredEventsHeader}>
                  <View style={homeStyles.trendingTitleContainer}>
                    <View style={[homeStyles.skeleton, { width: 140, height: 20, borderRadius: 10 }]} />
                    <View style={[homeStyles.skeleton, { width: 60, height: 16, borderRadius: 8, marginLeft: 12 }]} />
                  </View>
                </View>
                <View style={homeStyles.premiumFeaturedContainer}>
                  {[1, 2].map((index) => (
                    <View key={index} style={[homeStyles.premiumFeaturedCard, { marginLeft: index === 0 ? 0 : 12 }]}>
                      <View style={[homeStyles.skeleton, { width: '100%', height: 140, borderRadius: 12 }]} />
                      <View style={homeStyles.premiumFeaturedContent}>
                        <View style={[homeStyles.skeleton, { width: '70%', height: 16, borderRadius: 4, marginBottom: 8 }]} />
                        <View style={[homeStyles.skeleton, { width: '50%', height: 12, borderRadius: 4, marginBottom: 8 }]} />
                        <View style={homeStyles.premiumFeaturedMeta}>
                          <View style={[homeStyles.skeleton, { width: 80, height: 12, borderRadius: 4 }]} />
                          <View style={[homeStyles.skeleton, { width: 60, height: 12, borderRadius: 4, marginLeft: 8 }]} />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Upcoming Events Skeleton */}
              <View style={homeStyles.upcomingEventsSection}>
                <View style={homeStyles.upcomingEventsHeader}>
                  <View style={homeStyles.trendingTitleContainer}>
                    <View style={[homeStyles.skeleton, { width: 130, height: 20, borderRadius: 10 }]} />
                    <View style={[homeStyles.skeleton, { width: 60, height: 16, borderRadius: 8, marginLeft: 12 }]} />
                  </View>
                </View>
                <View style={homeStyles.horizontalEventsContainer}>
                  {[1, 2, 3].map((index) => (
                    <View key={index} style={[homeStyles.horizontalEventCard, { marginLeft: index === 0 ? 0 : 12 }]}>
                      <View style={[homeStyles.skeleton, { width: 120, height: 80, borderRadius: 8 }]} />
                      <View style={homeStyles.horizontalEventDetailsContainer}>
                        <View style={homeStyles.horizontalEventTopSection}>
                          <View style={[homeStyles.skeleton, { width: '90%', height: 14, borderRadius: 4, marginBottom: 8 }]} />
                          <View style={homeStyles.horizontalEventMetaRow}>
                            <View style={[homeStyles.skeleton, { width: 60, height: 10, borderRadius: 4 }]} />
                          </View>
                          <View style={homeStyles.horizontalEventMetaRow}>
                            <View style={[homeStyles.skeleton, { width: 50, height: 10, borderRadius: 4 }]} />
                          </View>
                        </View>
                        <View style={homeStyles.horizontalEventBottomRow}>
                          <View style={[homeStyles.skeleton, { width: 40, height: 14, borderRadius: 4 }]} />
                          <View style={[homeStyles.skeleton, { width: 80, height: 24, borderRadius: 12, marginLeft: 'auto' }]} />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          
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
              <View style={homeStyles.homeHeaderTopRow}>
                <View style={homeStyles.modernDashboardProfile}>
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
                  <View ref={bellAnchorRef} collapsable={false}>
                    <SafeTouchableOpacity
                      style={homeStyles.homeHeaderIconButton}
                      onPress={handleBellPress}
                    >
                      <Feather
                        name="bell"
                        size={20}
                        color={'rgba(255, 255, 255, 1)'}
                      />
                      {unreadCount > 0 && (
                        <View style={homeStyles.notificationBadge}>
                          <Text style={homeStyles.notificationBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Text>
                        </View>
                      )}
                    </SafeTouchableOpacity>
                  </View>
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

          <View style={homeStyles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={homeStyles.categoriesContent}
            >
              {curatedChips.map((category) => (
                <SafeTouchableOpacity
                  key={category.key}
                  style={[
                    homeStyles.categoryChip,
                  ]}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <View style={homeStyles.categoryDepthLayer} pointerEvents="none">
                    <View style={homeStyles.categoryGlowOrbOne} />
                    <View style={homeStyles.categoryGlowOrbTwo} />
                    <View style={homeStyles.categoryHighlight} />
                  </View>
                  <Feather
                    name={category.icon}
                    size={10}
                    color={'rgba(255, 255, 255, 0.8)'}
                    style={{ zIndex: 1 }}
                  />
                  <Text
                    style={[
                      homeStyles.categoryChipText,
                    ]}
                  >
                    {category.label}
                  </Text>
                </SafeTouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {trendingEvents.length > 0 && (
            <View style={homeStyles.trendingEventsSection}>
              <View style={homeStyles.trendingEventsHeader}>
                <View style={homeStyles.trendingTitleContainer}>
                  <Feather name="trending-up" size={20} color="#000000" />
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
                      <View style={homeStyles.trendingEventCardOrbOne} />
                      <View style={homeStyles.trendingEventCardOrbTwo} />
                      <View style={homeStyles.trendingEventCardOrbThree} />
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
                        <Animated.View
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            top: -90,
                            left: -160,
                            width: 180,
                            height: 420,
                            opacity: 0.50,
                            transform: [
                              {
                                translateX: promotionShineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [-200, 380],
                                }),
                              },
                              {
                                translateY: promotionShineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [160, -160],
                                }),
                              },
                              { rotate: '22deg' },
                            ],
                          }}
                        >
                          <LinearGradient
                            colors={[
                              'rgba(255,255,255,0)',
                              'rgba(255,255,255,0.32)',
                              'rgba(255,255,255,0)',
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </Animated.View>

                        <Animated.View
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            top: -50,
                            right: -60,
                            width: 160,
                            height: 160,
                            borderRadius: 80,
                            backgroundColor: 'rgba(255,255,255,0.14)',
                            opacity: cardGlowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.10, 0.20],
                            }),
                            transform: [
                              {
                                scale: cardGlowAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.08],
                                }),
                              },
                            ],
                          }}
                        />

                        <Animated.View
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            bottom: -60,
                            left: -70,
                            width: 180,
                            height: 180,
                            borderRadius: 90,
                            backgroundColor: 'rgba(2,119,189,0.12)',
                            opacity: cardGlowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.08, 0.16],
                            }),
                            transform: [
                              {
                                scale: cardGlowAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.06],
                                }),
                              },
                            ],
                          }}
                        />
                      </View>

                      {/* Featured Badge for Trending Events */}
                      {event.featured && (
                        <View style={homeStyles.premiumFeaturedBadgeLeft}>
                          <LinearGradient
                            colors={['#0277BD', '#01579B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={homeStyles.premiumBadgeGradient}
                          >
                            <Feather name="star" size={10} color="#FFFFFF" />
                            <Text style={homeStyles.premiumBadgeText}>FEATURED</Text>
                          </LinearGradient>
                        </View>
                      )}

                      <View style={homeStyles.trendingEventContent}>
                        <View style={homeStyles.trendingEventHeader}>
                          <Text style={homeStyles.trendingEventTitle} numberOfLines={2}>
                            {event.title}
                          </Text>
                        </View>

                        <View style={homeStyles.trendingEventMeta}>
                          <View style={homeStyles.trendingMetaItem}>
                            <Feather name="calendar" size={12} color="rgba(255, 255, 255, 0.8)" />
                            <Text style={homeStyles.trendingMetaText}>
                              {new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                          </View>
                          <View style={homeStyles.trendingMetaItem}>
                            <Feather name="clock" size={12} color="rgba(255, 255, 255, 0.8)" />
                            <Text style={homeStyles.trendingMetaText}>{event.time || 'TBD'}</Text>
                          </View>
                        </View>

                        <View style={homeStyles.trendingEventFooter}>
                          <View style={homeStyles.trendingLocationItem}>
                            <Feather name="map-pin" size={12} color="rgba(255, 255, 255, 0.8)" />
                            <Text style={homeStyles.trendingLocationText} numberOfLines={1}>
                              {getEventLocationLabel(event.location)}
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
          
          {trendingEvents.length === 0 && !isLoading && hasInitialLoad && (
            <EmptyState
              icon="calendar"
              iconSize={64}
              title="No Events Yet"
              description={
                searchQuery.trim()
                  ? `No events found for "${searchQuery}"`
                  : "Be the first to create amazing events in your area!"
              }
              primaryAction={searchQuery.trim() ? () => setSearchQuery('') : () => navigation.navigate('Events')}
              primaryActionText={searchQuery.trim() ? 'Clear Search' : 'Explore Events'}
              primaryActionIcon={searchQuery.trim() ? 'x' : 'compass'}
              secondaryAction={() => navigation.navigate('OrganizerDashboard')}
              secondaryActionText="Create Event"
              secondaryActionIcon="plus"
              gradientColors={['#0277BD', '#01579B']}
            />
          )}

          <View style={homeStyles.featuredEventsSection}>
            <View style={homeStyles.featuredEventsHeader}>
              <View style={homeStyles.trendingTitleContainer}>
                <Feather name="star" size={20} color="#000000" />
                <Text style={homeStyles.featuredEventsTitle}>Featured Events</Text>
              </View>
              <SafeTouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={homeStyles.seeAllLink}>See All</Text>
              </SafeTouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={homeStyles.recommendedEventsScrollContainer}
            >
              {featuredEvents.map((event) => (
                <SafeTouchableOpacity
                  key={event.id}
                  style={homeStyles.recommendedEventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.92}
                >
                  {event.imageUrl ? (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={homeStyles.recommendedEventImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#0277BD', '#01579B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={homeStyles.recommendedEventImage}
                    />
                  )}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: -60,
                      left: -100,
                      width: 200,
                      height: 560,
                      opacity: 0.55,
                      transform: [
                        {
                          translateX: promotionShineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-200, 400],
                          }),
                        },
                        {
                          translateY: promotionShineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [180, -180],
                          }),
                        },
                        { rotate: '25deg' },
                      ],
                    }}
                  >
                    <LinearGradient
                      colors={[
                        'rgba(255,255,255,0)',
                        'rgba(255,255,255,0.35)',
                        'rgba(255,255,255,0)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Animated.View>

                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: -40,
                      right: -50,
                      width: 180,
                      height: 180,
                      borderRadius: 90,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      opacity: cardGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.12, 0.25],
                      }),
                      transform: [
                        {
                          scale: cardGlowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.12],
                          }),
                        },
                      ],
                    }}
                  />

                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      bottom: -50,
                      left: -60,
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                      backgroundColor: 'rgba(2,119,189,0.16)',
                      opacity: cardGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.10, 0.20],
                      }),
                      transform: [
                        {
                          scale: cardGlowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.10],
                          }),
                        },
                      ],
                    }}
                  />

                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={homeStyles.recommendedEventOverlay}
                  >
                    <View style={homeStyles.recommendedEventOverlayContent}>
                      <Text style={homeStyles.recommendedEventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={homeStyles.recommendedEventMetaRow}>
                        <Feather name="calendar" size={12} color="rgba(255,255,255,0.92)" />
                        <Text style={homeStyles.recommendedEventMetaText}>
                          {formatDateTimeShort(event.date, event.time)}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </SafeTouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {recommendedEvents.length > 0 && (
            <View style={homeStyles.recommendedEventsSection}>
              <View style={homeStyles.featuredEventsHeader}>
                <View style={homeStyles.trendingTitleContainer}>
                  <Feather name="thumbs-up" size={20} color="#000000" />
                  <Text style={homeStyles.featuredEventsTitle}>Recommended Events</Text>
                </View>
              </View>

              <View style={homeStyles.premiumFeaturedContainer}>
                {recommendedEvents.map((event, index) => (
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
                            {getEventLocationLabel(event.location)}
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
          )}

          {nextEvent && (
            <View style={homeStyles.countdownInlineContainer}>
              <SafeTouchableOpacity
                onPress={() => handleEventPress(nextEvent)}
                activeOpacity={0.85}
                style={{ position: 'relative' }}
              >
                <View style={homeStyles.countdownInlineDepthLayer} pointerEvents="none">
                  <View style={homeStyles.countdownInlineGlowOrbOne} />
                  <View style={homeStyles.countdownInlineGlowOrbTwo} />
                  <View style={homeStyles.countdownInlineHighlight} />
                </View>
                <View style={homeStyles.countdownInlineContent}>
                  <View style={homeStyles.countdownInlineLeft}>
                    <Animated.View
                      style={[
                        homeStyles.countdownEventImageWrapper,
                        {
                          transform: [
                            {
                              rotate: countdownRotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {nextEvent.imageUrl ? (
                        <Image
                          source={{ uri: nextEvent.imageUrl }}
                          style={homeStyles.countdownEventImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={['#0277BD', '#01579B']}
                          style={homeStyles.countdownEventImage}
                        >
                          <Feather name="calendar" size={24} color="#FFFFFF" />
                        </LinearGradient>
                      )}
                    </Animated.View>

                    <View style={homeStyles.countdownInlineTextWrap}>
                      <Text style={homeStyles.countdownLabel}>Next Event</Text>
                      <Text style={homeStyles.countdownEventTitle} numberOfLines={1}>
                        {nextEvent.title}
                      </Text>
                    </View>
                  </View>
                  <View style={homeStyles.countdownInlineTimerPill}>
                    <Text style={homeStyles.countdownTimer}>{countdown}</Text>
                  </View>
                </View>
              </SafeTouchableOpacity>

              {promotionEvents.length > 0 && (
                <View style={homeStyles.promotionSection}>
                  <View style={homeStyles.promotionLayout}>
                    {promotionEvents[0] && (
                      <SafeTouchableOpacity
                        style={homeStyles.promotionVerticalCard}
                        onPress={() => handleEventPress(promotionEvents[0])}
                        activeOpacity={0.9}
                      >
                        <View style={homeStyles.promotionVerticalImageContainer}>
                          {promotionEvents[0].imageUrl ? (
                            <Image
                              source={{ uri: promotionEvents[0].imageUrl }}
                              style={homeStyles.promotionVerticalImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <LinearGradient
                              colors={['#0277BD', '#01579B']}
                              style={homeStyles.promotionVerticalImage}
                            >
                              <Feather name="image" size={32} color="rgba(255,255,255,0.7)" />
                            </LinearGradient>
                          )}

                          <Animated.View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              top: -80,
                              left: -140,
                              width: 180,
                              height: 520,
                              opacity: 0.45,
                              transform: [
                                {
                                  translateX: promotionShineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-180, 360],
                                  }),
                                },
                                {
                                  translateY: promotionShineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [140, -140],
                                  }),
                                },
                                { rotate: '20deg' },
                              ],
                            }}
                          >
                            <LinearGradient
                              colors={[
                                'rgba(255,255,255,0)',
                                'rgba(255,255,255,0.30)',
                                'rgba(255,255,255,0)',
                              ]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{ width: '100%', height: '100%' }}
                            />
                          </Animated.View>

                          <LinearGradient
                            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={homeStyles.recommendedEventOverlay}
                          >
                            <View style={homeStyles.recommendedEventOverlayContent}>
                              <Text style={homeStyles.promotionOverlayTitle} numberOfLines={2}>
                                {promotionEvents[0].title}
                              </Text>
                              <View style={homeStyles.recommendedEventMetaRow}>
                                <Feather name="calendar" size={10} color="rgba(255,255,255,0.92)" />
                                <Text style={homeStyles.promotionOverlayMetaText}>
                                  {formatDateTimeShort(promotionEvents[0].date, promotionEvents[0].time)}
                                </Text>
                              </View>
                            </View>
                          </LinearGradient>
                        </View>
                      </SafeTouchableOpacity>
                    )}

                    <View style={homeStyles.promotionHorizontalContainer}>
                      {promotionEvents.slice(1, 3).map((event, index) => (
                        <SafeTouchableOpacity
                          key={event.id}
                          style={homeStyles.promotionHorizontalCard}
                          onPress={() => handleEventPress(event)}
                          activeOpacity={0.9}
                        >
                          <View style={homeStyles.promotionHorizontalImageContainer}>
                            {event.imageUrl ? (
                              <Image
                                source={{ uri: event.imageUrl }}
                                style={homeStyles.promotionHorizontalImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <LinearGradient
                                colors={index % 2 === 0 ? ['#8B5CF6', '#7C3AED'] : ['#059669', '#047857']}
                                style={homeStyles.promotionHorizontalImage}
                              >
                                <Feather name="image" size={20} color="rgba(255,255,255,0.7)" />
                              </LinearGradient>
                            )}

                            <Animated.View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                top: -90,
                                left: -160,
                                width: 180,
                                height: 420,
                                opacity: 0.45,
                                transform: [
                                  {
                                    translateX: promotionShineAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [-180, 340],
                                    }),
                                  },
                                  {
                                    translateY: promotionShineAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [120, -120],
                                    }),
                                  },
                                  { rotate: '20deg' },
                                ],
                              }}
                            >
                              <LinearGradient
                                colors={[
                                  'rgba(255,255,255,0)',
                                  'rgba(255,255,255,0.30)',
                                  'rgba(255,255,255,0)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </Animated.View>

                            <LinearGradient
                              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={homeStyles.recommendedEventOverlay}
                            >
                              <View style={homeStyles.recommendedEventOverlayContent}>
                                <Text style={homeStyles.promotionOverlayTitle} numberOfLines={2}>
                                  {event.title}
                                </Text>
                                <View style={homeStyles.recommendedEventMetaRow}>
                                  <Feather name="calendar" size={10} color="rgba(255,255,255,0.92)" />
                                  <Text style={homeStyles.promotionOverlayMetaText}>
                                    {formatDateTimeShort(event.date, event.time)}
                                  </Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </View>
                        </SafeTouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={homeStyles.featuredEventsSection}>
            <View style={homeStyles.featuredEventsHeader}>
              <View style={homeStyles.trendingTitleContainer}>
                <Feather name="calendar" size={20} color="#000000" />
                <Text style={homeStyles.featuredEventsTitle}>Upcoming Events</Text>
              </View>
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
                          {getEventLocationLabel(event.location)}
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

          {popularOrganizers.length > 0 && (
            <View style={homeStyles.popularOrganizersSection}>
              <View style={homeStyles.featuredEventsHeader}>
                <View style={homeStyles.trendingTitleContainer}>
                  <Feather name="users" size={20} color="#000000" />
                  <Text style={homeStyles.featuredEventsTitle}>Popular Organizers</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={homeStyles.popularOrganizersScrollContainer}
              >
                {popularOrganizers.map((organizer, index) => (
                  <SafeTouchableOpacity
                    key={`${organizer.id}:${index}`}
                    style={homeStyles.popularOrganizerCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('Organprofilescreenforusers', {
                        organizerId: organizer.id,
                        organizerName: organizer.name,
                      })
                    }
                  >
                    {organizer.imageUrl ? (
                      <Image
                        source={{ uri: organizer.imageUrl }}
                        style={homeStyles.popularOrganizerAvatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#0277BD', '#01579B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={homeStyles.popularOrganizerAvatar}
                      >
                        <Feather name="user" size={18} color="#FFFFFF" />
                      </LinearGradient>
                    )}

                    <Text style={homeStyles.popularOrganizerName} numberOfLines={1}>
                      {organizer.name}
                    </Text>
                    <View style={homeStyles.popularOrganizerRatingRow}>
                      <Feather name="star" size={12} color="#F59E0B" />
                      <Feather name="star" size={12} color="#F59E0B" />
                      <Feather name="star" size={12} color="#F59E0B" />
                      <Feather name="star" size={12} color="#F59E0B" />
                      <Feather name="star" size={12} color="#E5E7EB" />
                      <Text style={homeStyles.popularOrganizerRatingText}>4.5</Text>
                    </View>
                    <Text style={homeStyles.popularOrganizerMeta} numberOfLines={1}>
                      {organizer.count} events
                    </Text>
                  </SafeTouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={homeStyles.creativeElementsSection}>
            <View style={homeStyles.statsCardsContainer}>
              <View style={[homeStyles.statsCard, { marginRight: 12 }]}> 
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={homeStyles.statsCardGradient}
                >
                  <View style={homeStyles.statsCardDepthLayer} pointerEvents="none">
                    <View style={homeStyles.statsCardGlowOrbOne} />
                    <View style={homeStyles.statsCardGlowOrbTwo} />
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.20)', 'rgba(255, 255, 255, 0)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={homeStyles.statsCardHighlight}
                    />
                  </View>
                  <Feather name="calendar" size={24} color="#FFFFFF" />
                  <Text style={homeStyles.statsCardNumber}>{processedEvents.length}</Text>
                  <Text style={homeStyles.statsCardLabel}>Total Events</Text>
                </LinearGradient>
              </View>
              <View style={[homeStyles.statsCard, { marginRight: 12 }]}> 
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={homeStyles.statsCardGradient}
                >
                  <View style={homeStyles.statsCardDepthLayer} pointerEvents="none">
                    <View style={homeStyles.statsCardGlowOrbOne} />
                    <View style={homeStyles.statsCardGlowOrbTwo} />
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.20)', 'rgba(255, 255, 255, 0)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={homeStyles.statsCardHighlight}
                    />
                  </View>
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
                  <View style={homeStyles.statsCardDepthLayer} pointerEvents="none">
                    <View style={homeStyles.statsCardGlowOrbOne} />
                    <View style={homeStyles.statsCardGlowOrbTwo} />
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.20)', 'rgba(255, 255, 255, 0)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={homeStyles.statsCardHighlight}
                    />
                  </View>
                  <Feather name="heart" size={24} color="#FFFFFF" />
                  <Text style={homeStyles.statsCardNumber}>{processedEvents.filter(event => isFavorite(event.id)).length}</Text>
                  <Text style={homeStyles.statsCardLabel}>Favorites</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          <View style={homeStyles.organizerBox}>
            <View style={homeStyles.organizerBoxGradient}>
              <View style={homeStyles.organizerBoxDepthLayer} pointerEvents="none">
                <View style={homeStyles.organizerBoxGlowOrbOne} />
                <View style={homeStyles.organizerBoxGlowOrbTwo} />
                <View style={homeStyles.organizerBoxHighlight} />
              </View>
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
            </View>
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