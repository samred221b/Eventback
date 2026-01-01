import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORGANIZER_EVENTS_CACHE_KEY = (organizerId) => `organizer_all_events_${organizerId}`;
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

const cacheEventsData = async (organizerId, eventsData) => {
  try {
    const cacheData = {
      events: eventsData,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(ORGANIZER_EVENTS_CACHE_KEY(organizerId), JSON.stringify(cacheData));
  } catch (error) {
    logger.warn('Failed to cache organizer events:', error);
  }
};

const getCachedEventsData = async (organizerId) => {
  try {
    const cachedData = await AsyncStorage.getItem(ORGANIZER_EVENTS_CACHE_KEY(organizerId));
    if (!cachedData) return null;
    
    const { events, timestamp } = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
      await AsyncStorage.removeItem(ORGANIZER_EVENTS_CACHE_KEY(organizerId));
      return null;
    }
    
    return events;
  } catch (error) {
    logger.warn('Failed to get cached events data:', error);
    return null;
  }
};

function OrganizerEventsScreen({ route, navigation }) {
  const { organizerId, organizerName } = route.params;
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [organizerId]);

  const fetchEvents = async (forceRefresh = false) => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedEvents = await getCachedEventsData(organizerId);
        if (cachedEvents) {
          console.log('Using cached events data');
          setEvents(cachedEvents);
          setIsFromCache(true);
          if (!refreshing) {
            setLoading(false);
          }
          return;
        }
      }

      // Reset cache indicator when fetching fresh data
      setIsFromCache(false);

      // Fetch all events for this organizer
      const response = await apiService.get(`/events?organizerId=${organizerId}&limit=100`);
      const eventsData = response.data.success ? response.data.data : response.data;
      
      setEvents(eventsData);
      
      // Cache the events data
      await cacheEventsData(organizerId, eventsData);
      console.log('Events data cached successfully');

    } catch (err) {
      console.error('Error fetching organizer events:', err);
      logger.error('Error fetching organizer events:', err);
      setError('Failed to load events');
    } finally {
      if (!refreshing) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setIsFromCache(false);
    await fetchEvents(true);
    setRefreshing(false);
  };

  const handleEventPress = async (event) => {
    try {
      await apiService.trackEventView(event.id);
    } catch (err) {
      logger.warn('Track view failed');
    }
    
    // Make event serializable for navigation
    const serializableEvent = {
      id: event._id || event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      price: event.price || 0,
      currency: event.currency || 'ETB',
      category: event.category,
      imageUrl: event.imageUrl || event.image || null,
      organizerName: event.organizerName || event.organizer || '',
      organizerId: event.organizerId,
      importantInfo: event.importantInfo || '',
    };
    
    navigation.navigate('EventDetails', { event: serializableEvent });
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden'
      }}
      onPress={() => handleEventPress(item)}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 120, height: 120 }}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={{ width: '100%', height: '100%' }} 
            />
          ) : (
            <LinearGradient
              colors={['#E0E7FF', '#C7D2FE']}
              style={{ 
                width: '100%', 
                height: '100%', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}
            >
              <Feather name="calendar" size={24} color="#6366F1" />
            </LinearGradient>
          )}
        </View>
        
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: '#1F2937',
            marginBottom: 8,
            numberOfLines: 2
          }}>
            {item.title}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Feather name="calendar" size={14} color="#64748B" />
            <Text style={{ 
              fontSize: 13, 
              color: '#64748B', 
              marginLeft: 4 
            }}>
              {new Date(item.date).toLocaleDateString()} • {item.time || 'TBD'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Feather name="map-pin" size={14} color="#64748B" />
            <Text style={{ 
              fontSize: 13, 
              color: '#64748B', 
              marginLeft: 4,
              flex: 1,
              numberOfLines: 1
            }}>
              {item.location?.name || item.location?.city || 'Location TBA'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 12, 
              color: '#6B7280',
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4
            }}>
              {item.category}
            </Text>
            
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600',
              color: item.price === 0 ? '#10B981' : '#0277BD'
            }}>
              {item.price === 0 ? 'Free' : `${item.currency || 'ETB'} ${item.price}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <LinearGradient
          colors={['#0277BD', '#01579B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top,
            paddingBottom: 16,
            paddingHorizontal: 20
          }}
        >
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <TouchableOpacity 
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: '#FFFFFF' 
            }}>
              {organizerName}'s Events
            </Text>
            
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center'
            }} />
          </View>
        </LinearGradient>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={{ marginTop: 16, color: '#64748B' }}>Loading events...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <LinearGradient
          colors={['#0277BD', '#01579B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top,
            paddingBottom: 16,
            paddingHorizontal: 20
          }}
        >
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <TouchableOpacity 
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: '#FFFFFF' 
            }}>
              {organizerName}'s Events
            </Text>
            
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center'
            }} />
          </View>
        </LinearGradient>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Feather name="alert-circle" size={64} color="#9CA3AF" />
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: '#374151' }}>
            {error}
          </Text>
          <TouchableOpacity 
            style={{
              marginTop: 16,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: '#0277BD',
              borderRadius: 8
            }}
            onPress={() => fetchEvents(true)}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <LinearGradient
        colors={['#0277BD', '#01579B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top,
          paddingBottom: 16,
          paddingHorizontal: 20
        }}
      >
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <TouchableOpacity 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '700', 
            color: '#FFFFFF' 
          }}>
            {organizerName}'s Events
          </Text>
          
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center'
          }} />
        </View>
      </LinearGradient>

      <FlatList
        data={events}
        keyExtractor={item => item._id || item.id}
        renderItem={renderEvent}
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFFFFF']}
            tintColor="#FFFFFF"
            progressBackgroundColor="#0277BD"
          />
        }
        ListEmptyComponent={
          <View style={{ 
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingVertical: 60 
          }}>
            <Feather name="calendar" size={48} color="#9CA3AF" />
            <Text style={{ 
              marginTop: 16, 
              fontSize: 18, 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              No Events Found
            </Text>
            <Text style={{ 
              marginTop: 8, 
              fontSize: 14, 
              color: '#64748B', 
              textAlign: 'center' 
            }}>
              {organizerName} hasn't posted any events yet
            </Text>
          </View>
        }
        ListHeaderComponent={
          isFromCache && !loading && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              marginHorizontal: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              marginTop: 8
            }}>
              <Feather name="info" size={14} color="#FFFFFF" />
              <Text style={{ 
                marginLeft: 6, 
                fontSize: 12, 
                color: '#FFFFFF',
                fontWeight: '500'
              }}>
                Cached data from {new Date(Date.now() - CACHE_EXPIRY_TIME).toLocaleTimeString()}
              </Text>
            </View>
          )
        }
        ListHeaderComponentStyle={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}

export default OrganizerEventsScreen;