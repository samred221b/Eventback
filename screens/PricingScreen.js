import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import homeStyles from '../styles/homeStyles';

export default function PricingScreen({ navigation }) {
  const insets = useSafeAreaInsets() || { top: 0, bottom: 0, left: 0, right: 0 };
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const packages = [
    {
      id: 'starter',
      name: 'Starter',
      price: '800',
      events: '10',
      period: 'month',
      color: '#10B981',
      gradient: ['#10B981', '#059669'],
      features: [
        '10 events per month',
        'Basic event analytics',
        'Email support',
        'Event listing',
        'Basic promotion tools',
        'Mobile app access'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '1500',
      events: '30',
      period: 'month',
      color: '#0277BD',
      gradient: ['#0277BD', '#01579B'],
      features: [
        '30 events per month',
        'Advanced analytics',
        'Priority support',
        'Featured listings',
        'Advanced promotion',
        'Custom branding',
        'Mobile app access'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '3000',
      events: '50+',
      period: 'month',
      color: '#7C3AED',
      gradient: ['#7C3AED', '#6D28D9'],
      features: [
        '50+ events per month',
        'Premium analytics',
        '24/7 phone support',
        'Priority placement',
        'Unlimited promotion',
        'Advanced event management',
        'Custom branding options'
      ],
      popular: false
    }
  ];

  const handleSelectPackage = (packageId) => {
    setSelectedPackage(packageId);
    setShowPaymentModal(true);
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
                  <Feather name="tag" size={20} color="#0F172A" />
                </View>
              </View>
              <View>
                <Text style={homeStyles.homeHeaderWelcomeText}>Pricing Plans</Text>
                <Text style={homeStyles.homeHeaderNameText}>Choose Your Plan</Text>
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
            <Text style={homeStyles.homeHeaderMetaText}>Starter Plans</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Professional</Text>
            <Text style={homeStyles.homeHeaderMetaSeparator}>|</Text>
            <Text style={homeStyles.homeHeaderMetaText}>Enterprise</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Pricing Cards */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {packages.map((pkg) => (
          <View key={pkg.id} style={[styles.packageCard, pkg.popular && styles.popularCard]}>
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>ETB {pkg.price}</Text>
                <Text style={styles.period}>/{pkg.period}</Text>
              </View>
              <Text style={styles.eventCount}>{pkg.events} events per month</Text>
            </View>

            <View style={styles.featuresContainer}>
              {pkg.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Feather name="check-circle" size={16} color={pkg.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.selectButton, { backgroundColor: pkg.color }]}
              onPress={() => handleSelectPackage(pkg.id)}
              activeOpacity={0.9}
            >
              <Text style={styles.selectButtonText}>Select Plan</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Choose Eventopia?</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="shield" size={24} color="#0277BD" />
              <Text style={styles.infoTitleText}>Secure Platform</Text>
              <Text style={styles.infoDesc}>Safe and reliable payment processing</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="users" size={24} color="#0277BD" />
              <Text style={styles.infoTitleText}>Large Audience</Text>
              <Text style={styles.infoDesc}>Reach thousands of event-goers</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="trending-up" size={24} color="#0277BD" />
              <Text style={styles.infoTitleText}>Growth Tools</Text>
              <Text style={styles.infoDesc}>Analytics to grow your events</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="headphones" size={24} color="#0277BD" />
              <Text style={styles.infoTitleText}>24/7 Support</Text>
              <Text style={styles.infoDesc}>We're here to help you succeed</Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change my plan later?</Text>
            <Text style={styles.faqAnswer}>Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
            <Text style={styles.faqAnswer}>We accept bank transfers, mobile money, and all major payment methods in Ethiopia.</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a contract commitment?</Text>
            <Text style={styles.faqAnswer}>No contracts! You can cancel your subscription at any time without penalties.</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Do unused events roll over?</Text>
            <Text style={styles.faqAnswer}>No, events reset each month. However, you can upgrade anytime to get more events.</Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need Help Choosing?</Text>
          <Text style={styles.contactDesc}>Our team is here to help you find the perfect plan</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Feather name="message-circle" size={18} color="#0277BD" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Information</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.selectedPlanInfo}>
                <Text style={styles.selectedPlanLabel}>Selected Plan:</Text>
                <Text style={styles.selectedPlanName}>
                  {selectedPackage && packages.find(p => p.id === selectedPackage)?.name} Plan
                </Text>
                <Text style={styles.selectedPlanPrice}>
                  ETB {selectedPackage && packages.find(p => p.id === selectedPackage)?.price}/month
                </Text>
              </View>

              <View style={styles.paymentMethods}>
                <Text style={styles.paymentMethodsTitle}>Payment Methods</Text>
                
                <View style={styles.paymentMethod}>
                  <View style={styles.paymentMethodHeader}>
                    <Feather name="credit-card" size={20} color="#0277BD" />
                    <Text style={styles.paymentMethodTitle}>Commercial Bank of Ethiopia (CBE)</Text>
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.accountNumber}>Account Number: 1000404046105</Text>
                    <Text style={styles.accountName}>Account Name: Samuel Alemayehu Tadesse</Text>
                  </View>
                </View>

                <View style={styles.paymentMethod}>
                  <View style={styles.paymentMethodHeader}>
                    <Feather name="smartphone" size={20} color="#10B981" />
                    <Text style={styles.paymentMethodTitle}>Telebirr</Text>
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.phoneNumber}>Phone Number: 0904577804</Text>
                    <Text style={styles.paymentNote}>Send payment with your name as reference</Text>
                  </View>
                </View>
              </View>

              <View style={styles.paymentInstructions}>
                <Text style={styles.instructionsTitle}>How to Complete Payment:</Text>
                <Text style={styles.instructionItem}>1. Choose your preferred payment method</Text>
                <Text style={styles.instructionItem}>2. Send the exact amount (ETB {selectedPackage && packages.find(p => p.id === selectedPackage)?.price})</Text>
                <Text style={styles.instructionItem}>3. Include your name and plan type in payment reference</Text>
                <Text style={styles.instructionItem}>4. Send payment confirmation to telegram @supernova221b</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => {
                    setShowPaymentModal(false);
                    navigation.navigate('OrganizerLogin', { selectedPackage });
                  }}
                >
                  <Text style={styles.confirmButtonText}>I've Sent Payment</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 44, // Add padding for status bar
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  popularCard: {
    borderColor: '#0277BD',
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#0277BD',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  packageName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  eventCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  faqSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDesc: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#0277BD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0277BD',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 30,
  },
  selectedPlanInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  selectedPlanLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedPlanPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0277BD',
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentMethod: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  paymentDetails: {
    paddingLeft: 32,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    color: '#6B7280',
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  paymentInstructions: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 10,
  },
  confirmButton: {
    backgroundColor: '#0277BD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
