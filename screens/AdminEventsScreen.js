import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/api';
import { adminEventsStyles } from '../styles/adminStyles';
import homeStyles from '../styles/homeStyles';
import { makeEventSerializable } from '../utils/dataProcessor';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { APP_ERROR_SEVERITY, toAppError } from '../utils/appError';
import cacheService, { TTL } from '../utils/cacheService';
import NetInfo from '@react-native-community/netinfo';

const AdminEventsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for local filtering
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOffline, setIsOffline] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: '',
    city: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const { user } = useAuth();

  const EVENTS_CACHE_KEY = 'admin:events';
  const EVENTS_FIRST_PAGE_CACHE_KEY = 'admin:events:firstPage';

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
      return [];
    }
  };

  const categories = [
    { key: 'all', icon: 'calendar', label: 'All' },
    { key: 'published', icon: 'check-circle', label: 'Live' },
    { key: 'draft', icon: 'file-text', label: 'Draft' },
    { key: 'cancelled', icon: 'x-circle', label: 'Cancel' },
    { key: 'completed', icon: 'check-square', label: 'Done' },
    { key: 'featured', icon: 'star', label: 'Star' },
  ];

  const fetchEvents = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setEvents([]);
      }
      if (page === 1) setError(null);

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      setIsOffline(!isConnected);

      // If offline and first page, try to load from cache
      if (!isConnected && page === 1) {
        const cachedEvents = await loadEventsFromCache();
        if (cachedEvents.length > 0) {
          setEvents(cachedEvents);
          setAllEvents(cachedEvents);
          setPagination({ current: 1, pages: 1, total: cachedEvents.length });
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // If offline and not first page, or no cache, show error
      if (!isConnected) {
        setError(toAppError(new Error('No internet connection'), { 
          fallbackMessage: 'No internet connection. Showing cached data if available.' 
        }));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const params = {
        page,
        limit: 20,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await apiService.get('/admin/events', { params, requireAuth: true });
      
      if (response.success) {
        if (reset || page === 1) {
          setEvents(response.data);
          setAllEvents(response.data); // Store all events for local filtering
          cacheEvents(response.data); // Cache the data
          cacheFirstPageEvents(response.data); // Cache first page
        } else {
          setEvents(prev => [...prev, ...response.data]);
          setAllEvents(prev => [...prev, ...response.data]); // Update all events
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      // If network error, try to load from cache
      if (page === 1) {
        const cachedEvents = await loadEventsFromCache();
        if (cachedEvents.length > 0) {
          setEvents(cachedEvents);
          setAllEvents(cachedEvents);
          setPagination({ current: 1, pages: 1, total: cachedEvents.length });
          setError(toAppError(error, { 
            fallbackMessage: 'Network error. Showing cached data.' 
          }));
        } else {
          setError(toAppError(error, { fallbackMessage: 'Failed to fetch events' }));
        }
      } else {
        setError(toAppError(error, { fallbackMessage: 'Failed to fetch events' }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents(1, true);
  };

  const handleLoadMore = () => {
    if (pagination.current < pagination.pages && !loading) {
      fetchEvents(pagination.current + 1);
    }
  };

  const filterEventsByCategory = useCallback((categoryKey) => {
    let filtered = [...allEvents];
    
    switch (categoryKey) {
      case 'all':
        // Show all events
        break;
      case 'published':
        filtered = filtered.filter(event => event.status === 'published');
        break;
      case 'draft':
        filtered = filtered.filter(event => event.status === 'draft');
        break;
      case 'cancelled':
        filtered = filtered.filter(event => event.status === 'cancelled');
        break;
      case 'completed':
        filtered = filtered.filter(event => event.status === 'completed');
        break;
      case 'featured':
        filtered = filtered.filter(event => event.featured);
        break;
      default:
        break;
    }
    
    setEvents(filtered);
  }, [allEvents]);

  const handleCategoryPress = useCallback((categoryKey) => {
    setSelectedCategory(categoryKey);
    filterEventsByCategory(categoryKey);
  }, [filterEventsByCategory]);

  const handleToggleFeature = useCallback(async (eventId) => {
    try {
      const response = await apiService.put(`/admin/events/${eventId}/feature`, {}, { requireAuth: true });
      if (response.success) {
        const updatedEvent = { featured: response.data.featured };
        
        // Update both displayed and all events
        setEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, ...updatedEvent }
            : event
        ));
        
        setAllEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, ...updatedEvent }
            : event
        ));

        // Update cache with new data
        cacheEvents(allEvents.map(event => 
          event._id === eventId 
            ? { ...event, ...updatedEvent }
            : event
        ));
        
        // Re-apply current category filter
        filterEventsByCategory(selectedCategory);
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to update event' }));
    }
  }, [selectedCategory, filterEventsByCategory, allEvents]);

  const handleUpdateStatus = useCallback(async (eventId, newStatus) => {
    try {
      const response = await apiService.put(`/admin/events/${eventId}/status`, { status: newStatus }, { requireAuth: true });
      if (response.success) {
        const updatedEvent = { status: response.data.status };
        
        // Update both displayed and all events
        setEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, ...updatedEvent }
            : event
        ));
        
        setAllEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, ...updatedEvent }
            : event
        ));
        
        // Update cache with new data
        cacheEvents(allEvents.map(event => 
          event._id === eventId 
            ? { ...event, ...updatedEvent }
            : event
        ));
        
        // Re-apply current category filter
        filterEventsByCategory(selectedCategory);
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to update event status' }));
    }
  }, [selectedCategory, filterEventsByCategory, allEvents]);

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
              setError(null);
              const response = await apiService.delete(`/admin/events/${eventId}`, { requireAuth: true });
              if (response.success) {
                setEvents(prev => prev.filter(event => event._id !== eventId));
              }
            } catch (error) {
              setError(toAppError(error, { fallbackMessage: 'Failed to delete event' }));
            }
          }
        }
      ]
    );
  };

  const handleEditEvent = (event) => {
    // Create a clean, serializable event object for navigation
    const cleanEvent = {
      _id: event._id || event.id,
      title: event.title || '',
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: typeof event.location === 'string' ? event.location : event.location?.address || '',
      category: event.category || '',
      mode: event.mode || 'In-person',
      price: event.price || 0,
      currency: event.currency || 'ETB',
      featured: event.featured || false,
      imageUrl: event.image || event.imageUrl || '',
      organizerId: event.organizerId?._id || event.organizerId?.id || event.organizerId,
      organizerName: event.organizerName || event.organizer || '',
      status: event.status || 'draft',
      tags: Array.isArray(event.tags) ? event.tags : [],
      capacity: event.capacity || null,
      vipPrice: event.vipPrice || null,
      vvipPrice: event.vvipPrice || null,
      earlyBirdPrice: event.earlyBirdPrice || null,
      onDoorPrice: event.onDoorPrice || null,
      ticketsAvailableAt: event.ticketsAvailableAt || null,
      importantInfo: event.importantInfo || '',
      requiresRegistration: event.requiresRegistration || false,
      isOnline: event.isOnline || false,
    };
    
    navigation.navigate('CreateEvent', { editEvent: cleanEvent });
  };

  const normalizeEventImageUri = (uri) => {
    if (!uri || typeof uri !== 'string') return null;
    const trimmed = uri.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://')) return trimmed.replace('http://', 'https://');
    return trimmed;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#0277BD';
      case 'draft': return '#64748B';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#10B981';
      default: return '#64748B';
    }
  };

  const renderEventCard = useCallback((event) => (
    <View key={event._id} style={adminEventsStyles.card}>
      <View style={adminEventsStyles.cardHeader}>
        <View style={adminEventsStyles.cardAvatar}>
          {event.image ? (
            <Image
              source={{ uri: normalizeEventImageUri(event.image) }}
              style={adminEventsStyles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <View style={adminEventsStyles.avatarPlaceholder}>
              <Feather name="calendar" size={18} color="#0277BD" />
            </View>
          )}
        </View>

        <View style={adminEventsStyles.cardInfo}>
          <Text style={adminEventsStyles.cardName}>{event.title}</Text>
          <Text style={adminEventsStyles.cardEmail}>
            {new Date(event.date).toLocaleDateString()} • {event.time}
          </Text>
          <View style={adminEventsStyles.cardStatusRow}>
            <View style={[
              adminEventsStyles.statusChip,
              { backgroundColor: getStatusColor(event.status) }
            ]}>
              <Text style={adminEventsStyles.statusText}>{event.status}</Text>
            </View>
            {event.featured && (
              <View style={adminEventsStyles.verifiedChip}>
                <Feather name="star" size={10} color="#FFFFFF" />
                <Text style={adminEventsStyles.verifiedText}>Featured</Text>
              </View>
            )}
          </View>
        </View>

        <View style={adminEventsStyles.cardActions}>
          <TouchableOpacity style={adminEventsStyles.actionButton} onPress={() => handleEditEvent(event)}>
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={adminEventsStyles.actionButton} onPress={() => handleToggleFeature(event._id)}>
            <Feather name="star" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[adminEventsStyles.actionButton, adminEventsStyles.toggleButton]}
            onPress={() => handleDeleteEvent(event._id)}
          >
            <Feather name="trash-2" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={adminEventsStyles.cardMeta}>
        <View style={adminEventsStyles.metaItem}>
          <View style={adminEventsStyles.metaIcon}>
            <Feather name="user" size={10} color="#0277BD" />
          </View>
          <Text style={adminEventsStyles.metaText}>{event.organizerId?.name || 'Unknown'}</Text>
        </View>
        <View style={adminEventsStyles.metaItem}>
          <View style={adminEventsStyles.metaIcon}>
            <Feather name="map-pin" size={10} color="#0277BD" />
          </View>
          <Text style={adminEventsStyles.metaText}>{event.location?.city || 'No location'}</Text>
        </View>
        <View style={adminEventsStyles.metaItem}>
          <View style={adminEventsStyles.metaIcon}>
            <Feather name="users" size={10} color="#0277BD" />
          </View>
          <Text style={adminEventsStyles.metaText}>{event.attendeeCount || 0} attending</Text>
        </View>
      </View>
    </View>
  ), [handleEditEvent, handleToggleFeature, handleDeleteEvent]);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOffline(!isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Try to load from cache first, then fetch fresh data if online
    const loadInitialData = async () => {
      const cachedEvents = await loadEventsFromCache();
      if (cachedEvents.length > 0) {
        setEvents(cachedEvents);
        setAllEvents(cachedEvents);
        setPagination({ current: 1, pages: 1, total: cachedEvents.length });
        setLoading(false);
      }
      // Always try to fetch fresh data
      fetchEvents(1, true);
    };

    loadInitialData();
  }, []); // Only fetch once on mount

  // Separate effect for search to avoid unnecessary refreshes
  useEffect(() => {
    if (searchQuery !== filters.search) {
      const timeout = setTimeout(() => {
        setFilters((prev) => {
          if ((prev.search || '') === (searchQuery || '')) return prev;
          return { ...prev, search: searchQuery };
        });
      }, 400);

      return () => clearTimeout(timeout);
    }
  }, [searchQuery, filters.search]);

  if (loading && events.length === 0) {
    return (
      <View style={adminEventsStyles.container}>
        <View style={adminEventsStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={adminEventsStyles.loadingText}>Loading events...</Text>
        </View>
      </View>
    );
  }

  if (error && error.severity === APP_ERROR_SEVERITY.ERROR && events.length === 0) {
    return (
      <View style={adminEventsStyles.container}>
        <AppErrorState error={error} onRetry={() => fetchEvents(1, true)} />
      </View>
    );
  }

  return (
    <View style={[adminEventsStyles.container, { paddingTop: insets.top }]}>
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
              <View style={homeStyles.modernDashboardAvatar}>
                <View style={homeStyles.modernDashboardAvatarInner}>
                  <Feather name="calendar" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Admin</Text>
                <Text style={homeStyles.homeHeaderNameText}>Manage Events</Text>
              </View>
            </View>
            <View style={homeStyles.homeHeaderActions}>
              <TouchableOpacity
                style={homeStyles.homeHeaderIconButton}
                onPress={handleRefresh}
              >
                <Feather name="refresh-cw" size={18} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={homeStyles.homeHeaderIconButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={20} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>{pagination.total || 0} total</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>{events.length} loaded</Text>
            {isOffline && (
              <>
                <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
                <Text style={[homeStyles.homeHeaderMetaText, { color: '#F59E0B' }]}>Offline</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      <View style={adminEventsStyles.searchContainer}>
        <View style={adminEventsStyles.searchInputWrapper}>
          <Feather name="search" size={16} color="#64748B" />
          <TextInput
            style={adminEventsStyles.searchInput}
            placeholder="Search events by title or organizer"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <TouchableOpacity
              style={adminEventsStyles.searchClearButton}
              onPress={() => setSearchQuery('')}
            >
              <Feather name="x" size={16} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Scrollable Categories */}
      <View style={adminEventsStyles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                adminEventsStyles.filterChip,
                selectedCategory === category.key && adminEventsStyles.filterChipActive,
              ]}
              onPress={() => handleCategoryPress(category.key)}
            >
              <Text
                style={[
                  adminEventsStyles.filterChipText,
                  selectedCategory === category.key && adminEventsStyles.filterChipTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={adminEventsStyles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <AppErrorBanner error={error} onRetry={() => fetchEvents(1, true)} disabled={loading || refreshing} />
        {events.length === 0 ? (
          <View style={adminEventsStyles.emptyContainer}>
            <Feather name={isOffline ? 'wifi-off' : 'calendar'} size={48} color="#9CA3AF" />
            <Text style={adminEventsStyles.emptyTitle}>
              {isOffline ? 'No Connection' : 'No events found'}
            </Text>
            <Text style={adminEventsStyles.emptyText}>
              {isOffline 
                ? 'Check your internet connection and try again'
                : 'Try adjusting your filters'
              }
            </Text>
          </View>
        ) : (
          <>
            {events.map(renderEventCard)}
            {loading && pagination.current < pagination.pages && (
              <View style={adminEventsStyles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#0277BD" />
                <Text style={adminEventsStyles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminEventsScreen;
