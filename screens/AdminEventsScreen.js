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
import { adminEventsStyles } from '../styles/adminStyles';

const AdminEventsScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchEvents = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setEvents([]);
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
        } else {
          setEvents(prev => [...prev, ...response.data]);
        }
        setPagination(response.pagination);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch events');
      console.error('Admin fetch events error:', error);
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

  const handleToggleFeature = async (eventId) => {
    try {
      const response = await apiService.put(`/admin/events/${eventId}/feature`, {}, { requireAuth: true });
      if (response.success) {
        setEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, featured: response.data.featured }
            : event
        ));
        Alert.alert('Success', `Event ${response.data.featured ? 'featured' : 'unfeatured'} successfully`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
      console.error('Admin feature event error:', error);
    }
  };

  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      const response = await apiService.put(`/admin/events/${eventId}/status`, { status: newStatus }, { requireAuth: true });
      if (response.success) {
        setEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, status: response.data.status }
            : event
        ));
        Alert.alert('Success', 'Event status updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update event status');
      console.error('Admin update status error:', error);
    }
  };

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
              const response = await apiService.delete(`/admin/events/${eventId}`, { requireAuth: true });
              if (response.success) {
                setEvents(prev => prev.filter(event => event._id !== eventId));
                Alert.alert('Success', 'Event deleted successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
              console.error('Admin delete event error:', error);
            }
          }
        }
      ]
    );
  };

  const handleEditEvent = (event) => {
    navigation.navigate('CreateEvent', { editEvent: event });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#10B981';
      case 'draft': return '#6B7280';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const renderEventCard = (event) => (
    <View key={event._id} style={adminEventsStyles.dashboardEventCard}>
      <View style={adminEventsStyles.dashboardEventHeader}>
        <View style={adminEventsStyles.dashboardEventInfo}>
          <View style={adminEventsStyles.dashboardEventIconContainer}>
            <Feather name="calendar" size={18} color="#0277BD" />
          </View>
          <View style={adminEventsStyles.dashboardEventDetails}>
            <Text style={adminEventsStyles.dashboardEventTitle}>{event.title}</Text>
            <Text style={adminEventsStyles.dashboardEventDate}>
              {new Date(event.date).toLocaleDateString()} • {event.time}
            </Text>
            <View style={adminEventsStyles.dashboardEventMeta}>
              <View style={adminEventsStyles.dashboardEventStatusWrapper}>
                <View style={[
                  adminEventsStyles.dashboardEventStatus,
                  { backgroundColor: getStatusColor(event.status) + '20' }
                ]}>
                  <Text style={[
                    adminEventsStyles.dashboardEventStatusText,
                    { color: getStatusColor(event.status) }
                  ]}>
                    {event.status}
                  </Text>
                </View>
                {event.featured && (
                  <View style={[
                    adminEventsStyles.dashboardEventStatus,
                    { backgroundColor: '#F59E0B20', marginLeft: 8 }
                  ]}>
                    <Text style={[adminEventsStyles.dashboardEventStatusText, { color: '#F59E0B' }]}>
                      Featured
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={adminEventsStyles.dashboardEventActions}>
          <TouchableOpacity
            style={[adminEventsStyles.dashboardActionButton, { backgroundColor: '#EFF6FF' }]}
            onPress={() => handleEditEvent(event)}
          >
            <Feather name="edit-2" size={16} color="#0277BD" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[adminEventsStyles.dashboardActionButton, { backgroundColor: '#FEF3C7' }]}
            onPress={() => handleToggleFeature(event._id)}
          >
            <Feather name="star" size={16} color={event.featured ? "#F59E0B" : "#9CA3AF"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[adminEventsStyles.dashboardActionButton, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleDeleteEvent(event._id)}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={adminEventsStyles.dashboardEventMeta}>
        <View style={adminEventsStyles.dashboardEventMetaItem}>
          <Feather name="user" size={12} color="#64748B" />
          <Text style={adminEventsStyles.dashboardEventMetaValue}>
            {event.organizerId?.name || 'Unknown'}
          </Text>
        </View>
        <View style={adminEventsStyles.dashboardEventMetaItem}>
          <Feather name="map-pin" size={12} color="#64748B" />
          <Text style={adminEventsStyles.dashboardEventMetaValue}>
            {event.location?.city}, {event.location?.country}
          </Text>
        </View>
        <View style={adminEventsStyles.dashboardEventMetaItem}>
          <Feather name="users" size={12} color="#64748B" />
          <Text style={adminEventsStyles.dashboardEventMetaValue}>
            {event.attendeeCount || 0} attending
          </Text>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    fetchEvents(1, true);
  }, [filters]);

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={adminEventsStyles.container}>
        <View style={adminEventsStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={adminEventsStyles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={adminEventsStyles.container}>
      <View style={adminEventsStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={adminEventsStyles.headerTitle}>Manage All Events</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Feather name="refresh-cw" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={adminEventsStyles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              adminEventsStyles.filterChip,
              filters.status === 'all' && adminEventsStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
          >
            <Text style={adminEventsStyles.filterChipText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminEventsStyles.filterChip,
              filters.status === 'published' && adminEventsStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'published' }))}
          >
            <Text style={adminEventsStyles.filterChipText}>Published</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminEventsStyles.filterChip,
              filters.status === 'draft' && adminEventsStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'draft' }))}
          >
            <Text style={adminEventsStyles.filterChipText}>Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminEventsStyles.filterChip,
              filters.status === 'cancelled' && adminEventsStyles.filterChipActive
            ]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'cancelled' }))}
          >
            <Text style={adminEventsStyles.filterChipText}>Cancelled</Text>
          </TouchableOpacity>
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
        {events.length === 0 ? (
          <View style={adminEventsStyles.emptyContainer}>
            <Feather name="calendar" size={48} color="#9CA3AF" />
            <Text style={adminEventsStyles.emptyTitle}>No events found</Text>
            <Text style={adminEventsStyles.emptyText}>
              {filters.status !== 'all' 
                ? `No ${filters.status} events found` 
                : 'No events found'
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
    </SafeAreaView>
  );
};

export default AdminEventsScreen;
