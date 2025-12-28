import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/api';
import { adminAnalyticsStyles } from '../styles/adminStyles';

const AdminAnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/admin/analytics', { requireAuth: true });
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch analytics');
      console.error('Admin fetch analytics error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
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
    fetchAnalytics();
  }, []);

  if (loading && !analytics) {
    return (
      <SafeAreaView style={adminAnalyticsStyles.container}>
        <View style={adminAnalyticsStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={adminAnalyticsStyles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={adminAnalyticsStyles.container}>
        <View style={adminAnalyticsStyles.emptyContainer}>
          <Feather name="bar-chart-2" size={48} color="#9CA3AF" />
          <Text style={adminAnalyticsStyles.emptyTitle}>No analytics available</Text>
          <Text style={adminAnalyticsStyles.emptyText}>Please try again later</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={adminAnalyticsStyles.container}>
      <View style={adminAnalyticsStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={adminAnalyticsStyles.headerTitle}>System Analytics</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Feather name="refresh-cw" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={adminAnalyticsStyles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
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
    </SafeAreaView>
  );
};

export default AdminAnalyticsScreen;
