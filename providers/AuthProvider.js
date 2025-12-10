import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase.config';
import apiService from '../services/api';

// Enhanced Auth Context with Backend Integration
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  // Handle user state changes
  const handleAuthStateChange = async (firebaseUser) => {
    setUser(firebaseUser);
    
    if (firebaseUser) {
      // User is signed in, sync with backend
      try {
        await syncWithBackend(firebaseUser);
      } catch (error) {
        console.error('Backend sync error:', error);
      }
    } else {
      // User is signed out, but still test backend connection for public data
      setOrganizerProfile(null);
      try {
        const isConnected = await apiService.testConnection();
        setBackendConnected(isConnected);
      } catch (error) {
        console.warn('Backend connection test failed:', error);
        setBackendConnected(false);
      }
    }
    
    if (initializing) setInitializing(false);
    setIsLoading(false);
  };

  // Sync Firebase user with backend
  const syncWithBackend = async (firebaseUser) => {
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
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    return unsubscribe;
  }, [initializing]);

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      setIsLoading(true);
      
      // Create Firebase user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile with full name
      if (fullName) {
        await updateProfile(result.user, {
          displayName: fullName
        });
      }
      
      // console.log('✅ User account created & signed in!');
      
      // Backend sync will happen automatically via onAuthStateChanged
      return { success: true, user: result.user };
      
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
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      // console.log('✅ User signed in successfully!');
      
      // Backend sync will happen automatically via onAuthStateChanged
      return { success: true, user: result.user };
      
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'An error occurred during sign in';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address!';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled!';
      }
      
      return { success: false, error: errorMessage };
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
    isLoading,
    initializing,
    
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
