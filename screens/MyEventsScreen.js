import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../providers/AuthProvider';
import { SafeScrollView, SafeTouchableOpacity } from '../components/SafeComponents';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import EmptyState from '../components/EmptyState';

import styles from '../styles/OrganizerDashboardStyle';
import { formatDate, formatPrice, standardizeEventForDetails } from '../utils/dataProcessor';
import apiService from '../services/api';
import cacheService from '../utils/cacheService';
import { logger } from '../utils/logger';
import { toAppError, APP_ERROR_SEVERITY, createOfflineCachedNotice } from '../utils/appError';

const MY_EVENTS_CACHE_KEY = 'my:events';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const categoryIconMap = {
  music: 'music',
  sports: 'activity',
  business: 'briefcase',
  education: 'book-open',
  food: 'coffee',
  nightlife: 'moon',
  art: 'image',
  tech: 'cpu',
  technology: 'cpu',
  health: 'heart',
  charity: 'heart',
  travel: 'map',
  community: 'users',
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

const cacheMyEventsData = async (eventsData) => {
  try {
    await cacheService.set(MY_EVENTS_CACHE_KEY, eventsData, { ttlMs: CACHE_TTL_MS });
  } catch (e) {
    logger.warn('Failed to cache my events:', e);
  }
};

const getCachedMyEventsData = async () => {
  try {
    const { data, isExpired } = await cacheService.get(MY_EVENTS_CACHE_KEY);
    if (!Array.isArray(data)) return null;
    return { events: data, isExpired };
  } catch (e) {
    logger.warn('Failed to get cached my events:', e);
    return null;
  }
};

function MyEventsScreen({ navigation }) {
  const { user, organizerProfile, verifyOrganizerIfNeeded } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const organizerId = organizerProfile?._id || organizerProfile?.id || user?.uid || null;

  const loadMyEvents = useCallback(async (forceRefresh = false) => {
    if (!user?.uid) {
      setError(toAppError(new Error('Please log in to view your events.'), { 
        kind: 'AUTH_REQUIRED', 
        severity: APP_ERROR_SEVERITY.WARNING 
      }));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Best-effort: ensure backend auth/profile is synced
      try {
        await verifyOrganizerIfNeeded();
      } catch (_) {
        // ignore
      }

      // Try to load from cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = await getCachedMyEventsData();
        if (cachedData && !cachedData.isExpired) {
          setEvents(cachedData.events);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      setIsFromCache(false);
      
      // Load from API (same endpoint as OrganizerDashboard)
      const response = await apiService.getOrganizerEvents();
      
      if (response?.success && response?.data) {
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
          likes: (event.likes && Array.isArray(event.likes) ? event.likes.length : event.likeCount || 0),
          location: event.location,
          description: event.description,
          featured: event.featured,
          imageUrl: event.imageUrl,
          currency: event.currency,
          isActive: event.isActive !== false
        }));
        setEvents(events);
        await cacheMyEventsData(events);
      } else {
        // Fallback: try to get all events and filter by organizer
        const allEventsResponse = await apiService.getEvents();
        if (allEventsResponse?.success && allEventsResponse?.data) {
          const events = allEventsResponse.data
            .filter(event => {
              if (!organizerId) return false;
              return (
                event?.organizerId === organizerId ||
                event?.organizer?._id === organizerId ||
                event?.organizer?.id === organizerId
              );
            })
            .map(event => ({
              id: event._id,
              title: event.title,
              date: event.date,
              time: event.time,
              status: getEventStatus(event.date),
              attendees: event.attendeeCount || 0,
              category: event.category,
              price: event.price || 0,
              views: event.views || 0,
              likes: (event.likes && Array.isArray(event.likes) ? event.likes.length : event.likeCount || 0),
              location: event.location,
              description: event.description,
              featured: event.featured,
              imageUrl: event.imageUrl,
              currency: event.currency,
              isActive: event.isActive !== false
            }));
          setEvents(events);
          await cacheMyEventsData(events);
        } else {
          throw new Error('No events data received');
        }
      }
    } catch (error) {
      // Try to show cached data if API fails
      const cachedData = await getCachedMyEventsData();
      if (cachedData) {
        setEvents(cachedData.events);
        setIsFromCache(true);
        setError(toAppError(createOfflineCachedNotice(), { 
          severity: APP_ERROR_SEVERITY.WARNING 
        }));
      } else {
        setError(toAppError(error, { 
          fallbackMessage: 'Failed to load your events. Please try again.' 
        }));
      }
      logger.error('MyEventsScreen loadMyEvents error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid, organizerId, verifyOrganizerIfNeeded]);


  useFocusEffect(
    useCallback(() => {
      loadMyEvents();
    }, [loadMyEvents])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMyEvents(true);
  }, [loadMyEvents]);

  const handleEventPress = useCallback((event) => {
    navigation.navigate('EventDetails', { 
      eventId: event.id,
      event,
      useCachedEvent: true,   // hint EventDetails to render from provided data
      skipApiFetch: true      // avoid refetching when pressing a cached card
    });
  }, [navigation]);

  const handleEditEvent = useCallback((event) => {
    navigation.navigate('CreateEvent', { 
      eventId: event.id,
      isEditing: true 
    });
  }, [navigation]);

  const handleDeleteEvent = useCallback((eventId) => {
    // Visual parity only; hook up real delete if needed.
    // eslint-disable-next-line no-console
    console.warn('Delete event action not implemented for MyEventsScreen:', eventId);
  }, []);

  const renderEventCard = useCallback(({ item: event }) => {
    const normalizedCategory = event.category?.toLowerCase?.();
    const iconName = normalizedCategory && categoryIconMap[normalizedCategory]
      ? categoryIconMap[normalizedCategory]
      : 'calendar';

    const locationLabel = (() => {
      if (!event?.location) return 'Location TBA';
      if (typeof event.location === 'string') return event.location;
      return event.location?.venue || event.location?.name || event.location?.address || event.location?.formattedAddress || event.location?.city || 'Location TBA';
    })();

    return (
      <SafeTouchableOpacity
        style={localStyles.eventCard}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.95}
      >
        <View style={localStyles.eventBody}>
          <View style={localStyles.eventTopRow}>
            <View style={localStyles.eventIconChip}>
              <Feather name={iconName} size={16} color="#0277BD" />
            </View>

            <View style={localStyles.eventBadgesInline}>
              <View style={[
                localStyles.eventBadge,
                event.status === 'Upcoming' || event.status === 'This Week' ? localStyles.badgeUpcoming :
                event.status === 'Today' ? localStyles.badgeToday : localStyles.badgeEnded,
              ]}>
                <Text style={localStyles.eventBadgeText}>{event.status}</Text>
              </View>

              {!!event.featured && (
                <View style={[localStyles.eventBadge, localStyles.badgeFeatured]}>
                  <Feather name="star" size={12} color="#0F172A" />
                  <Text style={[localStyles.eventBadgeText, localStyles.eventBadgeTextDark]}>Featured</Text>
                </View>
              )}
            </View>
          </View>

          <View style={localStyles.eventTitleRow}>
            <Text style={localStyles.eventTitle} numberOfLines={1}>{event.title}</Text>
            <View style={localStyles.eventActionsInline}>
              <SafeTouchableOpacity
                style={[localStyles.iconActionButton, localStyles.iconActionEdit]}
                onPress={() => handleEditEvent(event)}
                activeOpacity={0.7}
              >
                <Feather name="edit-3" size={16} color="#1E293B" />
              </SafeTouchableOpacity>
              <SafeTouchableOpacity
                style={[localStyles.iconActionButton, localStyles.iconActionDelete]}
                onPress={() => handleDeleteEvent(event.id)}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={16} color="#1E293B" />
              </SafeTouchableOpacity>
            </View>
          </View>

          <View style={localStyles.eventSubRow}>
            <Feather name="clock" size={13} color="#64748B" />
            <Text style={localStyles.eventSubText} numberOfLines={1}>
              {formatDate(event.date)}{event.time ? ` • ${event.time}` : ''}
            </Text>
          </View>
          <View style={localStyles.eventSubRow}>
            <Feather name="map-pin" size={13} color="#64748B" />
            <Text style={localStyles.eventSubText} numberOfLines={1}>{locationLabel}</Text>
          </View>

          <View style={localStyles.eventFooterRow}>
            <View style={localStyles.eventPricePill}>
              <Feather name="tag" size={13} color="#0277BD" />
              <Text style={localStyles.eventPriceText}>{formatPrice(event.price, event.currency || 'ETB')}</Text>
            </View>

            <View style={localStyles.eventStatsRow}>
              <View style={localStyles.eventStat}>
                <Feather name="users" size={13} color="#64748B" />
                <Text style={localStyles.eventStatText}>{event.attendees || 0}</Text>
              </View>
              <View style={localStyles.eventStat}>
                <Feather name="eye" size={13} color="#64748B" />
                <Text style={localStyles.eventStatText}>{event.views || 0}</Text>
              </View>
              <View style={localStyles.eventStat}>
                <Feather name="heart" size={13} color="#EF4444" />
                <Text style={[localStyles.eventStatText, localStyles.eventStatTextHeart]}>{event.likes || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeTouchableOpacity>
    );
  }, [handleEventPress, handleEditEvent]);

  const renderEmptyState = () => (
    <EmptyState
      icon="calendar"
      iconSize={64}
      title="No Events Yet"
      description="Start creating amazing events and manage them all in one place"
      primaryAction={() => navigation.navigate('CreateEvent')}
      primaryActionText="Create Your First Event"
      primaryActionIcon="plus"
      secondaryAction={() => navigation.navigate('OrganizerLogin')}
      secondaryActionText="Sign In"
      secondaryActionIcon="log-in"
      gradientColors={['#0277BD', '#01579B']}
    />
  );

  // Decorated Header Component
  const MyEventsHeader = ({ insets, events, isFromCache }) => (
    <View style={localStyles.homeHeaderContainer}>
      <LinearGradient
        colors={['#0277BD', '#01579B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={localStyles.homeHeaderCard}
      >
        <View style={localStyles.homeHeaderBg} pointerEvents="none">
          <View style={localStyles.homeHeaderOrbOne} />
          <View style={localStyles.homeHeaderOrbTwo} />
        </View>

        <View style={localStyles.homeHeaderTopRow}>
          <View style={localStyles.homeHeaderLeftRow}>
            <View style={localStyles.homeHeaderAvatar}>
              <View style={localStyles.homeHeaderAvatarInner}>
                <Feather name="calendar" size={20} color="#0F172A" />
              </View>
            </View>

            <View style={localStyles.homeHeaderTitleBlock}>
              <Text style={localStyles.homeHeaderWelcomeText}>Manage</Text>
              <Text style={localStyles.homeHeaderNameText}>My Events</Text>
              <Text style={localStyles.homeHeaderCountText}>
                {events.length} {events.length === 1 ? 'Event' : 'Events'}
              </Text>
            </View>
          </View>

          <SafeTouchableOpacity
            style={localStyles.homeHeaderPrimaryAction}
            onPress={() => navigation.navigate('CreateEvent')}
            activeOpacity={0.9}
          >
            <View style={localStyles.homeHeaderPrimaryActionInner}>
              <Feather name="plus" size={16} color="#0F172A" />
              <Text style={localStyles.homeHeaderPrimaryActionText}>New</Text>
            </View>
          </SafeTouchableOpacity>
        </View>

        <View style={localStyles.homeHeaderMetaRow}>
          <Text style={localStyles.homeHeaderMetaText}>Manage Events</Text>
          <Text style={localStyles.homeHeaderMetaSeparator}>|</Text>
          <Text style={localStyles.homeHeaderMetaText}>Track Performance</Text>
          <Text style={localStyles.homeHeaderMetaSeparator}>|</Text>
          <Text style={localStyles.homeHeaderMetaText}>Grow Audience</Text>
        </View>

        {isFromCache && (
          <View style={localStyles.cacheNotice}>
            <Feather name="wifi-off" size={14} color="#92400E" />
            <Text style={localStyles.cacheNoticeText}>Showing cached events</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[localStyles.container, { paddingTop: insets.top }]}>
        <MyEventsHeader insets={insets} events={events} isFromCache={isFromCache} />
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={localStyles.loadingText}>Loading your events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[localStyles.container, { paddingTop: insets.top }]}>
      <MyEventsHeader insets={insets} events={events} isFromCache={isFromCache} />
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={localStyles.eventsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0277BD']}
            tintColor="#0277BD"
          />
        }
        ItemSeparatorComponent={() => <View style={localStyles.eventSeparator} />}
        ListHeaderComponent={
          <View style={localStyles.content}>
            <AppErrorBanner error={error} onRetry={() => loadMyEvents(true)} disabled={loading} />
            <View style={localStyles.sectionHeaderRow}>
              <Text style={localStyles.sectionHeaderTitle}>My Events</Text>
              <Text style={localStyles.sectionHeaderCount}>{events.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={loading ? null : renderEmptyState}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  sectionHeaderCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'System',
  },
  myEventsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  myEventsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myEventsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  myEventsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'System',
  },
  cacheNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cacheNoticeText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'System',
  },
  homeHeaderContainer: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 1,
  },
  homeHeaderCard: {
    borderRadius: 30,
    padding: 20,
    shadowColor: 'rgba(147, 150, 156, 0.4)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 95, 95, 0.34)',
    position: 'relative',
    overflow: 'hidden',
  },
  homeHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  homeHeaderOrbOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    left: -90,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  homeHeaderOrbTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -120,
    right: -120,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  homeHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  homeHeaderLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    gap: 12,
  },
  homeHeaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  homeHeaderAvatarInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeHeaderTitleBlock: {
    flex: 0,
    alignItems: 'flex-start',
  },
  homeHeaderWelcomeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  homeHeaderNameText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: 'System',
    marginTop: 2,
  },
  homeHeaderCountText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 4,
  },
  homeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  homeHeaderIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  homeHeaderMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'System',
    fontWeight: '600',
  },
  homeHeaderMetaSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 8,
    fontFamily: 'System',
    fontWeight: '700',
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  eventBadgeTextDark: {
    color: '#0F172A',
  },
  badgeUpcoming: {
    backgroundColor: 'rgba(16, 185, 129, 0.90)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeToday: {
    backgroundColor: 'rgba(245, 158, 11, 0.92)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeEnded: {
    backgroundColor: 'rgba(100, 116, 139, 0.86)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeFeatured: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(15, 23, 42, 0.10)',
  },
  eventBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  eventIconChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(2, 119, 189, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(2, 119, 189, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBadgesInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  eventActionsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionEdit: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  iconActionDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  eventSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  eventSubText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'System',
  },
  eventFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  eventPricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  eventStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventStatTextHeart: {
    color: '#EF4444',
  },
  homeHeaderPrimaryAction: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  homeHeaderPrimaryActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  homeHeaderPrimaryActionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  eventSeparator: {
    height: 12,
  },
  eventStatusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  eventQuickActions: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  quickActionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  eventPriceContainer: {
    flex: 1,
  },
  eventPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0277BD',
    fontFamily: 'System',
  },
  eventStats: {
    flexDirection: 'row',
    gap: 12,
  },
  eventStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'System',
  },
});

export default MyEventsScreen;
