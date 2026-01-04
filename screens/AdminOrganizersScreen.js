import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';
import { adminOrganizersStyles } from '../styles/adminStyles';
import homeStyles from '../styles/homeStyles';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { APP_ERROR_SEVERITY, toAppError } from '../utils/appError';
import cacheService, { TTL } from '../utils/cacheService';
import NetInfo from '@react-native-community/netinfo';

const AdminOrganizersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [organizers, setOrganizers] = useState([]);
  const [allOrganizers, setAllOrganizers] = useState([]); // Store all organizers for local filtering
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOffline, setIsOffline] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    verified: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const ORGANIZERS_CACHE_KEY = 'admin:organizers';
  const ORGANIZERS_FIRST_PAGE_CACHE_KEY = 'admin:organizers:firstPage';

  const cacheOrganizers = async (organizers) => {
    try {
      await cacheService.set(ORGANIZERS_CACHE_KEY, organizers, { ttlMs: TTL.ONE_HOUR });
    } catch (e) {
      // Silent fail
    }
  };

  const loadOrganizersFromCache = async () => {
    try {
      const { data } = await cacheService.get(ORGANIZERS_CACHE_KEY);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  };

  const cacheFirstPageOrganizers = async (organizers) => {
    try {
      await cacheService.set(ORGANIZERS_FIRST_PAGE_CACHE_KEY, organizers.slice(0, 20), { ttlMs: TTL.ONE_HOUR });
    } catch (e) {
      // Silent fail
    }
  };

  const loadCachedFirstPageOrganizers = async () => {
    try {
      const { data } = await cacheService.get(ORGANIZERS_FIRST_PAGE_CACHE_KEY);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  };

  const categories = [
    { key: 'all', icon: 'users', label: 'All' },
    { key: 'active', icon: 'check-circle', label: 'Active' },
    { key: 'inactive', icon: 'x-circle', label: 'Inactive' },
    { key: 'verified', icon: 'shield', label: 'Verified' },
    { key: 'unverified', icon: 'alert-circle', label: 'Unverified' },
  ];

  const normalizeOrganizerImageUri = (uri) => {
    if (!uri || typeof uri !== 'string') return null;
    const trimmed = uri.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://')) return trimmed.replace('http://', 'https://');
    return trimmed;
  };

  const fetchOrganizers = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOrganizers([]);
      }
      if (page === 1) setError(null);

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      setIsOffline(!isConnected);

      // If offline and first page, try to load from cache
      if (!isConnected && page === 1) {
        const cachedOrganizers = await loadOrganizersFromCache();
        if (cachedOrganizers.length > 0) {
          setOrganizers(cachedOrganizers);
          setAllOrganizers(cachedOrganizers);
          setPagination({ current: 1, pages: 1, total: cachedOrganizers.length });
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

      const response = await apiService.get('/admin/organizers', { params, requireAuth: true });
      
      if (response.success) {
        if (reset || page === 1) {
          setOrganizers(response.data);
          setAllOrganizers(response.data); // Store all organizers for local filtering
          cacheOrganizers(response.data); // Cache the data
          cacheFirstPageOrganizers(response.data); // Cache first page
        } else {
          setOrganizers(prev => [...prev, ...response.data]);
          setAllOrganizers(prev => [...prev, ...response.data]); // Update all organizers
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      // If network error, try to load from cache
      if (page === 1) {
        const cachedOrganizers = await loadOrganizersFromCache();
        if (cachedOrganizers.length > 0) {
          setOrganizers(cachedOrganizers);
          setAllOrganizers(cachedOrganizers);
          setPagination({ current: 1, pages: 1, total: cachedOrganizers.length });
          setError(toAppError(error, { 
            fallbackMessage: 'Network error. Showing cached data.' 
          }));
        } else {
          setError(toAppError(error, { fallbackMessage: 'Failed to fetch organizers' }));
        }
      } else {
        setError(toAppError(error, { fallbackMessage: 'Failed to fetch organizers' }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrganizers(1, true);
  };

  const handleLoadMore = () => {
    if (pagination.current < pagination.pages && !loading) {
      fetchOrganizers(pagination.current + 1);
    }
  };

  const filterOrganizersByCategory = useCallback((categoryKey) => {
    let filtered = [...allOrganizers];
    
    switch (categoryKey) {
      case 'all':
        // Show all organizers
        break;
      case 'active':
        filtered = filtered.filter(org => org.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(org => !org.isActive);
        break;
      case 'verified':
        filtered = filtered.filter(org => org.isVerified);
        break;
      case 'unverified':
        filtered = filtered.filter(org => !org.isVerified);
        break;
      default:
        break;
    }
    
    setOrganizers(filtered);
  }, [allOrganizers]);

  const handleCategoryPress = useCallback((categoryKey) => {
    setSelectedCategory(categoryKey);
    filterOrganizersByCategory(categoryKey);
  }, [filterOrganizersByCategory]);

  const handleToggleVerify = useCallback(async (organizerId) => {
    try {
      const response = await apiService.put(`/admin/organizers/${organizerId}/verify`, {}, { requireAuth: true });
      if (response.success) {
        const updatedOrganizer = { isVerified: response.data.isVerified };
        
        // Update both displayed and all organizers
        setOrganizers(prev => prev.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, ...updatedOrganizer }
            : organizer
        ));
        
        setAllOrganizers(prev => prev.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, ...updatedOrganizer }
            : organizer
        ));

        // Update cache with new data
        cacheOrganizers(allOrganizers.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, ...updatedOrganizer }
            : organizer
        ));
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to update organizer' }));
    }
  }, [allOrganizers]);

  const handleToggleStatus = useCallback(async (organizerId, isActive) => {
    try {
      const response = await apiService.put(`/admin/organizers/${organizerId}/status`, { isActive }, { requireAuth: true });
      if (response.success) {
        const updatedOrganizer = { isActive: response.data.isActive };
        
        // Update both displayed and all organizers
        setOrganizers(prev => prev.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, ...updatedOrganizer }
            : organizer
        ));
        
        setAllOrganizers(prev => prev.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, ...updatedOrganizer }
            : organizer
        ));
        
        // Update cache with new data
        cacheOrganizers(allOrganizers.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, ...updatedOrganizer }
            : organizer
        ));
        
        // Re-apply current category filter
        filterOrganizersByCategory(selectedCategory);
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to update organizer status' }));
    }
  }, [selectedCategory, filterOrganizersByCategory, allOrganizers]);

  const handleViewDetails = useCallback(async (organizerId) => {
    try {
      const response = await apiService.get(`/admin/organizers/${organizerId}`, { requireAuth: true });
      if (response.success) {
        navigation.navigate('AdminOrganizerDetails', { organizer: response.data });
      }
    } catch (error) {
      setError(toAppError(error, { fallbackMessage: 'Failed to fetch organizer details' }));
    }
  }, [navigation]);

  const renderOrganizerCard = useCallback((organizer) => (
    <View key={organizer._id} style={adminOrganizersStyles.card}>
      <View style={adminOrganizersStyles.cardHeader}>
        <View style={adminOrganizersStyles.cardAvatar}>
          {organizer.profileImage ? (
            <Image
              source={{ uri: normalizeOrganizerImageUri(organizer.profileImage) }}
              style={adminOrganizersStyles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <View style={adminOrganizersStyles.avatarPlaceholder}>
              <Feather name="user" size={18} color="#0277BD" />
            </View>
          )}
        </View>

        <View style={adminOrganizersStyles.cardInfo}>
          <Text style={adminOrganizersStyles.cardName}>{organizer.name}</Text>
          <Text style={adminOrganizersStyles.cardEmail}>{organizer.email}</Text>
          <View style={adminOrganizersStyles.cardStatusRow}>
            <View style={[
              adminOrganizersStyles.statusChip,
              { backgroundColor: organizer.isActive ? '#0277BD' : '#64748B' }
            ]}>
              <Text style={adminOrganizersStyles.statusText}>{organizer.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            {organizer.isVerified && (
              <View style={adminOrganizersStyles.verifiedChip}>
                <Feather name="check-circle" size={10} color="#FFFFFF" />
                <Text style={adminOrganizersStyles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={adminOrganizersStyles.cardActions}>
          <TouchableOpacity style={adminOrganizersStyles.actionButton} onPress={() => handleViewDetails(organizer._id)}>
            <Feather name="eye" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={adminOrganizersStyles.actionButton} onPress={() => handleToggleVerify(organizer._id)}>
            <Feather name="check-circle" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[adminOrganizersStyles.actionButton, adminOrganizersStyles.toggleButton]}
            onPress={() => handleToggleStatus(organizer._id, !organizer.isActive)}
          >
            <Feather name={organizer.isActive ? "user-x" : "user-check"} size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={adminOrganizersStyles.cardMeta}>
        <View style={adminOrganizersStyles.metaItem}>
          <View style={adminOrganizersStyles.metaIcon}>
            <Feather name="calendar" size={10} color="#0277BD" />
          </View>
          <Text style={adminOrganizersStyles.metaText}>{organizer.stats?.totalEvents || 0} events</Text>
        </View>
        <View style={adminOrganizersStyles.metaItem}>
          <View style={adminOrganizersStyles.metaIcon}>
            <Feather name="activity" size={10} color="#0277BD" />
          </View>
          <Text style={adminOrganizersStyles.metaText}>{organizer.stats?.activeEvents || 0} active</Text>
        </View>
        <View style={adminOrganizersStyles.metaItem}>
          <View style={adminOrganizersStyles.metaIcon}>
            <Feather name="map-pin" size={10} color="#0277BD" />
          </View>
          <Text style={adminOrganizersStyles.metaText}>{organizer.location?.city || 'No location'}</Text>
        </View>
      </View>
    </View>
  ), [handleViewDetails, handleToggleVerify, handleToggleStatus]);

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
      const cachedOrganizers = await loadOrganizersFromCache();
      if (cachedOrganizers.length > 0) {
        setOrganizers(cachedOrganizers);
        setAllOrganizers(cachedOrganizers);
        setPagination({ current: 1, pages: 1, total: cachedOrganizers.length });
        setLoading(false);
      }
      // Always try to fetch fresh data
      fetchOrganizers(1, true);
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

  if (loading && organizers.length === 0) {
    return (
      <View style={adminOrganizersStyles.container}>
        <View style={adminOrganizersStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={adminOrganizersStyles.loadingText}>Loading organizers...</Text>
        </View>
      </View>
    );
  }

  if (error && error.severity === APP_ERROR_SEVERITY.ERROR && organizers.length === 0) {
    return (
      <View style={adminOrganizersStyles.container}>
        <AppErrorState error={error} onRetry={() => fetchOrganizers(1, true)} />
      </View>
    );
  }

  return (
    <View style={[adminOrganizersStyles.container, { paddingTop: insets.top }]}>
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
                  <Feather name="users" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Admin</Text>
                <Text style={homeStyles.homeHeaderNameText}>Manage Organizers</Text>
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
            <Text style={homeStyles.homeHeaderMetaText}>{organizers.length} loaded</Text>
            {isOffline && (
              <>
                <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
                <Text style={[homeStyles.homeHeaderMetaText, { color: '#F59E0B' }]}>Offline</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      <View style={adminOrganizersStyles.searchContainer}>
        <View style={adminOrganizersStyles.searchInputWrapper}>
          <Feather name="search" size={16} color="#64748B" />
          <TextInput
            style={adminOrganizersStyles.searchInput}
            placeholder="Search organizers by name or email"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <TouchableOpacity
              style={adminOrganizersStyles.searchClearButton}
              onPress={() => setSearchQuery('')}
            >
              <Feather name="x" size={16} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={adminOrganizersStyles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              adminOrganizersStyles.filterChip,
              filters.status === 'all' && adminOrganizersStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
          >
            <Text style={[
              adminOrganizersStyles.filterChipText,
              filters.status === 'all' && adminOrganizersStyles.filterChipTextActive
            ]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminOrganizersStyles.filterChip,
              filters.status === 'active' && adminOrganizersStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'active' }))}
          >
            <Text style={[
              adminOrganizersStyles.filterChipText,
              filters.status === 'active' && adminOrganizersStyles.filterChipTextActive
            ]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminOrganizersStyles.filterChip,
              filters.verified === 'true' && adminOrganizersStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, verified: prev.verified === 'true' ? '' : 'true' }))}
          >
            <Text style={[
              adminOrganizersStyles.filterChipText,
              filters.verified === 'true' && adminOrganizersStyles.filterChipTextActive
            ]}>Verified</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={adminOrganizersStyles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
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
        <AppErrorBanner error={error} onRetry={() => fetchOrganizers(1, true)} disabled={loading || refreshing} />
        {organizers.length === 0 ? (
          <View style={adminOrganizersStyles.emptyContainer}>
            <Feather name={isOffline ? 'wifi-off' : 'users'} size={48} color="#9CA3AF" />
            <Text style={adminOrganizersStyles.emptyTitle}>
              {isOffline ? 'No Connection' : 'No organizers found'}
            </Text>
            <Text style={adminOrganizersStyles.emptyText}>
              {isOffline 
                ? 'Check your internet connection and try again'
                : 'Try adjusting your filters'
              }
            </Text>
          </View>
        ) : (
          <>
            {organizers.map(renderOrganizerCard)}
            {loading && pagination.current < pagination.pages && (
              <View style={adminOrganizersStyles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#0277BD" />
                <Text style={adminOrganizersStyles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminOrganizersScreen;
