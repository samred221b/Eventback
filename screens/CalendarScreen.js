import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavorites } from '../providers/FavoritesProvider';
import apiService from '../services/api';
import EnhancedSearch from '../components/EnhancedSearch';
import homeStyles from '../styles/homeStyles';

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

  const insets = useSafeAreaInsets();

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
        console.log('📅 CalendarScreen focused - refreshing events (cooldown passed)');
        lastRefreshTime.current = now;
        loadEvents();
      } else if (hasInitialLoad) {
        console.log('📅 CalendarScreen focused - skipping refresh (cooldown active)');
      }
    }, [hasInitialLoad])
  );

  const loadEvents = async () => {
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const response = await apiService.getEvents();
      
      if (response.success && response.data) {
        // Sort events by date (nearest first)
        const sortedEvents = response.data.sort((a, b) => {
          return new Date(a.date) - new Date(b.date);
        });
        setAllEvents(sortedEvents); // Store all events
        filterEvents(sortedEvents, searchQuery);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setHasInitialLoad(true);
    }
  };

  const filterEvents = (eventsList, query) => {
    if (!query.trim()) {
      setEvents(eventsList);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = eventsList.filter(event => {
      return (
        event.title?.toLowerCase().includes(lowerQuery) ||
        event.location?.city?.toLowerCase().includes(lowerQuery) ||
        event.location?.name?.toLowerCase().includes(lowerQuery) ||
        event.category?.toLowerCase().includes(lowerQuery)
      );
    });
    setEvents(filtered);
  };

  useEffect(() => {
    filterEvents(allEvents, searchQuery);
  }, [searchQuery]);

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
      console.warn('Failed to track view:', error);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" backgroundColor="#000000" />
      <LinearGradient
        colors={['#ffffffff', '#e4e2e1ff']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={homeStyles.creativeBlobBlue} />
      <View style={homeStyles.creativeBlobGreen} />
      <View style={homeStyles.creativeBlobYellow} />
      <View style={homeStyles.decorativeShape1} />
      <View style={homeStyles.decorativeShape2} />
      <View style={homeStyles.decorativeShape3} />
      <View style={homeStyles.decorativeShape4} />
      <View style={homeStyles.decorativeShape6} />
      <View style={homeStyles.decorativeShape7} />
      <View style={homeStyles.decorativeShape8} />
      <View style={homeStyles.decorativeShape9} />
      <View style={homeStyles.decorativeShape10} />
      <View style={homeStyles.largeCurvedWave} />
      <View style={homeStyles.vibrantAccentRing1} />
      <View style={homeStyles.vibrantAccentRing2} />
      <View style={homeStyles.headerAura} />
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Home-style Header */}
        <View style={[homeStyles.homeHeaderContainer, { marginTop: insets.top }]}> 
          <LinearGradient
            colors={['#0277BD', '#01579B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={homeStyles.homeHeaderCard}
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
        <View style={styles.statsSection}>
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

        {/* Month Selector */}
        <View style={styles.monthSelector}>
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
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.calendarBackground}
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
                      <View style={styles.eventDot} />
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
                <LinearGradient
                  colors={['#E3F2FD', '#BBDEFB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
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
                </LinearGradient>
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
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  monthChevron: {
    padding: 8,
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  // Calendar
  calendarBackground: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 12,
  },
  calendarContainer: {
    backgroundColor: 'transparent',
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
    color: 'rgba(255, 255, 255, 0.9)',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  dayCell: {
    width: '13.2%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 3,
  },
  selectedDayCell: {
    backgroundColor: '#0277BD',
  },
  todayCell: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  activeDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  // Upcoming Events Section
  upcomingEventsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  upcomingEventGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  daysLeftBadge: {
    backgroundColor: '#0277BD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardGradient: {
    flex: 1,
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
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
});
