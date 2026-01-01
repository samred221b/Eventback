// Data processing utilities for converting API strings to proper types
// Important: Always convert coordinates to numbers to prevent native map crashes
import { logger } from './logger';

/**
 * Parse event data from JSON/API and ensure proper types
 * @param {Object} rawEvent - Raw event data with string coordinates and string booleans
 * @returns {Object} - Processed event with proper types
 */
export const parseEvent = (rawEvent) => {
  // Update parseEvent to handle GeoJSON coordinates
  const parsedCoordinates = {
    type: 'Point',
    coordinates: [
      parseFloat(rawEvent.location.coordinates[1]), // lng
      parseFloat(rawEvent.location.coordinates[0])  // lat
    ]
  };

  return {
    ...rawEvent,
    location: {
      ...rawEvent.location,
      geo: parsedCoordinates, // Use GeoJSON format
    },
    // Convert string numbers to actual numbers
    price: typeof rawEvent.price === 'string' ? parseFloat(rawEvent.price) : rawEvent.price,
    // Convert new pricing fields to numbers if they're strings
    vipPrice: rawEvent.vipPrice ? (typeof rawEvent.vipPrice === 'string' ? parseFloat(rawEvent.vipPrice) : rawEvent.vipPrice) : undefined,
    vvipPrice: rawEvent.vvipPrice ? (typeof rawEvent.vvipPrice === 'string' ? parseFloat(rawEvent.vvipPrice) : rawEvent.vvipPrice) : undefined,
    earlyBirdPrice: rawEvent.earlyBirdPrice ? (typeof rawEvent.earlyBirdPrice === 'string' ? parseFloat(rawEvent.earlyBirdPrice) : rawEvent.earlyBirdPrice) : undefined,
    onDoorPrice: rawEvent.onDoorPrice ? (typeof rawEvent.onDoorPrice === 'string' ? parseFloat(rawEvent.onDoorPrice) : rawEvent.onDoorPrice) : undefined,
    ticketsAvailableAt: rawEvent.ticketsAvailableAt || undefined,
    
    // ✅ CRITICAL: Convert string booleans to actual booleans for map/component props
    featured: rawEvent.featured === 'true', // "true" -> true, "false" -> false
    isOnline: rawEvent.isOnline === 'true',
    requiresRegistration: rawEvent.requiresRegistration === 'true',
    showOnMap: rawEvent.showOnMap === 'true',
    allowZoom: rawEvent.allowZoom === 'true',
    showMarker: rawEvent.showMarker === 'true',
    
    // Parse date to ensure it's a valid Date object
    parsedDate: new Date(rawEvent.date),
  };
};

/**
 * Process array of events from API/JSON
 * @param {Array} rawEvents - Array of raw event data
 * @returns {Array} - Array of processed events with proper types
 */
export const processEventsData = (rawEvents) => {
  if (!Array.isArray(rawEvents)) {
    logger.error('Events data is not an array:', rawEvents);
    return [];
  }

  return rawEvents.map(event => {
    try {
      return parseEvent(event);
    } catch (error) {
      logger.error('Error parsing event:', event, error);
      return null;
    }
  }).filter(event => event !== null); // Remove any failed parsing attempts
};

/**
 * Validate coordinates are numbers before passing to native components
 * @param {Object} coordinates - GeoJSON Point object
 * @returns {boolean} - true if valid numeric coordinates
 */
export const validateCoordinates = (coordinates) => {
  // Update validateCoordinates to use GeoJSON format
  if (!coordinates || coordinates.type !== 'Point' || !Array.isArray(coordinates.coordinates) || coordinates.coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = coordinates.coordinates;
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' && 
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

/**
 * Format price for display
 * @param {number} price - Numeric price
 * @param {string} currency - Currency code
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, currency) => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice) || numericPrice === 0) {
    return '🆓 Free';
  }
  
  return `💰 ${numericPrice} ${currency}`;
};

/**
 * Format date for display
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time for display
 * @param {string} timeInput - Time string (e.g., "14:30" or "2:30 PM")
 * @returns {string} - Formatted time string
 */
export const formatTime = (timeInput) => {
  if (!timeInput) {
    return 'Time TBA';
  }
  
  // If it's already in 12-hour format, return as is
  if (timeInput.includes('AM') || timeInput.includes('PM')) {
    return timeInput;
  }
  
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeInput.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Convert string boolean values to actual booleans
 * @param {any} value - Value that might be a string boolean
 * @returns {boolean} - Actual boolean value
 */
export const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  
  return Boolean(value);
};

/**
 * Safely parse numeric values that might be strings
 * @param {any} value - Value that might be a string number
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed number
 */
export const parseNumber = (value, defaultValue = 0) => {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
};

/**
 * Make event serializable by removing the Date object
 * @param {Object} event - Event object with a Date object
 * @returns {Object} - Serializable event object
 */
export const makeEventSerializable = (event) => {
  const { parsedDate, ...serializableEvent } = event;
  
  // Ensure organizerId is preserved
  if (event.organizerId) {
    serializableEvent.organizerId = event.organizerId;
  }
  
  return serializableEvent;
};

/**
 * Standardizes event data for EventDetailsScreen
 * Ensures all required fields are present for consistent display
 */
export const standardizeEventForDetails = (event) => {
  const serializable = makeEventSerializable(event);
  
  // Add missing fields that EventDetailsScreen expects
  return {
    ...serializable,
    // Basic info
    id: event.id || event._id,
    title: event.title || '',
    description: event.description || '',
    date: event.date,
    time: event.time || '',
    
    // Location
    location: event.location || {},
    
    // Pricing - ensure all pricing fields are present
    price: event.price || 0,
    vipPrice: event.vipPrice || null,
    vvipPrice: event.vvipPrice || null,
    earlyBirdPrice: event.earlyBirdPrice || null,
    onDoorPrice: event.onDoorPrice || null,
    ticketsAvailableAt: event.ticketsAvailableAt || null,
    currency: event.currency || 'ETB',
    
    // Event details
    category: event.category || '',
    featured: event.featured || false,
    capacity: event.capacity || null,
    imageUrl: event.imageUrl || event.image || null,
    
    // Organizer info
    organizerName: event.organizerName || event.organizer || '',
    organizerId: event.organizerId || null,
    
    // Additional info
    importantInfo: event.importantInfo || '',
    
    // Status
    status: event.status || 'published',
    
    // Mode
    mode: event.mode || 'In-person',
    
    // Registration
    requiresRegistration: event.requiresRegistration || false,
    
    // Online/Offline
    isOnline: event.isOnline || false,
  };
};
