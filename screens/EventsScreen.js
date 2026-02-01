import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../providers/AuthProvider';
import { useFavorites } from '../providers/FavoritesProvider';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';
import EmptyState from '../components/EmptyState';
import cacheService, { TTL } from '../utils/cacheService';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import EnhancedSearch from '../components/EnhancedSearch';
import homeStyles from '../styles/homeStyles';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status
import { logger } from '../utils/logger';
import { standardizeEventForDetails } from '../utils/dataProcessor';
import { APP_ERROR_SEVERITY, toAppError, createOfflineCachedNotice } from '../utils/appError';

const EVENTS_CACHE_KEY = 'events:all';
const EVENTS_FIRST_PAGE_CACHE_KEY = 'events:firstPage';

const cacheEvents = async (events) => {
  try {
    await cacheService.set(EVENTS_CACHE_KEY, events, { ttlMs: TTL.ONE_HOUR });
  } catch (e) {
    // Silent fail
  }
};

const loadEventsFromCache = async () => {
  try {
    const { data } = await cacheService.get(EVENTS_CACHE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

const cacheFirstPageEvents = async (events) => {
  try {
    await cacheService.set(EVENTS_FIRST_PAGE_CACHE_KEY, events.slice(0, 20), { ttlMs: TTL.ONE_HOUR });
  } catch (e) {
    // Silent fail
  }
};

const loadCachedFirstPageEvents = async () => {
  try {
    const { data } = await cacheService.get(EVENTS_FIRST_PAGE_CACHE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // Silent fail
  }
  return [];
};

const renderEmptyComponent = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No events available</Text>
    <Text style={styles.emptySubtext}>Try selecting a different category or check back later.</Text>
  </View>
);

const EventsScreen = ({ navigation, route }) => {
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // New smart filter state

  // Next event state
  const [nextEvent, setNextEvent] = useState(null);
  const [hotEvent, setHotEvent] = useState(null);
  const [culturalEvent, setCulturalEvent] = useState(null);
  const [nextCountdown, setNextCountdown] = useState('');
  const [hotCountdown, setHotCountdown] = useState('');
  const [culturalCountdown, setCulturalCountdown] = useState('');
  const countdownRotateAnim = useRef(new Animated.Value(0)).current;
  const countdownPulseAnim = useRef(new Animated.Value(1)).current;
  const [eventSpotlightWidth, setEventSpotlightWidth] = useState(0);
  const [eventSpotlightIndex, setEventSpotlightIndex] = useState(0);
  const eventSpotlightIndexRef = useRef(0);
  const eventSpotlightTranslateX = useRef(new Animated.Value(0)).current;

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
    { key: 'religious', icon: 'heart', label: 'Religious' },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date (Newest First)', icon: 'calendar' },
    { key: 'price_low', label: 'Price (Low to High)', icon: 'arrow-up' },
    { key: 'price_high', label: 'Price (High to Low)', icon: 'arrow-down' },
    { key: 'popular', label: 'Most Popular', icon: 'trending-up' },
    { key: 'name', label: 'Name (A-Z)', icon: 'type' },
  ];

  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };

  const appliedInitialParamsRef = useRef(false);

  useEffect(() => {
    if (appliedInitialParamsRef.current) return;
    const initialEventType = route?.params?.initialEventType;
    const initialSortBy = route?.params?.initialSortBy;

    if (typeof initialEventType === 'string') {
      setSelectedEventType(initialEventType);
    }
    if (typeof initialSortBy === 'string') {
      setSortBy(initialSortBy);
    }

    if (initialEventType || initialSortBy) {
      appliedInitialParamsRef.current = true;
    }
  }, [route?.params?.initialEventType, route?.params?.initialSortBy]);

  useEffect(() => {
    // Debounce search - only search after user stops typing for 500ms
    if (searchQuery.trim().length === 0) {
      // If search is cleared, just filter existing events without reloading from server
      filterEventsByCategory(selectedCategory, activeFilter);
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
    // Keep list sorted whenever sort changes
    applySorting(sortBy);
  }, [sortBy]);

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

  const loadEvents = async (isRefresh = false, options = {}) => {
    isLoadingRef.current = true;
    const reason = options?.reason;
    const isUserRetry = reason === 'retry';
    setIsRetrying(isUserRetry);

    const shouldShowLoader = isRefresh || (!hasInitialLoad && !isUserRetry);
    setIsLoading(shouldShowLoader);
    setIsRefreshing(isRefresh);
    setError(null);

    // Always show cached events immediately for better UX
    const cachedEvents = await loadEventsFromCache();
    if (cachedEvents.length > 0) {
      setEvents(cachedEvents);
      setAllEvents(cachedEvents);
    }

    const params = {};
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    let fetchedEvents = [];
    let backendFailed = false;
    let timeoutOccurred = false;

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      fetchedEvents = await loadEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError(createOfflineCachedNotice());
      } else {
        setError(toAppError(new Error('Failed to load events. Please check your connection.')));
      }
      setEvents(fetchedEvents);
      isLoadingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsRetrying(false);
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
        setError(toAppError(error));
      } else {
        backendFailed = true;
        logger.error('EventsScreen loadEvents error:', error);
      }
    }

    if (backendFailed && !timeoutOccurred) {
      fetchedEvents = await loadEventsFromCache();
      if (fetchedEvents.length > 0) {
        setError(createOfflineCachedNotice());
      } else {
        setError(toAppError(new Error('Failed to load events. Please check your connection.')));
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
    setIsRetrying(false);
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
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    
    switch (smartFilter) {
      // Date Range Filters
      case 'all_dates':
        // No date filtering
        break;
      case 'today':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        });
        break;
      case 'thisWeek':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate <= weekFromNow;
        });
        break;
      case 'thisMonth':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate <= thisMonthEnd;
        });
        break;
      case 'nextMonth':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
        });
        break;
      
      // Price Range Filters
      case 'all_prices':
        // No price filtering
        break;
      case 'free':
        filtered = filtered.filter(event => event.price === 0 || event.price === '0');
        break;
      case 'under100':
        filtered = filtered.filter(event => {
          const price = parseFloat(event.price) || 0;
          return price > 0 && price < 100;
        });
        break;
      case '100to500':
        filtered = filtered.filter(event => {
          const price = parseFloat(event.price) || 0;
          return price >= 100 && price <= 500;
        });
        break;
      case '500to1000':
        filtered = filtered.filter(event => {
          const price = parseFloat(event.price) || 0;
          return price >= 500 && price <= 1000;
        });
        break;
      case 'over1000':
        filtered = filtered.filter(event => {
          const price = parseFloat(event.price) || 0;
          return price > 1000;
        });
        break;
      
      // Event Mode Filters
      case 'all_modes':
        // No mode filtering
        break;
      case 'online':
        filtered = filtered.filter(event => event.mode === 'Online');
        break;
      case 'inperson':
        filtered = filtered.filter(event => event.mode === 'In-person');
        break;
      case 'hybrid':
        filtered = filtered.filter(event => event.mode === 'Hybrid');
        break;
      
      // Other Filters
      case 'all':
        // No additional filtering
        break;
      case 'featured':
        filtered = filtered.filter(event => event.featured === true);
        break;
      case 'favorites':
        filtered = filtered.filter(event => favorites.some(fav => fav.id === event._id || fav.id === event.id));
        break;
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.date) >= now);
        break;
      case 'past':
        filtered = filtered.filter(event => new Date(event.date) < now);
        break;
      
      // Legacy filters for backward compatibility
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
      // Add new pricing fields
      vipPrice: event.vipPrice,
      vvipPrice: event.vvipPrice,
      earlyBirdPrice: event.earlyBirdPrice,
      onDoorPrice: event.onDoorPrice,
      ticketsAvailableAt: event.ticketsAvailableAt,
      category: event.category,
      mode: event.mode,
      organizer: event.organizerId?.name || event.organizer || 'Unknown Organizer',
      organizerId: event.organizerId, // Preserve organizerId
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

  const handleEventPress = (event) => {
    const eventId = event?._id || event?.id;

    navigation.navigate('EventDetails', {
      event: makeEventSerializable(event),
    });

    // Track view
    if (!eventId) return;
    apiService.trackEventView(eventId).catch(() => {
      // Silent fail
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

  // const getDaysLeft = (dateString) => {
  //   const eventDate = new Date(dateString);
  //   const today = new Date();
  //   const diffTime = eventDate - today;
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   
  //   if (diffDays < 0) return 'Past Event';
  //   if (diffDays === 0) return 'Live Now';
  //   if (diffDays === 1) return '1 Day Left';
  //   return `${diffDays} Days Left`;
  // };

  const isFavorite = (eventId) => {
    return favorites.some(fav => fav.id === eventId || fav._id === eventId);
  };

  // Find next upcoming event
  useEffect(() => {
    const sourceEvents = (allEvents && allEvents.length > 0) ? allEvents : events;
    if (!sourceEvents || sourceEvents.length === 0) return;

    const now = new Date();
    const upcomingEvents = sourceEvents
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const upcoming = upcomingEvents[0] || null;
    setNextEvent(upcoming);

    const hotSorted = [...upcomingEvents].sort((a, b) => {
      const scoreA =
        (a.featured ? 1000000 : 0) +
        ((a.likeCount || 0) * 1000) +
        ((a.attendeeCount || 0) * 50) +
        (a.views || 0);
      const scoreB =
        (b.featured ? 1000000 : 0) +
        ((b.likeCount || 0) * 1000) +
        ((b.attendeeCount || 0) * 50) +
        (b.views || 0);
      return scoreB - scoreA;
    });

    const nextId = upcoming?._id || upcoming?.id;
    const hotCandidate = hotSorted.find(e => (e?._id || e?.id) !== nextId) || null;
    setHotEvent(hotCandidate);

    const hotId = hotCandidate?._id || hotCandidate?.id;
    const thirdCandidates = upcomingEvents.filter((e) => {
      const id = e?._id || e?.id;
      if (nextId && id === nextId) return false;
      if (hotId && id === hotId) return false;
      return true;
    });

    const randomPick = thirdCandidates.length
      ? thirdCandidates[Math.floor(Math.random() * thirdCandidates.length)]
      : null;
    setCulturalEvent(randomPick);
  }, [allEvents, events]);

  useEffect(() => {
    if (hotEvent || culturalEvent) return;
    eventSpotlightIndexRef.current = 0;
    setEventSpotlightIndex(0);
    if (eventSpotlightWidth) {
      eventSpotlightTranslateX.setValue(0);
    }
  }, [culturalEvent, hotEvent, eventSpotlightTranslateX, eventSpotlightWidth]);

  const computeCountdownText = (dateValue) => {
    const now = new Date();
    const eventTime = new Date(dateValue);
    const diff = eventTime - now;

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  // Countdown timer for next event
  useEffect(() => {
    if (!nextEvent) return;

    const updateCountdown = () => {
      setNextCountdown(computeCountdownText(nextEvent.date));
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(interval);
  }, [nextEvent]);

  // Countdown timer for hot event
  useEffect(() => {
    if (!hotEvent) return;

    const updateCountdown = () => {
      setHotCountdown(computeCountdownText(hotEvent.date));
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(interval);
  }, [hotEvent]);

  // Countdown timer for cultural event
  useEffect(() => {
    if (!culturalEvent) return;

    const updateCountdown = () => {
      setCulturalCountdown(computeCountdownText(culturalEvent.date));
    };

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(interval);
  }, [culturalEvent]);

  // Countdown rotation animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(countdownRotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: (t) => t,
        useNativeDriver: true,
      })
    ).start();
  }, [countdownRotateAnim]);

  // Countdown pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(countdownPulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(countdownPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [countdownPulseAnim]);

  // Spotlight carousel: slide between Next and Hot (fixed size)
  useEffect(() => {
    if (!nextEvent) return;
    if (!eventSpotlightWidth) return;

    const slideCount = 1 + (hotEvent ? 1 : 0) + (culturalEvent ? 1 : 0);
    if (slideCount < 2) {
      eventSpotlightIndexRef.current = 0;
      setEventSpotlightIndex(0);
      eventSpotlightTranslateX.setValue(0);
      return;
    }

    eventSpotlightTranslateX.setValue(-eventSpotlightIndexRef.current * eventSpotlightWidth);

    const interval = setInterval(() => {
      const nextIndex = (eventSpotlightIndexRef.current + 1) % slideCount;
      Animated.timing(eventSpotlightTranslateX, {
        toValue: -nextIndex * eventSpotlightWidth,
        duration: 520,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        eventSpotlightIndexRef.current = nextIndex;
        setEventSpotlightIndex(nextIndex);
      });
    }, 6500);

    return () => clearInterval(interval);
  }, [culturalEvent, nextEvent, hotEvent, eventSpotlightTranslateX, eventSpotlightWidth]);

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
              colors={['#0277BD', '#01579B']}
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
        {/* <View style={styles.eventOverlay}>
          <View style={[
            styles.eventStatusBadge,
            getDaysLeft(event.date) === 'Live Now' && styles.liveNowBadge
          ]}>
            <Text style={styles.eventStatusText}>{getDaysLeft(event.date)}</Text>
          </View>
        </View> */}
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
        return (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0277BD" />
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13, fontWeight: '600' }}>
              Getting data, please wait...
            </Text>
          </View>
        );
      }
      return (
        <EmptyState
          icon="calendar"
          iconSize={64}
          title="No Events Available"
          description={searchQuery.trim() 
            ? `No events found for "${searchQuery}"`
            : "There are no events to display at the moment. Try adjusting your filters or check back later."
          }
          primaryAction={searchQuery.trim() ? () => setSearchQuery('') : () => fetchEvents()}
          primaryActionText={searchQuery.trim() ? 'Clear Search' : 'Refresh'}
          primaryActionIcon={searchQuery.trim() ? 'x' : 'refresh-cw'}
          secondaryAction={() => navigation.navigate('Home')}
          secondaryActionText="Explore Home"
          secondaryActionIcon="home"
          gradientColors={['#0277BD', '#01579B']}
        />
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

  if (isLoading && !isRefreshing && hasInitialLoad && !isRetrying) {
    return (
      <SafeAreaView style={[styles.container, { flex: 1 }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]} edges={['top']}>
      {/* Home-style Header */}
      <View style={[homeStyles.homeHeaderContainer, { marginTop: 0 }]} > 
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
          <View style={styles.filterSectionsContainer}>
            {/* Date Range Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsScroll}
              >
                {[
                  { key: 'all_dates', label: 'All Dates', icon: 'calendar' },
                  { key: 'today', label: 'Today', icon: 'clock' },
                  { key: 'tomorrow', label: 'Tomorrow', icon: 'sunrise' },
                  { key: 'thisWeek', label: 'This Week', icon: 'calendar' },
                  { key: 'thisMonth', label: 'This Month', icon: 'calendar' },
                  { key: 'nextMonth', label: 'Next Month', icon: 'calendar' },
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

            {/* Price Range Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsScroll}
              >
                {[
                  { key: 'all_prices', label: 'All Prices', icon: 'dollar-sign' },
                  { key: 'free', label: 'Free', icon: 'tag' },
                  { key: 'under100', label: 'Under 100 ETB', icon: 'arrow-down' },
                  { key: '100to500', label: '100-500 ETB', icon: 'arrow-right' },
                  { key: '500to1000', label: '500-1000 ETB', icon: 'arrow-right' },
                  { key: 'over1000', label: 'Over 1000 ETB', icon: 'arrow-up' },
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

            {/* Event Mode Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Event Mode</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsScroll}
              >
                {[
                  { key: 'all_modes', label: 'All Modes', icon: 'grid' },
                  { key: 'online', label: 'Online', icon: 'wifi' },
                  { key: 'inperson', label: 'In-person', icon: 'users' },
                  { key: 'hybrid', label: 'Hybrid', icon: 'layers' },
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

            {/* Other Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Other Filters</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsScroll}
              >
                {[
                  { key: 'all', label: 'All', icon: 'grid' },
                  { key: 'featured', label: 'Featured', icon: 'star' },
                  { key: 'favorites', label: 'Favorites', icon: 'heart' },
                  { key: 'upcoming', label: 'Upcoming', icon: 'clock' },
                  { key: 'past', label: 'Past Events', icon: 'archive' },
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
              <View style={styles.categoryDepthLayer} pointerEvents="none">
                <View style={styles.categoryGlowOrbOne} />
                <View style={styles.categoryGlowOrbTwo} />
                <View style={styles.categoryHighlight} />
              </View>
              <Feather
                name={category.icon}
                size={10}
                color={selectedCategory === category.key ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'}
                style={{ zIndex: 1 }}
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

        {/* Next/Hot Event Spotlight */}
        {nextEvent && (
          <View style={homeStyles.countdownInlineContainer}>
            <View style={homeStyles.countdownInlineDepthLayer} pointerEvents="none">
              <View style={homeStyles.countdownInlineGlowOrbOne} />
              <View style={homeStyles.countdownInlineGlowOrbTwo} />
              <View style={homeStyles.countdownInlineHighlight} />
            </View>

            <View
              style={homeStyles.countdownInlineCarouselViewport}
              onLayout={(e) => {
                const w = Math.round(e.nativeEvent.layout.width);
                if (!w) return;
                if (w === eventSpotlightWidth) return;
                setEventSpotlightWidth(w);
                eventSpotlightTranslateX.setValue(-eventSpotlightIndexRef.current * w);
              }}
            >
              <Animated.View
                style={[
                  homeStyles.countdownInlineCarouselTrack,
                  { transform: [{ translateX: eventSpotlightTranslateX }] },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleEventPress(nextEvent)}
                  activeOpacity={0.85}
                  style={[homeStyles.countdownInlineCarouselSlide, { width: eventSpotlightWidth || undefined }]}
                >
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
                        {nextEvent.imageUrl || nextEvent.image ? (
                          <Image
                            source={{ uri: nextEvent.imageUrl || nextEvent.image }}
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
                    <Animated.View
                      style={[
                        homeStyles.countdownInlineTimerPill,
                        {
                          transform: [
                            {
                              scale: countdownPulseAnim.interpolate({
                                inputRange: [1, 1.05],
                                outputRange: [1, 1.05],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={homeStyles.countdownTimer}>{nextCountdown}</Text>
                    </Animated.View>
                  </View>
                </TouchableOpacity>

                {hotEvent && (
                  <TouchableOpacity
                    onPress={() => handleEventPress(hotEvent)}
                    activeOpacity={0.85}
                    style={[homeStyles.countdownInlineCarouselSlide, { width: eventSpotlightWidth || undefined }]}
                  >
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
                          {hotEvent.imageUrl || hotEvent.image ? (
                            <Image
                              source={{ uri: hotEvent.imageUrl || hotEvent.image }}
                              style={homeStyles.countdownEventImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <LinearGradient
                              colors={['#EF4444', '#F97316']}
                              style={homeStyles.countdownEventImage}
                            >
                              <Feather name="trending-up" size={24} color="#FFFFFF" />
                            </LinearGradient>
                          )}
                        </Animated.View>

                        <View style={homeStyles.countdownInlineTextWrap}>
                          <Text style={homeStyles.countdownLabel}>Hot Event</Text>
                          <Text style={homeStyles.countdownEventTitle} numberOfLines={1}>
                            {hotEvent.title}
                          </Text>
                        </View>
                      </View>
                      <Animated.View
                        style={[
                          homeStyles.countdownInlineTimerPill,
                          {
                            transform: [
                              {
                                scale: countdownPulseAnim.interpolate({
                                  inputRange: [1, 1.05],
                                  outputRange: [1, 1.05],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Text style={homeStyles.countdownTimer}>{hotCountdown}</Text>
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                )}

                {culturalEvent && (
                  <TouchableOpacity
                    onPress={() => handleEventPress(culturalEvent)}
                    activeOpacity={0.85}
                    style={[homeStyles.countdownInlineCarouselSlide, { width: eventSpotlightWidth || undefined }]}
                  >
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
                          {culturalEvent.imageUrl || culturalEvent.image ? (
                            <Image
                              source={{ uri: culturalEvent.imageUrl || culturalEvent.image }}
                              style={homeStyles.countdownEventImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <LinearGradient
                              colors={['#8B5CF6', '#EC4899']}
                              style={homeStyles.countdownEventImage}
                            >
                              <Feather name="award" size={24} color="#FFFFFF" />
                            </LinearGradient>
                          )}
                        </Animated.View>

                        <View style={homeStyles.countdownInlineTextWrap}>
                          <Text style={homeStyles.countdownLabel}>Spotlight Event</Text>
                          <Text style={homeStyles.countdownEventTitle} numberOfLines={1}>
                            {culturalEvent.title}
                          </Text>
                        </View>
                      </View>
                      <Animated.View
                        style={[
                          homeStyles.countdownInlineTimerPill,
                          {
                            transform: [
                              {
                                scale: countdownPulseAnim.interpolate({
                                  inputRange: [1, 1.05],
                                  outputRange: [1, 1.05],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Text style={homeStyles.countdownTimer}>{culturalCountdown}</Text>
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          </View>
        )}

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
          <AppErrorBanner
            error={error}
            onRetry={() => loadEvents(false, { reason: 'retry' })}
            disabled={isLoadingRef.current}
            loading={isRetrying}
          />

          {error && error.severity === APP_ERROR_SEVERITY.ERROR ? (
            <AppErrorState error={error} onRetry={() => loadEvents(false, { reason: 'retry' })} />
          ) : (
            <FlatList
              data={events}
              keyExtractor={event => event._id || event.id}
              renderItem={({ item }) => renderEventCard(item)}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              contentContainerStyle={styles.eventsContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
                  colors={['#0277BD', '#01579B']}
                  tintColor="#0277BD"
                  progressBackgroundColor="transparent"
                />
              }
              ListEmptyComponent={renderEmptyComponent}
            />
          )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
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
  filterSectionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  filterChipsScroll: {
    paddingHorizontal: 0,
  },
  categoriesContainer: {
    backgroundColor: 'transparent',
    marginBottom: 12,
    marginTop: 16,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#060B14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    marginRight: 6,
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 4,
    maxWidth: 100,
    maxHeight: 30,
    overflow: 'hidden',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(2, 119, 189, 0.6)',
    borderColor: 'rgba(2, 119, 189, 0.5)',
    shadowColor: 'rgba(2, 119, 189, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  categoryDepthLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryGlowOrbOne: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -60,
    left: -50,
    backgroundColor: 'rgba(2, 119, 189, 0.35)',
  },
  categoryGlowOrbTwo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -80,
    right: -80,
    backgroundColor: 'rgba(1, 87, 155, 0.30)',
  },
  categoryHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ skewY: '-8deg' }],
    opacity: 0.5,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
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
  // offlineBanner: {
  //   backgroundColor: '#FEF3C7',
  //   paddingVertical: 6,
  //   alignItems: 'center',
  // },
  // offlineText: {
  //   color: '#92400E',
  //   fontSize: 13,
  //   fontWeight: '600',
  // },
  eventsContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  eventsContainer: {
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'stretch',
    position: 'relative',
    zIndex: 5, // Ensure container is above other elements but below cards
  },
  // Event Card
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    flexBasis: '48%', // Change width to flexBasis
    borderWidth: 2,
    borderColor: 'rgba(210, 211, 211, 0.36)',
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
  // eventStatusBadge: {
  //   backgroundColor: 'rgba(2, 119, 189, 0.9)',
  //   paddingHorizontal: 8,
  //   paddingVertical: 4,
  //   borderTopRightRadius: 20, // Match parent card's radius
  //   borderBottomLeftRadius: 12,
  // },
  // liveNowBadge: {
  //   backgroundColor: 'rgba(220, 38, 38, 0.9)',
  // },
  // eventStatusText: {
  //   color: '#FFFFFF',
  //   fontSize: 10,
  //   fontWeight: '700',
  // },
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
  // errorContainer: {
  //   padding: 40,
  //   alignItems: 'center',
  // },
  // errorText: {
  //   fontSize: 16,
  //   color: '#dc2626',
  //   textAlign: 'center',
  //   marginBottom: 16,
  // },
  // retryButton: {
  //   backgroundColor: '#3b82f6',
  //   paddingHorizontal: 20,
  //   paddingVertical: 10,
  //   borderRadius: 6,
  // },
  // retryButtonText: {
  //   color: '#ffffff',
  //   fontSize: 14,
  //   fontWeight: '600',
  // },
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
