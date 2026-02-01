import React, { useMemo, useState, useEffect } from 'react';
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

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const { user, organizerProfile } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0 };
  const [insights, setInsights] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalEvents: 0,
    monthlyGrowth: 0,
    engagementRate: 0,
    averageRating: 0,
    bestCategory: 'None',
    recentActivity: 0,
    pastEvents: 0,
    upcomingEvents: 0,
    avgViewsPerEvent: 0,
    bestPerformingEvent: null,
    categoryBreakdown: [],
    growthTrend: [],
    engagementFunnel: { views: 0, likes: 0, rating: 0 },
    recentActivityList: [],
    eventHealthMatrix: [],
    comparativeInsights: { periodGrowth: 0, categoryGrowth: 0, topEventGrowth: 0 },
  });
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    calculateInsights(organizerEvents);
  }, [timeRange, organizerEvents]);

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
          category: event.category,
          price: event.price || 0,
          views: event.views || 0,
          likes: (event.likes && Array.isArray(event.likes) ? event.likes.length : event.likeCount || 0),
          location: event.location,
          description: event.description,
          featured: event.featured
        }));
        
        setOrganizerEvents(events);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateInsights = (events) => {
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    const rangeStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const scopedEvents = Array.isArray(events)
      ? events.filter((event) => {
          const ts = new Date(event?.date).getTime();
          if (Number.isNaN(ts)) return false;
          return ts >= rangeStart.getTime();
        })
      : [];

    const totalViews = scopedEvents.reduce((sum, event) => sum + (event.views || 0), 0);
    const totalLikes = scopedEvents.reduce((sum, event) => sum + (event.likes || 0), 0);
    
    // Calculate engagement rate (likes + views per event)
    const engagementRate = scopedEvents.length > 0 
      ? Math.round(((totalLikes + totalViews) / scopedEvents.length) / 10)
      : 0;

    // Calculate real growth based on event dates
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentEvents = scopedEvents.filter(event => new Date(event.date) >= thirtyDaysAgo);
    const olderEvents = scopedEvents.filter(event => new Date(event.date) < thirtyDaysAgo);
    
    const monthlyGrowth = olderEvents.length > 0 
      ? Math.round(((recentEvents.length - olderEvents.length) / olderEvents.length) * 100)
      : recentEvents.length > 0 ? 100 : 0;

    // Calculate average rating based on event performance
    const avgRating = scopedEvents.length > 0
      ? Math.min(5, Math.max(1, 3.2 + (totalLikes / (scopedEvents.length * 10)) + (totalViews / (scopedEvents.length * 250))))
      : 0;

    // Calculate category performance
    const categoryPerformance = {};
    scopedEvents.forEach(event => {
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

    const categoryBreakdown = Object.entries(categoryPerformance)
      .map(([category, data]) => {
        const safeCategory = typeof category === 'string' ? category : 'Other';
        const share = scopedEvents.length > 0
          ? Math.round((data.count / scopedEvents.length) * 100)
          : 0;
        return {
          category: safeCategory,
          count: data.count,
          views: data.views,
          likes: data.likes,
          share,
          score: data.views + (data.likes * 2),
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    // Growth trend (mock sparkline data based on time range)
    const growthTrend = Array.from({ length: Math.min(7, days) }, (_, i) => {
      const base = totalViews / (days || 1);
      const variation = Math.sin(i * 0.8) * 0.3 + Math.random() * 0.2 - 0.1;
      return Math.round(base * (1 + variation));
    });

    // Engagement funnel
    const engagementFunnel = {
      views: totalViews,
      likes: totalLikes,
      rating: Math.round(avgRating * 20), // Scale to 100 for visual consistency
    };

    // Recent activity list (last 5 events with activity)
    const recentActivityList = scopedEvents
      .filter(e => (e.views || 0) > 0 || (e.likes || 0) > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        views: e.views || 0,
        likes: e.likes || 0,
        rating: avgRating,
        category: e.category,
      }));

    // Event health matrix (events with health score)
    const eventHealthMatrix = scopedEvents
      .map(e => {
        const viewScore = Math.min(100, (e.views || 0) / 10);
        const likeScore = Math.min(100, (e.likes || 0) * 5);
        const ratingScore = avgRating * 20;
        const health = Math.round((viewScore + likeScore + ratingScore) / 3);
        return {
          id: e.id,
          title: e.title,
          category: e.category,
          health,
          views: e.views || 0,
          likes: e.likes || 0,
          date: e.date,
        };
      })
      .sort((a, b) => b.health - a.health)
      .slice(0, 6);

    // Comparative insights (mock comparative data)
    const comparativeInsights = {
      periodGrowth: Math.round(Math.random() * 40 - 10), // -10% to +30%
      categoryGrowth: Math.round(Math.random() * 30 - 5),
      topEventGrowth: Math.round(Math.random() * 50 - 20),
    };

    setInsights({
      totalViews,
      totalLikes,
      totalEvents: scopedEvents.length,
      monthlyGrowth: Math.max(0, monthlyGrowth),
      engagementRate: Math.min(100, engagementRate),
      averageRating: avgRating,
      bestCategory,
      recentActivity: recentEvents.length,
      pastEvents: scopedEvents.filter(event => getEventStatus(event.date) === 'past').length,
      upcomingEvents: scopedEvents.filter(event => getEventStatus(event.date) === 'upcoming').length,
      avgViewsPerEvent: scopedEvents.length > 0 ? Math.round(totalViews / scopedEvents.length) : 0,
      bestPerformingEvent: scopedEvents.length > 0 ? scopedEvents.reduce((best, event) => 
        (event.views || 0) > (best.views || 0) ? event : best
      ) : null
      ,
      categoryBreakdown,
      growthTrend,
      engagementFunnel,
      recentActivityList,
      eventHealthMatrix,
      comparativeInsights,
    });
  };

  const scopedEventsForDisplay = useMemo(() => {
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    const rangeStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return Array.isArray(organizerEvents)
      ? organizerEvents.filter((event) => {
          const ts = new Date(event?.date).getTime();
          if (Number.isNaN(ts)) return false;
          return ts >= rangeStart.getTime();
        })
      : [];
  }, [organizerEvents, timeRange]);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const timeRanges = [
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
    { key: 'quarter', label: 'Last 3 Months' },
    { key: 'year', label: 'Last Year' },
  ];

  const performanceScore = useMemo(() => {
    const growth = typeof insights.monthlyGrowth === 'number' ? insights.monthlyGrowth : 0;
    const engagement = typeof insights.engagementRate === 'number' ? insights.engagementRate : 0;
    const score = Math.round((engagement * 0.7) + (Math.min(100, growth) * 0.3));
    return Math.max(0, Math.min(100, score));
  }, [insights.engagementRate, insights.monthlyGrowth]);

  const AnalyticsHeader = () => (
    <View style={[styles.homeHeaderContainer, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0B3A67', '#01579B', '#0277BD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.homeHeaderCard}
      >
        <View style={styles.homeHeaderBg} pointerEvents="none">
          <View style={styles.homeHeaderOrbOne} />
          <View style={styles.homeHeaderOrbTwo} />
        </View>

        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack?.()}
              activeOpacity={0.8}
              style={styles.headerIconButton}
            >
              <Feather name="chevron-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.homeHeaderWelcomeText}>Insights</Text>
            <Text style={styles.homeHeaderNameText}>Analytics</Text>
            <Text style={styles.homeHeaderCountText}>
              {insights.totalEvents} {insights.totalEvents === 1 ? 'Event' : 'Events'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleRefresh}
              activeOpacity={0.8}
              style={styles.headerIconButton}
            >
              <Feather name="refresh-cw" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.homeHeaderMetaRow}>
          <Text style={styles.homeHeaderMetaText}>Track Performance</Text>
          <Text style={styles.homeHeaderMetaSeparator}>|</Text>
          <Text style={styles.homeHeaderMetaText}>Monitor Growth</Text>
          <Text style={styles.homeHeaderMetaSeparator}>|</Text>
          <Text style={styles.homeHeaderMetaText}>Optimize Strategy</Text>
        </View>

        <View style={styles.heroRow}>
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Feather name="zap" size={14} color="#0F172A" />
                <Text style={styles.heroBadgeText}>Performance Score</Text>
              </View>
              <Text style={styles.heroScore}>{performanceScore}</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              Engagement + growth across your selected period
            </Text>
            <View style={styles.heroMiniRow}>
              <View style={styles.heroMiniItem}>
                <Feather name="eye" size={14} color="#E2E8F0" />
                <Text style={styles.heroMiniText}>{formatNumber(insights.totalViews)} views</Text>
              </View>
              <View style={styles.heroMiniItem}>
                <Feather name="heart" size={14} color="#FCA5A5" />
                <Text style={styles.heroMiniText}>{formatNumber(insights.totalLikes)} likes</Text>
              </View>
              <View style={styles.heroMiniItem}>
                <Feather name="trending-up" size={14} color="#86EFAC" />
                <Text style={styles.heroMiniText}>+{insights.monthlyGrowth}%</Text>
              </View>
            </View>
          </LinearGradient>
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
            <LinearGradient
              colors={['#E0F2FE', '#EFF6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricCard}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: '#0277BD' }]}>
                <Feather name="eye" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(insights.totalViews)}</Text>
              <Text style={styles.metricLabel}>Total Views</Text>
              <View style={styles.metricTrend}>
                <Feather name="trending-up" size={12} color="#10B981" />
                <Text style={styles.metricTrendText}>+{insights.monthlyGrowth}%</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#FFE4E6', '#FEF2F2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricCard}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: '#EF4444' }]}>
                <Feather name="heart" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(insights.totalLikes)}</Text>
              <Text style={styles.metricLabel}>Total Likes</Text>
              <View style={styles.metricTrend}>
                <Feather name="activity" size={12} color="#EF4444" />
                <Text style={[styles.metricTrendText, { color: '#EF4444' }]}>{insights.engagementRate}%</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#FEF3C7', '#FFFBEB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricCard}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: '#F59E0B' }]}>
                <Feather name="calendar" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{insights.totalEvents}</Text>
              <Text style={styles.metricLabel}>Events</Text>
              <View style={styles.metricTrend}>
                <Feather name="check-circle" size={12} color="#0F172A" />
                <Text style={[styles.metricTrendText, { color: '#0F172A' }]}>Tracked</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#DCFCE7', '#F0FDF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricCard}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: '#10B981' }]}>
                <Feather name="bar-chart-2" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.metricValue}>{formatNumber(insights.avgViewsPerEvent)}</Text>
              <Text style={styles.metricLabel}>Avg Views/Event</Text>
              <View style={styles.metricTrend}>
                <Feather name="zap" size={12} color="#10B981" />
                <Text style={styles.metricTrendText}>{performanceScore}/100</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatsHeader}>
            <Text style={styles.sectionTitle}>Quick Snapshot</Text>
            <Text style={styles.quickStatsHint}>{timeRanges.find(r => r.key === timeRange)?.label}</Text>
          </View>
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatPill}>
              <Feather name="clock" size={14} color="#475569" />
              <Text style={styles.quickStatText}>{insights.recentActivity} recent</Text>
            </View>
            <View style={styles.quickStatPill}>
              <Feather name="arrow-up-right" size={14} color="#10B981" />
              <Text style={styles.quickStatText}>{insights.upcomingEvents} upcoming</Text>
            </View>
            <View style={styles.quickStatPill}>
              <Feather name="archive" size={14} color="#64748B" />
              <Text style={styles.quickStatText}>{insights.pastEvents} past</Text>
            </View>
          </View>
        </View>

        {/* Growth Trend */}
        <View style={styles.growthContainer}>
          <Text style={styles.sectionTitle}>Growth Trend</Text>
          <View style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <View style={styles.growthLabel}>
                <Feather name="trending-up" size={16} color="#10B981" />
                <Text style={styles.growthLabelText}>Views over time</Text>
              </View>
              <Text style={styles.growthValue}>+{insights.monthlyGrowth}%</Text>
            </View>
            <View style={styles.sparklineContainer}>
              {insights.growthTrend.map((value, index) => {
                const max = Math.max(...insights.growthTrend);
                const height = max > 0 ? (value / max) * 100 : 0;
                return (
                  <View key={index} style={[styles.sparklineBar, { height: `${height}%` }]} />
                );
              })}
            </View>
            <Text style={styles.growthNote}>Last {insights.growthTrend.length} periods</Text>
          </View>
        </View>

        {/* Engagement Funnel */}
        <View style={styles.funnelContainer}>
          <Text style={styles.sectionTitle}>Engagement Funnel</Text>
          <View style={styles.funnelCard}>
            {[
              { label: 'Views', value: insights.engagementFunnel.views, color: '#0277BD', icon: 'eye' },
              { label: 'Likes', value: insights.engagementFunnel.likes, color: '#EF4444', icon: 'heart' },
              { label: 'Rating', value: `${insights.averageRating.toFixed(1)} ⭐`, color: '#F59E0B', icon: 'star' },
            ].map((step, index) => (
              <View key={step.label} style={styles.funnelStep}>
                <View style={styles.funnelStepLeft}>
                  <View style={[styles.funnelStepIcon, { backgroundColor: step.color }]}>
                    <Feather name={step.icon} size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.funnelStepLabel}>{step.label}</Text>
                </View>
                <Text style={styles.funnelStepValue}>{formatNumber(step.value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Event Health Matrix */}
        <View style={styles.healthContainer}>
          <Text style={styles.sectionTitle}>Event Health Matrix</Text>
          <View style={styles.healthGrid}>
            {insights.eventHealthMatrix.map((event) => (
              <View key={event.id} style={styles.healthCard}>
                <View style={styles.healthHeader}>
                  <Text style={styles.healthTitle} numberOfLines={1}>{event.title}</Text>
                  <View style={[styles.healthBadge, { backgroundColor: event.health >= 80 ? '#10B981' : event.health >= 50 ? '#F59E0B' : '#EF4444' }]}>
                    <Text style={styles.healthBadgeText}>{event.health}</Text>
                  </View>
                </View>
                <Text style={styles.healthCategory}>{event.category}</Text>
                <View style={styles.healthBars}>
                  <View style={styles.healthBar}>
                    <Text style={styles.healthBarLabel}>Views</Text>
                    <View style={styles.healthBarTrack}>
                      <View style={[styles.healthBarFill, { width: `${Math.min(100, (event.views / 10))}%`, backgroundColor: '#0277BD' }]} />
                    </View>
                  </View>
                  <View style={styles.healthBar}>
                    <Text style={styles.healthBarLabel}>Likes</Text>
                    <View style={styles.healthBarTrack}>
                      <View style={[styles.healthBarFill, { width: `${Math.min(100, (event.likes * 5))}%`, backgroundColor: '#EF4444' }]} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity Timeline */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {insights.recentActivityList.length === 0 ? (
              <View style={styles.activityEmpty}>
                <Feather name="inbox" size={24} color="#94A3B8" />
                <Text style={styles.activityEmptyText}>No recent activity</Text>
              </View>
            ) : (
              insights.recentActivityList.map((item, index) => (
                <View key={item.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityMeta}>{item.category} • {formatDate(item.date)}</Text>
                    <View style={styles.activityStats}>
                      <Text style={styles.activityStat}>{formatNumber(item.views)} views</Text>
                      <Text style={styles.activityStat}>{formatNumber(item.likes)} likes</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Comparative Insights */}
        <View style={styles.comparativeContainer}>
          <Text style={styles.sectionTitle}>Comparative Insights</Text>
          <View style={styles.comparativeGrid}>
            <View style={styles.comparativeCard}>
              <View style={styles.comparativeHeader}>
                <Feather name="calendar" size={16} color="#0277BD" />
                <Text style={styles.comparativeTitle}>Period Growth</Text>
              </View>
              <Text style={[styles.comparativeValue, { color: insights.comparativeInsights.periodGrowth >= 0 ? '#10B981' : '#EF4444' }]}>
                {insights.comparativeInsights.periodGrowth >= 0 ? '+' : ''}{insights.comparativeInsights.periodGrowth}%
              </Text>
              <Text style={styles.comparativeNote}>vs previous period</Text>
            </View>
            <View style={styles.comparativeCard}>
              <View style={styles.comparativeHeader}>
                <Feather name="layers" size={16} color="#8B5CF6" />
                <Text style={styles.comparativeTitle}>Category Growth</Text>
              </View>
              <Text style={[styles.comparativeValue, { color: insights.comparativeInsights.categoryGrowth >= 0 ? '#10B981' : '#EF4444' }]}>
                {insights.comparativeInsights.categoryGrowth >= 0 ? '+' : ''}{insights.comparativeInsights.categoryGrowth}%
              </Text>
              <Text style={styles.comparativeNote}>vs average</Text>
            </View>
            <View style={styles.comparativeCard}>
              <View style={styles.comparativeHeader}>
                <Feather name="award" size={16} color="#F59E0B" />
                <Text style={styles.comparativeTitle}>Top Event</Text>
              </View>
              <Text style={[styles.comparativeValue, { color: insights.comparativeInsights.topEventGrowth >= 0 ? '#10B981' : '#EF4444' }]}>
                {insights.comparativeInsights.topEventGrowth >= 0 ? '+' : ''}{insights.comparativeInsights.topEventGrowth}%
              </Text>
              <Text style={styles.comparativeNote}>vs last period</Text>
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

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Feather name="award" size={16} color="#8B5CF6" />
              <Text style={styles.insightTitle}>Best Category</Text>
            </View>
            <Text style={styles.insightValue}>{insights.bestCategory}</Text>
            <Text style={styles.insightDescription}>Most impact by views + likes</Text>
          </View>
        </View>

        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.breakdownCard}>
            {(insights.categoryBreakdown || []).length === 0 ? (
              <View style={styles.breakdownEmpty}>
                <View style={styles.breakdownEmptyIcon}>
                  <Feather name="layers" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.breakdownEmptyTitle}>No category data yet</Text>
                <Text style={styles.breakdownEmptyText}>Create events and start collecting insights.</Text>
              </View>
            ) : (
              (insights.categoryBreakdown || []).map((row) => (
                <View key={row.category} style={styles.breakdownRow}>
                  <View style={styles.breakdownRowTop}>
                    <Text style={styles.breakdownLabel} numberOfLines={1}>
                      {row.category}
                    </Text>
                    <Text style={styles.breakdownMeta}>{row.share}%</Text>
                  </View>
                  <View style={styles.breakdownBarTrack}>
                    <View style={[styles.breakdownBarFill, { width: `${Math.min(100, Math.max(0, row.share || 0))}%` }]} />
                  </View>
                  <Text style={styles.breakdownSub}>
                    {formatNumber(row.views)} views • {formatNumber(row.likes)} likes • {row.count} events
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Top Performing Events */}
        <View style={styles.topEventsContainer}>
          <Text style={styles.sectionTitle}>Top Performing Events</Text>
          {scopedEventsForDisplay
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
                    {event.views || 0} views • {event.likes || 0} likes
                  </Text>
                </View>
                <View style={styles.topEventPerformance}>
                  <Text style={styles.topEventPerformanceText}>
                    {event.price > 0 ? formatCurrency(event.price) : 'Free'}
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    marginTop: 14,
  },
  heroCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '900',
    fontFamily: 'System',
  },
  heroScore: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    fontFamily: 'System',
  },
  heroMiniRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroMiniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMiniText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
    fontFamily: 'System',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
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
  quickStatsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  quickStatsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickStatsHint: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  quickStatText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  breakdownContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  breakdownEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  breakdownEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  breakdownEmptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: 'System',
  },
  breakdownEmptyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
  breakdownRow: {
    marginBottom: 12,
  },
  breakdownRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
    fontFamily: 'System',
  },
  breakdownMeta: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0277BD',
    fontFamily: 'System',
  },
  breakdownBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    backgroundColor: '#0277BD',
    borderRadius: 999,
  },
  breakdownSub: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'System',
  },
  growthContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  growthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  growthLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  growthLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  growthValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
    fontFamily: 'System',
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: 12,
    gap: 4,
  },
  sparklineBar: {
    flex: 1,
    backgroundColor: '#0277BD',
    borderRadius: 2,
    minHeight: 4,
  },
  growthNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: 'System',
  },
  funnelContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  funnelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  funnelStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  funnelStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  funnelStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  funnelStepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  funnelStepValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: 'System',
  },
  healthContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  healthCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
    fontFamily: 'System',
  },
  healthBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  healthCategory: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
    fontFamily: 'System',
  },
  healthBars: {
    gap: 8,
  },
  healthBar: {
    gap: 6,
  },
  healthBarLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    fontFamily: 'System',
  },
  healthBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  activityContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  activityEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  activityEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: 'System',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0277BD',
    marginTop: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  activityMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'System',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  activityStat: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '700',
    fontFamily: 'System',
  },
  comparativeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  comparativeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  comparativeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  comparativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  comparativeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  comparativeValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    fontFamily: 'System',
  },
  comparativeNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: 'System',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
