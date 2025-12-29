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
import { adminOrganizersStyles } from '../styles/adminStyles';

const AdminOrganizersScreen = ({ navigation }) => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchOrganizers = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOrganizers([]);
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
        } else {
          setOrganizers(prev => [...prev, ...response.data]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch organizers');
      if (__DEV__) {
        console.error('Admin fetch organizers error:', error);
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

  const handleToggleVerify = async (organizerId) => {
    try {
      const response = await apiService.put(`/admin/organizers/${organizerId}/verify`, {}, { requireAuth: true });
      if (response.success) {
        setOrganizers(prev => prev.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, isVerified: response.data.isVerified }
            : organizer
        ));
        Alert.alert('Success', `Organizer ${response.data.isVerified ? 'verified' : 'unverified'} successfully`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update organizer');
      if (__DEV__) {
        console.error('Admin verify organizer error:', error);
      }
    }
  };

  const handleToggleStatus = async (organizerId, isActive) => {
    try {
      const response = await apiService.put(`/admin/organizers/${organizerId}/status`, { isActive }, { requireAuth: true });
      if (response.success) {
        setOrganizers(prev => prev.map(organizer => 
          organizer._id === organizerId 
            ? { ...organizer, isActive: response.data.isActive }
            : organizer
        ));
        Alert.alert('Success', `Organizer ${isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update organizer status');
      if (__DEV__) {
        console.error('Admin update organizer status error:', error);
      }
    }
  };

  const handleViewDetails = async (organizerId) => {
    try {
      const response = await apiService.get(`/organizers/${organizerId}/admin-details`, { requireAuth: true });
      if (response.success) {
        navigation.navigate('AdminOrganizerDetails', { organizer: response.data });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch organizer details');
      if (__DEV__) {
        console.error('Admin organizer details error:', error);
      }
    }
  };

  const renderOrganizerCard = (organizer) => (
    <View key={organizer._id} style={adminOrganizersStyles.dashboardEventCard}>
      <View style={adminOrganizersStyles.dashboardEventHeader}>
        <View style={adminOrganizersStyles.dashboardEventInfo}>
          <View style={adminOrganizersStyles.dashboardEventIconContainer}>
            <Feather name="user" size={18} color="#0277BD" />
          </View>
          <View style={adminOrganizersStyles.dashboardEventDetails}>
            <Text style={adminOrganizersStyles.dashboardEventTitle}>{organizer.name}</Text>
            <Text style={adminOrganizersStyles.dashboardEventDate}>{organizer.email}</Text>
            <View style={adminOrganizersStyles.dashboardEventMeta}>
              <View style={adminOrganizersStyles.dashboardEventStatusWrapper}>
                <View style={[
                  adminOrganizersStyles.dashboardEventStatus,
                  { backgroundColor: organizer.isActive ? '#10B98120' : '#EF444420' }
                ]}>
                  <Text style={[
                    adminOrganizersStyles.dashboardEventStatusText,
                    { color: organizer.isActive ? '#10B981' : '#EF4444' }
                  ]}>
                    {organizer.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                {organizer.isVerified && (
                  <View style={[
                    adminOrganizersStyles.dashboardEventStatus,
                    { backgroundColor: '#3B82F620', marginLeft: 8 }
                  ]}>
                    <Text style={[adminOrganizersStyles.dashboardEventStatusText, { color: '#3B82F6' }]}>
                      Verified
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={adminOrganizersStyles.dashboardEventActions}>
          <TouchableOpacity
            style={[adminOrganizersStyles.dashboardActionButton, { backgroundColor: '#EFF6FF' }]}
            onPress={() => handleViewDetails(organizer._id)}
          >
            <Feather name="eye" size={16} color="#0277BD" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[adminOrganizersStyles.dashboardActionButton, { backgroundColor: '#FEF3C7' }]}
            onPress={() => handleToggleVerify(organizer._id)}
          >
            <Feather name="check-circle" size={16} color={organizer.isVerified ? "#F59E0B" : "#9CA3AF"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminOrganizersStyles.dashboardActionButton, 
              { backgroundColor: organizer.isActive ? '#FEE2E2' : '#D1FAE5' }
            ]}
            onPress={() => handleToggleStatus(organizer._id, !organizer.isActive)}
          >
            <Feather 
              name={organizer.isActive ? "user-x" : "user-check"} 
              size={16} 
              color={organizer.isActive ? "#EF4444" : "#10B981"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={adminOrganizersStyles.dashboardEventMeta}>
        <View style={adminOrganizersStyles.dashboardEventMetaItem}>
          <Feather name="calendar" size={12} color="#64748B" />
          <Text style={adminOrganizersStyles.dashboardEventMetaValue}>
            {organizer.stats?.totalEvents || 0} events
          </Text>
        </View>
        <View style={adminOrganizersStyles.dashboardEventMetaItem}>
          <Feather name="activity" size={12} color="#64748B" />
          <Text style={adminOrganizersStyles.dashboardEventMetaValue}>
            {organizer.stats?.activeEvents || 0} active
          </Text>
        </View>
        <View style={adminOrganizersStyles.dashboardEventMetaItem}>
          <Feather name="map-pin" size={12} color="#64748B" />
          <Text style={adminOrganizersStyles.dashboardEventMetaValue}>
            {organizer.location?.city || 'No location'}
          </Text>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    fetchOrganizers(1, true);
  }, [filters]);

  if (loading && organizers.length === 0) {
    return (
      <SafeAreaView style={adminOrganizersStyles.container}>
        <View style={adminOrganizersStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={adminOrganizersStyles.loadingText}>Loading organizers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={adminOrganizersStyles.container}>
      <View style={adminOrganizersStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={adminOrganizersStyles.headerTitle}>Manage Organizers</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Feather name="refresh-cw" size={24} color="#1F2937" />
        </TouchableOpacity>
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
            <Text style={adminOrganizersStyles.filterChipText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminOrganizersStyles.filterChip,
              filters.status === 'active' && adminOrganizersStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'active' }))}
          >
            <Text style={adminOrganizersStyles.filterChipText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminOrganizersStyles.filterChip,
              filters.verified === 'true' && adminOrganizersStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, verified: prev.verified === 'true' ? '' : 'true' }))}
          >
            <Text style={adminOrganizersStyles.filterChipText}>Verified</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={adminOrganizersStyles.container}
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
        {organizers.length === 0 ? (
          <View style={adminOrganizersStyles.emptyContainer}>
            <Feather name="users" size={48} color="#9CA3AF" />
            <Text style={adminOrganizersStyles.emptyTitle}>No organizers found</Text>
            <Text style={adminOrganizersStyles.emptyText}>
              Try adjusting your filters
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
    </SafeAreaView>
  );
};

export default AdminOrganizersScreen;
