import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Constants from 'expo-constants';

import { useAuth } from '../providers/AuthProvider';
import { SafeScrollView, SafeTouchableOpacity } from '../components/SafeComponents';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';

import styles from '../styles/OrganizerDashboardStyle';
import { formatDate, parseBoolean } from '../utils/dataProcessor';
import apiService from '../services/api';
import cacheService from '../utils/cacheService';
import { logger } from '../utils/logger';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';

const DASHBOARD_EVENTS_CACHE_KEY = 'dashboard:organizer:events';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const normalizeRemoteImageUri = (uri) => {
  if (!uri || typeof uri !== 'string') return null;

  const trimmed = uri.trim();
  if (!trimmed) return null;

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

  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://');
  }

  return trimmed;
};

const cacheDashboardEvents = async (eventsData) => {
  try {
    await cacheService.set(DASHBOARD_EVENTS_CACHE_KEY, eventsData, { ttlMs: CACHE_TTL_MS });
  } catch (e) {
    logger.warn('Failed to cache dashboard events:', e);
  }
};

const getCachedDashboardEvents = async () => {
  try {
    const { data, isExpired } = await cacheService.get(DASHBOARD_EVENTS_CACHE_KEY);
    if (!Array.isArray(data)) return null;
    return { events: data, isExpired };
  } catch (e) {
    logger.warn('Failed to get cached dashboard events:', e);
    return null;
  }
};

export default function OrganizerDashboard({ navigation, route }) {
  const { user, organizerProfile, signOut, verifyOrganizerIfNeeded } = useAuth();
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track if we've already loaded events
  const eventsLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const [insights, setInsights] = useState({
    totalViews: 0,
    totalLikes: 0,
    growthRate: 0,
    topCategory: 'N/A',
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    avgViewsPerEvent: 0,
    engagementRate: 0,
    monthlyGrowth: 0,
    bestPerformingEvent: null,
    recentActivity: 0,
  });
  
  // Load events when screen is focused (with caching)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          // Try to verify in the background, but don't block the UI
          verifyOrganizerIfNeeded().catch(e => {
            // Silent fail
          });
          
          const shouldForceRefresh = Boolean(route?.params?.refresh);

          // Only load events if we haven't loaded them recently (within last 30 seconds)
          const now = Date.now();
          const timeSinceLastLoad = now - lastLoadTimeRef.current;
          const shouldLoad = !eventsLoadedRef.current || timeSinceLastLoad > 30000; // 30 seconds

          if (!isActive) return;

          if (shouldForceRefresh) {
            await loadOrganizerEvents(true);
            eventsLoadedRef.current = true;
            lastLoadTimeRef.current = now;

            // Clear the param so it only refreshes once
            navigation.setParams({ refresh: undefined });
            return;
          }

          if (shouldLoad) {
            await loadOrganizerEvents();
            eventsLoadedRef.current = true;
            lastLoadTimeRef.current = now;
          }
        } catch (e) {
          // Silent fail
        }
      })();
      return () => { isActive = false; };
    }, [navigation, route?.params?.refresh])
  );
  
  const loadOrganizerEvents = async (forceRefresh = false) => {
    try {
      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cached = await getCachedDashboardEvents();
        if (cached?.events?.length && !cached.isExpired) {
          setOrganizerEvents(cached.events);
          calculateInsights(cached.events);
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      const response = await apiService.getOrganizerEvents();
      
      if (response.success && response.data) {
        const events = response.data.map(event => ({
          id: event._id,
          title: event.title,
          date: event.date,
          time: event.time,
          status: getEventStatus(event.date),
          attendees: event.attendeeCount || 0,
          category: event.category,
          price: event.price || 0,
          views: event.views || 0,
          likes: event.likeCount || 0,
          location: event.location,
          description: event.description,
          featured: event.featured
        }));
        
        setOrganizerEvents(events);
        calculateInsights(events);
        
        // Cache the events data
        await cacheDashboardEvents(events);
      } else {
        const allEventsResponse = await apiService.getEvents();
        if (allEventsResponse.success && allEventsResponse.data) {
          const events = allEventsResponse.data.map(event => ({
            id: event._id,
            title: event.title,
            date: event.date,
            time: event.time,
            status: getEventStatus(event.date),
            attendees: event.attendeeCount || 0,
            category: event.category,
            price: event.price || 0,
            views: event.views || 0,
            likes: event.likeCount || 0,
            location: event.location,
            description: event.description,
            featured: event.featured
          }));
          
          setOrganizerEvents(events);
          calculateInsights(events);
        }
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to load your events. Please try again.' }));
      logger.error('OrganizerDashboard loadOrganizerEvents error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Banner upload handlers
  const pickBannerImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError(toAppError(new Error('Camera roll permission is required to upload images.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setBannerImageUri(localUri);

        setError(toAppError(new Error('Please wait while your banner is uploaded.'), { kind: 'INFO', severity: APP_ERROR_SEVERITY.INFO }));

        const fd = new FormData();
        fd.append('file', {
          uri: localUri,
          type: 'image/jpeg',
          name: 'banner.jpg',
        });
        fd.append('upload_preset', 'Eventopia');

        try {
          const response = await axios.post(
            'https://api.cloudinary.com/v1_1/dqme0oqap/image/upload',
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          if (response.data.secure_url) {
            setBannerImageUrl(response.data.secure_url);
            setError(toAppError(new Error('Banner uploaded successfully.'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          setError(toAppError(error, { fallbackMessage: 'Failed to upload banner. Please try again.' }));
          setBannerImageUri(null);
          setBannerImageUrl(null);
        }
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'An unexpected error occurred. Please try again.' }));
    }
  };

  const removeBannerImage = () => {
    setBannerImageUri(null);
    setBannerImageUrl(null);
  };

  const addBanner = async () => {
    if (!isPromoAdmin) {
      setError(toAppError(new Error('Only the administrator can manage promotional banners.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    if (!bannerImageUrl) {
      setError(toAppError(new Error('Please upload a banner image first.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    try {
      setIsBannerPublishing(true);
      const verify = await verifyOrganizerIfNeeded();
      if (!verify?.success) {
        setError(toAppError(new Error('Please sign in again to publish banners.'), { kind: 'AUTH_REQUIRED', severity: APP_ERROR_SEVERITY.WARNING }));
        setIsBannerPublishing(false);
        return;
      }

      const res = await apiService.post('/banners', {
        imageUrl: bannerImageUrl,
        order: 0,
        isActive: true,
      }, { requireAuth: true });

      if (res?.success) {
        setError(null); // Clear any previous errors
        setError(toAppError(new Error('Promotional banner published successfully.'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
        setBannerImageUri(null);
        setBannerImageUrl(null);
        await loadBanners();
      } else {
        setError(toAppError(new Error(res?.message || 'Failed to publish banner'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to publish banner.' }));
    } finally {
      setIsBannerPublishing(false);
    }
  };

  const replaceSelectedBanner = async () => {
    if (!isPromoAdmin) {
      setError(toAppError(new Error('Only the administrator can manage promotional banners.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    if (!selectedBannerId) {
      setError(toAppError(new Error('Please select a banner to replace.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    if (!bannerImageUrl) {
      setError(toAppError(new Error('Please pick and upload a new image first.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    try {
      setIsBannerPublishing(true);
      const verify = await verifyOrganizerIfNeeded();
      if (!verify?.success) {
        setError(toAppError(new Error('Please sign in again to replace banners.'), { kind: 'AUTH_REQUIRED', severity: APP_ERROR_SEVERITY.WARNING }));
        setIsBannerPublishing(false);
        return;
      }
      const res = await apiService.put(`/banners/${selectedBannerId}`, {
        imageUrl: bannerImageUrl,
      }, { requireAuth: true });
      if (res?.success) {
        setError(null); // Clear any previous errors
        setError(toAppError(new Error('Banner replaced successfully.'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
        setBannerImageUri(null);
        setBannerImageUrl(null);
        await loadBanners();
      } else {
        setError(toAppError(new Error(res?.message || 'Failed to replace banner'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to replace banner.' }));
    } finally {
      setIsBannerPublishing(false);
    }
  };

  const deleteSelectedBanner = async () => {
    if (!isPromoAdmin) {
      setError(toAppError(new Error('Only the administrator can manage promotional banners.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    if (!selectedBannerId) {
      setError(toAppError(new Error('Please select a banner to delete.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    Alert.alert('Delete Banner', 'Are you sure you want to delete this banner?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setIsBannerPublishing(true);
          const verify = await verifyOrganizerIfNeeded();
          if (!verify?.success) {
            setError(toAppError(new Error('Please sign in again to delete banners.'), { kind: 'AUTH_REQUIRED', severity: APP_ERROR_SEVERITY.WARNING }));
            setIsBannerPublishing(false);
            return;
          }
          const res = await apiService.delete(`/banners/${selectedBannerId}`, { requireAuth: true });
          if (res?.success) {
            setError(null); // Clear any previous errors
            setError(toAppError(new Error('Banner deleted successfully.'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
            await loadBanners();
          } else {
            setError(toAppError(new Error(res?.message || 'Failed to delete banner'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
          }
        } catch (error) {
          setError(toAppError(error, { fallbackMessage: 'Failed to delete banner.' }));
        } finally {
          setIsBannerPublishing(false);
        }
      }}
    ]);
  };

  const loadBanners = async () => {
    if (!isPromoAdmin) {
      setIsBannersLoading(false);
      setShowBannerModal(false);
      setError(toAppError(new Error('Only the administrator can manage promotional banners.'), { kind: 'PERMISSION_DENIED', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }
    setIsBannersLoading(true);
    try {
      let list = null;
      // Ensure auth is fresh so we can access the private management endpoint
      try { await verifyOrganizerIfNeeded(); } catch (_) {}
      // Try private management endpoint first
      try {
        const res = await apiService.get('/banners/all', { requireAuth: true });
        if (res?.success && Array.isArray(res.data)) {
          list = res.data;
        }
      } catch (_) { /* fall back to public endpoint */ }

      // Fallback to public active banners if private route unavailable
      if (!Array.isArray(list)) {
        try {
          const res2 = await apiService.getBanners();
          if (res2?.success && Array.isArray(res2.data)) {
            list = res2.data;
          }
        } catch (_) {}
      }

      if (Array.isArray(list)) {
        setBanners(list);
        if (!selectedBannerId && list.length) {
          setSelectedBannerId(list[0]._id || list[0].id || null);
        } else if (selectedBannerId && !list.find(b => ((b._id || b.id) === selectedBannerId))) {
          setSelectedBannerId(list[0]?._id || list[0]?.id || null);
        }
      }
    } finally {
      setIsBannersLoading(false);
    }
  };

  
  
  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'Ended';
    if (daysDiff === 0) return 'Today';
    if (daysDiff <= 7) return 'This Week';
    return 'Upcoming';
  };
  
  const calculateInsights = (events) => {
    if (events.length === 0) {
      setInsights({ 
        totalViews: 0, 
        totalLikes: 0, 
        growthRate: 0, 
        topCategory: 'N/A',
        totalEvents: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        avgViewsPerEvent: 0,
        engagementRate: 0,
        monthlyGrowth: 0,
        bestPerformingEvent: null,
        recentActivity: 0,
      });
      return;
    }

    const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);
    const totalLikes = events.reduce((sum, e) => sum + (e.likes || 0), 0);
    const totalEvents = events.length;
    
    // Calculate upcoming vs past events
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= now).length;
    const pastEvents = events.filter(e => new Date(e.date) < now).length;
    
    // Calculate average views per event
    const avgViewsPerEvent = totalEvents > 0 ? Math.round(totalViews / totalEvents) : 0;
    
    // Calculate engagement rate (likes per 100 views)
    const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0;
    
    // Find best performing event
    const bestPerformingEvent = events.reduce((best, event) => 
      (event.views || 0) > (best?.views || 0) ? event : best, null);
    
    // Calculate monthly growth (events created in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const monthlyGrowth = totalEvents > 0 ? ((recentEvents.length / totalEvents) * 100).toFixed(1) : 0;
    
    // Calculate recent activity (events in last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = events.filter(e => new Date(e.date) >= sevenDaysAgo).length;
    
    // Category analysis
    const categories = {};
    events.forEach(e => {
      if (e.category) {
        categories[e.category] = (categories[e.category] || 0) + 1;
      }
    });
    
    const topCategory = Object.keys(categories).length > 0 
      ? Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)
      : 'N/A';
    
    // Calculate growth rate (events created in last month vs total)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthEvents = events.filter(e => new Date(e.date) >= lastMonth);
    const growthRate = totalEvents > 0 
      ? ((lastMonthEvents.length / totalEvents) * 100).toFixed(1)
      : 0;
    
    setInsights({
      totalViews,
      totalLikes,
      growthRate: parseFloat(growthRate),
      topCategory,
      totalEvents,
      upcomingEvents,
      pastEvents,
      avgViewsPerEvent,
      engagementRate: parseFloat(engagementRate),
      monthlyGrowth: parseFloat(monthlyGrowth),
      bestPerformingEvent,
      recentActivity,
    });
  };
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerImageUri, setBannerImageUri] = useState(null);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [isBannerPublishing, setIsBannerPublishing] = useState(false);
  const [banners, setBanners] = useState([]);
  const [selectedBannerId, setSelectedBannerId] = useState(null);
  const [isBannersLoading, setIsBannersLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    price: ''
  });
  const isPromoAdmin = (user?.email?.toLowerCase?.() === 'samred221b@gmail.com');

  useEffect(() => {
    if (showBannerModal) {
      setError(null); // Clear any previous errors when opening banner modal
      loadBanners();
    }
  }, [showBannerModal]);

  const dashboardProfile = {
    name: organizerProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Organizer',
    email: organizerProfile?.email || user?.email || '',
    avatar: normalizeRemoteImageUri(organizerProfile?.profileImage || organizerProfile?.avatar || ''),
    totalEvents: organizerEvents.length,
    activeEvents: organizerEvents.filter(e => e.status !== 'Ended').length,
    totalFavorites: organizerEvents.reduce((sum, event) => sum + (event.likes || 0), 0),
    isVerified: organizerProfile?.isVerified || false
  };

  const categoryIconMap = {
    music: 'music',
    technology: 'cpu',
    art: 'feather',
    food: 'coffee',
    sports: 'activity',
    business: 'briefcase',
    education: 'book-open',
    festival: 'sun',
    networking: 'users',
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.success) {
                navigation.navigate('OrganizerLogin');
              }
            } catch (error) {
              // Silent fail
            }
          }
        }
      ]
    );
  };

  const handleDeleteEvent = (eventId) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteEvent(eventId);
              if (response.success) {
                setOrganizerEvents(prev => prev.filter(e => e.id !== eventId));
                setError(null); // Clear any previous errors
                setError(toAppError(new Error('Event deleted successfully'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
              } else {
                setError(toAppError(new Error(response.message || 'Failed to delete event'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
              }
            } catch (error) {
              setError(toAppError(error, { fallbackMessage: 'Failed to delete event.' }));
            }
          }
        }
      ]
    );
  };
  
  const handleEditEvent = (event) => {
    navigation.navigate('CreateEvent', { editEvent: event });
  };
  
  const renderEventCard = (event) => {
    const normalizedCategory = event.category?.toLowerCase?.();
    const iconName = normalizedCategory && categoryIconMap[normalizedCategory]
      ? categoryIconMap[normalizedCategory]
      : 'calendar';

    return (
      <SafeTouchableOpacity 
        key={event.id} 
        style={styles.dashboardEventCard}
        activeOpacity={0.95}
      >
        <View style={styles.dashboardEventHeader}>
          <View style={styles.dashboardEventInfo}>
            <View style={styles.dashboardEventIconContainer}>
              <Feather name={iconName} size={18} color="#0277BD" />
            </View>
            <View style={styles.dashboardEventDetails}>
              <Text style={styles.dashboardEventTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={styles.dashboardEventDate}>{formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}</Text>
              <View style={styles.dashboardEventMeta}>
                <View style={styles.dashboardEventStatusWrapper}>
                  <View style={[styles.dashboardEventStatus, 
                    event.status === 'Upcoming' || event.status === 'This Week' ? styles.statusUpcoming :
                    event.status === 'Today' ? styles.statusOngoing : styles.statusEnded
                  ]}>
                    <Text style={styles.dashboardEventStatusText}>{event.status}</Text>
                  </View>
                </View>
                <View style={styles.dashboardEventMetaItem}>
                  <Feather name="eye" size={14} color="#64748B" />
                  <Text style={styles.dashboardEventMetaValue}>{event.views}</Text>
                </View>
                <View style={styles.dashboardEventMetaItem}>
                  <Feather name="heart" size={14} color="#EF4444" />
                  <Text style={[styles.dashboardEventMetaValue, styles.dashboardEventFavoritesValue]}>{event.likes}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.dashboardEventActions}>
            <SafeTouchableOpacity 
              style={[styles.dashboardActionButton, styles.editButton]}
              onPress={() => handleEditEvent(event)}
              activeOpacity={0.7}
            >
              <Feather name="edit-3" size={16} color="#1E293B" />
            </SafeTouchableOpacity>
            <SafeTouchableOpacity 
              style={[styles.dashboardActionButton, styles.deleteButton]}
              onPress={() => handleDeleteEvent(event.id)}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={16} color="#1E293B" />
            </SafeTouchableOpacity>
          </View>
        </View>
      </SafeTouchableOpacity>
    );
  };

  return (
    <SafeScrollView 
      style={styles.modernDashboardContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* StatusBar moved to App.js */}
      
      <LinearGradient
        colors={['#0277BD', '#01579B', '#0B3A67']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modernDashboardHeader}
      >
        <View style={styles.modernDashboardHeaderBg} pointerEvents="none">
          <View style={styles.modernDashboardHeaderOrbOne} />
          <View style={styles.modernDashboardHeaderOrbTwo} />
        </View>

        <View style={styles.modernDashboardHeaderTop}>
          <View style={styles.modernDashboardProfile}>
            <View style={styles.modernDashboardAvatar}>
              {dashboardProfile.avatar ? (
                <Image 
                  source={{ uri: dashboardProfile.avatar }} 
                  style={styles.modernDashboardAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={30} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.modernDashboardProfileInfo}>
              <Text style={styles.modernDashboardWelcome}>Organizer Dashboard</Text>
              <View style={styles.modernDashboardNameRow}>
                <Text style={styles.modernDashboardName} numberOfLines={1}>{dashboardProfile.name}</Text>
                {dashboardProfile.isVerified ? (
                  <View style={styles.modernDashboardVerifiedChip}>
                    <Feather name="check" size={12} color="#0F172A" />
                    <Text style={styles.modernDashboardVerifiedText}>Verified</Text>
                  </View>
                ) : null}
              </View>
              {!!dashboardProfile.email && (
                <Text style={styles.modernDashboardEmail} numberOfLines={1}>{dashboardProfile.email}</Text>
              )}
            </View>
          </View>
          
          <SafeTouchableOpacity 
            style={styles.modernDashboardSettingsButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={22} color="#FFFFFF" />
          </SafeTouchableOpacity>
        </View>

        {/* Minimal Stats below header elements - full width */}
        <View style={styles.minimalStatsContainer}>
          <View style={styles.minimalStatItem}>
            <Text style={styles.minimalStatNumber}>{organizerEvents.length}</Text>
            <Text style={styles.minimalStatLabel}>Events</Text>
          </View>
          <View style={styles.minimalStatDivider} />
          <View style={styles.minimalStatItem}>
            <Text style={styles.minimalStatNumber}>{insights.totalViews || 0}</Text>
            <Text style={styles.minimalStatLabel}>Views</Text>
          </View>
          <View style={styles.minimalStatDivider} />
          <View style={styles.minimalStatItem}>
            <Text style={styles.minimalStatNumber}>{dashboardProfile.totalFavorites || 0}</Text>
            <Text style={styles.minimalStatLabel}>Favorites</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.modernDashboardQuickActions}>
        <SafeTouchableOpacity 
          style={styles.modernDashboardActionButton}
          onPress={() => navigation.navigate('CreateEvent')}
          activeOpacity={0.9}
        >
          <View style={styles.modernDashboardActionGradient}>
            <Feather name="plus-circle" size={22} color="#FFFFFF" />
            <Text style={styles.modernDashboardActionText}>Create Event</Text>
          </View>
        </SafeTouchableOpacity>

        <SafeTouchableOpacity 
          style={styles.modernDashboardSecondaryButton}
          onPress={() => {
            setError(null); // Clear any previous errors
            eventsLoadedRef.current = true;
            lastLoadTimeRef.current = Date.now();
            loadOrganizerEvents(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={20} color="#0277BD" />
          <Text style={styles.modernDashboardSecondaryText}>Refresh</Text>
        </SafeTouchableOpacity>
      </View>

      <View style={styles.modernDashboardSection}>
        <View style={styles.modernDashboardSectionHeader}>
          <Text style={styles.modernDashboardSectionTitle}>My Events</Text>
          <Text style={styles.modernDashboardSectionCount}>{organizerEvents.length}</Text>
        </View>

        <AppErrorBanner error={error} onRetry={() => loadOrganizerEvents(true)} disabled={isLoading} />

        {isLoading ? (
          <View style={styles.modernDashboardEmptyState}>
            <ActivityIndicator size="large" color="#0277BD" />
            <Text style={styles.modernDashboardEmptyText}>Loading your events...</Text>
          </View>
        ) : organizerEvents.length === 0 ? (
          <View style={styles.modernDashboardEmptyState}>
            <View style={styles.modernDashboardEmptyIconContainer}>
              <Feather name="calendar" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.modernDashboardEmptyTitle}>No Events Yet</Text>
            <Text style={styles.modernDashboardEmptyText}>
              Start creating amazing events and manage them all in one place
            </Text>
            <TouchableOpacity 
              style={styles.modernDashboardEmptyButton}
              onPress={() => navigation.navigate('CreateEvent')}
              activeOpacity={0.9}
            >
              <View style={styles.modernDashboardEmptyButtonGradient}>
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.modernDashboardEmptyButtonText}>Create First Event</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {organizerEvents.map(renderEventCard)}
          </View>
        )}
      </View>

      {/* Analytics Button */}
      <View style={styles.modernDashboardSection}>
        <SafeTouchableOpacity 
          style={styles.modernDashboardActionButton}
          onPress={() => navigation.navigate('Analytics')}
          activeOpacity={0.9}
        >
          <View style={[styles.modernDashboardActionGradient, { backgroundColor: '#0277BD' }]}>
            <Feather name="bar-chart-2" size={22} color="#FFFFFF" />
            <Text style={styles.modernDashboardActionText}>Analytics</Text>
          </View>
        </SafeTouchableOpacity>
      </View>

      <View style={styles.modernDashboardSection}>
        <SafeTouchableOpacity 
          style={styles.modernDashboardActionButton}
          onPress={() => navigation.navigate('OrganizerInbox')}
          activeOpacity={0.9}
        >
          <View style={[styles.modernDashboardActionGradient, { backgroundColor: '#10B981' }]}>
            <Feather name="inbox" size={22} color="#FFFFFF" />
            <Text style={styles.modernDashboardActionText}>Messages</Text>
          </View>
        </SafeTouchableOpacity>
      </View>

      {/* Admin Panel - Only visible to admin */}
      {isPromoAdmin && (
        <View style={styles.dashboardSection}>
          <Text style={styles.dashboardSectionTitle}>Admin Panel</Text>
          <View style={styles.dashboardSettings}>
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupTitle}>Event Management</Text>
              <SafeTouchableOpacity 
                style={styles.dashboardSettingItem} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AdminEvents')}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                    <Feather name="calendar" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.dashboardSettingText}>Manage All Events</Text>
                    <Text style={styles.dashboardSettingSubtext}>View, edit, and delete any event</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity 
                style={styles.dashboardSettingItem} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AdminOrganizers')}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                    <Feather name="users" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.dashboardSettingText}>Manage Organizers</Text>
                    <Text style={styles.dashboardSettingSubtext}>Verify and manage organizer accounts</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity 
                style={styles.dashboardSettingItem} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AdminAnalytics')}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                    <Feather name="bar-chart-2" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.dashboardSettingText}>System Analytics</Text>
                    <Text style={styles.dashboardSettingSubtext}>View platform statistics and trends</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </SafeTouchableOpacity>
              
              <SafeTouchableOpacity 
                style={styles.dashboardSettingItem} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AdminMessaging')}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconContainer, { backgroundColor: '#10B981' }]}>
                    <Feather name="message-square" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.dashboardSettingText}>Admin Messaging</Text>
                    <Text style={styles.dashboardSettingSubtext}>Send messages to organizers</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </SafeTouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.dashboardSection}>
        <Text style={styles.dashboardSectionTitle}>Billing & Subscription</Text>
        <View style={styles.dashboardSettings}>
          <View style={styles.settingsGroup}>
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Pricing')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="credit-card" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>View Pricing Plans</Text>
                  <Text style={styles.dashboardSettingSubtext}>Upgrade or change your subscription</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
          </View>
          
          <View style={styles.settingsGroup}>
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UsageStatistics')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="bar-chart" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Usage Statistics</Text>
                  <Text style={styles.dashboardSettingSubtext}>Track your event usage</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
          </View>
          
          <View style={styles.settingsGroup}>
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Pricing')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="dollar-sign" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Payment Methods</Text>
                  <Text style={styles.dashboardSettingSubtext}>Manage billing information</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.dashboardSection}>
        <Text style={styles.dashboardSectionTitle}>Settings & Preferences</Text>
        <View style={styles.dashboardSettings}>
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Account</Text>
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UpdateProfile')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="user" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Update Profile</Text>
                  <Text style={styles.dashboardSettingSubtext}>Edit your personal information</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
            
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Verification')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Verification Badge</Text>
                  <Text style={styles.dashboardSettingSubtext}>Get verified organizer status</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
          </View>
          
          
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Support</Text>
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="life-buoy" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Help & Support</Text>
                  <Text style={styles.dashboardSettingSubtext}>Get help with your events</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
            
            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => { setIsBannersLoading(true); setShowBannerModal(true); }}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="image" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Promotional Banner</Text>
                  <Text style={styles.dashboardSettingSubtext}>Upload and publish home banner</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>

            <SafeTouchableOpacity 
              style={styles.dashboardSettingItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TermsPrivacy')}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                  <Feather name="file-text" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dashboardSettingText}>Terms & Privacy</Text>
                  <Text style={styles.dashboardSettingSubtext}>Review our policies</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </SafeTouchableOpacity>
          </View>
          
          <SafeTouchableOpacity 
            style={[styles.dashboardSettingItem, styles.logoutButton]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: '#0277BD' }]}>
                <Feather name="log-out" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.dashboardSettingText, { color: '#ef4444' }]}>Log Out</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#ef4444" />
          </SafeTouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showCreateForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateForm(false)}
      >
        <View style={styles.createEventOverlay}>
          <View style={styles.createEventModal}>
            <View style={styles.createEventHeader}>
              <Text style={styles.createEventTitle}>Create New Event</Text>
              <SafeTouchableOpacity 
                onPress={() => setShowCreateForm(false)}
                style={styles.createEventClose}
              >
                <Text style={styles.createEventCloseText}>×</Text>
              </SafeTouchableOpacity>
            </View>
            
            <SafeScrollView style={styles.createEventForm}>
              <View style={styles.createEventInputGroup}>
                <Text style={styles.createEventLabel}>Event Title</Text>
                <TextInput 
                  style={styles.createEventInput}
                  placeholder="Enter event title"
                  value={newEvent.title}
                  onChangeText={(text) => setNewEvent({...newEvent, title: text})}
                />
              </View>
              
              <View style={styles.createEventInputGroup}>
                <Text style={styles.createEventLabel}>Category</Text>
                <TextInput 
                  style={styles.createEventInput}
                  placeholder="Concert, Tech Talk, Exhibition..."
                  value={newEvent.category}
                  onChangeText={(text) => setNewEvent({...newEvent, category: text})}
                />
              </View>
              
              <View style={styles.createEventInputGroup}>
                <Text style={styles.createEventLabel}>Description</Text>
                <TextInput 
                  style={styles.createEventTextArea}
                  placeholder="Describe your event..."
                  multiline={true}
                  numberOfLines={4}
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent({...newEvent, description: text})}
                />
              </View>
              
              <View style={styles.createEventInputGroup}>
                <Text style={styles.createEventLabel}>Location</Text>
                <TextInput 
                  style={styles.createEventInput}
                  placeholder="Event location"
                  value={newEvent.location}
                  onChangeText={(text) => setNewEvent({...newEvent, location: text})}
                />
              </View>
              
              <View style={styles.createEventRow}>
                <View style={styles.createEventInputHalf}>
                  <Text style={styles.createEventLabel}>Start Date</Text>
                  <TextInput 
                    style={styles.createEventInput}
                    placeholder="YYYY-MM-DD"
                    value={newEvent.startDate}
                    onChangeText={(text) => setNewEvent({...newEvent, startDate: text})}
                  />
                </View>
                <View style={styles.createEventInputHalf}>
                  <Text style={styles.createEventLabel}>End Date</Text>
                  <TextInput 
                    style={styles.createEventInput}
                    placeholder="YYYY-MM-DD"
                    value={newEvent.endDate}
                    onChangeText={(text) => setNewEvent({...newEvent, endDate: text})}
                  />
                </View>
              </View>
              
              <View style={styles.createEventInputGroup}>
                <Text style={styles.createEventLabel}>Price (Optional)</Text>
                <TextInput 
                  style={styles.createEventInput}
                  placeholder="Free or $XX.XX"
                  value={newEvent.price}
                  onChangeText={(text) => setNewEvent({...newEvent, price: text})}
                />
              </View>
              
              <View style={styles.createEventActions}>
                <SafeTouchableOpacity 
                  style={styles.createEventDraftButton}
                  onPress={() => {
                    setShowCreateForm(false);
                  }}
                >
                  <Text style={styles.createEventDraftText}>Save Draft</Text>
                </SafeTouchableOpacity>
                
                <SafeTouchableOpacity 
                  style={styles.createEventPublishButton}
                  onPress={() => {
                    setShowCreateForm(false);
                  }}
                >
                  <Text style={styles.createEventPublishText}>Publish Event</Text>
                </SafeTouchableOpacity>
              </View>
            </SafeScrollView>
          </View>
        </View>
      </Modal>

      
      <Modal
        visible={showBannerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBannerModal(false)}
      >
        <View style={styles.createEventOverlay}>
          <View style={styles.createEventModal}>
            <View style={styles.createEventHeader}>
              <Text style={styles.createEventTitle}>Promotional Banner</Text>
              <SafeTouchableOpacity 
                onPress={() => setShowBannerModal(false)}
                style={styles.createEventClose}
              >
                <Text style={styles.createEventCloseText}>×</Text>
              </SafeTouchableOpacity>
            </View>

            <SafeScrollView style={styles.createEventForm}>
              <AppErrorBanner error={error} onRetry={() => setError(null)} disabled={isBannerPublishing} />
              
              <View style={{ marginBottom: 12 }}>
                {isBannersLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#0277BD" />
                    <Text style={{ color: '#4b5563', marginTop: 8 }}>Loading banners...</Text>
                  </View>
                ) : banners.length === 0 ? (
                  <Text style={{ color: '#4b5563' }}>No banners yet</Text>
                ) : (
                  banners.map(b => (
                    <SafeTouchableOpacity
                      key={b._id || b.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10,
                        borderWidth: 2, borderColor: (selectedBannerId === (b._id || b.id)) ? '#0277BD' : '#E5E7EB', borderRadius: 12,
                        marginBottom: 10, backgroundColor: '#FFFFFF'
                      }}
                      onPress={() => setSelectedBannerId(b._id || b.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 60, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f3f4f6', marginRight: 12 }}>
                        <Image source={{ uri: b.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#111827', fontWeight: '700' }}>{b.title || 'Banner'}</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>{b.imageUrl?.slice(0, 40)}</Text>
                      </View>
                      <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0277BD', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedBannerId === (b._id || b.id) && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0277BD' }} />}
                      </View>
                    </SafeTouchableOpacity>
                  ))
                )}
              </View>

              <View style={{ marginBottom: 16 }}>
                {bannerImageUri ? (
                  <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#0b24473b' }}>
                    <Image source={{ uri: bannerImageUri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                  </View>
                ) : (
                  <Text style={{ color: '#4b5563' }}>Recommended: 1600x800px • Max 10MB</Text>
                )}
              </View>

              <View style={styles.createEventActions}>
                <SafeTouchableOpacity 
                  style={styles.createEventDraftButton}
                  onPress={bannerImageUri ? removeBannerImage : pickBannerImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createEventDraftText}>{bannerImageUri ? 'Remove Image' : 'Pick Image'}</Text>
                </SafeTouchableOpacity>

                <SafeTouchableOpacity 
                  style={styles.createEventPublishButton}
                  onPress={addBanner}
                  disabled={!bannerImageUrl || isBannerPublishing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createEventPublishText}>{isBannerPublishing ? 'Publishing...' : 'Add Banner'}</Text>
                </SafeTouchableOpacity>
              </View>

              <View style={styles.createEventActions}>
                <SafeTouchableOpacity 
                  style={styles.createEventDraftButton}
                  onPress={replaceSelectedBanner}
                  disabled={!selectedBannerId || !bannerImageUrl || isBannerPublishing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createEventDraftText}>Replace Selected</Text>
                </SafeTouchableOpacity>

                <SafeTouchableOpacity 
                  style={styles.createEventPublishButton}
                  onPress={deleteSelectedBanner}
                  disabled={!selectedBannerId || isBannerPublishing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.createEventPublishText}>Delete Selected</Text>
                </SafeTouchableOpacity>
              </View>
            </SafeScrollView>
          </View>
        </View>
      </Modal>
    </SafeScrollView>
  );
}
