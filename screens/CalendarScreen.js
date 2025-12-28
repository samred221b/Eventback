import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../providers/FavoritesProvider';
import apiService from '../services/api';
import EnhancedSearch from '../components/EnhancedSearch';
import homeStyles from '../styles/homeStyles';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status
import { logger } from '../utils/logger';
import { getWithTTL, setWithTTL, TTL } from '../utils/cacheUtils';

const CALENDAR_EVENTS_CACHE_KEY = '@eventopia_calendar_events';

const cacheCalendarEvents = async (events) => {
  try {
    // Primary: cache with TTL for 6 hours
    await setWithTTL(CALENDAR_EVENTS_CACHE_KEY, events, TTL.SIX_HOURS);
  } catch (e) {
    // Fallback: store raw for backward compatibility
    try {
      await AsyncStorage.setItem(CALENDAR_EVENTS_CACHE_KEY, JSON.stringify(events));
    } catch (_) {
      // Silent fail
    }
  }
};

const loadCalendarEventsFromCache = async () => {
  // Try TTL cache first (return data even if expired for offline fallback)
  try {
    const { data } = await getWithTTL(CALENDAR_EVENTS_CACHE_KEY);
    if (Array.isArray(data)) return data;
  } catch (e) {
    // ignore and try raw cache
  }
  // Fallback to legacy raw cache
  try {
    const cached = await AsyncStorage.getItem(CALENDAR_EVENTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
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
  const [isLoading, setIsLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false); // Add this line
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // New filter state

  const insets = useSafeAreaInsets();

  const loadEvents = async (isRefresh = false) => {
    setIsLoading(!isRefresh);
    setIsRefreshing(isRefresh);
    setError(null);

    let fetchedEvents = [];
    let backendFailed = false;
    let timeoutOccurred = false;

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      fetchedEvents = await loadCalendarEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError('Offline: Showing cached calendar events');
      } else {
        setError('Failed to load calendar events. Please check your connection.');
      }
      setAllEvents(fetchedEvents);
      filterEvents(fetchedEvents, searchQuery, activeFilter);
      setIsLoading(false);
      setIsRefreshing(false);
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
        setError('Request Timeout: The server is taking too long to respond. Please check your internet connection or try again later.');
        Alert.alert('Request Timeout', 'The server is taking too long to respond. Please check your internet connection or try again later.');
      } else {
        backendFailed = true;
        logger.error('CalendarScreen loadEvents error:', error);
      }
    }

    if (backendFailed && !timeoutOccurred) {
      fetchedEvents = await loadCalendarEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError('Offline: Showing cached calendar events');
      } else {
        setError('Failed to load calendar events. Please check your connection.');
      }
    }

    const sortedEvents = fetchedEvents.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    setAllEvents(sortedEvents);
    filterEvents(sortedEvents, searchQuery, activeFilter);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Refresh events when screen comes into focus
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const isLoadingRef = useRef(false);
  const lastRefreshTime = useRef(Date.now());
  
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

  const handleEventPress = async (event) => {
    // Track view
    try {
      await apiService.trackEventView(event._id || event.id);
    } catch (error) {
      // Silent fail
    }
    
    const serializable = makeEventSerializable(event);
    serializable.organizerName = event.organizerName || event.organizer || '';
    serializable.importantInfo = event.importantInfo || '';
    navigation.navigate('EventDetails', { event: serializable });
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
      category: event.category,
      imageUrl: event.imageUrl || event.image,
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
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent', flex: 1 }]} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 ,  zIndex: 5, elevation:4}}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{error}</Text>
          </View>
        )}
        <View style={[homeStyles.homeHeaderContainer, {  zIndex: 1 }]}> 
          <LinearGradient
            colors={['#0277BD', '#01579B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[homeStyles.homeHeaderCard, { zIndex: 1, elevation: 1 }]}
          >
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
          <View style={styles.searchSection}>
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
        <View style={[styles.statsSection, { zIndex: 1, elevation: 3 }]} > 
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statCard}
          >
            <Feather name="calendar" size={22} color="#FFFFFF" />
            <Text style={styles.statNumber}>{todayEvents.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statCard}
          >
            <Feather name="clock" size={22} color="#FFFFFF" />
            <Text style={styles.statNumber}>{thisWeekEvents.length}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.statCard}
          >
            <Feather name="trending-up" size={22} color="#FFFFFF" />
            <Text style={styles.statNumber}>{thisMonthEvents.length}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </LinearGradient>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            {[
              { key: 'all', label: 'All', icon: 'grid' },
              { key: 'thisWeek', label: 'This Week', icon: 'calendar' },
              { key: 'free', label: 'Free', icon: 'tag' },
              { key: 'online', label: 'Online', icon: 'wifi' },
              { key: 'inperson', label: 'In-person', icon: 'users' },
              { key: 'favorites', label: 'Favorites', icon: 'heart' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  activeFilter === filter.key && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(filter.key)}
                activeOpacity={0.8}
              >
                <Feather 
                  name={filter.icon} 
                  size={14} 
                  color={activeFilter === filter.key ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Compact Search Row */}
        {showSearch && (
          <View style={styles.compactSearchContainer}>
            <View style={styles.searchInputContainer}>
              <Feather name="search" size={16} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
                autoFocus
                returnKeyType="search"
              />
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Feather name="x" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

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
          <View style={styles.calendarContainer}>
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

        {/* Upcoming Events Section */}
        <View style={styles.upcomingEventsSection}>
          <Text style={styles.upcomingEventsTitle}>Upcoming Events</Text>
          
          {events
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
                        <Feather name="calendar" size={14} color="#0277BD" />
                        <Text style={styles.upcomingMetaText}>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      
                      <View style={styles.upcomingMetaRow}>
                        <Feather name="clock" size={14} color="#0277BD" />
                        <Text style={styles.upcomingMetaText}>
                          {formatTime(event.time)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.upcomingMetaRow}>
                      <Feather name="map-pin" size={14} color="#0277BD" />
                      <Text style={styles.upcomingMetaText} numberOfLines={1}>
                        {event.location?.city || event.location?.address || 'Location TBA'}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow Icon */}
                  <Feather name="chevron-right" size={20} color="#0277BD" />
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 100,
    elevation: 5,
  },
  // Month Selector
  monthSelector: {
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
  },
  selectedDayCell: {
    backgroundColor: '#0277BD',
  },
  todayCell: {
    backgroundColor: '#059669',
  },
  dayText: {
    fontSize: 15,
    bottom: 'center',
    color: '#374151',
    fontWeight: '600',
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
    overflow: 'hidden',
  },
  upcomingEventGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#E3F2FD',
  },
  daysLeftBadge: {
    backgroundColor: '#0277BD',
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
    color: '#0277BD',
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
    color: '#0277BD',
    fontWeight: '600',
  },
  // Stats Section
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 6,
  },
  statNumber: {
    fontSize: 24,
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
  // Compact Search Styles
  compactSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearSearchButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
