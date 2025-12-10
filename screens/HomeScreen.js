import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { useFavorites } from '../providers/FavoritesProvider';
import { SafeScrollView, SafeTouchableOpacity } from '../components/SafeComponents';
import EnhancedSearch from '../components/EnhancedSearch';

import homeStyles from '../styles/homeStyles';
import { makeEventSerializable, formatPrice } from '../utils/dataProcessor';
import apiService from '../services/api';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [processedEvents, setProcessedEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoadingRef = useRef(false);
  const lastRefreshTime = useRef(Date.now());

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      const REFRESH_COOLDOWN = 30000;

      if (hasInitialLoad && !isLoadingRef.current && timeSinceLastRefresh > REFRESH_COOLDOWN) {
        lastRefreshTime.current = now;
        loadEventsFromBackend();
      }
    }, [hasInitialLoad])
  );

  useEffect(() => {
    loadEventsFromBackend();
  }, []);

  const loadEventsFromBackend = async () => {
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const response = await apiService.getEvents();
      if (response.success && response.data) {
        const transformedEvents = response.data
          .filter(event => event._id && event.title && event.date)
          .map(event => ({
            id: event._id,
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            price: event.price || 0,
            currency: event.currency || 'ETB',
            category: event.category,
            featured: event.featured || false,
            imageUrl: event.imageUrl || event.image || null,
            organizerName: event.organizerName || event.organizer || '',
            importantInfo: event.importantInfo || '',
          }));

        setProcessedEvents(transformedEvents);
        setFeaturedEvents(transformedEvents.filter(e => e.featured).slice(0, 6));

        const now = new Date();
        const upcoming = transformedEvents
          .filter(event => new Date(event.date) >= now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setUpcomingEvents(upcoming);
      } else {
        console.error('Failed to load events from backend');
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      setHasInitialLoad(true);
    }
  };

  const handleRefresh = async () => {
    const now = Date.now();
    const REFRESH_COOLDOWN = 30000;

    if (isLoadingRef.current || now - lastRefreshTime.current < REFRESH_COOLDOWN) {
      return;
    }

    try {
      setIsRefreshing(true);
      lastRefreshTime.current = now;
      await loadEventsFromBackend();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEventPress = (event) => {
    const serializable = makeEventSerializable(event);
    serializable.organizerName = event.organizerName || event.organizer || '';
    serializable.importantInfo = event.importantInfo || '';
    navigation.navigate('EventDetails', { event: serializable });
  };


  const formatDateTimeShort = (dateString, timeString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = timeString || '2:00 PM';
    return `${dateStr} • ${timeStr}`;
  };

  const filteredEvents = searchQuery.trim()
    ? processedEvents.filter(event =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : processedEvents;

  if (isLoading && !hasInitialLoad) {
    return (
      <View style={homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={homeStyles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#000000" />
      <LinearGradient
        colors={['#ffffffff', '#e4e2e1ff']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* <View style={homeStyles.creativeBlobBlue} />
      <View style={homeStyles.creativeBlobGreen} />
      <View style={homeStyles.creativeBlobYellow} /> */}

      <View style={homeStyles.decorativeShape1} />
      <View style={homeStyles.decorativeShape2} />
      <View style={homeStyles.decorativeShape3} />
      <View style={homeStyles.decorativeShape4} />
      <View style={homeStyles.decorativeShape6} />
      <View style={homeStyles.decorativeShape7} />
      <View style={homeStyles.decorativeShape8} />
      <View style={homeStyles.decorativeShape9} />
      <View style={homeStyles.decorativeShape10} />
      <View style={homeStyles.largeCurvedWave} />
      <View style={homeStyles.vibrantAccentRing1} />
      <View style={homeStyles.vibrantAccentRing2} />
      <View style={homeStyles.headerAura} />
      

      <SafeScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={homeStyles.homeHeaderContainer}>
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
                    <Feather name="user" size={20} color="#0F172A" />
                  </View>
                </View>
                <View>
                  <Text style={homeStyles.homeHeaderWelcomeText}>Welcome back,</Text>
                  <Text style={homeStyles.homeHeaderNameText}>User</Text>
                </View>
              </View>
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
          <View style={homeStyles.homeSearchSection}>
            <EnhancedSearch
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events by name, location, category..."
              events={processedEvents}
              onEventSelect={handleEventPress}
            />
          </View>
        )}

        <View style={homeStyles.promotionalBannersSection}>
          <AutoScrollingPromoCarousel navigation={navigation} />
        </View>

        <View style={homeStyles.featuredEventsSection}>
          <View style={homeStyles.featuredEventsHeader}>
            <Text style={homeStyles.featuredEventsTitle}>Featured Events</Text>
            <SafeTouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={homeStyles.seeAllLink}>See All</Text>
            </SafeTouchableOpacity>
          </View>

          <View style={homeStyles.premiumFeaturedContainer}>
            {featuredEvents.map((event, index) => (
              <SafeTouchableOpacity
                key={event.id}
                style={homeStyles.horizontalEventCard}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.95}
              >
                <View style={homeStyles.premiumFeaturedBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={homeStyles.premiumBadgeGradient}
                  >
                    <Feather name="star" size={10} color="#FFFFFF" />
                    <Text style={homeStyles.premiumBadgeText}>FEATURED</Text>
                  </LinearGradient>
                </View>

                <View style={homeStyles.horizontalEventImageContainer}>
                  {event.imageUrl ? (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={homeStyles.horizontalEventImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={
                        index % 3 === 0 ? ['#0277BD', '#01579B'] :
                        index % 3 === 1 ? ['#8B5CF6', '#7C3AED'] :
                        ['#059669', '#047857']
                      }
                      style={homeStyles.horizontalEventImagePlaceholder}
                    >
                      <Feather name="image" size={24} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                  )}
                </View>

                <View style={homeStyles.horizontalEventDetailsContainer}>
                  <View style={homeStyles.horizontalEventTopSection}>
                    <Text style={homeStyles.horizontalEventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="map-pin" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText} numberOfLines={1}>
                        {event.location?.city || event.location?.name || 'Location TBA'}
                      </Text>
                    </View>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="calendar" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText}>
                        {formatDateTimeShort(event.date, event.time)}
                      </Text>
                    </View>
                  </View>

                  <View style={homeStyles.horizontalEventBottomRow}>
                    <Text style={homeStyles.horizontalEventPrice}>
                      {formatPrice(event.price, event.currency)}
                    </Text>

                    <SafeTouchableOpacity
                      style={homeStyles.horizontalEventHeartButton}
                      onPress={() => toggleFavorite(event.id)}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name="heart"
                        size={14}
                        color={isFavorite(event.id) ? '#EF4444' : 'rgba(255,255,255,0.9)'}
                        fill={isFavorite(event.id) ? '#EF4444' : 'transparent'}
                      />
                    </SafeTouchableOpacity>

                    <SafeTouchableOpacity
                      style={homeStyles.horizontalEventViewButton}
                      onPress={() => handleEventPress(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={homeStyles.horizontalEventViewButtonText}>View Details</Text>
                    </SafeTouchableOpacity>
                  </View>
                </View>
              </SafeTouchableOpacity>
            ))}
          </View>
        </View>

        <View style={homeStyles.featuredEventsSection}>
          <View style={homeStyles.featuredEventsHeader}>
            <Text style={homeStyles.featuredEventsTitle}>Upcoming Events</Text>
            <SafeTouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={homeStyles.seeAllLink}>See All</Text>
            </SafeTouchableOpacity>
          </View>

          <View style={homeStyles.premiumFeaturedContainer}>
            {upcomingEvents.map((event, index) => (
              <SafeTouchableOpacity
                key={event.id}
                style={homeStyles.horizontalEventCard}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.95}
              >
                <View style={homeStyles.premiumFeaturedBadge}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={homeStyles.premiumBadgeGradient}
                  >
                    <Feather name="clock" size={10} color="#FFFFFF" />
                    <Text style={homeStyles.premiumBadgeText}>UPCOMING</Text>
                  </LinearGradient>
                </View>

                <View style={homeStyles.horizontalEventImageContainer}>
                  {event.imageUrl ? (
                    <Image
                      source={{ uri: event.imageUrl }}
                      style={homeStyles.horizontalEventImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={
                        index % 3 === 0 ? ['#0277BD', '#01579B'] :
                        index % 3 === 1 ? ['#8B5CF6', '#7C3AED'] :
                        ['#059669', '#047857']
                      }
                      style={homeStyles.horizontalEventImagePlaceholder}
                    >
                      <Feather name="image" size={24} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                  )}
                </View>

                <View style={homeStyles.horizontalEventDetailsContainer}>
                  <View style={homeStyles.horizontalEventTopSection}>
                    <Text style={homeStyles.horizontalEventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="map-pin" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText} numberOfLines={1}>
                        {event.location?.city || event.location?.name || 'Location TBA'}
                      </Text>
                    </View>

                    <View style={homeStyles.horizontalEventMetaRow}>
                      <Feather name="calendar" size={12} color="#6B7280" />
                      <Text style={homeStyles.horizontalEventMetaText}>
                        {formatDateTimeShort(event.date, event.time)}
                      </Text>
                    </View>
                  </View>

                  <View style={homeStyles.horizontalEventBottomRow}>
                    <Text style={homeStyles.horizontalEventPrice}>
                      {formatPrice(event.price, event.currency)}
                    </Text>

                    <SafeTouchableOpacity
                      style={homeStyles.horizontalEventViewButton}
                      onPress={() => handleEventPress(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={homeStyles.horizontalEventViewButtonText}>View Details</Text>
                    </SafeTouchableOpacity>
                  </View>
                </View>
              </SafeTouchableOpacity>
            ))}
          </View>
        </View>

        <View style={homeStyles.creativeElementsSection}>
          <View style={homeStyles.statsCardsContainer}>
            <View style={homeStyles.statsCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={homeStyles.statsCardGradient}
              >
                <Feather name="calendar" size={24} color="#FFFFFF" />
                <Text style={homeStyles.statsCardNumber}>{processedEvents.length}</Text>
                <Text style={homeStyles.statsCardLabel}>Total Events</Text>
              </LinearGradient>
            </View>
            <View style={homeStyles.statsCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={homeStyles.statsCardGradient}
              >
                <Feather name="star" size={24} color="#FFFFFF" />
                <Text style={homeStyles.statsCardNumber}>{featuredEvents.length}</Text>
                <Text style={homeStyles.statsCardLabel}>Featured</Text>
              </LinearGradient>
            </View>
            <View style={homeStyles.statsCard}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={homeStyles.statsCardGradient}
              >
                <Feather name="heart" size={24} color="#FFFFFF" />
                <Text style={homeStyles.statsCardNumber}>{processedEvents.filter(event => isFavorite(event.id)).length}</Text>
                <Text style={homeStyles.statsCardLabel}>Favorites</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={homeStyles.organizerBox}>
            <LinearGradient
              colors={['#1F2937', '#111827']}
              style={homeStyles.organizerBoxGradient}
            >
              <View style={homeStyles.organizerContent}>
                <View style={homeStyles.organizerTextSection}>
                  <Text style={homeStyles.organizerTitle}>Are you an organizer?</Text>
                  <Text style={homeStyles.organizerSubtitle}>Create and manage amazing events</Text>
                </View>
                <SafeTouchableOpacity
                  style={homeStyles.organizerButton}
                  onPress={() => navigation.navigate('Organizer', { screen: 'OrganizerLogin' })}
                  activeOpacity={0.8}
                >
                  <Feather name="user-plus" size={18} color="#FFFFFF" />
                  <Text style={homeStyles.organizerButtonText}>Get Started</Text>
                </SafeTouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </SafeScrollView>

    </View>
  );
}

function AutoScrollingPromoCarousel({ navigation }) {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const bannerBackgroundImage = require('../assets/a.jpeg');
  const bannerImages = [
    require('../assets/y.png'),
    require('../assets/x.png'),
    require('../assets/z.png'),
    require('../assets/fe.png'),
    require('../assets/ge.jpeg'),
  ];
  const bannerImageStyles = [
    homeStyles.heroBannerImage1,
    homeStyles.heroBannerImage2,
    homeStyles.heroBannerImage3,
    homeStyles.heroBannerImage4,
    homeStyles.heroBannerImage5,
  ];

  const promoBanners = [
    {
      id: 'discover',
      title: 'Discover Awesome Events',
      subtitle: 'Find concerts, adventures, and more—every day.',
      buttonText: 'Explore Now',
      action: () => navigation.navigate('Events'),
    },
    {
      id: 'premium',
      title: 'Level Up to Premium!',
      subtitle: 'Unlock perks and win exclusive rewards.',
      buttonText: 'Go Premium',
      action: () => {},
    },
    {
      id: 'host',
      title: 'Become an Organizer',
      subtitle: 'Host, promote, and grow your own events with us.',
      buttonText: 'Get Started',
      action: () => navigation.navigate('Organizer'),
    },
    {
      id: 'connect',
      title: 'Connect with your friends',
      subtitle: 'Stay in touch and enjoy events together.',
      buttonText: 'Find Friends',
      action: () => {},
    },
    {
      id: 'tickets',
      title: 'Save your Favourite Events',
      subtitle: 'Keep track of events you love and never miss out.',
      buttonText: 'View Tickets',
      action: () => {},
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % promoBanners.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * Dimensions.get('window').width,
        animated: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, promoBanners.length]);

  const onScroll = (event) => {
    const newIndex = Math.round(
      event.nativeEvent.contentOffset.x / Dimensions.get('window').width
    );
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <View style={homeStyles.promotionalBannersContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ width: Dimensions.get('window').width }}
      >
        {promoBanners.map((banner, index) => (
          <View
            key={banner.id}
            style={{ width: Dimensions.get('window').width, paddingHorizontal: 6 }}
          >
            <ImageBackground
              source={bannerBackgroundImage}
              style={[homeStyles.heroBanner, { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }]}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(5, 139, 223, 0.97)', 'rgba(2, 46, 80, 0.49)']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28 }}
              />
              <View style={{ flex: 2.5, paddingLeft: 16, justifyContent: 'center', alignItems: 'flex-start', zIndex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 }}>
                  {banner.title}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 14 }}>
                  {banner.subtitle}
                </Text>
                <TouchableOpacity
                  style={homeStyles.heroBannerButton}
                  onPress={banner.action}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#0277BD', fontWeight: 'bold', fontSize: 15 }}>{banner.buttonText}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1.8, alignItems: 'center', justifyContent: 'center', marginRight: 10, zIndex: 1 }}>
                <Image source={bannerImages[index]} style={bannerImageStyles[index]} resizeMode="contain" />
              </View>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
      <View style={homeStyles.paginationContainer}>
        {promoBanners.map((_, index) => (
          <View
            key={index}
            style={[homeStyles.paginationDot, index === currentIndex && homeStyles.paginationDotActive]}
          />
        ))}
      </View>
    </View>
  );
}
