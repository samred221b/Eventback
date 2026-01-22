import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../providers/FavoritesProvider';
import apiService from '../services/api';
import EnhancedSearch from '../components/EnhancedSearch';
import EmptyState from '../components/EmptyState';
import homeStyles from '../styles/homeStyles';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status
import { logger } from '../utils/logger';
import cacheService, { TTL } from '../utils/cacheService';
import AppErrorBanner from '../components/AppErrorBanner';
import { toAppError, createOfflineCachedNotice } from '../utils/appError';

const CALENDAR_EVENTS_CACHE_KEY = 'calendar:events';

const cacheCalendarEvents = async (events) => {
  try {
    await cacheService.set(CALENDAR_EVENTS_CACHE_KEY, events, { ttlMs: TTL.SIX_HOURS });
  } catch (e) {
    // Silent fail
  }
};

const loadCalendarEventsFromCache = async () => {
  try {
    const { data } = await cacheService.get(CALENDAR_EVENTS_CACHE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

export default function CalendarScreen({ navigation }) {
  const { favorites, toggleFavorite } = useFavorites();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for search
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false); // Add this line
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // New filter state

  // Refresh events when screen comes into focus
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const isLoadingRef = useRef(false);
  const lastRefreshTime = useRef(Date.now());

  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };

  const loadEvents = async (isRefresh = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setIsLoading(!isRefresh);
    setIsRefreshing(isRefresh);
    setError(null);

    // Cache-first: show cached events immediately for better UX
    try {
      const cachedEvents = await loadCalendarEventsFromCache();
      if (cachedEvents.length > 0) {
        const sortedCached = [...cachedEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
        setAllEvents(sortedCached);
        filterEvents(sortedCached, searchQuery, activeFilter);
      }
    } catch (e) {
      // Silent fail
    }

    let fetchedEvents = [];
    let backendFailed = false;
    let timeoutOccurred = false;

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      fetchedEvents = await loadCalendarEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError(createOfflineCachedNotice('Showing cached calendar events'));
      } else {
        setError(toAppError(new Error('Failed to load calendar events. Please check your connection.')));
      }
      const sortedOffline = [...fetchedEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
      setAllEvents(sortedOffline);
      filterEvents(sortedOffline, searchQuery, activeFilter);
      setIsLoading(false);
      setIsRefreshing(false);
      setHasInitialLoad(true);
      isLoadingRef.current = false;
      return;
    }

    try {
      const response = await apiService.getEvents();
      if (response.success) {
        fetchedEvents = response.data || [];
        await cacheCalendarEvents(fetchedEvents);
      } else {
        backendFailed = true;
      }
    } catch (error) {
      const messageLower = String(error?.message || '').toLowerCase();
      const isTimeout = error?.name === 'AbortError' || messageLower.includes('timeout');
      if (isTimeout) {
        timeoutOccurred = true;
        setError(toAppError(error));
      } else {
        backendFailed = true;
        logger.error('CalendarScreen loadEvents error:', error);
      }
    }

    if (backendFailed && !timeoutOccurred) {
      fetchedEvents = await loadCalendarEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError(createOfflineCachedNotice('Showing cached calendar events'));
      } else {
        setError(toAppError(new Error('Failed to load calendar events. Please check your connection.')));
      }
    }

    const sortedEvents = [...fetchedEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    setAllEvents(sortedEvents);
    filterEvents(sortedEvents, searchQuery, activeFilter);
    setIsLoading(false);
    setIsRefreshing(false);
    setHasInitialLoad(true);
    isLoadingRef.current = false;
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown
      
      // Only refresh if cooldown has passed
      if (hasInitialLoad && !isLoadingRef.current && timeSinceLastRefresh > REFRESH_COOLDOWN) {
        lastRefreshTime.current = now;
        loadEvents();
      }
    }, [hasInitialLoad])
  );

  useFocusEffect(
    React.useCallback(() => {
      // Reset overlay state when the screen gains focus
      setShowOverlay(false);

      return () => {
        // Cleanup if necessary when the screen loses focus
      };
    }, [])
  );

  const filterEvents = (eventsList, query, filter = activeFilter) => {
    let filtered = eventsList;
    
    // Apply search query
    if (query.trim()) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(query.toLowerCase()) ||
        event.description?.toLowerCase().includes(query.toLowerCase()) ||
        event.location?.name?.toLowerCase().includes(query.toLowerCase()) ||
        event.location?.city?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply smart filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    switch (filter) {
      case 'thisWeek':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate <= weekFromNow;
        });
        break;
      case 'free':
        filtered = filtered.filter(event => event.price === 0 || event.price === '0');
        break;
      case 'online':
        filtered = filtered.filter(event => event.mode === 'Online');
        break;
      case 'inperson':
        filtered = filtered.filter(event => event.mode === 'In-person');
        break;
      case 'favorites':
        filtered = filtered.filter(event => favorites.some(fav => fav.id === event._id || fav.id === event.id));
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }
    
    setEvents(filtered);
  };

  useEffect(() => {
    filterEvents(allEvents, searchQuery, activeFilter);
  }, [searchQuery, activeFilter]);

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < adjustedStart; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const isFavorite = (eventId) => {
    return favorites.some(fav => fav.id === eventId || fav._id === eventId);
  };

  const handleEventPress = (event) => {
    const eventId = event?._id || event?.id;

    const serializable = makeEventSerializable(event);
    serializable.organizerName = event.organizerName || event.organizer || '';
    serializable.importantInfo = event.importantInfo || '';

    navigation.navigate('EventDetails', { event: serializable });

    // Track view
    if (!eventId) return;
    apiService.trackEventView(eventId).catch(() => {
      // Silent fail
    });
  };

  const makeEventSerializable = (event) => {
    return {
      id: event._id,
      _id: event._id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      price: event.price,
      currency: event.currency,
      // Add new pricing fields
      vipPrice: event.vipPrice,
      vvipPrice: event.vvipPrice,
      earlyBirdPrice: event.earlyBirdPrice,
      onDoorPrice: event.onDoorPrice,
      ticketsAvailableAt: event.ticketsAvailableAt,
      category: event.category,
      imageUrl: event.imageUrl || event.image,
      organizerId: event.organizerId, // Preserve organizerId
    };
  };

  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'Time TBA';
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return 'Time TBA';
    }
  };

  const getDaysLeft = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past Event';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 Day Left';
    return `${diffDays} Days Left`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate event statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });

  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  
  const thisWeekEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= thisWeekStart && eventDate <= thisWeekEnd;
  });

  const thisMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth.getMonth() && 
           eventDate.getFullYear() === currentMonth.getFullYear();
  });

  const selectedDayEvents = getEventsForDate(selectedDate);

  const onRefresh = () => {
    loadEvents(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent', flex: 1 }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, zIndex: 5, elevation: 4 }}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View pointerEvents="none" style={styles.pageBackground}>
          <View style={styles.backgroundOrbOne} />
          <View style={styles.backgroundOrbTwo} />
          <View style={styles.backgroundOrbThree} />
          <View style={styles.backgroundOrbFour} />
          <LinearGradient
            colors={['rgba(2, 119, 189, 0.14)', 'rgba(1, 87, 155, 0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backgroundRibbon}
          />
        </View>
        <AppErrorBanner error={error} onRetry={() => loadEvents(true)} disabled={isRefreshing} />

        <View style={[homeStyles.homeHeaderContainer, {  zIndex: 1 }]}> 
          <LinearGradient
            colors={['#0277BD', '#01579B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[homeStyles.homeHeaderCard, { zIndex: 1, elevation: 1 }]}
          >
            <View style={homeStyles.homeHeaderBg} pointerEvents="none">
              <View style={homeStyles.homeHeaderOrbOne} />
              <View style={homeStyles.homeHeaderOrbTwo} />
            </View>
            <View style={homeStyles.homeHeaderTopRow}>
              <Text style={homeStyles.homeHeaderNameText}>Calendar</Text>
              <View style={homeStyles.homeHeaderActions}>
                <TouchableOpacity 
                  style={homeStyles.homeHeaderIconButton}
                  onPress={() => setShowSearch(!showSearch)}
                  activeOpacity={0.7}
                >
                  <Feather name="search" size={20} color="rgba(255, 255, 255, 1)" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={homeStyles.homeHeaderIconButton}
                  onPress={goToToday}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={20} color="rgba(255, 255, 255, 1)" />
                </TouchableOpacity>
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
        {/* Enhanced Search Bar */}
        {showSearch && (
          <View style={homeStyles.homeSearchSection}>
            <EnhancedSearch
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events by name, location, category..."
              events={allEvents}
              onEventSelect={(event) => {
                handleEventPress(event);
                setShowSearch(false);
              }}
            />
          </View>
        )}

        {/* Stats Section */}
        <View style={[styles.statsSection, { zIndex: 1, elevation: 3 }]}>
          <View style={[styles.statCardContainer, styles.statCardSpacing]}>
            <View style={homeStyles.countdownInlineDepthLayer} pointerEvents="none">
              <View style={styles.statCardGlowOrbOneGreen} />
              <View style={styles.statCardGlowOrbTwoGreen} />
              <View style={homeStyles.countdownInlineHighlight} />
            </View>
            <View style={styles.statCardContent}>
              <Feather name="calendar" size={22} color="#FFFFFF" />
              <Text style={styles.statNumber}>{todayEvents.length}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Today</Text>
            </View>
          </View>
          <View style={[styles.statCardContainer, styles.statCardSpacing]}>
            <View style={homeStyles.countdownInlineDepthLayer} pointerEvents="none">
              <View style={styles.statCardGlowOrbOneOrange} />
              <View style={styles.statCardGlowOrbTwoOrange} />
              <View style={homeStyles.countdownInlineHighlight} />
            </View>
            <View style={styles.statCardContent}>
              <Feather name="clock" size={22} color="#FFFFFF" />
              <Text style={styles.statNumber}>{thisWeekEvents.length}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>This Week</Text>
            </View>
          </View>
          <View style={styles.statCardContainer}>
            <View style={homeStyles.countdownInlineDepthLayer} pointerEvents="none">
              <View style={styles.statCardGlowOrbOneRed} />
              <View style={styles.statCardGlowOrbTwoRed} />
              <View style={homeStyles.countdownInlineHighlight} />
            </View>
            <View style={styles.statCardContent}>
              <Feather name="trending-up" size={22} color="#FFFFFF" />
              <Text style={styles.statNumber}>{thisMonthEvents.length}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>This Month</Text>
            </View>
          </View>
        </View>

        {/* View Tabs */}
        <View style={styles.viewToggleContainer}>
          <View style={styles.viewTogglePill}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'calendar' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.85}
            >
              <Text style={[styles.viewToggleText, viewMode === 'calendar' && styles.viewToggleTextActive]}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'timeline' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('timeline')}
              activeOpacity={0.85}
            >
              <Text style={[styles.viewToggleText, viewMode === 'timeline' && styles.viewToggleTextActive]}>Timeline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'calendar' ? (
          <>
            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                style={styles.monthChevron}
                onPress={() => changeMonth(-1)}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={24} color="#0277BD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthLabel}
                onPress={() => setShowMonthPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.monthText}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthChevron}
                onPress={() => changeMonth(1)}
                activeOpacity={0.7}
              >
                <Feather name="chevron-right" size={24} color="#0277BD" />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              style={styles.calendarContainer}
            >
              <View style={homeStyles.homeHeaderBg} pointerEvents="none">
                <View style={homeStyles.homeHeaderOrbOne} />
                <View style={homeStyles.homeHeaderOrbTwo} />
              </View>
              <View style={[styles.calendarContainer, styles.blueCompactCalendarContainer]}>
                {/* Days of Week */}
                <View style={styles.weekDaysRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.weekDayText}>{day}</Text>
                  ))}
                </View>

                {/* Calendar Days Grid */}
                <View style={styles.daysGrid}>
                  {getDaysInMonth().map((day, index) => {
                    if (!day) {
                      return <View key={`empty-${index}`} style={styles.dayCell} />;
                    }

                    const dayEvents = getEventsForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          isSelected && styles.selectedDayCell,
                          isToday && !isSelected && styles.todayCell,
                        ]}
                        onPress={() => setSelectedDate(day)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dayText,
                          (isToday || isSelected) && styles.activeDayText,
                        ]}>
                          {day.getDate()}
                        </Text>
                        {hasEvents && (
                          <View style={styles.eventBadge} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </LinearGradient>
          </>
        ) : (
          <>
            {/* Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.timelineTitle}>Timeline</Text>

              {events
                .filter(event => new Date(event.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 6)
                .length === 0 && !isLoading ? (
                <EmptyState
                  icon="calendar"
                  iconSize={48}
                  title="No Upcoming Events"
                  description={
                    searchQuery.trim()
                      ? `No events found for "${searchQuery}"`
                      : 'There are no upcoming events right now.'
                  }
                  primaryAction={searchQuery.trim() ? () => setSearchQuery('') : () => navigation.navigate('Events')}
                  primaryActionText={searchQuery.trim() ? 'Clear Search' : 'Browse Events'}
                  primaryActionIcon={searchQuery.trim() ? 'x' : 'calendar'}
                  secondaryAction={() => navigation.navigate('Home')}
                  secondaryActionText="Go Home"
                  secondaryActionIcon="home"
                  gradientColors={['#0277BD', '#01579B']}
                />
              ) : (
                <View style={styles.timelineContainer}>
                  {events
                    .filter(event => new Date(event.date) >= new Date())
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 6)
                    .map((event, index, list) => {
                      const isLeft = index % 2 === 0;
                      const showTop = index !== 0;
                      const showBottom = index !== list.length - 1;
                      const timelineImageUri =
                        event?.imageUrl ||
                        event?.image ||
                        event?.image?.url ||
                        event?.coverImageUrl ||
                        event?.coverImage ||
                        null;

                      return (
                        <View key={event._id || event.id || `${event.title}:${index}`} style={styles.timelineRow}>
                          <View style={[styles.timelineSide, !isLeft && styles.timelineSideSpacer]}>
                            {isLeft && (
                              <TouchableOpacity
                                style={styles.timelineCard}
                                onPress={() => handleEventPress(event)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.timelineCardTitle} numberOfLines={2}>{event.title}</Text>
                                <Text style={styles.timelineCardMeta} numberOfLines={1}>
                                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {event.time ? ` • ${formatTime(event.time)}` : ''}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          <View style={styles.timelineCenter}>
                            {showTop && <View style={[styles.timelineLine, styles.timelineLineTop]} />}
                            <View style={styles.timelineNode}>
                              {timelineImageUri ? (
                                <Image source={{ uri: timelineImageUri }} style={styles.timelineNodeImage} resizeMode="cover" />
                              ) : (
                                <LinearGradient colors={['#0277BD', '#01579B']} style={styles.timelineNodeImage}>
                                  <Feather name="image" size={18} color="#FFFFFF" />
                                </LinearGradient>
                              )}
                            </View>
                            {showBottom && <View style={[styles.timelineLine, styles.timelineLineBottom]} />}
                          </View>

                          <View style={[styles.timelineSide, isLeft && styles.timelineSideSpacer]}>
                            {!isLeft && (
                              <TouchableOpacity
                                style={styles.timelineCard}
                                onPress={() => handleEventPress(event)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.timelineCardTitle} numberOfLines={2}>{event.title}</Text>
                                <Text style={styles.timelineCardMeta} numberOfLines={1}>
                                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {event.time ? ` • ${formatTime(event.time)}` : ''}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                </View>
              )}
            </View>
          </>
        )}

        {/* Upcoming Events Section */}
        <View style={styles.upcomingEventsSection}>
          <Text style={styles.upcomingEventsTitle}>Upcoming Events</Text>
          
          {events
            .filter(event => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5)
            .length === 0 && !isLoading ? (
            <EmptyState
              icon="calendar"
              iconSize={48}
              title="No Events This Month"
              description={
                searchQuery.trim()
                  ? `No events found for "${searchQuery}"`
                  : "There are no events scheduled for this month. Check other months or browse all events."
              }
              primaryAction={searchQuery.trim() ? () => setSearchQuery('') : () => navigation.navigate('Events')}
              primaryActionText={searchQuery.trim() ? 'Clear Search' : 'Browse Events'}
              primaryActionIcon={searchQuery.trim() ? 'x' : 'calendar'}
              secondaryAction={() => navigation.navigate('Home')}
              secondaryActionText="Go Home"
              secondaryActionIcon="home"
              gradientColors={['#0277BD', '#01579B']}
            />
          ) : (
            events
              .filter(event => new Date(event.date) >= new Date())
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(0, 5)
              .map((event, index) => (
                <TouchableOpacity
                  key={event._id}
                  style={styles.upcomingEventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.8}
                >
                  <View style={styles.upcomingEventDepthLayer} pointerEvents="none">
                    <View style={styles.upcomingEventGlowOrbOne} />
                    <View style={styles.upcomingEventGlowOrbTwo} />
                    <View style={styles.upcomingEventHighlight} />
                  </View>
                  <View
                    style={styles.upcomingEventGradient}
                  >
                    {/* Days Left Badge */}
                    <View style={styles.daysLeftBadge}>
                      <Text style={styles.daysLeftText}>
                        {getDaysLeft(event.date)}
                      </Text>
                    </View>

                    {/* Event Info */}
                    <View style={styles.upcomingEventInfo}>
                      <Text style={styles.upcomingEventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      
                      <View style={styles.upcomingEventMeta}>
                        <View style={styles.upcomingMetaRow}>
                          <Feather name="calendar" size={14} color="rgba(255, 255, 255, 0.9)" />
                          <Text style={styles.upcomingMetaText}>
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                        
                        <View style={styles.upcomingMetaRow}>
                          <Feather name="clock" size={14} color="rgba(255, 255, 255, 0.9)" />
                          <Text style={styles.upcomingMetaText}>
                            {formatTime(event.time)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.upcomingMetaRow}>
                        <Feather name="map-pin" size={14} color="rgba(255, 255, 255, 0.9)" />
                        <Text style={styles.upcomingMetaText} numberOfLines={1}>
                          {event.location?.city || event.location?.address || 'Location TBA'}
                        </Text>
                      </View>
                    </View>

                    {/* Arrow Icon */}
                    <Feather name="chevron-right" size={20} color="rgba(255, 255, 255, 0.9)" />
                  </View>
                </TouchableOpacity>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
  },
  viewToggleContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  viewTogglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 999,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(15, 23, 42, 0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  viewToggleTextActive: {
    color: '#0F172A',
  },
  timelineSection: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  timelineContainer: {
    paddingBottom: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 10,
  },
  timelineSide: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineSideSpacer: {
    opacity: 0,
  },
  timelineCenter: {
    width: 64,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    width: 4,
    backgroundColor: 'rgba(2, 119, 189, 0.22)',
    left: (64 - 4) / 2,
    borderRadius: 2,
  },
  timelineLineTop: {
    top: -10,
    bottom: '50%',
  },
  timelineLineBottom: {
    top: '50%',
    bottom: -10,
  },
  timelineNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(2, 119, 189, 0.25)',
    shadowColor: 'rgba(15, 23, 42, 0.18)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  timelineNodeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  timelineCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 18,
  },
  timelineCardMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pageBackground: {
    position: 'absolute',
    top: -140,
    left: -120,
    right: -120,
    height: 520,
    zIndex: -1,
  },
  backgroundOrbOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(4, 73, 112, 0.46)',
    top: 0,
    left: 0,
  },
  backgroundOrbTwo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 180,
    backgroundColor: 'rgba(1, 132, 155, 0.67)',
    top: 700,
    right: -40,
  },
  backgroundOrbThree: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 130,
    backgroundColor: 'rgba(2, 137, 209, 0.59)',
    top: 700,
    left: 0,
  },
  backgroundOrbFour: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(1, 87, 155, 0.18)',
    bottom: -100,
    right: 10,
  },
  backgroundRibbon: {
    position: 'absolute',
    top: 200,
    left: -60,
    right: -60,
    height: 220,
    transform: [{ rotate: '-6deg' }],
  },
  blueCompactCalendarContainer: {
    maxHeight: 300,
    backgroundColor: 'rgba(2, 119, 189, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  monthChevron: {
    padding: 8,
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  // Calendar
  calendarContainer: {
    marginHorizontal: 10,
    marginVertical: 10, // Reduced from -10 // Reduced from 20
    borderRadius: 16,
    padding: 5, 
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 8,
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    width: '100%',
    marginVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
    paddingHorizontal: 0,
    rowGap: 8,  // Controls vertical spacing between rows
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days = ~14.28%
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 1,
    paddingHorizontal: 1,
  },
  selectedDayCell: {
    backgroundColor: '#0277BD',
  },
  todayCell: {
    backgroundColor: '#059669',
  },
  dayText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activeDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventBadge: {
    width: 18,
    height: 8,
    backgroundColor: '#F59E0B', // Bright amber for visibility
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  // Upcoming Events Section
  upcomingEventsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  upcomingEventsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  upcomingEventCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#060B14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  upcomingEventDepthLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  upcomingEventGlowOrbOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -100,
    left: -90,
    backgroundColor: 'rgba(2, 119, 189, 0.35)',
  },
  upcomingEventGlowOrbTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: -120,
    right: -120,
    backgroundColor: 'rgba(1, 87, 155, 0.30)',
  },
  upcomingEventHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ skewY: '-8deg' }],
    opacity: 0.5,
  },
  upcomingEventGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  daysLeftBadge: {
    backgroundColor: 'rgba(2, 119, 189, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  upcomingEventInfo: {
    flex: 1,
    gap: 6,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
  },
  upcomingEventMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingMetaText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  statCardContainer: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#060B14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 10,
    overflow: 'hidden',
  },
  statCardSpacing: {
    marginRight: 12,
  },
  statCardGlowOrbOneGreen: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -120,
    left: -110,
    backgroundColor: 'rgba(2, 119, 189, 0.35)',
  },
  statCardGlowOrbTwoGreen: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -140,
    right: -140,
    backgroundColor: 'rgba(1, 87, 155, 0.30)',
  },
  statCardGlowOrbOneOrange: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -120,
    left: -110,
    backgroundColor: 'rgba(2, 119, 189, 0.35)',
  },
  statCardGlowOrbTwoOrange: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -140,
    right: -140,
    backgroundColor: 'rgba(1, 87, 155, 0.30)',
  },
  statCardGlowOrbOneRed: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -120,
    left: -110,
    backgroundColor: 'rgba(2, 119, 189, 0.35)',
  },
  statCardGlowOrbTwoRed: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -140,
    right: -140,
    backgroundColor: 'rgba(1, 87, 155, 0.30)',
  },
  statCardGradient: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardContent: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  offlineBanner: {
    backgroundColor: '#FFD700',
    padding: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  offlineText: {
    color: '#000',
    fontWeight: '500',
  },
  // Filter Chips Styles
  filterChipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  filterChipsScroll: {
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#0277BD',
    borderColor: '#0277BD',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Month Navigation Styles
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
});
