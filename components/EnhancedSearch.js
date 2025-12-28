import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

const EnhancedSearch = ({ 
  value, 
  onChangeText, 
  placeholder = "Search events...",
  events = [],
  onEventSelect,
  style
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent searches from storage
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Generate suggestions based on input
  useEffect(() => {
    if (value.trim().length > 0 && events.length > 0) {
      generateSuggestions(value);
    } else {
      setSuggestions([]);
    }
  }, [value, events]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      logger.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (searchText) => {
    if (!searchText.trim()) return;
    
    try {
      let updated = [searchText, ...recentSearches.filter(s => s !== searchText)];
      updated = updated.slice(0, 10); // Keep only last 10 searches
      
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      logger.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem('recentSearches');
      setRecentSearches([]);
    } catch (error) {
      logger.error('Error clearing recent searches:', error);
    }
  };

  const generateSuggestions = (query) => {
    const lowerQuery = query.toLowerCase();
    const matches = [];

    // Search by event name
    events.forEach(event => {
      if (event.title?.toLowerCase().includes(lowerQuery)) {
        // Handle location object or string
        let locationText = 'Location TBA';
        if (event.location) {
          if (typeof event.location === 'string') {
            locationText = event.location;
          } else if (typeof event.location === 'object') {
            locationText = event.location.city || event.location.name || event.location.address || 'Location TBA';
          }
        }
        
        matches.push({
          type: 'event',
          icon: 'calendar',
          text: event.title,
          subtitle: locationText,
          data: event
        });
      }
    });

    // Search by location
    const locations = new Set();
    events.forEach(event => {
      const city = event.location?.city;
      const locationName = event.location?.name;
      
      if (city && city.toLowerCase().includes(lowerQuery) && !locations.has(city)) {
        locations.add(city);
        matches.push({
          type: 'location',
          icon: 'map-pin',
          text: city,
          subtitle: 'Location',
          query: city
        });
      }
      
      if (locationName && locationName.toLowerCase().includes(lowerQuery) && !locations.has(locationName)) {
        locations.add(locationName);
        matches.push({
          type: 'location',
          icon: 'map-pin',
          text: locationName,
          subtitle: 'Venue',
          query: locationName
        });
      }
    });

    // Search by category
    const categories = new Set();
    events.forEach(event => {
      if (event.category && event.category.toLowerCase().includes(lowerQuery) && !categories.has(event.category)) {
        categories.add(event.category);
        matches.push({
          type: 'category',
          icon: 'tag',
          text: event.category.charAt(0).toUpperCase() + event.category.slice(1),
          subtitle: 'Category',
          query: event.category
        });
      }
    });

    // Limit to 8 suggestions
    setSuggestions(matches.slice(0, 8));
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay to allow suggestion click
    setTimeout(() => {
      setIsFocused(false);
      // Don't hide suggestions immediately to allow clicks
    }, 150);
  };

  const handleSuggestionPress = (suggestion) => {
    if (suggestion.type === 'event' && onEventSelect) {
      onEventSelect(suggestion.data);
      setShowSuggestions(false);
    } else if (suggestion.query) {
      onChangeText(suggestion.query);
      saveRecentSearch(suggestion.query);
      setShowSuggestions(false);
    }
  };

  const handleRecentSearchPress = (searchText) => {
    onChangeText(searchText);
    setShowSuggestions(false);
  };

  const handleSubmit = () => {
    if (value.trim()) {
      saveRecentSearch(value.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Feather name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {value.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              onChangeText('');
              setShowSuggestions(false);
            }} 
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && (isFocused || value.length > 0) && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Recent Searches */}
            {value.length === 0 && recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleRecentSearchPress(search)}
                  >
                    <Feather name="clock" size={18} color="#6B7280" />
                    <Text style={styles.suggestionText}>{search}</Text>
                    <Feather name="arrow-up-left" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && value.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Suggestions</Text>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <View style={[
                      styles.suggestionIconContainer,
                      suggestion.type === 'event' && styles.eventIconContainer,
                      suggestion.type === 'location' && styles.locationIconContainer,
                      suggestion.type === 'category' && styles.categoryIconContainer,
                    ]}>
                      <Feather name={suggestion.icon} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {suggestion.text}
                      </Text>
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                        {suggestion.subtitle}
                      </Text>
                    </View>
                    <Feather name="arrow-up-left" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* No Results */}
            {suggestions.length === 0 && value.length > 0 && (
              <View style={styles.noResults}>
                <Feather name="search" size={32} color="#D1D5DB" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try different keywords</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    zIndex: 101,
  },
  searchContainerFocused: {
    borderColor: '#0277BD',
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 102,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 103,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  recentSection: {
    paddingVertical: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0277BD',
  },
  suggestionsSection: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0277BD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIconContainer: {
    backgroundColor: '#0277BD',
  },
  locationIconContainer: {
    backgroundColor: '#10B981',
  },
  categoryIconContainer: {
    backgroundColor: '#F59E0B',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default EnhancedSearch;
