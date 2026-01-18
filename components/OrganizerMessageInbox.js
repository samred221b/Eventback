import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';
import { logger } from '../utils/logger';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';
import homeStyles from '../styles/homeStyles';

export default function OrganizerMessageInbox({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  
  // State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.get('/organizer/messages', { requireAuth: true });
      setMessages(result.data || []);
    } catch (err) {
      logger.error('Error fetching messages:', err);
      setError(toAppError(err, { fallbackMessage: 'Failed to load messages' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setMessageModalVisible(true);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  const closeMessageModal = () => {
    setMessageModalVisible(false);
    setSelectedMessage(null);
  };

  const shareMessage = async () => {
    if (selectedMessage) {
      try {
        await Share.share({
          message: `Message from Eventopia Admin:\n\n${selectedMessage.title || 'Admin Message'}\n\n${selectedMessage.message}`,
          title: 'Eventopia Admin Message',
        });
      } catch (error) {
        logger.error('Error sharing message:', error);
      }
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await apiService.put(`/organizer/messages/${messageId}/read`, {}, { requireAuth: true });
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (err) {
      logger.error('Error marking message as read:', err);
    }
  };

  const renderMessageItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          !item.read && styles.unreadMessage,
        ]}
        onPress={() => openMessageModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.messageInfo}>
            <View style={[styles.avatar, !item.read && styles.unreadAvatar]}>
              <Feather name="shield" size={20} color={!item.read ? "#FFFFFF" : "#0277BD"} />
            </View>
            <View style={styles.senderInfo}>
              <Text style={[styles.senderName, !item.read && styles.unreadSenderName]}>
                Eventopia Admin
              </Text>
              <Text style={styles.timestamp}>
                {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.messageHeaderRight}>
            {!item.read && (
              <View style={styles.unreadDot} />
            )}
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          </View>
        </View>
        
        <Text style={[styles.messageTitle, !item.read && styles.unreadMessageTitle]}>
          {item.title || 'Admin Message'}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {item.message}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={styles.messageType}>
            📧 Message
          </Text>
          <Text style={styles.messageTimeAgo}>
            {getTimeAgo(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const MessagesHeader = () => (
    <View style={[styles.messagesHeaderContainer, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0277BD', '#01579B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.messagesHeaderCard}
      >
        <View style={styles.messagesHeaderBg} pointerEvents="none">
          <View style={styles.messagesHeaderOrbOne} />
          <View style={styles.messagesHeaderOrbTwo} />
        </View>

        <View style={styles.messagesHeaderTopRow}>
          <View style={styles.messagesHeaderLeftRow}>
            <TouchableOpacity 
              style={styles.messagesBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.messagesHeaderTitleBlock}>
              <Text style={styles.messagesHeaderWelcomeText}>Inbox</Text>
              <Text style={styles.messagesHeaderNameText}>Messages</Text>
              <Text style={styles.messagesHeaderCountText}>{messages.length} {messages.length === 1 ? 'Message' : 'Messages'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.messagesHeaderMetaRow}>
          <Text style={styles.messagesHeaderMetaText}>Admin Updates</Text>
          <Text style={styles.messagesHeaderMetaSeparator}>|</Text>
          <Text style={styles.messagesHeaderMetaText}>Notifications</Text>
          <Text style={styles.messagesHeaderMetaSeparator}>|</Text>
          <Text style={styles.messagesHeaderMetaText}>Stay Informed</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MessagesHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MessagesHeader />
      <AppErrorBanner error={error} onRetry={fetchMessages} />
      
      {/* Messages List */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Messages</Text>
          <Text style={styles.emptyDescription}>
            You haven't received any messages from Eventopia admin yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.messagesContent}
        />
      )}

      {/* Message Detail Modal */}
      <Modal
        visible={messageModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeMessageModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#0277BD', '#01579B', '#004D8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={homeStyles.homeHeaderBg} pointerEvents="none">
              <View style={homeStyles.homeHeaderOrbOne} />
              <View style={homeStyles.homeHeaderOrbTwo} />
            </View>
            
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeMessageModal}
                activeOpacity={0.7}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.modalHeaderCenter}>
                <Text style={styles.modalHeaderTitle}>Message Details</Text>
                <Text style={styles.modalHeaderSubtitle}>Administrative Communication</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.modalShareButton}
                onPress={shareMessage}
                activeOpacity={0.7}
              >
                <Feather name="share-2" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {selectedMessage && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Message Card */}
              <View style={styles.messageDetailContainer}>
                {/* Sender Info */}
                <View style={styles.messageDetailHeader}>
                  <View style={styles.messageDetailAvatar}>
                    <LinearGradient
                      colors={['#0277BD', '#01579B']}
                      style={styles.avatarGradient}
                    >
                      <Feather name="shield" size={28} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.messageDetailSenderInfo}>
                    <Text style={styles.messageDetailSenderName}>Eventopia Admin</Text>
                    <Text style={styles.messageDetailTimestamp}>
                      {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} at {new Date(selectedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.messageDetailRelativeTime}>
                      {getTimeAgo(selectedMessage.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Message Title */}
                <View style={styles.titleSection}>
                  <Text style={styles.messageDetailTitle}>
                    {selectedMessage.title || 'Admin Message'}
                  </Text>
                  <View style={styles.titleUnderline} />
                </View>

                {/* Message Content */}
                <View style={styles.messageDetailContent}>
                  <Text style={styles.messageDetailText}>
                    {selectedMessage.message}
                  </Text>
                </View>

                {/* Message Footer */}
                <View style={styles.messageDetailFooter}>
                  <View style={styles.footerLeft}>
                    <Text style={styles.messageDetailType}>
                      📧 Administrative Message
                    </Text>
                    <Text style={styles.messageDetailStatus}>
                      {selectedMessage.read ? '✅ Read' : '🔵 Unread'}
                    </Text>
                  </View>
                  <View style={styles.footerRight}>
                    <Text style={styles.securityBadge}>
                      🔒 Secure
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
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
  messagesHeaderContainer: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 8,
  },
  messagesHeaderCard: {
    borderRadius: 30,
    padding: 20,
    shadowColor: 'rgba(147, 150, 156, 0.4)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 95, 95, 0.34)',
    position: 'relative',
    overflow: 'hidden',
  },
  messagesHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  messagesHeaderOrbOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    left: -90,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  messagesHeaderOrbTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -120,
    right: -120,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  messagesHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  messagesHeaderLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    gap: 12,
  },
  messagesBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesHeaderTitleBlock: {
    flex: 0,
    alignItems: 'flex-start',
  },
  messagesHeaderWelcomeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  messagesHeaderNameText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
    fontFamily: 'System',
    marginTop: 2,
  },
  messagesHeaderCountText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 4,
  },
  messagesHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  messagesHeaderMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'System',
    fontWeight: '600',
  },
  messagesHeaderMetaSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 8,
    fontFamily: 'System',
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadMessage: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0277BD',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0277BD',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageType: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageTimeAgo: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '500',
  },
  messageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadAvatar: {
    backgroundColor: '#0277BD',
  },
  unreadSenderName: {
    color: '#0277BD',
    fontWeight: '700',
  },
  unreadMessageTitle: {
    color: '#1F2937',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    overflow: 'hidden',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  modalShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  messageDetailContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageDetailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageDetailSenderInfo: {
    flex: 1,
  },
  messageDetailSenderName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  messageDetailTimestamp: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  messageDetailRelativeTime: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '500',
    marginTop: 2,
  },
  titleSection: {
    marginBottom: 20,
  },
  messageDetailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 30,
  },
  titleUnderline: {
    height: 3,
    backgroundColor: '#0277BD',
    width: 60,
    borderRadius: 2,
    marginTop: 8,
  },
  messageDetailContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageDetailText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
  },
  messageDetailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  messageDetailType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageDetailStatus: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  securityBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
