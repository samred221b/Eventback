// API Service for Eventopia Backend Integration
import { auth } from '../firebase.config';
import { Platform } from 'react-native';

// API Configuration
// Use localhost for web/simulator, but your IP for physical device
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api'; // Production URL
  }
  
  // For development
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api'; // Web can use localhost
  }
  
  // For mobile (Expo Go), use your computer's IP (confirmed working)
  return 'http://192.168.0.153:3000/api';
};

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = 10000; // 10 seconds

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log(`🔗 API Service initialized for ${Platform.OS}`);
    console.log(`📡 Backend URL: ${this.baseURL}`);
  }

  // Get Firebase ID token for authentication
  async getAuthToken() {
    try {
      if (auth.currentUser) {
        console.log('🔐 Getting auth token for user:', auth.currentUser.email);
        const token = await auth.currentUser.getIdToken();
        console.log('✅ Auth token retrieved successfully');
        return token;
      } else {
        console.warn('⚠️ No authenticated user found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authentication token if available
    if (options.requireAuth === true) {
      const token = await this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      console.log(`API Response: ${response.status}`, data);
      return data;

    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    return this.get('/health', { requireAuth: false });
  }

  // Authentication endpoints
  async verifyAuth() {
    return this.post('/auth/verify', {}, { requireAuth: true });
  }

  async getCurrentUser() {
    return this.get('/auth/me', { requireAuth: true });
  }

  // Event endpoints
  async getEvents(params = {}) {
    try {
      // console.log('📅 Fetching events with params:', params);
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/events?${queryString}` : '/events';
      // console.log('🔗 API endpoint:', `${this.baseURL}${endpoint}`);
      
      const result = await this.get(endpoint, { requireAuth: false });
      // console.log('📊 Events API response:', result);
      return result;
    } catch (error) {
      console.error('❌ getEvents error:', error);
      throw error;
    }
  }

  async getEvent(id) {
    return this.get(`/events/${id}`, { requireAuth: false });
  }

  async createEvent(eventData) {
    return this.post('/events', eventData, { requireAuth: true });
  }

  async updateEvent(id, eventData) {
    return this.put(`/events/${id}`, eventData, { requireAuth: true });
  }

  async deleteEvent(id) {
    return this.delete(`/events/${id}`, { requireAuth: true });
  }

  async registerForEvent(id) {
    return this.post(`/events/${id}/register`, {}, { requireAuth: true });
  }

  async unregisterFromEvent(id) {
    return this.delete(`/events/${id}/register`, { requireAuth: true });
  }

  async likeEvent(id) {
    return this.post(`/events/${id}/like`, {}, { requireAuth: true });
  }

  async getFeaturedEvents(limit = 10) {
    return this.get(`/events/featured?limit=${limit}`, { requireAuth: false });
  }

  async getNearbyEvents(lat, lng, radius = 10000, limit = 20) {
    return this.get(`/events/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`, { requireAuth: false });
  }

  async getEventsByCategory(category, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/categories/${category}?${queryString}` : `/events/categories/${category}`;
    return this.get(endpoint, { requireAuth: false });
  }

  // Organizer endpoints
  async getOrganizers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/organizers?${queryString}` : '/organizers';
    return this.get(endpoint, { requireAuth: false });
  }

  async getOrganizer(id) {
    return this.get(`/organizers/${id}`, { requireAuth: false });
  }

  async updateOrganizerProfile(profileData) {
    return this.put('/organizers/profile', profileData, { requireAuth: true });
  }

  async getOrganizerStats() {
    return this.get('/organizers/profile/stats', { requireAuth: true });
  }

  async getOrganizerEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/organizers/profile/events?${queryString}` : '/organizers/profile/events';
    return this.get(endpoint, { requireAuth: true });
  }

  // Search functionality
  async searchEvents(query, filters = {}) {
    const params = { search: query, ...filters };
    return this.getEvents(params);
  }

  // Track event view
  async trackEventView(eventId) {
    try {
      return this.post(`/events/${eventId}/view`, {}, { requireAuth: false });
    } catch (error) {
      console.warn('Failed to track event view:', error);
      // Don't throw error as view tracking shouldn't break the app
      return { success: false };
    }
  }

  // Upload image
  async uploadImage(imageUri) {
    try {
      console.log('📤 Uploading image:', imageUri);

      // Create FormData
      const formData = new FormData();
      
      // For React Native, we need to create a proper file object
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename || 'image.jpg',
      });

      const response = await fetch(`${this.baseURL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Image uploaded successfully:', data.data.url);
      return data;

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw error;
    }
  }

  // Delete uploaded image
  async deleteImage(filename) {
    try {
      const response = await fetch(`${this.baseURL}/upload/image/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Image deleted successfully');
      return data;

    } catch (error) {
      console.error('❌ Image deletion failed:', error);
      throw error;
    }
  }

  // Test backend connection
  async testConnection() {
    try {
      // console.log('🔍 Testing backend connection to:', `${this.baseURL}/health`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), API_TIMEOUT);
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${this.baseURL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }),
        timeoutPromise
      ]);
      
      // console.log('📡 Backend response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log('✅ Backend connection successful:', data);
        return true;
      } else {
        console.error('❌ Backend responded with error:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection test failed:', error.message);
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;

// Export individual methods for convenience
export const {
  healthCheck,
  verifyAuth,
  getCurrentUser,
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  likeEvent,
  getFeaturedEvents,
  getNearbyEvents,
  getEventsByCategory,
  getOrganizers,
  getOrganizer,
  updateOrganizerProfile,
  getOrganizerStats,
  getOrganizerEvents,
  searchEvents,
  trackEventView,
  uploadImage,
  deleteImage,
  testConnection,
} = apiService;
