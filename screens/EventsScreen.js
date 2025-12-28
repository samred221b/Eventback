import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../providers/AuthProvider';
import { useFavorites } from '../providers/FavoritesProvider';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';
import EnhancedSearch from '../components/EnhancedSearch';
import homeStyles from '../styles/homeStyles';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status
import { logger } from '../utils/logger';

const EVENTS_CACHE_KEY = '@eventopia_events';


const cacheEvents = async (events) => {
  try {
    await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch (e) {
    // Silent fail
  }
};

const loadEventsFromCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
    const parsedEvents = cached ? JSON.parse(cached) : [];
    return parsedEvents;
  } catch (e) {
    return [];
  }
};

const cacheFirstPageEvents = async (events) => {
  try {
    const cacheData = {
      timestamp: new Date().toISOString(),
      events: events.slice(0, 20), // Cache only the first 20 events
    };
    await AsyncStorage.setItem('@events_cache', JSON.stringify(cacheData));
  } catch (e) {
    // Silent fail
  }
};

const loadCachedFirstPageEvents = async () => {
  try {
    const cached = await AsyncStorage.getItem('@events_cache');
    if (cached) {
      const { events } = JSON.parse(cached);
      return events;
    }
  } catch (e) {
    // Silent fail
  }
  return [];
};

const renderEmptyComponent = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No events available</Text>
    <Text style={styles.emptySubtext}>Please check your connection or try again later.</Text>
  </View>
);

const EventsScreen = ({ navigation }) => {
  const { backendConnected } = useAuth();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for overall stats
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false); // New state for secondary filters
  const [error, setError] = useState(null);
  const { favorites, toggleFavorite } = useFavorites();
  const isLoadingRef = useRef(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // New smart filter state

  const categories = [
    { key: 'all', icon: 'grid', label: 'All' },
    { key: 'music', icon: 'music', label: 'Music' },
    { key: 'culture', icon: 'award', label: 'Culture' },
    { key: 'education', icon: 'book', label: 'Education' },
    { key: 'sports', icon: 'activity', label: 'Sports' },
    { key: 'art', icon: 'feather', label: 'Art' },
    { key: 'business', icon: 'briefcase', label: 'Business' },
    { key: 'food', icon: 'coffee', label: 'Food' },
    { key: 'technology', icon: 'cpu', label: 'Tech' },
    { key: 'health', icon: 'heart', label: 'Health' },
    { key: 'fashion', icon: 'shopping-bag', label: 'Fashion' },
    { key: 'travel', icon: 'map-pin', label: 'Travel' },
    { key: 'photography', icon: 'camera', label: 'Photo' },
    { key: 'gaming', icon: 'target', label: 'Gaming' },
    { key: 'automotive', icon: 'truck', label: 'Auto' },
    { key: 'charity', icon: 'gift', label: 'Charity' },
    { key: 'networking', icon: 'users', label: 'Network' },
    { key: 'workshop', icon: 'tool', label: 'Workshop' },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date (Newest First)', icon: 'calendar' },
    { key: 'price_low', label: 'Price (Low to High)', icon: 'arrow-up' },
    { key: 'price_high', label: 'Price (High to Low)', icon: 'arrow-down' },
    { key: 'popular', label: 'Most Popular', icon: 'trending-up' },
    { key: 'name', label: 'Name (A-Z)', icon: 'type' },
  ];

  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Debounce search - only search after user stops typing for 500ms
    if (searchQuery.trim().length === 0) {
      // If search is cleared, reload immediately
      loadEvents();
      return;
    }
    
    if (searchQuery.trim().length < 3) {
      // Don't search until at least 3 characters
      return;
    }
    
    const timeoutId = setTimeout(() => {
      loadEvents();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]); // Only reload when search query changes

  useEffect(() => {
    // Initial load
    loadEvents();
  }, []);

  useEffect(() => {
    // Reload when event type changes (not category)
    loadEvents();
  }, [selectedEventType]);

  useEffect(() => {
    // Apply smart filter when it changes
    filterEventsByCategory(selectedCategory, activeFilter);
  }, [activeFilter, selectedCategory]);

  const handleRefresh = () => {
    if (isLoadingRef.current) return; // Prevent multiple refreshes
    loadEvents(true);
  };

  const loadEvents = async (isRefresh = false) => {
    isLoadingRef.current = true;
    const shouldShowLoader = isRefresh || hasInitialLoad;
    setIsLoading(shouldShowLoader);
    setIsRefreshing(isRefresh);
    setError(null);

    const params = {};
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    // Load cached events first
    const cachedEvents = await loadCachedFirstPageEvents();
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents); // Render cached events immediately
    }

    let fetchedEvents = [];
    let backendFailed = false;
    let timeoutOccurred = false;

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      fetchedEvents = await loadEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError('Offline: Showing cached events');
      } else {
        setError('Failed to load events. Please check your connection.');
      }
      setEvents(fetchedEvents);
      isLoadingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
      setHasInitialLoad(true);
      return;
    }

    try {
      const response = await apiService.getEvents(params);
      if (response.success) {
        fetchedEvents = response.data || [];
        setAllEvents(fetchedEvents);
        await cacheEvents(fetchedEvents);
        await cacheFirstPageEvents(fetchedEvents); // Cache first page events
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
        logger.error('EventsScreen loadEvents error:', error);
      }
    }

    if (backendFailed && !timeoutOccurred) {
      fetchedEvents = await loadEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError('Offline: Showing cached events');
      } else {
        setError('Failed to load events. Please check your connection.');
      }
      setEvents(fetchedEvents);
    }

    if (!backendFailed) {
      let filteredEvents = fetchedEvents;
      if (selectedCategory !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.category === selectedCategory);
      }
      if (selectedEventType === 'featured') {
        filteredEvents = filteredEvents.filter(event => event.featured === true);
      } else if (selectedEventType === 'upcoming') {
        const now = new Date();
        filteredEvents = filteredEvents.filter(event => new Date(event.date) >= now);
      }
      setEvents(filteredEvents);
    }

    isLoadingRef.current = false;
    setIsLoading(false);
    setIsRefreshing(false);
    setHasInitialLoad(true);
  };

  // Local filtering function for category changes and smart filters
  const filterEventsByCategory = (category, smartFilter = activeFilter) => {
    let filtered = allEvents;
    
    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(event => event.category === category);
    }
    
    // Apply smart filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    switch (smartFilter) {
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

  // Apply sorting to events
  const applySorting = (sortKey) => {
    const sortedEvents = [...events].sort((a, b) => {
      switch (sortKey) {
        case 'date':
          return new Date(b.date) - new Date(a.date); // Newest first
        case 'price_low':
          return (a.price || 0) - (b.price || 0); // Low to high
        case 'price_high':
          return (b.price || 0) - (a.price || 0); // High to low
        case 'popular':
          return (b.likeCount || 0) - (a.likeCount || 0); // Most popular first
        case 'name':
          return a.title.localeCompare(b.title); // A-Z
        default:
          return 0;
      }
    });
    setEvents(sortedEvents);
  };

  // Helper function to make event object serializable and compatible
  const makeEventSerializable = (event) => {
    return {
      id: event._id || event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: {
        name: event.location?.address || event.location?.name || 'Location TBA',
        address: event.location?.address || '',
        city: event.location?.city || '',
        country: event.location?.country || 'Ethiopia',
        coordinates: event.location?.coordinates?.coordinates || [9.0320, 38.7469]
      },
      price: event.price || 0,
      currency: event.currency || 'ETB',
      category: event.category,
      mode: event.mode,
      organizer: event.organizerId?.name || event.organizer || 'Unknown Organizer',
      attendeeCount: event.attendeeCount || 0,
      likeCount: event.likeCount || 0,
      views: event.views || 0,
      featured: event.featured || false,
      requiresRegistration: event.requiresRegistration || false,
      capacity: event.capacity,
      tags: event.tags || [],
      imageUrl: event.imageUrl || event.image || null,
      importantInfo: event.importantInfo || '',
      organizerName: event.organizerName || event.organizer || '',
    };
  };

  const handleEventPress = async (event) => {
    // Track view
    try {
      await apiService.trackEventView(event.id);
    } catch (error) {
      // Silent fail
    }
    
    navigation.navigate('EventDetails', { 
      event: makeEventSerializable(event)
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date TBA';
    }
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return 'Time TBA';
    }
  };

  const formatPrice = (price, currency = 'ETB') => {
    if (price === 0) return 'Free';
    return `${price} ${currency}`;
  };

  const getDaysLeft = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past Event';
    if (diffDays === 0) return 'Live Now';
    if (diffDays === 1) return '1 Day Left';
    return `${diffDays} Days Left`;
  };

  const isFavorite = (eventId) => {
    return favorites.some(fav => fav.id === eventId || fav._id === eventId);
  };

  const renderEventCard = (event) => (
    <View key={event._id} style={styles.eventCard}>
      {/* Cover Image */}
      <TouchableOpacity 
        style={styles.eventImageContainer}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.9}
      >
        {(event.imageUrl || event.image) ? (
          <Image 
            source={{ uri: event.imageUrl || event.image }} 
            style={styles.eventImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.eventImagePlaceholder}>
            <Feather name="image" size={48} color="#9ca3af" />
          </View>
        )}
        {event.featured && (
          <View style={styles.featuredBadgeContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.featuredBadge}
            >
              <Feather name="star" size={10} color="#FFFFFF" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </LinearGradient>
          </View>
        )}
        {/* Top Right Days Left Badge */}
        <View style={styles.eventOverlay}>
          <View style={[
            styles.eventStatusBadge,
            getDaysLeft(event.date) === 'Live Now' && styles.liveNowBadge
          ]}>
            <Text style={styles.eventStatusText}>{getDaysLeft(event.date)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Text Section */}
      <View style={styles.eventContent}>
        {/* Event Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Date & Location Row */}
        <View style={styles.eventInfoRow}>
          <View style={styles.eventInfoItem}>
            <Feather name="calendar" size={12} color="#6b7280" />
            <Text style={styles.eventInfoText}>
              {formatDate(event.date)}
            </Text>
          </View>
          <View style={styles.eventInfoItem}>
            <Feather name="map-pin" size={12} color="#6b7280" />
            <Text style={styles.eventInfoText} numberOfLines={1}>
              {event.location?.city || 'Location TBA'}
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => handleEventPress(event)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEventList = () => {
    if (events.length === 0) {
      if (!hasInitialLoad) {
        // Avoid showing empty-state message on first app open
        // Render a minimal placeholder while background fetch completes
        return <View style={{ padding: 16 }} />;
      }
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events available</Text>
          <Text style={styles.emptySubtext}>Please check your connection or try again later.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={events}
        keyExtractor={event => event._id || event.id}
        renderItem={({ item }) => renderEventCard(item)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.eventsContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (isLoading && !isRefreshing && hasInitialLoad) {
    return (
      <SafeAreaView style={[styles.container, { flex: 1 }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]} edges={['top', 'bottom']}>
      {/* Home-style Header */}
      <View style={[homeStyles.homeHeaderContainer, { marginTop: 0 }]} > 
          <LinearGradient
            colors={['#0277BD', '#01579B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={homeStyles.homeHeaderCard}
          >
            <View style={homeStyles.homeHeaderTopRow}>
              <View>
                <Text style={homeStyles.homeHeaderNameText}>Events</Text>
              </View>
              <View style={homeStyles.homeHeaderActions}>
                <TouchableOpacity 
                  style={homeStyles.homeHeaderIconButton}
                  onPress={() => setShowFilters(!showFilters)}
                  activeOpacity={0.7}
                >
                  <Feather name="search" size={20} color="rgba(255, 255, 255, 1)" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={homeStyles.homeHeaderIconButton}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Feather name="refresh-cw" size={20} color="rgba(255, 255, 255, 1)" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={homeStyles.homeHeaderIconButton}
                  onPress={() => setShowSecondaryFilters(!showSecondaryFilters)}
                  activeOpacity={0.7}
                >
                  <Feather name="sliders" size={20} color="rgba(255, 255, 255, 1)" />
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

        {/* Enhanced Search Bar - Show when filters toggled */}
        {showFilters && (
          <View style={styles.searchSection}>
            <EnhancedSearch
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events, venues, categories..."
              events={allEvents}
              onEventSelect={handleEventPress}
            />
          </View>
        )}

        {/* Filter Sections - Show when secondary filters toggled */}
        {showSecondaryFilters && (
          <View>
            {/* Smart Filter Chips */}
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
          </View>
        )}

        {/* Horizontal Scrollable Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryChip,
                selectedCategory === category.key && styles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedCategory(category.key);
                filterEventsByCategory(category.key);
              }}
              activeOpacity={0.7}
            >
              <Feather
                name={category.icon}
                size={10}
                color={selectedCategory === category.key ? '#FFFFFF' : '#1F2937'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.key && styles.categoryChipTextActive
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Menu - Show when sort toggled */}
        {showSortMenu && (
          <View style={styles.sortMenuSection}>
            <View style={styles.sortMenuHeader}>
              <Text style={styles.sortMenuTitle}>Sort Events By</Text>
              <TouchableOpacity onPress={() => setShowSortMenu(false)}>
                <Feather name="x" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortMenu(false);
                  // Apply sorting logic here
                  applySorting(option.key);
                }}
                activeOpacity={0.7}
              >
                <Feather name={option.icon} size={18} color={sortBy === option.key ? "#0277BD" : "#666"} />
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Feather name="check" size={18} color="#0277BD" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Events Content */}
        <View style={styles.eventsContent}>
          {/* Offline banner */}
          {error === 'Offline: Showing cached events' && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>{error}</Text>
            </View>
          )}

          {/* Fatal error */}
          {error && error !== 'Offline: Showing cached events' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadEvents()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={events}
              keyExtractor={event => event._id || event.id}
              renderItem={({ item }) => renderEventCard(item)}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              contentContainerStyle={styles.eventsContainer}
              showsVerticalScrollIndicator={false}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={renderEmptyComponent}
            />
          )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoriesContainer: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 12,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    marginRight: 6,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backdropFilter: 'blur(10px)',
    gap: 3,
    maxWidth: 100,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(2, 119, 189, 0.8)',
    borderColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: 'rgba(2, 119, 189, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  // Events Content
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
  eventsContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  eventsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    gap: 12,
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 5, // Ensure container is above other elements but below cards
  },
  // Event Card
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    flexBasis: '48%', // Change width to flexBasis
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    minHeight: 300, // Ensures equal height for all cards
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  eventImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  featuredBadgeContainer: {
    position: 'absolute',
    top: 0,
    left: -17,
    zIndex: 3,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius:3,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  eventStatusBadge: {
    backgroundColor: 'rgba(2, 119, 189, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 20, // Match parent card's radius
    borderBottomLeftRadius: 12,
  },
  liveNowBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  eventStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  eventContent: {
    padding: 12,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  eventDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  eventInfoRow: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 10,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  eventInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  eventActions: {
    flexDirection: 'column',
    gap: 8,
  },
  viewDetailsButton: {
    backgroundColor: '#0277BD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonActive: {
    borderColor: '#0277BD',
    backgroundColor: '#E3F2FD',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontWeight: '600',
    color: '#1F2937',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#0277BD',
    fontWeight: '600',
  },
  decorativeShape1: {
    position: 'absolute',
    top: '20%',
    left: '-25%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: '15%',
    right: '-30%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
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
});

export default EventsScreen;
