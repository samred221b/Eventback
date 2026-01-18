import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import homeStyles from '../styles/homeStyles';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import cacheService, { TTL } from '../utils/cacheService';
import NetInfo from '@react-native-community/netinfo';

export default function UsageStatisticsScreen({ navigation }) {
  const { user, organizerProfile } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [statistics, setStatistics] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    totalViews: 0,
    totalLikes: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    monthlyViews: [],
    topEvents: [],
    recentActivity: []
  });

  const STATS_CACHE_KEY = 'organizer:stats';

  const cacheStatistics = async (stats) => {
    try {
      await cacheService.set(STATS_CACHE_KEY, stats, { ttlMs: TTL.ONE_HOUR });
    } catch (e) {
      // Silent fail
    }
  };

  const loadStatisticsFromCache = async () => {
    try {
      const { data } = await cacheService.get(STATS_CACHE_KEY);
      return data || null;
    } catch (e) {
      return null;
    }
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
    loadStatistics();
  }, []);

  const loadStatistics = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      setIsOffline(!isConnected);

      // If offline and not refreshing, try to load from cache
      if (!isConnected && !refresh) {
        const cachedStats = await loadStatisticsFromCache();
        if (cachedStats) {
          setStatistics(cachedStats);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // If offline and no cache, show cached data if available
      if (!isConnected) {
        const cachedStats = await loadStatisticsFromCache();
        if (cachedStats) {
          setStatistics(cachedStats);
        }
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Try to load from cache first for instant UI
      if (!refresh) {
        const cachedStats = await loadStatisticsFromCache();
        if (cachedStats) {
          setStatistics(cachedStats);
          setIsLoading(false);
        }
      }
      
      // Fetch fresh data from backend
      const statsResponse = await apiService.get('/organizers/profile/stats', { requireAuth: true });
      const statsData = statsResponse?.data?.stats || {};
      
      // Fetch organizer's events for top events and activity
      const eventsResponse = await apiService.get('/organizers/profile/events', { requireAuth: true });
      const events = eventsResponse?.data || [];
      
      // Calculate published vs draft events
      const publishedEvents = events.filter(e => e.status === 'published').length;
      const draftEvents = events.filter(e => e.status === 'draft').length;
      
      // Sort events by views for top events
      const topEvents = events
        .filter(e => e.status === 'published')
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)
        .map(event => ({
          id: event._id,
          title: event.title,
          views: event.views || 0,
          likes: event.likes ? event.likes.length : 0
        }));
      
      // Create recent activity from recent events
      const recentEvents = events
        .filter(e => e.status === 'published')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3);
      
      const recentActivity = recentEvents.map(event => ({
        type: 'view',
        event: event.title,
        count: event.views || 0,
        time: formatTimeAgo(new Date(event.createdAt || Date.now()))
      }));
      
      // Generate monthly views (mock data for now since backend doesn't track this)
      const monthlyViews = generateMonthlyViews(statsData.totalViews || 0);
      
      // Calculate engagement rate
      const engagementRate = statsData.totalViews > 0 
        ? ((statsData.totalLikes || 0) / statsData.totalViews * 100).toFixed(1)
        : '0.0';
      
      const realStats = {
        totalEvents: statsData.totalEvents || 0,
        publishedEvents,
        draftEvents,
        totalViews: statsData.totalViews || 0,
        totalLikes: statsData.totalLikes || 0,
        upcomingEvents: statsData.upcomingEvents || 0,
        pastEvents: statsData.pastEvents || 0,
        monthlyViews,
        topEvents,
        recentActivity,
        engagementRate: `${engagementRate}%`
      };

      setStatistics(realStats);
      // Cache the fresh data
      await cacheStatistics(realStats);
    } catch (error) {
      logger.error('Error fetching usage statistics:', error);
      // Try to load from cache on error
      const cachedStats = await loadStatisticsFromCache();
      if (cachedStats) {
        setStatistics(cachedStats);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadStatistics(true);
  };
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };
  
  const generateMonthlyViews = (totalViews) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseViews = Math.floor(totalViews / 6);
    return months.map((month, index) => ({
      month,
      views: baseViews + Math.floor(Math.random() * baseViews * 0.3)
    }));
  };

  const StatCard = ({ icon, title, value, subtitle, color }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={color}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardGradient}
      >
        <Feather name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.statCardNumber}>{value}</Text>
        <Text style={styles.statCardLabel}>{title}</Text>
        {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[homeStyles.homeHeaderContainer, { paddingTop: insets.top }]}>
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
                  <Text style={homeStyles.homeHeaderWelcomeText}>Usage Statistics</Text>
                  <Text style={homeStyles.homeHeaderNameText}>Loading...</Text>
                </View>
              </View>
              <View style={homeStyles.homeHeaderActions}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={handleRefresh}
                >
                  <Feather name="refresh-cw" size={16} color="rgba(255, 255, 255, 1)" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[homeStyles.homeHeaderContainer, { paddingTop: insets.top }]}>
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
                <Text style={homeStyles.homeHeaderWelcomeText}>Usage Statistics</Text>
                <Text style={homeStyles.homeHeaderNameText}>{organizerProfile?.name || 'Organizer'}</Text>
              </View>
            </View>
            <View style={homeStyles.homeHeaderActions}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleRefresh}
              >
                <Feather name="refresh-cw" size={16} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>Analytics</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Insights</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Performance</Text>
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
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              title="Total Events"
              value={statistics.totalEvents}
              subtitle={`${statistics.publishedEvents} published`}
              color={['#10B981', '#059669']}
            />
            <StatCard
              icon="eye"
              title="Total Views"
              value={statistics.totalViews.toLocaleString()}
              subtitle="All time"
              color={['#3B82F6', '#2563EB']}
            />
            <StatCard
              icon="heart"
              title="Total Likes"
              value={statistics.totalLikes.toLocaleString()}
              subtitle="All time"
              color={['#EF4444', '#DC2626']}
            />
            <StatCard
              icon="trending-up"
              title="Engagement Rate"
              value={statistics.engagementRate}
              subtitle="Likes per 100 views"
              color={['#8B5CF6', '#7C3AED']}
            />
          </View>
        </View>

        {/* Event Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Event Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.upcoming]} />
              <Text style={styles.statusLabel}>Upcoming Events</Text>
              <Text style={styles.statusValue}>{statistics.upcomingEvents}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.past]} />
              <Text style={styles.statusLabel}>Past Events</Text>
              <Text style={styles.statusValue}>{statistics.pastEvents}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.draft]} />
              <Text style={styles.statusLabel}>Draft Events</Text>
              <Text style={styles.statusValue}>{statistics.draftEvents}</Text>
            </View>
          </View>
        </View>

        {/* Top Performing Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Performing Events</Text>
          {statistics.topEvents.map((event, index) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventRank}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventStats}>
                  <View style={styles.eventStat}>
                    <Feather name="eye" size={14} color="#64748B" />
                    <Text style={styles.eventStatText}>{event.views.toLocaleString()}</Text>
                  </View>
                  <View style={styles.eventStat}>
                    <Feather name="heart" size={14} color="#64748B" />
                    <Text style={styles.eventStatText}>{event.likes}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Recent Activity</Text>
          {statistics.recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Feather 
                  name={activity.type === 'view' ? 'eye' : activity.type === 'like' ? 'heart' : 'trending-up'} 
                  size={16} 
                  color="#64748B" 
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>
                  {activity.count} {activity.type === 'view' ? 'views' : 'likes'} on {activity.event}
                </Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginRight: 8,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statusContainer: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  upcoming: {
    backgroundColor: '#10B981',
  },
  past: {
    backgroundColor: '#64748B',
  },
  draft: {
    backgroundColor: '#F59E0B',
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  eventRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0277BD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: 14,
    color: '#64748B',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
