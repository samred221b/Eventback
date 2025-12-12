import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Feather } from '@expo/vector-icons';
import Logo from '../assets/Logo.png';

const { width } = Dimensions.get('window');

export default function OrganizerLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  const handlePrimaryAction = async () => {
    if (isSubmitting) {
      return;
    }

    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setErrorMessage(isLogin ? 'Please enter both email and password.' : 'Please complete all required fields.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const trimmedName = name.trim();

      const result = isLogin
        ? await signIn(trimmedEmail, trimmedPassword)
        : await signUp(trimmedEmail, trimmedPassword, trimmedName);

      if (!result?.success) {
        setErrorMessage(result?.error || 'Unable to complete the action. Please try again.');
        return;
      }

      navigation.navigate('OrganizerDashboard');
    } catch (error) {
      setErrorMessage(error?.message || 'Something went wrong. Please try again.');
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
      Alert.alert("Success", "Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      Alert.alert("Error", "Failed to send password reset email. Please try again.");
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
      <StatusBar style="light" backgroundColor="#000000" />

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
                    Alert.alert("Error", "Please enter a valid email address.");
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
          <View style={styles.headerIconContainer}>
            <Image source={Logo} style={styles.logo} />
          </View>
          <Text style={styles.headerTitle}>
            {isLogin ? 'Welcome Back' : 'Join Eventopia'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLogin 
              ? 'Sign in to manage your events' 
              : 'Start creating amazing events today'}
          </Text>
        </LinearGradient>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>

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

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Feather name="facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Feather name="mail" size={20} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Feather name="github" size={20} color="#333333" />
            </TouchableOpacity>
          </View>

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

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Join Eventopia?</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Feather name={feature.icon} size={24} color="#0277BD" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
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
  // Features Section
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
  },
});
