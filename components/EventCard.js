import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Memoized Event Card Component for better performance
const EventCard = memo(({ event, onPress, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={() => onPress(event)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={event.featured ? ['#FFD700', '#FFA500'] : ['#0277BD', '#01579B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            {event.featured && (
              <View style={styles.featuredBadge}>
                <Feather name="star" size={12} color="#FFFFFF" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Feather name="calendar" size={14} color="#FFFFFF" />
              <Text style={styles.detailText}>{event.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="clock" size={14} color="#FFFFFF" />
              <Text style={styles.detailText}>{event.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={14} color="#FFFFFF" />
              <Text style={styles.detailText} numberOfLines={1}>
                {event.location?.city || 'Location'}
              </Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Feather name="users" size={12} color="#FFFFFF" />
                <Text style={styles.statText}>{event.attendees || 0}</Text>
              </View>
              <View style={styles.stat}>
                <Feather name="heart" size={12} color="#FFFFFF" />
                <Text style={styles.statText}>{event.likes || 0}</Text>
              </View>
            </View>
            
            {event.price && (
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${event.price}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginVertical: 8,
  },
  gradient: {
    padding: 16,
    minHeight: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  featuredText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  details: {
    gap: 4,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EventCard;
