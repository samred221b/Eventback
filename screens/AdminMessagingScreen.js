import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';
import homeStyles from '../styles/homeStyles';

export default function AdminMessagingScreen({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  
  // State
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('individual'); // 'individual' | 'broadcast'
  const [messageHistory, setMessageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'history'

  useEffect(() => {
    fetchOrganizers();
    fetchMessageHistory();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real organizers from the existing API
      const response = await apiService.get('/admin/organizers', { requireAuth: true });
      const organizersData = response.data || [];
      
      // Transform the data to match the expected format
      const formattedOrganizers = organizersData.map(org => ({
        id: org._id || org.id,
        name: org.name || org.businessName || 'Unknown Organizer',
        email: org.email || 'no-email@example.com',
        eventsCount: org.eventsCount || org.stats?.totalEvents || 0,
      }));
      
      setOrganizers(formattedOrganizers);
      
    } catch (err) {
      logger.error('Error fetching organizers:', err);
      setError(toAppError(err, { fallbackMessage: 'Failed to load organizers' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageHistory = async () => {
    try {
      const result = await apiService.get('/admin/messages/history', { requireAuth: true });
      setMessageHistory(result.data || []);
    } catch (err) {
      logger.warn('Error fetching message history:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete(`/admin/messages/${messageId}`, { requireAuth: true });
              
              if (response.success) {
                // Remove the message from local state
                setMessageHistory(prev => prev.filter(msg => (msg.id || msg._id) !== messageId));
                logger.log('Message deleted successfully:', messageId);
              }
            } catch (error) {
              logger.error('Error deleting message:', error);
              setError(toAppError(error, { fallbackMessage: 'Failed to delete message' }));
            }
          }
        }
      ]
    );
  };

  const toggleOrganizerSelection = (organizerId) => {
    setSelectedOrganizers(prev => 
      prev.includes(organizerId) 
        ? prev.filter(id => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const selectAllOrganizers = () => {
    if (selectedOrganizers.length === organizers.length) {
      setSelectedOrganizers([]);
    } else {
      setSelectedOrganizers(organizers.map(org => org.id));
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      setError(toAppError(new Error('Please enter a message'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }

    if (messageType === 'individual' && selectedOrganizers.length === 0) {
      setError(toAppError(new Error('Please select at least one organizer'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }

    try {
      setSending(true);
      setError(null);

      const payload = {
        message: message.trim(),
        type: messageType,
        recipients: messageType === 'individual' ? selectedOrganizers : [],
      };

      await apiService.post('/admin/messages/send', payload, { requireAuth: true });
      
      Alert.alert('Success', 'Message sent successfully!');
      setMessage('');
      setSelectedOrganizers([]);

      fetchMessageHistory();
      
    } catch (err) {
      logger.error('Error sending message:', err);
      setError(toAppError(err, { fallbackMessage: 'Failed to send message' }));
    } finally {
      setSending(false);
    }
  };

  const renderOrganizerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.organizerItem,
        selectedOrganizers.includes(item.id) && styles.selectedOrganizer
      ]}
      onPress={() => toggleOrganizerSelection(item.id)}
    >
      <View style={styles.organizerInfo}>
        <View style={styles.organizerAvatar}>
          <Feather name="user" size={20} color="#0277BD" />
        </View>
        <View style={styles.organizerDetails}>
          <Text style={styles.organizerName}>{item.name}</Text>
          <Text style={styles.organizerEmail}>{item.email}</Text>
          <Text style={styles.organizerEvents}>{item.eventsCount || 0} events</Text>
        </View>
      </View>
      <View style={styles.selectionCheckbox}>
        <Feather 
          name={selectedOrganizers.includes(item.id) ? "check-square" : "square"} 
          size={20} 
          color={selectedOrganizers.includes(item.id) ? "#0277BD" : "#9CA3AF"} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => (
    <View style={styles.messageItem}>
      <View style={styles.messageHeader}>
        <View style={styles.messageHeaderLeft}>
          <Text style={styles.messageType}>
            {item.type === 'broadcast' ? '📢 Broadcast' : `📧 To ${item.recipients?.length || 0} organizers`}
          </Text>
          <Text style={styles.messageDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteMessage(item.id || item._id)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.messageContent}>{item.message}</Text>
      <View style={styles.messageFooter}>
        <Text style={styles.messageStatus}>
          Status: {item.status || 'delivered'}
        </Text>
        {item.recipients && (
          <Text style={styles.recipientCount}>
            {item.recipients.length} recipients
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={styles.loadingText}>Loading organizers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppErrorBanner error={error} />
      
      {/* Header matching HomeScreen */}
      <View style={homeStyles.homeHeaderContainer}>
        <LinearGradient
          colors={['#0277BD', '#01579B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={homeStyles.homeHeaderCard}
        >
          <View style={homeStyles.homeHeaderBg} pointerEvents="none">
            <View style={homeStyles.homeHeaderOrbOne} />
            <View style={homeStyles.homeHeaderOrbTwo} />
          </View>
          <View style={homeStyles.homeHeaderTopRow}>
            <View style={homeStyles.modernDashboardProfile}>
              <View style={homeStyles.modernDashboardAvatar}>
                <View style={homeStyles.modernDashboardAvatarInner}>
                  <Feather name="message-square" size={20} color="#0277BD" />
                </View>
              </View>
              <View style={homeStyles.modernDashboardText}>
                <Text style={[homeStyles.modernDashboardGreeting, { color: '#FFFFFF' }]}>Admin</Text>
                <Text style={[homeStyles.modernDashboardName, { color: '#FFFFFF' }]}>Messaging</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={homeStyles.modernDashboardBell}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'compose' && styles.activeTab]}
          onPress={() => setActiveTab('compose')}
        >
          <Feather name="edit-3" size={16} color={activeTab === 'compose' ? "#FFFFFF" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'compose' && styles.activeTabText]}>
            Compose
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Feather name="clock" size={16} color={activeTab === 'history' ? "#FFFFFF" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'compose' ? (
          <View style={styles.composeContainer}>
            {/* Message Type Selection */}
            <View style={styles.messageTypeContainer}>
              <Text style={styles.sectionTitle}>Message Type</Text>
              <View style={styles.messageTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.messageTypeOption,
                    messageType === 'individual' && styles.selectedMessageType
                  ]}
                  onPress={() => setMessageType('individual')}
                >
                  <Feather name="users" size={16} color={messageType === 'individual' ? "#FFFFFF" : "#6B7280"} />
                  <Text style={[styles.messageTypeOptionText, messageType === 'individual' && styles.selectedMessageTypeText]}>
                    Individual Organizers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.messageTypeOption,
                    messageType === 'broadcast' && styles.selectedMessageType
                  ]}
                  onPress={() => setMessageType('broadcast')}
                >
                  <Feather name="radio" size={16} color={messageType === 'broadcast' ? "#FFFFFF" : "#6B7280"} />
                  <Text style={[styles.messageTypeOptionText, messageType === 'broadcast' && styles.selectedMessageTypeText]}>
                    Broadcast to All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Organizer Selection */}
            {messageType === 'individual' && (
              <View style={styles.selectionContainer}>
                <View style={styles.selectionHeader}>
                  <Text style={styles.sectionTitle}>Select Organizers</Text>
                  <TouchableOpacity onPress={selectAllOrganizers} style={styles.selectAllButton}>
                    <Text style={styles.selectAllText}>
                      {selectedOrganizers.length === organizers.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.organizersList}>
                  {organizers.map((org) => (
                    <View key={org.id}>{renderOrganizerItem({ item: org })}</View>
                  ))}
                </View>
                
                <Text style={styles.selectionCount}>
                  {selectedOrganizers.length} of {organizers.length} selected
                </Text>
              </View>
            )}

            {/* Message Input */}
            <View style={styles.messageInputContainer}>
              <Text style={styles.sectionTitle}>Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Enter your message here..."
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{message.length} characters</Text>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.disabledButton]}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.sendButtonContent}>
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Message History</Text>
            {messageHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Feather name="inbox" size={48} color="#9CA3AF" />
                <Text style={styles.emptyHistoryText}>No messages sent yet</Text>
              </View>
            ) : (
              messageHistory.map((item, index) => (
                <View key={item.id}>
                  {renderMessageItem({ item })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0277BD',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80,
  },
  composeContainer: {
    flexGrow: 1,
  },
  messageTypeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  messageTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  messageTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    gap: 8,
  },
  selectedMessageType: {
    backgroundColor: '#0277BD',
    borderColor: '#0277BD',
  },
  messageTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedMessageTypeText: {
    color: '#FFFFFF',
  },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0277BD',
  },
  organizersList: {
    maxHeight: 300,
    marginBottom: 12,
  },
  organizerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOrganizer: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0277BD',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerDetails: {
    flex: 1,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  organizerEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  organizerEvents: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  selectionCheckbox: {
    padding: 4,
  },
  selectionCount: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },
  sendButton: {
    backgroundColor: '#0277BD',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyContainer: {
    flex: 1,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  messageItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginLeft: 8,
  },
  messageType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0277BD',
  },
  messageDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageContent: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  recipientCount: {
    fontSize: 11,
    color: '#6B7280',
  },
});
