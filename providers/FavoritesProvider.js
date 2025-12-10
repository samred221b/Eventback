import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = '@eventopia_favorites';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from AsyncStorage on app start
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addToFavorites = async (eventId) => {
    try {
      // Update local state first for immediate UI feedback
      const newFavorites = [...favorites, eventId];
      setFavorites(newFavorites);
      await saveFavorites(newFavorites);
      
      // Sync with backend
      console.log('👍 Adding to favorites and syncing with backend:', eventId);
      await apiService.likeEvent(eventId);
      console.log('✅ Successfully synced favorite with backend');
    } catch (error) {
      console.error('❌ Failed to sync favorite with backend:', error);
      // Keep local favorite even if backend sync fails
    }
  };

  const removeFromFavorites = async (eventId) => {
    try {
      // Update local state first for immediate UI feedback
      const newFavorites = favorites.filter(id => id !== eventId);
      setFavorites(newFavorites);
      await saveFavorites(newFavorites);
      
      // Sync with backend (toggle like will remove it)
      console.log('👎 Removing from favorites and syncing with backend:', eventId);
      await apiService.likeEvent(eventId);
      console.log('✅ Successfully synced favorite removal with backend');
    } catch (error) {
      console.error('❌ Failed to sync favorite removal with backend:', error);
      // Keep local state even if backend sync fails
    }
  };

  const toggleFavorite = async (eventId) => {
    if (isFavorite(eventId)) {
      await removeFromFavorites(eventId);
    } else {
      await addToFavorites(eventId);
    }
  };

  const isFavorite = (eventId) => {
    return favorites.includes(eventId);
  };

  const clearAllFavorites = async () => {
    setFavorites([]);
    await saveFavorites([]);
  };

  const value = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
