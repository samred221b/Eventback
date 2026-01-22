// API Service for Eventopia Backend Integration
import { auth } from '../firebase.config';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API Configuration
// Prefer app config's extra.apiBaseUrl when available
const getApiBaseUrl = () => {
  try {
    const extra = (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra);
    if (extra?.apiBaseUrl) {
      return extra.apiBaseUrl;
    }
  } catch (e) {
    // ignore and fall back
  }

  if (!__DEV__) {
    return 'https://eventoback-1.onrender.com/api'; // Production URL
  }

  // For development
  if (Platform.OS === 'web') {
    return 'https://eventoback-1.onrender.com/api'; // Web can use production backend
  }

  // For mobile (Expo Go), default to production backend
  return 'https://eventoback-1.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = 10000; // 10 seconds
const DEBUG_API = __DEV__;

// Helpers
const isRetriableStatus = (status) => [502, 503, 504].includes(status);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function parseResponseSafely(response) {
  // Handle no content
  if (response.status === 204) return {};
  const contentType = response.headers?.get?.('content-type') || '';
  const isJson = contentType.includes('application/json');
  try {
    if (isJson) {
      return await response.json();
    }
    const text = await response.text();
    // Try JSON parse fallback
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  } catch (e) {
    // Final fallback
    return {};
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
          }

  // Get Firebase ID token for authentication
  async getAuthToken() {
    try {
      if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                return token;
      } else {
                return null;
      }
    } catch (error) {
            return null;
    }
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const baseHeaders = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const method = (options.method || 'GET').toUpperCase();
    const requireAuth = options.requireAuth === true;
    const maxRetries = method === 'GET' ? 1 : 0; // one retry for GET only

    // Add authentication token if available
    if (requireAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        const authError = new Error('Authentication required');
        authError.code = 'auth/no-token';
        throw authError;
      }
      baseHeaders.Authorization = `Bearer ${token}`;
    }

    let attempt = 0;
    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      try {
        const response = await fetch(url, {
          ...options,
          method,
          headers: baseHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await parseResponseSafely(response);

        if (!response.ok) {
          const errorMessage = data?.message || data?.error || `HTTP ${response.status}`;
          const shouldRetry = attempt < maxRetries && (isRetriableStatus(response.status));
          if (shouldRetry) {
            attempt += 1;
            await sleep(300 * attempt);
            continue;
          }
          const err = new Error(errorMessage);
          err.status = response.status;
          throw err;
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        // Normalize timeout error
        if (error.name === 'AbortError') {
          if (attempt < maxRetries) {
            attempt += 1;
            await sleep(300 * attempt);
            continue;
          }
          const timeoutErr = new Error('Request timeout');
          timeoutErr.code = 'request/timeout';
          throw timeoutErr;
        }

        // Network errors (no status) are retriable once for GET
        const isNetworkError = !('status' in error);
        if (isNetworkError && attempt < maxRetries) {
          attempt += 1;
          await sleep(300 * attempt);
          continue;
        }

        throw error;
      }
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

  // Support endpoints
  async submitBugReport(bugReportData) {
    return this.post('/support/bug-report', bugReportData, { requireAuth: false });
  }

  async submitFeatureRequest(featureRequestData) {
    return this.post('/support/feature-request', featureRequestData, { requireAuth: false });
  }

  async getSupportRequests(params = {}) {
    return this.get('/support/requests', { ...params, requireAuth: true });
  }

  async updateSupportRequestStatus(id, status) {
    return this.put(`/support/requests/${id}/status`, { status }, { requireAuth: true });
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
    const encodedCategory = encodeURIComponent(String(category ?? '').trim());
    const endpoint = queryString
      ? `/events/categories/${encodedCategory}?${queryString}`
      : `/events/categories/${encodedCategory}`;
    return this.get(endpoint, { requireAuth: false });
  }

  // Notifications (broadcast)
  async getBroadcastNotifications(limit = 30) {
    // Optional auth: if logged in, backend will include isRead.
    const requireAuth = !!auth.currentUser;
    return this.get(`/notifications/broadcast?limit=${limit}`, { requireAuth });
  }

  async getUnreadNotificationsCount() {
    if (!auth.currentUser) {
      return { success: true, data: { unreadCount: 0 } };
    }
    return this.get('/notifications/unread-count', { requireAuth: true });
  }

  async markNotificationRead(id) {
    if (!id) throw new Error('Notification id is required');
    if (!auth.currentUser) {
      return { success: true };
    }
    return this.post(`/notifications/${id}/read`, {}, { requireAuth: true });
  }

  async markAllNotificationsRead() {
    if (!auth.currentUser) {
      return { success: true, data: { unreadCount: 0 } };
    }
    return this.post('/notifications/read-all', {}, { requireAuth: true });
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

  async deleteOrganizerAccount() {
    return this.delete('/organizers/account', { requireAuth: true });
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
            // Don't throw error as view tracking shouldn't break the app
      return { success: false };
    }
  }

  // Upload image
  async uploadImage(imageUri) {
    try {
      
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

            return data;

    } catch (error) {
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

            return data;

    } catch (error) {
            throw error;
    }
  }

  // Banner endpoints
  async getBanners() {
    return this.get('/banners', { requireAuth: false });
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
                return false;
      }
    } catch (error) {
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
  likeEvent,
  getFeaturedEvents,
  getNearbyEvents,
  getEventsByCategory,
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