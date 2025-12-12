import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Share, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../providers/FavoritesProvider';
import { formatPrice, formatDate, formatTime } from '../utils/dataProcessor';
import NetInfo from '@react-native-community/netinfo'; // Import NetInfo for network status

const { width } = Dimensions.get('window');

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [offline, setOffline] = useState(false); // State to track offline status

  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setOffline(!netInfo.isConnected);
    };
    checkNetworkStatus();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\n\n${event.description}\n\nLocation: ${event.location.name}\nDate: ${formatDate(event.date)}\nPrice: ${formatPrice(event.price, event.currency)}`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleGetDirections = () => {
    const [lat, lng] = event.location.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    Alert.alert(
      'Open Maps',
      `Get directions to ${event.location.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Google Maps', 
          onPress: () => {
            import('react-native').then(({ Linking }) => {
              Linking.openURL(url).catch(err => 
                Alert.alert('Error', 'Could not open maps')
              );
            });
          }
        },
      ]
    );
  };


  const getDaysLeft = () => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return null;
  };

  const daysLeft = getDaysLeft();

  const essentialDetails = [
    {
      key: 'schedule',
      icon: 'calendar',
      label: 'Schedule',
      value: `${formatDate(event.date)}${event.time ? ` • ${formatTime(event.time)}` : ''}`,
    },
    {
      key: 'mode',
      icon: event.mode === 'Online' ? 'wifi' : 'map',
      label: 'Mode',
      value: event.mode || 'In-person',
    },
    {
      key: 'venue',
      icon: 'map-pin',
      label: 'Venue',
      value: event.location?.address || event.location?.city || event.location?.name || 'Location TBA',
    },
    {
      key: 'pricing',
      icon: 'tag',
      label: 'Entrance',
      value: formatPrice(event.price, event.currency),
    },
    {
      key: 'host',
      icon: 'user',
      label: 'Organizer',
      value: event.organizerName || event.organizer || 'To be announced',
    },
  ];

  const vibeBadges = [
    event.category,
    event.isOnline ? 'Stream Friendly' : 'On-Site Experience',
    event.requiresRegistration ? 'Secure Entry' : 'Open Invitation',
    event.location?.city,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
      />
      
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline: Some features may be limited</Text>
        </View>
      )}
      
      <View style={styles.heroContainer}>
        {event.imageUrl ? (
          <Image 
            source={{ uri: event.imageUrl }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#0277BD', '#01579B']}
            style={styles.heroPlaceholder}
          >
            <Feather name="image" size={80} color="rgba(255, 255, 255, 0.5)" />
          </LinearGradient>
        )}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.mainContentCard}>
            <Text style={styles.detailsEyebrow}>Event Spotlight</Text>
            <Text style={styles.detailsTitle}>{event.title}</Text>
            <Text style={styles.detailsMeta}>
              {formatDate(event.date)} • {event.location?.city || event.location?.country || 'Location'}{event.category ? ` • ${event.category}` : ''}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>About the Experience</Text>
            <Text style={styles.detailsSubtitle}>
              {event.description || 'Stay tuned for a closer look at what makes this gathering special.'}
            </Text>
          </View>

          <View style={styles.essentialsCard}>
            <Text style={styles.cardTitle}>Key Details</Text>
            {essentialDetails.map((detail, index) => (
              <View key={detail.key} style={[styles.detailListItem, index === essentialDetails.length - 1 && { borderBottomWidth: 0 }]}>
                <Feather name={detail.icon} size={20} color="#0284C7" style={styles.detailListItemIcon} />
                <View style={styles.detailListItemTextWrapper}>
                  <Text style={styles.detailListItemLabel}>{detail.label}</Text>
                  <Text style={styles.detailListItemValue}>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {(event.importantInfo || event.importantinfo) && (
            <View style={{
              backgroundColor: '#DBEAFE',
              borderRadius: 16,
              padding: 18,
              marginBottom: 18,
              borderLeftWidth: 5,
              borderLeftColor: '#2563EB',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <Feather name="info" size={22} color="#2563EB" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#1E40AF', fontWeight: '700', fontSize: 16, marginBottom: 2 }}>Important Information</Text>
                <Text style={{ color: '#1E293B', fontSize: 14 }}>{event.importantInfo || event.importantinfo}</Text>
              </View>
            </View>
          )}

          <View style={styles.ctaCard}>
            <Text style={styles.ctaHeadline}>Get Involved</Text>
            <View style={styles.ctaButtonRow}>
              <TouchableOpacity style={styles.ctaPrimaryButton} onPress={handleGetDirections}>
                <Feather name="navigation" size={16} color="#FFFFFF" />
                <Text style={styles.ctaPrimaryText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaSecondaryButton} onPress={handleShare}>
                <Feather name="share-2" size={16} color="#0369A1" />
                <Text style={styles.ctaSecondaryText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => toggleFavorite(event.id)}>
            <Feather 
              name="heart" 
              size={18} 
              color={isFavorite(event.id) ? "#FBBF24" : "#FFFFFF"} 
              fill={isFavorite(event.id) ? "#FBBF24" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
  },
  heroContainer: {
    height: 280,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  mainContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  detailsEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 34,
  },
  detailsCategory: {
    fontSize: 14,
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailsMeta: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    marginVertical: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  detailsSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },
  essentialsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  detailListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailListItemIcon: {
    marginRight: 16,
  },
  detailListItemTextWrapper: {
    flex: 1,
  },
  detailListItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailListItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  noticeBody: {
    fontSize: 14,
    color: '#334155',
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    borderRadius: 20,
    padding: 20,
  },
  ctaHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  ctaButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ctaSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaSecondaryText: {
    color: '#0369A1',
    fontWeight: '700',
  },
  headerBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    alignItems: 'center',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
  },
});
