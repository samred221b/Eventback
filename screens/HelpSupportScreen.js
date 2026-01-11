import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import homeStyles from '../styles/homeStyles';

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: '',
  });

  const faqCategories = [
    {
      id: 'events',
      title: '🎪 Event Management',
      icon: '🎪',
      faqs: [
        {
          question: 'How do I create an event?',
          answer: 'Go to the Organizer tab, tap "Create Event", fill in the details including title, description, date, location, and pricing. Your event will be live once submitted.'
        },
        {
          question: 'Can I edit my event after publishing?',
          answer: 'Yes! Go to your Organizer Dashboard, find your event, and tap "Edit". You can update most details, but major changes may require attendee notification.'
        },
        {
          question: 'How do I cancel an event?',
          answer: 'In your dashboard, select the event and choose "Cancel Event". All registered attendees will be automatically notified and refunded according to your refund policy.'
        },
        {
          question: 'What image formats are supported?',
          answer: 'We support JPG, PNG, and WebP formats. Images should be at least 800x600 pixels for best quality. Maximum file size is 5MB.'
        }
      ]
    },
    {
      id: 'promotion',
      title: '📢 Event Promotion',
      icon: '📢',
      faqs: [
        {
          question: 'How do I make my event more visible?',
          answer: 'Use clear, attractive images, write detailed descriptions, choose the right category, and consider getting verified for higher visibility in search results.'
        },
        {
          question: 'Can I promote my event on social media?',
          answer: 'Yes! You can share your event link on social media platforms. We also provide sharing tools within the app to make promotion easier.'
        },
        {
          question: 'What makes an event featured?',
          answer: 'Featured events are selected based on quality, engagement, and organizer verification status. Verified organizers have better chances of being featured.'
        },
        {
          question: 'How do I track event performance?',
          answer: 'Check your organizer dashboard for insights including views, favorites, and attendee engagement metrics to understand how your event is performing.'
        }
      ]
    },
    {
      id: 'account',
      title: '👤 Account & Profile',
      icon: '👤',
      faqs: [
        {
          question: 'How do I update my profile?',
          answer: 'Go to Organizer Dashboard → Update Profile. You can change your name, bio, contact information, and profile picture.'
        },
        {
          question: 'I forgot my password',
          answer: 'On the login screen, tap "Forgot Password" and enter your email. You\'ll receive a password reset link within a few minutes.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'Contact our support team to delete your account. Note that this action is permanent and cannot be undone.'
        },
        {
          question: 'Can I have multiple organizer accounts?',
          answer: 'Each email address can only have one account. However, you can create multiple event types under a single organizer profile.'
        }
      ]
    },
    {
      id: 'technical',
      title: '⚙️ Technical Issues',
      icon: '⚙️',
      faqs: [
        {
          question: 'The app is running slowly',
          answer: 'Try closing and reopening the app. If issues persist, restart your device or check for app updates in your app store.'
        },
        {
          question: 'I can\'t upload images',
          answer: 'Check your internet connection and ensure you have sufficient storage space. Also verify that camera/photo permissions are enabled for Eventopia.'
        },
        {
          question: 'Events aren\'t loading',
          answer: 'This usually indicates a connectivity issue. Check your internet connection and try refreshing by pulling down on the events list.'
        },
        {
          question: 'Push notifications not working',
          answer: 'Go to your device Settings → Notifications → Eventopia and ensure notifications are enabled. Also check the notification settings within the app.'
        }
      ]
    }
  ];

  const handleSendMessage = () => {
    if (!contactForm.subject || !contactForm.message || !contactForm.email) {
      Alert.alert('Missing Information', 'Please fill in all fields before sending.');
      return;
    }

    Alert.alert(
      'Message Sent!',
      'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setContactForm({ subject: '', message: '', email: '' });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8FF' }}>
      {/* Header - Home Style */}
      <View style={[homeStyles.homeHeaderContainer, { paddingTop: insets.top }]}>
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
                  <Feather name="help-circle" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Support</Text>
                <Text style={homeStyles.homeHeaderNameText}>Help & Support</Text>
              </View>
            </View>
            <View style={homeStyles.homeHeaderActions}>
              <TouchableOpacity 
                style={homeStyles.homeHeaderIconButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={20} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={homeStyles.homeHeaderMetaRow}>
            <Text style={homeStyles.homeHeaderMetaText}>FAQ</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Contact</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Guides</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* FAQ Categories */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
          
          {faqCategories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <View style={styles.categoryTitleContainer}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </View>
                <Text style={styles.expandIcon}>
                  {selectedCategory === category.id ? '−' : '+'}
                </Text>
              </TouchableOpacity>

              {selectedCategory === category.id && (
                <View style={styles.faqList}>
                  {category.faqs.map((faq, index) => (
                    <View key={index} style={styles.faqItem}>
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>📧 Contact Support</Text>
          <Text style={styles.contactDescription}>
            Can't find what you're looking for? Send us a message and we'll help you out!
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email Address</Text>
            <TextInput
              style={styles.formInput}
              value={contactForm.email}
              onChangeText={(text) => setContactForm({...contactForm, email: text})}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Subject</Text>
            <TextInput
              style={styles.formInput}
              value={contactForm.subject}
              onChangeText={(text) => setContactForm({...contactForm, subject: text})}
              placeholder="Brief description of your issue"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={[styles.formInput, styles.messageInput]}
              value={contactForm.message}
              onChangeText={(text) => setContactForm({...contactForm, message: text})}
              placeholder="Please describe your issue in detail..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfoSection}>
          <Text style={styles.sectionTitle}>📞 Other Ways to Reach Us</Text>
          
          <View style={styles.contactMethod}>
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactDetails}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactInfo}>samred221b@gmail.com</Text>
              <Text style={styles.contactNote}>Response within 24 hours</Text>
            </View>
          </View>

          <View style={styles.contactMethod}>
            <Text style={styles.contactIcon}>💬</Text>
            <View style={styles.contactDetails}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactInfo}>Available in app</Text>
              <Text style={styles.contactNote}>Instant responses during business hours</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 44, // Add padding for status bar
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 16,
  },
  faqSection: {
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6b7280',
  },
  faqList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  messageInput: {
    height: 100,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  contactInfoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 4,
  },
  contactDetails: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 2,
  },
  contactNote: {
    fontSize: 12,
    color: '#6b7280',
  },
});
