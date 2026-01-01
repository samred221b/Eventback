import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import homeStyles from '../styles/homeStyles';
import apiService from '../services/api';
import { logger } from '../utils/logger';

export default function UsageStatisticsScreen({ navigation }) {
  const { user, organizerProfile } = useAuth();
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchUsageStatistics();
  }, []);

  const fetchUsageStatistics = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would have an API endpoint for usage statistics
      // For now, we'll simulate with mock data
      
      const mockStats = {
        totalEvents: 12,
        publishedEvents: 10,
        draftEvents: 2,
        totalViews: 15420,
        totalLikes: 892,
        upcomingEvents: 3,
        pastEvents: 9,
        monthlyViews: [
          { month: 'Jan', views: 1200 },
          { month: 'Feb', views: 1450 },
          { month: 'Mar', views: 1680 },
          { month: 'Apr', views: 1920 },
          { month: 'May', views: 2100 },
          { month: 'Jun', views: 2340 }
        ],
        topEvents: [
          { id: '1', title: 'Summer Music Festival', views: 3420, likes: 234 },
          { id: '2', title: 'Tech Conference 2024', views: 2890, likes: 198 },
          { id: '3', title: 'Food and Wine Expo', views: 2156, likes: 167 }
        ],
        recentActivity: [
          { type: 'view', event: 'Summer Music Festival', count: 45, time: '2 hours ago' },
          { type: 'like', event: 'Tech Conference 2024', count: 12, time: '5 hours ago' },
          { type: 'view', event: 'Food and Wine Expo', count: 8, time: '1 day ago' }
        ]
      };

      setStatistics(mockStats);
    } catch (error) {
      logger.error('Error fetching usage statistics:', error);
    } finally {
      setIsLoading(false);
    }
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
              value="4.2%"
              subtitle="Views per event"
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
