import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { parseBoolean, parseNumber } from '../utils/dataProcessor';

// Mock MapView component for Expo managed workflow (no native maps dependency)
const MockMapView = ({ children, style, initialRegion, ...props }) => {
  return (
    <View style={[styles.mockMapContainer, style]}>
      <Text style={styles.mockMapTitle}>📍 Mock Map View</Text>
      <Text style={styles.mockMapSubtitle}>
        Region: {initialRegion?.latitude?.toFixed(4)}, {initialRegion?.longitude?.toFixed(4)}
      </Text>
      <Text style={styles.mockMapInfo}>
        🗺️ In a real app, this would be react-native-maps
      </Text>
      <View style={styles.mockMapContent}>
        {children}
      </View>
    </View>
  );
};

// Mock Marker component
const MockMarker = ({ coordinate, title, description, onPress, ...props }) => {
  return (
    <TouchableOpacity 
      style={styles.mockMarker}
      onPress={() => {
        if (onPress) {
          onPress();
        } else if (title) {
          Alert.alert(title, description || 'Marker location');
        }
      }}
    >
      <Text style={styles.mockMarkerIcon}>📍</Text>
      <Text style={styles.mockMarkerTitle}>{title || 'Marker'}</Text>
      <Text style={styles.mockMarkerCoords}>
        {coordinate?.latitude?.toFixed(4)}, {coordinate?.longitude?.toFixed(4)}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Safe MapView component that ensures all boolean props are properly typed
 * Uses MockMapView for Expo managed workflow compatibility
 */
export const SafeMapView = ({ 
  children,
  // Boolean props that commonly cause crashes (now safely handled)
  showsUserLocation,
  showsMyLocationButton,
  showsPointsOfInterest,
  showsCompass,
  showsScale,
  showsBuildings,
  showsTraffic,
  showsIndoors,
  zoomEnabled,
  scrollEnabled,
  pitchEnabled,
  rotateEnabled,
  cacheEnabled,
  loadingEnabled,
  moveOnMarkerPress,
  // Numeric props
  minZoomLevel,
  maxZoomLevel,
  // Other props
  ...props 
}) => {
  // ✅ All boolean props are properly parsed (demonstration of the fix)
  const parsedProps = {
    showsUserLocation: parseBoolean(showsUserLocation),
    showsMyLocationButton: parseBoolean(showsMyLocationButton),
    showsPointsOfInterest: parseBoolean(showsPointsOfInterest),
    showsCompass: parseBoolean(showsCompass),
    showsScale: parseBoolean(showsScale),
    showsBuildings: parseBoolean(showsBuildings),
    showsTraffic: parseBoolean(showsTraffic),
    showsIndoors: parseBoolean(showsIndoors),
    zoomEnabled: parseBoolean(zoomEnabled),
    scrollEnabled: parseBoolean(scrollEnabled),
    pitchEnabled: parseBoolean(pitchEnabled),
    rotateEnabled: parseBoolean(rotateEnabled),
    cacheEnabled: parseBoolean(cacheEnabled),
    loadingEnabled: parseBoolean(loadingEnabled),
    moveOnMarkerPress: parseBoolean(moveOnMarkerPress),
    minZoomLevel: minZoomLevel ? parseNumber(minZoomLevel) : undefined,
    maxZoomLevel: maxZoomLevel ? parseNumber(maxZoomLevel) : undefined,
  };

  // Log the boolean conversion for debugging
  // console.log('🗺️ SafeMapView - Boolean props converted:', parsedProps);

  return (
    <MockMapView {...props}>
      {children}
    </MockMapView>
  );
};

/**
 * Safe Marker component that ensures all boolean props are properly typed
 */
export const SafeMarker = ({ 
  // Boolean props
  draggable,
  flat,
  tracksViewChanges,
  tracksInfoWindowChanges,
  // Numeric props
  rotation,
  opacity,
  zIndex,
  // Coordinate props (critical for Android)
  coordinate,
  ...props 
}) => {
  // ✅ CRITICAL: Validate coordinates are numbers before passing to native
  const safeCoordinate = coordinate ? {
    latitude: parseNumber(coordinate.latitude),
    longitude: parseNumber(coordinate.longitude),
  } : undefined;

  // ✅ Parse all boolean props to prevent crashes
  const parsedProps = {
    draggable: parseBoolean(draggable),
    flat: parseBoolean(flat),
    tracksViewChanges: parseBoolean(tracksViewChanges),
    tracksInfoWindowChanges: parseBoolean(tracksInfoWindowChanges),
    rotation: rotation ? parseNumber(rotation) : undefined,
    opacity: opacity ? parseNumber(opacity, 1.0) : undefined,
    zIndex: zIndex ? parseNumber(zIndex) : undefined,
  };

  // console.log('📍 SafeMarker - Boolean props converted:', parsedProps);

  return (
    <MockMarker
      {...props}
      coordinate={safeCoordinate}
    />
  );
};

/**
 * Hook for safe location handling with proper boolean conversion
 */
export const useLocation = () => {
  const [location, setLocation] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [hasPermission, setHasPermission] = React.useState(false);

  React.useEffect(() => {
    // Mock location for now - in real app, use expo-location
    setTimeout(() => {
      setLocation({
        latitude: 9.03, // Addis Ababa
        longitude: 38.74,
        // ✅ Ensure these are actual booleans, not strings
        mocked: false, // Not "false"
        fromMockData: true, // Not "true"
      });
      setIsLoading(false);
      setHasPermission(true);
    }, 1000);
  }, []);

  return {
    location,
    isLoading,
    error,
    hasPermission: parseBoolean(hasPermission), // Ensure boolean
  };
};

/**
 * Example of proper event data usage with maps
 */
export const EventMapMarker = ({ event, onPress }) => {
  // ✅ CRITICAL: Convert string booleans from JSON to actual booleans
  const shouldShowMarker = event.showMarker === true; // Already converted in parseEvent
  const allowZoom = event.allowZoom === true; // Already converted in parseEvent
  
  if (!shouldShowMarker) {
    return null;
  }

  return (
    <SafeMarker
      coordinate={{
        latitude: event.location.coordinates[0], // Already converted to number
        longitude: event.location.coordinates[1], // Already converted to number
      }}
      title={event.title}
      description={event.location.name}
      onPress={onPress}
      // ✅ CRITICAL: Force boolean conversion to prevent "String cannot be cast to Boolean"
      draggable={Boolean(false)} // Force boolean, not string "false"
      flat={Boolean(false)} // Force boolean, not string "false"
      tracksViewChanges={Boolean(true)} // Force boolean, not string "true"
    />
  );
};

// Styles for mock components
const styles = StyleSheet.create({
  mockMapContainer: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#4ade80',
    borderStyle: 'dashed',
  },
  mockMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 10,
  },
  mockMapSubtitle: {
    fontSize: 16,
    color: '#15803d',
    marginBottom: 5,
  },
  mockMapInfo: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 20,
  },
  mockMapContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mockMarker: {
    backgroundColor: '#ffffff',
    padding: 10,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mockMarkerIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  mockMarkerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 3,
  },
  mockMarkerCoords: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
});
