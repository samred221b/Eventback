import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Feather } from '@expo/vector-icons';
import Logo from '../assets/Logo.png';
import { logger } from '../utils/logger';
import PricingScreen from './PricingScreen';
import AppErrorBanner from '../components/AppErrorBanner';
import AppErrorState from '../components/AppErrorState';
import { toAppError, APP_ERROR_SEVERITY } from '../utils/appError';
import homeStyles from '../styles/homeStyles';

const { width } = Dimensions.get('window');

export default function OrganizerLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { signIn, signUp } = useAuth();

  const handlePrimaryAction = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null); // Clear any previous errors

    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError(toAppError(new Error(isLogin ? 'Please enter both email and password.' : 'Please complete all required fields.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const trimmedName = name.trim();

      let result;
      
      if (isLogin) {
        // Handle login
        result = await signIn(trimmedEmail, trimmedPassword, rememberMe);
        if (!result?.success) {
          // More specific error message for invalid credentials
          if (result?.error?.includes('password') || result?.error?.includes('user-not-found')) {
            setError(toAppError(new Error('The email or password you entered is incorrect. Please try again.'), { kind: 'AUTH_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
          } else if (result?.error?.includes('network')) {
            setError(toAppError(new Error('Unable to connect. Please check your internet connection and try again.'), { kind: 'NETWORK_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
          } else {
            setError(toAppError(new Error('Unable to log in. Please check your details and try again.'), { kind: 'AUTH_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
          }
          return;
        }
        navigation.navigate('OrganizerDashboard');
      } else {
        // Handle sign up
        result = await signUp(trimmedEmail, trimmedPassword, trimmedName);
        if (!result?.success) {
          if (result?.error?.includes('email-already-in-use')) {
            setError(toAppError(new Error('This email is already registered. Please sign in or use a different email.'), { kind: 'AUTH_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
          } else if (result?.error?.includes('weak-password')) {
            setError(toAppError(new Error('Password should be at least 6 characters long.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
          } else if (result?.error?.includes('invalid-email')) {
            setError(toAppError(new Error('Please enter a valid email address.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
          } else {
            setError(toAppError(new Error('Unable to create account. Please try again.'), { kind: 'API_ERROR', severity: APP_ERROR_SEVERITY.ERROR }));
          }
          return;
        }
        
        // Show success message with verification info
        Alert.alert(
          'Account Created',
          'Your account has been created successfully! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Switch to login form
                setIsLogin(true);
                setEmail(trimmedEmail);
                setPassword('');
              }
            }
          ]
        );
      }
    } catch (error) {
      logger.error('Login error:', error);
      setError(toAppError(error, { fallbackMessage: 'An unexpected error occurred. Please try again later.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
const [forgotEmail, setForgotEmail] = useState("");
const [forgotLoading, setForgotLoading] = useState(false);

const handleForgotPassword = () => {
  setShowForgotModal(true);
};

  const sendPasswordResetEmailToUser = async (email) => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setError(toAppError(new Error('Password reset email sent! Check your inbox.'), { kind: 'SUCCESS', severity: APP_ERROR_SEVERITY.SUCCESS }));
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      setError(toAppError(error, { fallbackMessage: 'Failed to send password reset email. Please try again.' }));
    }
  };

  const features = [
    { icon: 'calendar', title: 'Create Events', description: 'Design and publish unlimited events' },
    { icon: 'users', title: 'Engage Guests', description: 'Connect with your audience easily' },
    { icon: 'bar-chart-2', title: 'Analytics', description: 'Get insights on event performance' },
    { icon: 'zap', title: 'Instant Updates', description: 'Real-time notifications and updates' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* StatusBar is managed in App.js */}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)'}}>
          <View style={{width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 24}}>
            <Text style={{fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8}}>Reset Password</Text>
            <Text style={{fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 16}}>Enter your email address to receive a password reset link.</Text>
            <TextInput
              style={{borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 18, fontSize: 15}}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 12}}>
              <TouchableOpacity
                style={{paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#E5E7EB'}}
                onPress={() => {
                  setShowForgotModal(false);
                  setForgotEmail("");
                }}
                disabled={forgotLoading}
              >
                <Text style={{color: '#374151', fontWeight: '600'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#0277BD'}}
                onPress={async () => {
                  if (!forgotEmail.trim()) {
                    setError(toAppError(new Error('Please enter a valid email address.'), { kind: 'VALIDATION_ERROR', severity: APP_ERROR_SEVERITY.WARNING }));
                    return;
                  }
                  setForgotLoading(true);
                  await sendPasswordResetEmailToUser(forgotEmail.trim());
                  setForgotLoading(false);
                  setShowForgotModal(false);
                  setForgotEmail("");
                }}
                disabled={forgotLoading}
              >
                <Text style={{color: '#fff', fontWeight: '700'}}>{forgotLoading ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#0277BD', '#01579B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={homeStyles.homeHeaderBg} pointerEvents="none">
            <View style={homeStyles.homeHeaderOrbOne} />
            <View style={homeStyles.homeHeaderOrbTwo} />
          </View>
          <View style={styles.headerIconContainer}>
            <Image source={Logo} style={styles.logo} />
          </View>
          <Text style={styles.headerTitle}>
            {isLogin ? 'Welcome Back' : 'Join Eventopia'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLogin 
              ? 'Sign in to create, manage, and promote events' 
              : 'Start creating amazing events today'}
          </Text>
        </LinearGradient>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>

          {/* Error Message */}
          <AppErrorBanner error={error} onRetry={() => setError(null)} disabled={isSubmitting} />

          {/* Name Input (Sign Up Only) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Feather name="user" size={20} color="#6B7280" />
              </View>
              <TextInput
                style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput('')}
              />
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Feather name="mail" size={20} color="#6B7280" />
            </View>
            <TextInput
              style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput('')}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Feather name="lock" size={20} color="#6B7280" />
            </View>
            <TextInput
              style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput('')}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Feather 
                name={showPassword ? "eye" : "eye-off"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          {/* Remember Me - Login Only */}
          {isLogin && (
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>
          )}

          {/* Forgot Password */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotButton} activeOpacity={0.7} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Login/Signup Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            activeOpacity={0.9}
            onPress={handlePrimaryAction}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#0277BD', '#01579B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Feather 
                name={isLogin ? "log-in" : "user-plus"} 
                size={20} 
                color="#FFFFFF" 
              />
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 12 }} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setIsLogin(!isLogin)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {isLogin 
                ? "Don't have an account? " 
                : "Already have an account? "}
              <Text style={styles.toggleTextBold}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Start Your Event Journey</Text>
          <Text style={styles.benefitsSubtitle}>Join thousands of successful event organizers</Text>
          
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <View style={styles.benefitDepthLayer} pointerEvents="none">
                <View style={styles.benefitGlowOrbOne} />
                <View style={styles.benefitGlowOrbTwo} />
                <View style={styles.benefitHighlight} />
              </View>
              <Text style={styles.benefitNumber}>200+</Text>
              <Text style={styles.benefitLabel}>Events Created</Text>
            </View>
            
            <View style={styles.benefitCard}>
              <View style={styles.benefitDepthLayer} pointerEvents="none">
                <View style={styles.benefitGlowOrbOne} />
                <View style={styles.benefitGlowOrbTwo} />
                <View style={styles.benefitHighlight} />
              </View>
              <Text style={styles.benefitNumber}>25K+</Text>
              <Text style={styles.benefitLabel}>Active Users</Text>
            </View>
            
            <View style={styles.benefitCard}>
              <View style={styles.benefitDepthLayer} pointerEvents="none">
                <View style={styles.benefitGlowOrbOne} />
                <View style={styles.benefitGlowOrbTwo} />
                <View style={styles.benefitHighlight} />
              </View>
              <Text style={styles.benefitNumber}>150+</Text>
              <Text style={styles.benefitLabel}>Organizers</Text>
            </View>
          </View>
        </View>
        
        {/* Quick Links */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.quickLinksTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity 
              style={styles.quickLinkCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Pricing')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.quickLinkGradient}
              >
                <Feather name="book-open" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickLinkText}>Pricing Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickLinkCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('About')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickLinkGradient}
              >
                <Feather name="info" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickLinkText}>About the App</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickLinkCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TermsPrivacy')}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.quickLinkGradient}
              >
                <Feather name="file-text" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickLinkCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.quickLinkGradient}
              >
                <Feather name="message-circle" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.quickLinkText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  // Header
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
 
  logo: {
    width: 98,
    height: 98,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 15,
    color: '#1F2937',
  },
  inputFocused: {
    borderColor: '#0277BD',
  },
  eyeIcon: {
    paddingRight: 16,
    paddingLeft: 12,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0277BD',
    borderColor: '#0277BD',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 10,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    color: '#0277BD',
    fontWeight: '600',
  },
  // Primary Button
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorText: {
    textAlign: 'center',
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 16,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    marginHorizontal: 16,
  },
  // Social Buttons
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  // Toggle
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleTextBold: {
    fontWeight: '800',
    color: '#0277BD',
  },
  // Benefits Section
  benefitsSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 0,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  benefitsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: '#060B14',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
  },
  benefitDepthLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  benefitGlowOrbOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -100,
    left: -90,
    backgroundColor: 'rgba(2, 119, 189, 0.35)',
  },
  benefitGlowOrbTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: -120,
    right: -120,
    backgroundColor: 'rgba(1, 87, 155, 0.30)',
  },
  benefitHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ skewY: '-8deg' }],
    opacity: 0.5,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  benefitNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    zIndex: 1,
  },
  benefitLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 1,
  },
  // Quick Links Section
  quickLinksSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 16,
  },
  quickLinksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickLinkGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
});
