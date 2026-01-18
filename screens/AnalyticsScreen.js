import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/api';
import { organizerDashboardStyles } from '../styles/OrganizerDashboardStyle';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const { user, organizerProfile } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0 };
  const [insights, setInsights] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalEvents: 0,
    totalAttendees: 0,
    monthlyGrowth: 0,
    engagementRate: 0,
    averageRating: 0,
    revenue: 0,
    bestCategory: 'None',
    recentActivity: 0,
    pastEvents: 0,
    upcomingEvents: 0,
    avgViewsPerEvent: 0,
    bestPerformingEvent: null,
  });
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Load organizer events
      const eventsResponse = await apiService.getOrganizerEvents();
      if (eventsResponse.success && eventsResponse.data) {
        const events = eventsResponse.data.map(event => ({
          id: event._id,
          title: event.title,
          date: event.date,
          time: event.time,
          status: getEventStatus(event.date),
          attendees: event.attendeeCount || 0,
          category: event.category,
          price: event.price || 0,
          views: event.views || 0,
          likes: event.likeCount || 0,
          location: event.location,
          description: event.description,
          featured: event.featured
        }));
        
        setOrganizerEvents(events);
        calculateInsights(events);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateInsights = (events) => {
    const totalViews = events.reduce((sum, event) => sum + (event.views || 0), 0);
    const totalLikes = events.reduce((sum, event) => sum + (event.likes || 0), 0);
    const totalAttendees = events.reduce((sum, event) => sum + (event.attendees || 0), 0);
    const totalRevenue = events.reduce((sum, event) => sum + ((event.price || 0) * (event.attendees || 0)), 0);
    
    // Calculate engagement rate (likes + views per event)
    const engagementRate = events.length > 0 
      ? Math.round(((totalLikes + totalViews) / events.length) / 10)
      : 0;

    // Calculate real growth based on event dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentEvents = events.filter(event => new Date(event.date) >= thirtyDaysAgo);
    const olderEvents = events.filter(event => new Date(event.date) < thirtyDaysAgo);
    
    const monthlyGrowth = olderEvents.length > 0 
      ? Math.round(((recentEvents.length - olderEvents.length) / olderEvents.length) * 100)
      : recentEvents.length > 0 ? 100 : 0;

    // Calculate average rating based on event performance
    const avgRating = events.length > 0
      ? Math.min(5, Math.max(1, 3.5 + (totalLikes / (events.length * 10)) + (totalAttendees / (events.length * 5))))
      : 0;

    // Calculate category performance
    const categoryPerformance = {};
    events.forEach(event => {
      if (!categoryPerformance[event.category]) {
        categoryPerformance[event.category] = { count: 0, views: 0, likes: 0 };
      }
      categoryPerformance[event.category].count++;
      categoryPerformance[event.category].views += event.views || 0;
      categoryPerformance[event.category].likes += event.likes || 0;
    });

    // Find best performing category
    let bestCategory = 'None';
    let bestScore = 0;
    Object.keys(categoryPerformance).forEach(category => {
      const score = categoryPerformance[category].views + (categoryPerformance[category].likes * 2);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category.charAt(0).toUpperCase() + category.slice(1);
      }
    });

    setInsights({
      totalViews,
      totalLikes,
      totalEvents: events.length,
      totalAttendees,
      monthlyGrowth: Math.max(0, monthlyGrowth),
      engagementRate: Math.min(100, engagementRate),
      averageRating: avgRating,
      revenue: totalRevenue,
      bestCategory,
      recentActivity: recentEvents.length,
      pastEvents: events.filter(event => getEventStatus(event.date) === 'past').length,
      upcomingEvents: events.filter(event => getEventStatus(event.date) === 'upcoming').length,
      avgViewsPerEvent: events.length > 0 ? Math.round(totalViews / events.length) : 0,
      bestPerformingEvent: events.length > 0 ? events.reduce((best, event) => 
        (event.views || 0) > (best.views || 0) ? event : best
      ) : null
    });
  };

  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) return 'past';
    if (eventDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalyticsData();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const timeRanges = [
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
    { key: 'quarter', label: 'Last 3 Months' },
    { key: 'year', label: 'Last Year' },
  ];

  const AnalyticsHeader = () => (
    <View style={[styles.homeHeaderContainer, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0277BD', '#01579B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.homeHeaderCard}
      >
        <View style={styles.homeHeaderBg} pointerEvents="none">
          <View style={styles.homeHeaderOrbOne} />
          <View style={styles.homeHeaderOrbTwo} />
        </View>

        <View style={styles.homeHeaderTopRow}>
          <View style={styles.homeHeaderLeftRow}>
            <View style={styles.homeHeaderAvatar}>
              <View style={styles.homeHeaderAvatarInner}>
                <Feather name="activity" size={20} color="#0F172A" />
              </View>
            </View>
            <View style={styles.homeHeaderTitleBlock}>
              <Text style={styles.homeHeaderWelcomeText}>Insights</Text>
              <Text style={styles.homeHeaderNameText}>Analytics</Text>
              <Text style={styles.homeHeaderCountText}>
                {insights.totalEvents} {insights.totalEvents === 1 ? 'Event' : 'Events'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.homeHeaderMetaRow}>
          <Text style={styles.homeHeaderMetaText}>Track Performance</Text>
          <Text style={styles.homeHeaderMetaSeparator}>|</Text>
          <Text style={styles.homeHeaderMetaText}>Monitor Growth</Text>
          <Text style={styles.homeHeaderMetaSeparator}>|</Text>
          <Text style={styles.homeHeaderMetaText}>Optimize Strategy</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnalyticsHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <AnalyticsHeader />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.timeRangeTitle}>Time Period</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeRangeScroll}
          >
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.key}
                style={[
                  styles.timeRangeButton,
                  timeRange === range.key && styles.timeRangeButtonActive
                ]}
                onPress={() => setTimeRange(range.key)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  timeRange === range.key && styles.timeRangeButtonTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#EBF5FF' }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#0277BD' }]}>
                <Feather name="eye" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(insights.totalViews)}</Text>
              <Text style={styles.metricLabel}>Total Views</Text>
              <View style={styles.metricTrend}>
                <Feather name="arrow-up" size={12} color="#10B981" />
                <Text style={styles.metricTrendText}>+{insights.monthlyGrowth}%</Text>
              </View>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#FEF2F2' }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#EF4444' }]}>
                <Feather name="heart" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(insights.totalLikes)}</Text>
              <Text style={styles.metricLabel}>Total Favorites</Text>
              <View style={styles.metricTrend}>
                <Feather name="users" size={12} color="#10B981" />
                <Text style={styles.metricTrendText}>{insights.engagementRate}%</Text>
              </View>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#F59E0B' }]}>
                <Feather name="calendar" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{insights.totalEvents}</Text>
              <Text style={styles.metricLabel}>Total Events</Text>
              <View style={styles.metricTrend}>
                <Feather name="trending-up" size={12} color="#10B981" />
                <Text style={styles.metricTrendText}>Active</Text>
              </View>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#F0FDF4' }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#10B981' }]}>
                <Feather name="users" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(insights.totalAttendees)}</Text>
              <Text style={styles.metricLabel}>Total Attendees</Text>
              <View style={styles.metricTrend}>
                <Feather name="user-plus" size={12} color="#10B981" />
                <Text style={styles.metricTrendText}>+{Math.floor(insights.totalAttendees * 0.1)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Feather name="star" size={16} color="#F59E0B" />
              <Text style={styles.insightTitle}>Average Rating</Text>
            </View>
            <Text style={styles.insightValue}>{insights.averageRating.toFixed(1)} ⭐</Text>
            <Text style={styles.insightDescription}>Based on {insights.totalEvents} events</Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Feather name="target" size={16} color="#3B82F6" />
              <Text style={styles.insightTitle}>Engagement Rate</Text>
            </View>
            <Text style={styles.insightValue}>{insights.engagementRate}%</Text>
            <Text style={styles.insightDescription}>Likes & views per event</Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Feather name="trending-up" size={16} color="#10B981" />
              <Text style={styles.insightTitle}>Growth Rate</Text>
            </View>
            <Text style={styles.insightValue}>+{insights.monthlyGrowth}%</Text>
            <Text style={styles.insightDescription}>Monthly growth trend</Text>
          </View>
        </View>

        {/* Top Performing Events */}
        <View style={styles.topEventsContainer}>
          <Text style={styles.sectionTitle}>Top Performing Events</Text>
          {organizerEvents
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 3)
            .map((event, index) => (
              <View key={event.id} style={styles.topEventCard}>
                <View style={styles.topEventRank}>
                  <Text style={styles.topEventRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.topEventInfo}>
                  <Text style={styles.topEventTitle}>{event.title}</Text>
                  <Text style={styles.topEventStats}>
                    {event.views || 0} views • {event.attendees || 0} attendees
                  </Text>
                </View>
                <View style={styles.topEventPerformance}>
                  <Text style={styles.topEventPerformanceText}>
                    {event.price > 0 ? formatCurrency(event.price * (event.attendees || 0)) : 'Free'}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  scrollView: {
    flex: 1,
  },
  timeRangeContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  timeRangeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  timeRangeScroll: {
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeRangeButtonActive: {
    backgroundColor: '#0277BD',
    borderColor: '#0277BD',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#FFFFFF',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricTrendText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  homeHeaderCountText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    fontFamily: 'System',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  topEventsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topEventRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0277BD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topEventRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topEventInfo: {
    flex: 1,
  },
  topEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  topEventStats: {
    fontSize: 13,
    color: '#64748B',
  },
  topEventPerformance: {
    alignItems: 'flex-end',
  },
  topEventPerformanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
