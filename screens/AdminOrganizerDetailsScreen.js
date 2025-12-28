import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { adminOrganizerDetailsStyles } from '../styles/adminStyles';

const AdminOrganizerDetailsScreen = ({ navigation, route }) => {
  const { organizer } = route.params;

  const handleBack = () => {
    navigation.goBack();
  };

  const renderStatCard = (title, value, subtitle, color, icon) => (
    <View style={[adminOrganizerDetailsStyles.insightCard, { borderLeftColor: color }]}>
      <View style={adminOrganizerDetailsStyles.insightIconContainer}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={adminOrganizerDetailsStyles.insightContent}>
        <Text style={adminOrganizerDetailsStyles.insightValue}>{value}</Text>
        <Text style={adminOrganizerDetailsStyles.insightTitle}>{title}</Text>
        <Text style={adminOrganizerDetailsStyles.insightSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderEventItem = (event, index) => (
    <View key={event._id} style={adminOrganizerDetailsStyles.eventItem}>
      <View style={adminOrganizerDetailsStyles.eventItemHeader}>
        <Text style={adminOrganizerDetailsStyles.eventItemTitle}>{event.title}</Text>
        <View style={[
          adminOrganizerDetailsStyles.eventStatusBadge,
          { backgroundColor: getStatusColor(event.status) + '20' }
        ]}>
          <Text style={[
            adminOrganizerDetailsStyles.eventStatusText,
            { color: getStatusColor(event.status) }
          ]}>
            {event.status}
          </Text>
        </View>
      </View>
      <Text style={adminOrganizerDetailsStyles.eventItemDate}>
        {new Date(event.date).toLocaleDateString()} • {event.time || 'No time'}
      </Text>
      <View style={adminOrganizerDetailsStyles.eventItemMeta}>
        <Text style={adminOrganizerDetailsStyles.eventItemLocation}>
          {event.location?.city}, {event.location?.country}
        </Text>
        <Text style={adminOrganizerDetailsStyles.eventItemAttendees}>
          {event.attendeeCount || 0} attending
        </Text>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#10B981';
      case 'draft': return '#6B7280';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={adminOrganizerDetailsStyles.container}>
      <View style={adminOrganizerDetailsStyles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={adminOrganizerDetailsStyles.headerTitle}>Organizer Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={adminOrganizerDetailsStyles.container}>
        {/* Organizer Info */}
        <View style={adminOrganizerDetailsStyles.organizerInfoCard}>
          <View style={adminOrganizerDetailsStyles.organizerHeader}>
            <View style={adminOrganizerDetailsStyles.organizerAvatar}>
              <Feather name="user" size={32} color="#64748B" />
            </View>
            <View style={adminOrganizerDetailsStyles.organizerDetails}>
              <Text style={adminOrganizerDetailsStyles.organizerName}>{organizer.name}</Text>
              <Text style={adminOrganizerDetailsStyles.organizerEmail}>{organizer.email}</Text>
              <View style={adminOrganizerDetailsStyles.organizerBadges}>
                {organizer.isVerified && (
                  <View style={adminOrganizerDetailsStyles.verifiedBadge}>
                    <Feather name="check-circle" size={14} color="#3B82F6" />
                    <Text style={adminOrganizerDetailsStyles.verifiedBadgeText}>Verified</Text>
                  </View>
                )}
                <View style={[
                  adminOrganizerDetailsStyles.statusBadge,
                  { backgroundColor: organizer.isActive ? '#10B98120' : '#EF444420' }
                ]}>
                  <Text style={[
                    adminOrganizerDetailsStyles.statusText,
                    { color: organizer.isActive ? '#10B981' : '#EF4444' }
                  ]}>
                    {organizer.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {organizer.bio && (
            <Text style={adminOrganizerDetailsStyles.organizerBio}>{organizer.bio}</Text>
          )}
          
          {organizer.location && (
            <View style={adminOrganizerDetailsStyles.organizerLocation}>
              <Feather name="map-pin" size={16} color="#64748B" />
              <Text style={adminOrganizerDetailsStyles.organizerLocationText}>
                {organizer.location.city}, {organizer.location.country}
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={adminOrganizerDetailsStyles.analyticsSection}>
          <Text style={adminOrganizerDetailsStyles.sectionTitle}>Statistics</Text>
          <View style={adminOrganizerDetailsStyles.statsGrid}>
            {renderStatCard('Total Events', organizer.adminStats?.totalEvents || 0, 'All time', '#0277BD', 'calendar')}
            {renderStatCard('Active Events', organizer.adminStats?.activeEvents || 0, 'Upcoming', '#10B981', 'activity')}
            {renderStatCard('Past Events', organizer.adminStats?.pastEvents || 0, 'Completed', '#6B7280', 'clock')}
            {renderStatCard('Cancelled Events', organizer.adminStats?.cancelledEvents || 0, 'Cancelled', '#EF4444', 'x-circle')}
            {renderStatCard('Total Attendees', organizer.adminStats?.totalAttendees || 0, 'All events', '#F59E0B', 'users')}
            {renderStatCard('Total Views', organizer.adminStats?.totalViews || 0, 'All events', '#8B5CF6', 'eye')}
            {renderStatCard('Total Likes', organizer.adminStats?.totalLikes || 0, 'All events', '#EF4444', 'heart')}
            {renderStatCard('Rating', organizer.rating || 0, 'Out of 5', '#3B82F6', 'star')}
          </View>
        </View>

        {/* Recent Events */}
        <View style={adminOrganizerDetailsStyles.analyticsSection}>
          <Text style={adminOrganizerDetailsStyles.sectionTitle}>Recent Events</Text>
          {organizer.events && organizer.events.length > 0 ? (
            organizer.events.map(renderEventItem)
          ) : (
            <View style={adminOrganizerDetailsStyles.emptySection}>
              <Feather name="calendar" size={32} color="#9CA3AF" />
              <Text style={adminOrganizerDetailsStyles.emptyText}>No events found</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={adminOrganizerDetailsStyles.analyticsSection}>
          <Text style={adminOrganizerDetailsStyles.sectionTitle}>Contact Information</Text>
          <View style={adminOrganizerDetailsStyles.contactCard}>
            {organizer.phone && (
              <View style={adminOrganizerDetailsStyles.contactItem}>
                <Feather name="phone" size={16} color="#64748B" />
                <Text style={adminOrganizerDetailsStyles.contactText}>{organizer.phone}</Text>
              </View>
            )}
            <View style={adminOrganizerDetailsStyles.contactItem}>
              <Feather name="mail" size={16} color="#64748B" />
              <Text style={adminOrganizerDetailsStyles.contactText}>{organizer.email}</Text>
            </View>
            {organizer.createdAt && (
              <View style={adminOrganizerDetailsStyles.contactItem}>
                <Feather name="calendar" size={16} color="#64748B" />
                <Text style={adminOrganizerDetailsStyles.contactText}>
                  Member since {new Date(organizer.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
            {organizer.lastLoginAt && (
              <View style={adminOrganizerDetailsStyles.contactItem}>
                <Feather name="clock" size={16} color="#64748B" />
                <Text style={adminOrganizerDetailsStyles.contactText}>
                  Last login {new Date(organizer.lastLoginAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Social Links */}
        {organizer.socialLinks && Object.values(organizer.socialLinks).some(link => link) && (
          <View style={adminOrganizerDetailsStyles.analyticsSection}>
            <Text style={adminOrganizerDetailsStyles.sectionTitle}>Social Links</Text>
            <View style={adminOrganizerDetailsStyles.contactCard}>
              {organizer.socialLinks.website && (
                <View style={adminOrganizerDetailsStyles.contactItem}>
                  <Feather name="globe" size={16} color="#64748B" />
                  <Text style={adminOrganizerDetailsStyles.contactText}>{organizer.socialLinks.website}</Text>
                </View>
              )}
              {organizer.socialLinks.facebook && (
                <View style={adminOrganizerDetailsStyles.contactItem}>
                  <Feather name="facebook" size={16} color="#64748B" />
                  <Text style={adminOrganizerDetailsStyles.contactText}>Facebook</Text>
                </View>
              )}
              {organizer.socialLinks.twitter && (
                <View style={adminOrganizerDetailsStyles.contactItem}>
                  <Feather name="twitter" size={16} color="#64748B" />
                  <Text style={adminOrganizerDetailsStyles.contactText}>Twitter</Text>
                </View>
              )}
              {organizer.socialLinks.instagram && (
                <View style={adminOrganizerDetailsStyles.contactItem}>
                  <Feather name="instagram" size={16} color="#64748B" />
                  <Text style={adminOrganizerDetailsStyles.contactText}>Instagram</Text>
                </View>
              )}
              {organizer.socialLinks.linkedin && (
                <View style={adminOrganizerDetailsStyles.contactItem}>
                  <Feather name="linkedin" size={16} color="#64748B" />
                  <Text style={adminOrganizerDetailsStyles.contactText}>LinkedIn</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminOrganizerDetailsScreen;
