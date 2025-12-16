import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase.config';
import apiService from '../services/api';

// Enhanced Auth Context with Backend Integration
const AuthContext = createContext({});

// Key for AsyncStorage
const AUTH_STORAGE_KEY = '@Eventopia/auth_state';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const lastVerifiedUidRef = useRef(null);
  const syncingRef = useRef(false);

  // Save auth state to AsyncStorage
  const saveAuthState = async (userData) => {
    try {
      if (userData) {
        const { uid, email, emailVerified } = userData;
        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ uid, email, emailVerified })
        );
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  // Load auth state from AsyncStorage
  const loadAuthState = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Failed to load auth state:', error);
      return null;
    }
  };

  // Handle user state changes
  const handleAuthStateChange = async (firebaseUser) => {
    if (firebaseUser) {
      // Save user data to AsyncStorage
      await saveAuthState(firebaseUser);
      
      // Check backend connection if not already connected
      if (!backendConnected) {
        try {
          const isConnected = await apiService.testConnection();
          setBackendConnected(isConnected);
          
          // Always try to sync with backend, regardless of email verification
          if (isConnected) {
            await syncWithBackend(firebaseUser);
          }
        } catch (error) {
          console.warn('Backend connection test failed:', error);
          setBackendConnected(false);
        }
      }
    } else {
      // User signed out
      await saveAuthState(null);
      setOrganizerProfile(null);
      
      // Still check backend connection for public data
      try {
        const isConnected = await apiService.testConnection();
        setBackendConnected(isConnected);
      } catch (error) {
        console.warn('Backend connection test failed:', error);
        setBackendConnected(false);
      }
    }
    
    // Update user state
    setUser(firebaseUser);
    
    // Update loading states
    if (initializing) {
      setInitializing(false);
    }
    setIsLoading(false);
  };

  // Sync Firebase user with backend
  const syncWithBackend = async (firebaseUser) => {
    // Guard: require a signed-in user
    if (!firebaseUser) return;

    // Guard: prevent overlapping calls
    if (syncingRef.current) return;

    // Guard: avoid re-verifying the same user repeatedly if we already have a profile
    if (lastVerifiedUidRef.current === firebaseUser.uid && organizerProfile) return;

    syncingRef.current = true;
    try {
      // Test backend connection
      const isConnected = await apiService.testConnection();
      setBackendConnected(isConnected);
      
      if (!isConnected) {
        console.warn('Backend not available, working in offline mode');
        return;
      }

      // Try to verify auth with backend and get/create organizer profile
      try {
        const response = await apiService.verifyAuth();
        
        if (response.success) {
          setOrganizerProfile(response.user);
          // Mark this UID as verified to prevent duplicate calls on re-renders
          lastVerifiedUidRef.current = firebaseUser.uid;
          // console.log('✅ Synced with backend:', response.user.name);
        }
      } catch (authError) {
        // Auth verification failed, but backend is still connected
        console.warn('Auth verification failed, but backend is available:', authError.message);
        // Don't set backendConnected to false just because auth failed
      }
    } catch (error) {
      console.error('Backend sync failed:', error);
      setBackendConnected(false);
    } finally {
      syncingRef.current = false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check local storage for faster initial load
        const savedAuth = await loadAuthState();
        if (savedAuth) {
          // If we have saved auth, set the user immediately
          const { uid, email, emailVerified } = savedAuth;
          setUser({ uid, email, emailVerified });
        }
        
        // Then set up the auth state listener
        const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
        
        // Small delay to prevent flash of loading screen
        const timer = setTimeout(() => {
          if (initializing) {
            setInitializing(false);
          }
        }, 500);
        
        return () => {
          clearTimeout(timer);
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitializing(false);
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
  }, [initializing]);
  
  // Add sendEmailVerification function
  const sendEmailVerification = async () => {
    if (!auth.currentUser) return { success: false, error: 'No user is signed in' };
    
    try {
      await firebaseSendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      setIsLoading(true);
      
      // Create Firebase user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await firebaseSendEmailVerification(result.user);
      
      // Update Firebase profile with full name
      if (fullName) {
        await updateProfile(result.user, {
          displayName: fullName
        });
      }
      
      // Show verification message but still allow login
      return { 
        success: true, 
        user: result.user,
        message: 'Please check your email to verify your account. You can still log in, but some features may be limited until you verify your email.'
      };
      
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'An error occurred during sign up';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters!';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!email || !password) {
        return { success: false, error: 'Please enter both email and password' };
      }
      
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // console.log('✅ User signed in successfully!');
        return { success: true, user: result.user };
      } catch (firebaseError) {
        // Handle Firebase auth errors
        console.log('Firebase auth error:', firebaseError.code); // Debug log
        
        let errorMessage = 'Invalid email or password. Please try again.';
        
        // Map Firebase error codes to user-friendly messages
        const errorMap = {
          'auth/user-not-found': 'No account found with this email address',
          'auth/wrong-password': 'Incorrect password. Please try again',
          'auth/invalid-email': 'Please enter a valid email address',
          'auth/user-disabled': 'This account has been disabled',
          'auth/too-many-requests': 'Too many attempts. Please try again later',
          'auth/network-request-failed': 'Network error. Please check your connection'
        };
        
        if (firebaseError.code && errorMap[firebaseError.code]) {
          errorMessage = errorMap[firebaseError.code];
        }
        
        return { 
          success: false, 
          error: errorMessage,
          code: firebaseError.code
        };
      }
      
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setOrganizerProfile(null);
      // console.log('✅ User signed out successfully!');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'An error occurred during sign out' };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      // console.log('✅ Password reset email sent!');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      let errorMessage = 'An error occurred while sending reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Update organizer profile
  const updateOrganizerProfile = async (profileData) => {
    try {
      setIsLoading(true);
      
      if (!backendConnected) {
        throw new Error('Backend not available');
      }
      
      const response = await apiService.updateOrganizerProfile(profileData);
      
      if (response.success) {
        setOrganizerProfile(response.data);
        // console.log('✅ Profile updated successfully!');
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'An error occurred while updating profile' };
    } finally {
      setIsLoading(false);
    }
  };

  // Get organizer statistics
  const getOrganizerStats = async () => {
    try {
      if (!backendConnected) {
        throw new Error('Backend not available');
      }
      
      const response = await apiService.getOrganizerStats();
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get organizer stats error:', error);
      return null;
    }
  };

  // Refresh backend connection
  const refreshBackendConnection = async () => {
    try {
      const isConnected = await apiService.testConnection();
      setBackendConnected(isConnected);
      
      if (isConnected && user) {
        await syncWithBackend(user);
      }
      
      return isConnected;
    } catch (error) {
      console.error('Refresh backend connection error:', error);
      setBackendConnected(false);
      return false;
    }
  };

  const value = {
    // Firebase user
    user,
    
    // Backend organizer profile
    organizerProfile,
    
    // Loading states
    isLoading: initializing || isLoading,
    isInitializing: initializing,
    
    // Connection status
    backendConnected,
    
    // Authentication methods
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
    
    // Profile methods
    updateOrganizerProfile,
    getOrganizerStats,
    
    // Utility methods
    refreshBackendConnection,
    // On-demand verification for organizer features
    verifyOrganizerIfNeeded: async () => {
      try {
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }
        // If already verified and have profile for this UID, skip
        if (lastVerifiedUidRef.current === user.uid && organizerProfile) {
          return { success: true, data: organizerProfile };
        }

        setIsLoading(true);
        await syncWithBackend(user);
        return { success: !!(lastVerifiedUidRef.current === user.uid), data: organizerProfile };
      } catch (e) {
        return { success: false, error: e?.message || 'Verification failed' };
      } finally {
        setIsLoading(false);
      }
    },
    
    // Computed properties
    isAuthenticated: !!user,
    hasOrganizerProfile: !!organizerProfile,
    isOrganizerVerified: organizerProfile?.isVerified || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
