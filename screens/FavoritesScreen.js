// src/screens/FavoritesScreen.js
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import globalStyles from '../styles';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status

import { SafeTouchableOpacity } from '../components/SafeComponents';
import { useFavorites } from '../providers/FavoritesProvider';
import apiService from '../services/api';
import favStyles from '../styles/Favouritescreenstyle';
import homeStyles from '../styles/homeStyles';
import EnhancedSearch from '../components/EnhancedSearch';
import { logger } from '../utils/logger';

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
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

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
      setFilteredEvents([]);
      setLoading(false);
      setHasInitialLoad(true);
      return;
    }

    try {
      const shouldShowLoader = hasInitialLoad;
      setLoading(shouldShowLoader);
      let allEvents = [];
      let matched = [];
      let fetched = false;

      // Immediately show cached favorites for perceived performance
      const initialCached = await loadEventsFromCache();
      if (initialCached.length > 0) {
        const mappedCached = initialCached
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
        const preMatched = mappedCached.filter(event => favorites.includes(event.id));
        setFavoriteEvents(preMatched);
        setFilteredEvents(preMatched);
      }

      // We will now rely only on the cache, so the network call is removed.
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
        fetched = true;
      }

      if (!fetched) {
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

      matched = allEvents.filter(event => favorites.includes(event.id));
      setFavoriteEvents(matched);
      setFilteredEvents(matched);
    } catch (error) {
      logger.error('FavoritesScreen: Failed to load events', error);
    } finally {
      setLoading(false);
      setHasInitialLoad(true);
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
      logger.warn('Track view failed');
    }
    const serializable = makeEventSerializable(event);
    serializable.organizerName = event.organizerName || event.organizer || '';
    serializable.importantInfo = event.importantInfo || '';
    navigation.navigate('EventDetails', { event: serializable });
  };

  const renderEvent = ({ item }) => (
    <SafeTouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.95}
    >
      <View style={styles.eventImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
        ) : (
          <LinearGradient
            colors={['#E0E7FF', '#C7D2FE']}
            style={styles.eventPlaceholder}
          >
            <Feather name="image" size={24} color="#6366F1" />
          </LinearGradient>
        )}
      </View>

      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.heartButton}
            activeOpacity={0.8}
          >
            <Feather name="heart" size={18} color="#EF4444" fill="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color="#64748B" />
            <Text style={styles.metaText}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color="#64748B" />
            <Text style={styles.metaText}>{item.time || 'TBD'}</Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.locationItem}>
            <Feather name="map-pin" size={14} color="#64748B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {typeof item.location === 'string' ? item.location : item.location?.name || 'Location TBA'}
            </Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {item.price === 0 ? 'Free' : `${item.currency} ${item.price}`}
            </Text>
          </View>
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

  if (loading && hasInitialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0277BD" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  const contentStyle = filteredEvents.length === 0
    ? { paddingTop: 0, paddingBottom: insets.bottom + 40, flexGrow: 1 }
    : { paddingTop: 0, paddingBottom: insets.bottom + 40 };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        ListEmptyComponent={
          hasInitialLoad ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Feather name="heart" size={48} color="#E0E7FF" />
              </View>
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptyDescription}>
                Start exploring events and tap the heart icon to save your favorites here
              </Text>
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreButtonText}>Explore Events</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingVertical: 16 }} />
          )
        }
      />
    </View>
  );
};

export default FavoritesScreen;