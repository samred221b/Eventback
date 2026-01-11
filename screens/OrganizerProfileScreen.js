import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { formatPrice, formatDate, formatTime, standardizeEventForDetails } from '../utils/dataProcessor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import apiService from '../services/api';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';

const { width } = Dimensions.get('window');

export default function OrganizerProfileScreen({ route, navigation }) {
  const { organizerId } = route.params;
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageVersion, setImageVersion] = useState(0);

  useEffect(() => {
    fetchOrganizerProfile();
  }, [organizerId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchOrganizerProfile();
    }, [organizerId])
  );

  const fetchOrganizerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organizer details
      const organizerResponse = await apiService.get(`/organizers/${organizerId}`);
      const organizerData = organizerResponse.data.success ? organizerResponse.data.data : null;

      if (!organizerData) {
        setError(toAppError(new Error('Organizer not found'), { kind: 'NOT_FOUND', severity: APP_ERROR_SEVERITY.WARNING }));
        return;
      }

      setOrganizer(organizerData);
      setImageVersion((v) => v + 1);

      // Fetch organizer's events
      const eventsResponse = await apiService.get(`/events?organizerId=${organizerId}&limit=10`);
      const eventsData = eventsResponse.data.success ? eventsResponse.data.data : [];
      setEvents(eventsData);

    } catch (err) {
      logger.error('Error fetching organizer profile:', err);
      setError(toAppError(err, { fallbackMessage: 'Failed to load organizer profile' }));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `Check out ${organizer.name} on Eventopia!\n\n${organizer.bio || 'Amazing event organizer'}`;
      await Share.share({
        message: shareContent,
        title: `${organizer.name} - Eventopia`,
      });
    } catch (error) {
      logger.warn('Share failed:', error);
      setError(toAppError(error, { kind: 'SHARE_ERROR', severity: APP_ERROR_SEVERITY.WARNING, fallbackMessage: 'Share failed' }));
    }
  };

  const handleContactPress = () => {
    if (organizer.phone) {
      Alert.alert(
        'Contact Organizer',
        'How would you like to contact them?',
        [
          {
            text: 'Call',
            onPress: () => {
              // You can integrate with phone dialer here
              logger.info('Call organizer:', organizer.phone);
            },
          },
          {
            text: 'Email',
            onPress: () => {
              // You can integrate with email client here
              logger.info('Email organizer:', organizer.email);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert('Contact Info', 'No contact information available');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Time TBA';
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatPrice = (price, currency = 'ETB') => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice) || numericPrice === 0) {
      return '🆓 Free';
    }
    return `💰 ${numericPrice} ${currency}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organizer Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={styles.loadingText}>Loading organizer profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !organizer) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organizer Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <AppErrorState
          error={error}
          onRetry={fetchOrganizerProfile}
          title="Organizer Not Available"
          subtitle="We couldn't load this organizer's profile. Please try again."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppErrorBanner error={error} onRetry={fetchOrganizerProfile} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Background */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#0277BD', '#01579B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Organizer Profile</Text>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Feather name="share-2" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            {/* Logo/Profile Image */}
            <View style={styles.logoContainer}>
              {organizer.profileImage ? (
                <Image
                  source={{
                    uri: `${organizer.profileImage}${organizer.profileImage.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(organizer.updatedAt || imageVersion))}`,
                  }}
                  style={styles.logo}
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Feather name="user" size={40} color="#0277BD" />
                </View>
              )}
              {organizer.isVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Organizer Details */}
            <View style={styles.organizerDetails}>
              <Text style={styles.organizerName}>{organizer.name}</Text>
              <Text style={styles.organizerEmail}>{organizer.email}</Text>
              
              {/* Rating and Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Feather name="star" size={16} color="#F59E0B" />
                  <Text style={styles.statText}>
                    {organizer.rating ? organizer.rating.toFixed(1) : 'New'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="calendar" size={16} color="#0277BD" />
                  <Text style={styles.statText}>{organizer.totalEvents || 0} Events</Text>
                </View>
              </View>

              {/* Bio */}
              {organizer.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioLabel}>About</Text>
                  <Text style={styles.bioText}>{organizer.bio}</Text>
                </View>
              )}

              {/* Contact Info */}
              <View style={styles.contactSection}>
                <Text style={styles.contactLabel}>Contact</Text>
                {organizer.phone && (
                  <TouchableOpacity style={styles.contactItem} onPress={handleContactPress}>
                    <Feather name="phone" size={16} color="#0277BD" />
                    <Text style={styles.contactText}>{organizer.phone}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.contactItem} onPress={handleContactPress}>
                  <Feather name="mail" size={16} color="#0277BD" />
                  <Text style={styles.contactText}>{organizer.email}</Text>
                </TouchableOpacity>
                {organizer.location && (
                  <View style={styles.contactItem}>
                    <Feather name="map-pin" size={16} color="#0277BD" />
                    <Text style={styles.contactText}>
                      {organizer.location.city}, {organizer.location.country}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionHeaderGradient}
            >
              <Feather name="calendar" size={18} color="#FFFFFF" />
              <Text style={styles.sectionHeaderText}>Upcoming Events</Text>
            </LinearGradient>
          </View>
          
          {events.length > 0 ? (
            <View style={styles.eventsList}>
              {events.map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetails', { event })}
                >
                  <View style={styles.eventImageContainer}>
                    {event.imageUrl ? (
                      <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                    ) : (
                      <View style={styles.eventImagePlaceholder}>
                        <Feather name="image" size={24} color="#94A3B8" />
                      </View>
                    )}
                    {event.featured && (
                      <View style={styles.featuredBadge}>
                        <Feather name="star" size={12} color="#FFFFFF" />
                        <Text style={styles.featuredText}>Featured</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                    <Text style={styles.eventCategory}>{event.category}</Text>
                    
                    <View style={styles.eventMeta}>
                      <View style={styles.eventMetaItem}>
                        <Feather name="calendar" size={12} color="#64748B" />
                        <Text style={styles.eventMetaText}>{formatDate(event.date)}</Text>
                      </View>
                      <View style={styles.eventMetaItem}>
                        <Feather name="clock" size={12} color="#64748B" />
                        <Text style={styles.eventMetaText}>{formatTime(event.time)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.eventPricing}>
                      <Text style={styles.eventPrice}>{formatPrice(event.price, event.currency)}</Text>
                      <View style={styles.eventStats}>
                        <Feather name="users" size={12} color="#64748B" />
                        <Text style={styles.eventStatsText}>{event.attendeeCount || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noEventsContainer}>
              <Feather name="calendar" size={48} color="#94A3B8" />
              <Text style={styles.noEventsText}>No upcoming events</Text>
              <Text style={styles.noEventsSubtext}>This organizer hasn't published any events yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileHeader: {
    height: 120,
  },
  headerGradient: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  profileInfo: {
    padding: 24,
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  organizerDetails: {
    alignItems: 'center',
  },
  organizerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  organizerEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  bioSection: {
    width: '100%',
    marginBottom: 20,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  bioText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
  },
  contactSection: {
    width: '100%',
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#0277BD',
    fontWeight: '500',
  },
  eventsSection: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventsList: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventCategory: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  eventPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0277BD',
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatsText: {
    fontSize: 12,
    color: '#64748B',
  },
  noEventsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0277BD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
