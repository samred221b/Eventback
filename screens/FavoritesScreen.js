// src/screens/FavoritesScreen.js
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import globalStyles from '../styles';

import { SafeTouchableOpacity } from '../components/SafeComponents';
import { useFavorites } from '../providers/FavoritesProvider';
import apiService from '../services/api';
import favStyles from '../styles/Favouritescreenstyle';
import homeStyles from '../styles/homeStyles';
import EnhancedSearch from '../components/EnhancedSearch';

const makeEventSerializable = (event) => {
  const { parsedDate, ...rest } = event;
  return rest;
};

const EVENTS_CACHE_KEY = '@eventopia_events';

const FavoritesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const styles = favStyles; // alias once at top
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Fetch full event details for the user's favorite IDs
  const cacheEvents = async (events) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
    } catch (e) {
      // handle error
    }
  };

  const loadEventsFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // handle error
    }
    return [];
  };

  const loadFavoriteEvents = async () => {
    if (favorites.length === 0) {
      setFavoriteEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let allEvents = [];
      let matched = [];
      let fetched = false;
      try {
        const response = await apiService.getEvents();
        if (response.success && response.data) {
          allEvents = response.data
            .filter(e => e._id && e.title && e.date)
            .map(e => ({
              id: e._id,
              title: e.title,
              description: e.description,
              date: e.date,
              time: e.time,
              location: e.location,
              price: e.price || 0,
              currency: e.currency || 'ETB',
              category: e.category,
              featured: e.featured || false,
              imageUrl: e.imageUrl || e.image || null,
              organizerName: e.organizerName || e.organizer || '',
              importantInfo: e.importantInfo || '',
            }));
          // Cache all events locally
          await cacheEvents(response.data);
          fetched = true;
        }
      } catch (error) {
        // If fetch fails, try to load from cache
        const cached = await loadEventsFromCache();
        if (cached.length > 0) {
          allEvents = cached
            .filter(e => e._id && e.title && e.date)
            .map(e => ({
              id: e._id,
              title: e.title,
              description: e.description,
              date: e.date,
              time: e.time,
              location: e.location,
              price: e.price || 0,
              currency: e.currency || 'ETB',
              category: e.category,
              featured: e.featured || false,
              imageUrl: e.imageUrl || e.image || null,
              organizerName: e.organizerName || e.organizer || '',
              importantInfo: e.importantInfo || '',
            }));
        }
      }
      // Keep only events that are in the user's favorites list
      matched = allEvents.filter(event => favorites.includes(event.id));
      setFavoriteEvents(matched);
      setFilteredEvents(matched);
    } catch (error) {
      console.error('FavoritesScreen: Failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavoriteEvents();
  }, [favorites]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredEvents(favoriteEvents);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = favoriteEvents.filter(
      event =>
        event.title?.toLowerCase().includes(lowerQuery) ||
        event.location?.name?.toLowerCase().includes(lowerQuery) ||
        event.category?.toLowerCase().includes(lowerQuery)
    );
    setFilteredEvents(filtered);
  }, [searchQuery, favoriteEvents]);

  const handleEventPress = async (event) => {
    try {
      await apiService.trackEventView(event.id);
    } catch (err) {
      console.warn('Track view failed');
    }
    const serializable = makeEventSerializable(event);
    serializable.organizerName = event.organizerName || event.organizer || '';
    serializable.importantInfo = event.importantInfo || '';
    navigation.navigate('EventDetails', { event: serializable });
  };

  const renderEvent = ({ item }) => (
    <SafeTouchableOpacity
      style={styles.favoriteEventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.95}
    >
      <View style={styles.favoriteEventImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.favoriteEventImage} />
        ) : (
          <View style={styles.favoriteEventPlaceholder}>
            <Feather name="image" size={32} color="#60A5FA" />
          </View>
        )}
      </View>

      <View style={styles.favoriteEventContent}>
        <Text style={styles.favoriteEventTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.favoriteEventDate}>
          {new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          • {item.time || 'Time TBD'}
        </Text>

        <Text style={styles.favoriteEventLocation} numberOfLines={1}>
          {typeof item.location === 'string' ? item.location : item.location?.name || 'Location TBA'}
        </Text>

        <View style={styles.favoriteEventFooter}>
          <Text style={styles.favoriteEventPrice}>
            {item.price === 0 ? 'Free' : `${item.currency} ${item.price}`}
          </Text>

          {/* Heart button to unfavorite */}
          <SafeTouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteHeartButton}
          >
            <Feather name="heart" size={22} color="#EF4444" fill="#EF4444" />
          </SafeTouchableOpacity>
        </View>
      </View>
    </SafeTouchableOpacity>
  );

  const renderHeader = () => (
    <View style={{ paddingTop: insets.top }}>
      <View style={homeStyles.homeHeaderContainer}>
        <LinearGradient
          colors={['#0277BD', '#01579B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={homeStyles.homeHeaderCard}
        >
          <View style={homeStyles.homeHeaderTopRow}>
            <Text style={homeStyles.homeHeaderNameText}>Favourites</Text>
            <View style={homeStyles.homeHeaderActions}>
              <SafeTouchableOpacity 
                style={homeStyles.homeHeaderIconButton}
                onPress={() => setShowSearch(!showSearch)}
              >
                <Feather name="search" size={20} color="rgba(255, 255, 255, 1)" />
              </SafeTouchableOpacity>
            </View>
          </View>

          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>Discover Events</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Create Memories</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Share Moments</Text>
          </View>

        </LinearGradient>
      </View>

      {showSearch && (
        <View style={styles.searchSection}>
          <EnhancedSearch
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your favorites..."
            events={favoriteEvents}
            onEventSelect={event => {
              handleEventPress(event);
              setShowSearch(false);
            }}
          />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0277BD" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  const contentStyle = filteredEvents.length === 0
    ? { paddingTop: 0, paddingBottom: insets.bottom + 40, flexGrow: 1 }
    : { paddingTop: 0, paddingBottom: insets.bottom + 40 };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7EFEA' }}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyFavoritesContainer}>
            <Feather name="award" size={80} color="#93C5FD" />
            <Text style={styles.emptyFavoritesTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyFavoritesText}>
              Your favorite events will appear here. Start exploring and save what you love!
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default FavoritesScreen;