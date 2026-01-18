import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/api';
import { adminAnalyticsStyles } from '../styles/adminStyles';
import homeStyles from '../styles/homeStyles';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { APP_ERROR_SEVERITY, toAppError } from '../utils/appError';
import cacheService, { TTL } from '../utils/cacheService';
import NetInfo from '@react-native-community/netinfo';

const AdminAnalyticsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const ANALYTICS_CACHE_KEY = 'admin:analytics';

  const cacheAnalytics = async (analytics) => {
    try {
      await cacheService.set(ANALYTICS_CACHE_KEY, analytics, { ttlMs: TTL.THREE_HOURS });
    } catch (e) {
      // Silent fail
    }
  };

  const loadAnalyticsFromCache = async () => {
    try {
      const { data } = await cacheService.get(ANALYTICS_CACHE_KEY);
      return data || null;
    } catch (e) {
      return null;
    }
  };

  const fetchAnalytics = async (forceRefresh = false) => {
    try {
      setError(null);

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      setIsOffline(!isConnected);

      // If not forcing refresh, try cache first
      if (!forceRefresh) {
        const cachedAnalytics = await loadAnalyticsFromCache();
        if (cachedAnalytics) {
          setAnalytics(cachedAnalytics);
          setLoading(false);
          setRefreshing(false);
          
          // If online, fetch fresh data in background
          if (isConnected) {
            fetchFreshAnalytics();
          }
          return;
        }
      }

      // If offline and no cache, show error
      if (!isConnected) {
        setError(toAppError(new Error('No internet connection'), { 
          fallbackMessage: 'No internet connection. Showing cached data if available.' 
        }));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch fresh data
      await fetchFreshAnalytics();
    } catch (error) {
      // If network error, try to load from cache
      const cachedAnalytics = await loadAnalyticsFromCache();
      if (cachedAnalytics) {
        setAnalytics(cachedAnalytics);
        setError(toAppError(error, { 
          fallbackMessage: 'Network error. Showing cached data.' 
        }));
      } else {
        setError(toAppError(error, { fallbackMessage: 'Failed to fetch analytics' }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFreshAnalytics = async () => {
    const response = await apiService.get('/admin/analytics', { requireAuth: true });
    
    if (response.success) {
      setAnalytics(response.data);
      cacheAnalytics(response.data); // Cache the data
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(true); // Force refresh
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const renderOverviewCard = (title, value, subtitle, color, icon) => (
    <View style={[adminAnalyticsStyles.insightCard, { borderLeftColor: color }]}>
      <View style={adminAnalyticsStyles.insightIconContainer}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={adminAnalyticsStyles.insightContent}>
        <Text style={adminAnalyticsStyles.insightValue}>{formatNumber(value)}</Text>
        <Text style={adminAnalyticsStyles.insightTitle}>{title}</Text>
        <Text style={adminAnalyticsStyles.insightSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderCategoryCard = (category, count, index) => (
    <View key={category} style={adminAnalyticsStyles.categoryCard}>
      <View style={adminAnalyticsStyles.categoryRank}>
        <Text style={adminAnalyticsStyles.categoryRankText}>#{index + 1}</Text>
      </View>
      <View style={adminAnalyticsStyles.categoryInfo}>
        <Text style={adminAnalyticsStyles.categoryName}>{category}</Text>
        <Text style={adminAnalyticsStyles.categoryCount}>{count} events</Text>
      </View>
      <View style={adminAnalyticsStyles.categoryBar}>
        <View 
          style={[
            adminAnalyticsStyles.categoryBarFill, 
            { width: `${Math.min((count / analytics.eventsByCategory[0]?.count || 1) * 100, 100)}%` }
          ]} 
        />
      </View>
    </View>
  );

  const renderOrganizerCard = (organizer, index) => (
    <View key={organizer._id} style={adminAnalyticsStyles.topOrganizerCard}>
      <View style={adminAnalyticsStyles.organizerRank}>
        <Text style={adminAnalyticsStyles.organizerRankText}>#{index + 1}</Text>
      </View>
      <View style={adminAnalyticsStyles.organizerInfo}>
        <Text style={adminAnalyticsStyles.organizerName}>{organizer.name}</Text>
        <Text style={adminAnalyticsStyles.organizerEmail}>{organizer.email}</Text>
        <View style={adminAnalyticsStyles.organizerMeta}>
          <Text style={adminAnalyticsStyles.organizerEventCount}>{organizer.eventCount} events</Text>
          {organizer.isVerified && (
            <View style={adminAnalyticsStyles.verifiedBadge}>
              <Feather name="check-circle" size={12} color="#3B82F6" />
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderMonthCard = (month, count, index) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, monthNum] = month.split('-');
    const monthName = monthNames[parseInt(monthNum) - 1];
    
    return (
      <View key={month} style={adminAnalyticsStyles.monthCard}>
        <Text style={adminAnalyticsStyles.monthName}>{monthName}</Text>
        <Text style={adminAnalyticsStyles.monthCount}>{count}</Text>
      </View>
    );
  };

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
      const cachedAnalytics = await loadAnalyticsFromCache();
      if (cachedAnalytics) {
        setAnalytics(cachedAnalytics);
        setLoading(false);
      }
      // Always try to fetch fresh data (will use cache-first logic)
      fetchAnalytics();
    };

    loadInitialData();
  }, []);

  if (loading) {
    return (
      <View style={adminAnalyticsStyles.container}>
        <View style={adminAnalyticsStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={adminAnalyticsStyles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (error && error.severity === APP_ERROR_SEVERITY.ERROR) {
    return (
      <View style={adminAnalyticsStyles.container}>
        <AppErrorState error={error} onRetry={fetchAnalytics} />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={adminAnalyticsStyles.container}>
        <View style={adminAnalyticsStyles.emptyContainer}>
          <Feather name={isOffline ? 'wifi-off' : 'bar-chart-2'} size={48} color="#9CA3AF" />
          <Text style={adminAnalyticsStyles.emptyTitle}>
            {isOffline ? 'No Connection' : 'No analytics available'}
          </Text>
          <Text style={adminAnalyticsStyles.emptyText}>
            {isOffline 
              ? 'Check your internet connection and try again'
              : 'Please try again later'
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[adminAnalyticsStyles.container, { paddingTop: insets.top }]}>
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
                  <Feather name="bar-chart-2" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Admin</Text>
                <Text style={homeStyles.homeHeaderNameText}>System Analytics</Text>
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
            <Text style={homeStyles.homeHeaderMetaText}>Analytics Dashboard</Text>
            {isOffline && (
              <>
                <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
                <Text style={[homeStyles.homeHeaderMetaText, { color: '#F59E0B' }]}>Offline</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={adminAnalyticsStyles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <AppErrorBanner error={error} onRetry={fetchAnalytics} disabled={loading || refreshing} />
        {/* Overview Section */}
        <View style={adminAnalyticsStyles.analyticsSection}>
          <Text style={adminAnalyticsStyles.sectionTitle}>Platform Overview</Text>
          <View style={adminAnalyticsStyles.overviewGrid}>
            {renderOverviewCard('Total Events', analytics.overview.totalEvents, 'All time', '#0277BD', 'calendar')}
            {renderOverviewCard('Active Organizers', analytics.overview.totalUsers, 'Currently active', '#10B981', 'users')}
            {renderOverviewCard('Active Events', analytics.overview.activeEvents, 'Upcoming', '#F59E0B', 'activity')}
            {renderOverviewCard('Featured Events', analytics.overview.featuredEvents, 'Highlighted', '#EF4444', 'star')}
            {renderOverviewCard('Verified Organizers', analytics.overview.verifiedOrganizers, 'Trusted', '#3B82F6', 'check-circle')}
            {renderOverviewCard('Total Organizers', analytics.overview.totalOrganizers, 'All users', '#8B5CF6', 'users')}
          </View>
        </View>

        {/* Events by Category */}
        <View style={adminAnalyticsStyles.analyticsSection}>
          <Text style={adminAnalyticsStyles.sectionTitle}>Events by Category</Text>
          {analytics.eventsByCategory.length === 0 ? (
            <View style={adminAnalyticsStyles.emptySection}>
              <Text style={adminAnalyticsStyles.emptyText}>No category data available</Text>
            </View>
          ) : (
            <View style={adminAnalyticsStyles.categoryList}>
              {analytics.eventsByCategory.map((cat, index) => renderCategoryCard(cat._id, cat.count, index))}
            </View>
          )}
        </View>

        {/* Monthly Trends */}
        <View style={adminAnalyticsStyles.analyticsSection}>
          <Text style={adminAnalyticsStyles.sectionTitle}>Monthly Events (Last 6 Months)</Text>
          {analytics.eventsByMonth.length === 0 ? (
            <View style={adminAnalyticsStyles.emptySection}>
              <Text style={adminAnalyticsStyles.emptyText}>No monthly data available</Text>
            </View>
          ) : (
            <View style={adminAnalyticsStyles.monthGrid}>
              {analytics.eventsByMonth.map((month, index) => renderMonthCard(month._id, month.count, index))}
            </View>
          )}
        </View>

        {/* Top Organizers */}
        <View style={adminAnalyticsStyles.analyticsSection}>
          <Text style={adminAnalyticsStyles.sectionTitle}>Top Organizers by Events</Text>
          {analytics.topOrganizers.length === 0 ? (
            <View style={adminAnalyticsStyles.emptySection}>
              <Text style={adminAnalyticsStyles.emptyText}>No organizer data available</Text>
            </View>
          ) : (
            <View style={adminAnalyticsStyles.organizerList}>
              {analytics.topOrganizers.map((organizer, index) => renderOrganizerCard(organizer, index))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminAnalyticsScreen;
