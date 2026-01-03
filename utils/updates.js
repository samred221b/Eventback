import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { logger } from './logger';

/**
 * Hook to handle Expo Updates with user-friendly prompts
 */
export const useExpoUpdates = () => {
  const { currentlyRunning, isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Check for updates when app starts
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        logger.log('Update available:', update);
        setShowUpdatePrompt(true);
      }
    } catch (error) {
      logger.warn('Error checking for updates:', error);
    }
  };

  const applyUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
      logger.log('Update fetched, restarting');
      await Updates.reloadAsync();
    } catch (error) {
      logger.error('Error applying update:', error);
      Alert.alert('Update Failed', 'Unable to apply the update. Please try again later.');
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending,
    showUpdatePrompt,
    checkForUpdates,
    applyUpdate,
    dismissUpdate,
  };
};

/**
 * Component to show update prompt
 */
export const UpdatePrompt = ({ visible, onApply, onDismiss }) => {
  useEffect(() => {
    if (visible) {
      Alert.alert(
        'Update Available',
        'A new version of Eventopia is available with improvements and bug fixes. Would you like to update now?',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: onDismiss,
          },
          {
            text: 'Update Now',
            style: 'default',
            onPress: onApply,
          },
        ],
        { cancelable: true }
      );
    }
  }, [visible, onApply, onDismiss]);

  return null; // Alert handles the UI
};
