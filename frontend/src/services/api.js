import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safely import Platform and other modules - they may not be ready immediately
let Platform, NativeModules, Constants;
try {
  Platform = require('react-native').Platform;
  NativeModules = require('react-native').NativeModules;
  Constants = require('expo-constants').default;
} catch (error) {
  console.warn('[API] React Native modules not ready yet:', error.message);
}

// Prefer configurable base URL for physical device testing (Expo Go).
// Use EXPO_PUBLIC_API_BASE at runtime (Expo SDK 54+ supports PUBLIC prefix).
// Fallback to localhost for web/emulator usage.
const getAPIBaseURL = () => {
  // Priority 1: Explicit env var
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }

  // Priority 2: Try to derive from Expo Constants (only on native)
  try {
    if (Platform?.OS && Platform.OS !== 'web') {
      const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoClientHost;
      if (hostUri) {
        const host = hostUri.replace(/^exp:\/\//, '').split(':')[0];
        return `http://${host}:9090/api`;
      }

      // Fallback: scriptURL
      const scriptURL = NativeModules?.SourceCode?.scriptURL;
      if (scriptURL && typeof scriptURL === 'string') {
        const host = scriptURL.replace(/^https?:\/\//, '').split(':')[0];
        return `http://${host}:9090/api`;
      }
    }
  } catch (error) {
    console.warn('[API] Error deriving base URL:', error.message);
  }

  // Priority 3: Default to localhost
  return 'http://localhost:9090/api';
};

const api = axios.create({
  baseURL: getAPIBaseURL(),
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Exponential backoff with jitter
const getRetryDelay = (retryCount) => {
  const exponentialDelay = RETRY_DELAY * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
};

// Network connectivity check
const isNetworkConnected = async () => {
  try {
    // Try to reach a reliable endpoint
    const response = await axios.get(getAPIBaseURL() + '/products', { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    console.warn('[API] Network connectivity check failed:', error.message);
    return false;
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - No token`);
    }
    // Add retry count tracker
    config.retryCount = config.retryCount || 0;
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic and token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const config = error.config;

    // Don't retry if no config
    if (!config) {
      console.error('[API Error] No config found:', error.message);
      return Promise.reject(error);
    }

    // Endpoints to exclude from retry
    const excludeFromRetry = ['/auth/login', '/auth/signup', '/auth/profile'];
    const shouldExclude = excludeFromRetry.some(endpoint => config.url?.includes(endpoint));

    // Handle 401 Unauthorized (token might be expired)
    if (error.response?.status === 401 && !shouldExclude) {
      console.warn('[API] 401 Unauthorized - Attempting to refresh token');

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            config.headers.Authorization = `Bearer ${token}`;
            return api(config);
          })
          .catch(err => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Clear the invalid token
          await AsyncStorage.removeItem('token');
          console.log('[API] Invalid token cleared from storage');
        }

        processQueue(new Error('Token refresh failed. Please login again.'));
        return Promise.reject(error);
      } catch (err) {
        processQueue(err);
        return Promise.reject(err);
      }
    }

    // Retry logic for network errors and 5xx errors
    const isNetworkError = error.code === 'ECONNABORTED' || 
                          error.code === 'ERR_NETWORK' ||
                          error.code === 'ECONNREFUSED';
    const isServerError = error.response?.status >= 500;
    const shouldRetry = (isNetworkError || isServerError) && !shouldExclude;

    if (shouldRetry && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      const delay = getRetryDelay(config.retryCount - 1);

      console.warn(
        `[API] Retrying request (${config.retryCount}/${MAX_RETRIES}) after ${delay.toFixed(0)}ms:`,
        `${config.method?.toUpperCase()} ${config.url}`
      );

      await new Promise(resolve => setTimeout(resolve, delay));

      // Check network before retry
      const connected = await isNetworkConnected();
      if (!connected) {
        console.error('[API] Network appears to be unavailable');
        return Promise.reject(new Error('Network unavailable. Please check your connection.'));
      }

      return api(config);
    }

    // Final error handling
    const errorMessage = error.response?.data?.error || 
                        error.message || 
                        'An error occurred. Please try again.';

    console.error('[API Error]', {
      status: error.response?.status,
      message: errorMessage,
      url: config.url,
      retries: config.retryCount,
    });

    return Promise.reject(error);
  }
);

// Simple debug log
console.log('[API] Base URL:', getAPIBaseURL());
console.log('[API] Timeout: 10000ms, Max Retries: 3');

// Token management
export const setAuthToken = async (token) => {
  await AsyncStorage.setItem('token', token);
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem('token');
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('token');
};

// Product API
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, size, quantity) => api.post('/cart', { productId, size, quantity }),
  removeFromCart: (id) => api.delete(`/cart/${id}`),
  updateQuantity: (id, quantity) => api.put(`/cart/${id}/quantity?quantity=${quantity}`),
};

// Auth API
export const authAPI = {
  signup: async (user) => {
    const response = await api.post('/auth/signup', user);
    return response;
  },

  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response;
  },

  logout: async () => {
    await clearAuthToken();
    return api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response;
  },

  getUser: async (id) => {
    const response = await api.get(`/auth/user/${id}`);
    return response;
  },

  updateUser: async (id, user) => {
    const response = await api.put(`/auth/user/${id}`, user);
    return response;
  },
};

// Order API
export const orderAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getUserOrders: (userId) => api.get(`/orders/user/${userId}`),
  create: (order) => api.post('/orders', order),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllUsers: () => api.get('/admin/users'),
  getAllProducts: () => api.get('/admin/products'),
  getAllOrders: () => api.get('/admin/orders'),
  getAllLogs: () => api.get('/admin/logs'),
  createProduct: (product) => api.post('/admin/products', product),
  updateProduct: (id, product) => api.put(`/admin/products/${id}`, product),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, null, { params: { status } }),
};

export default api;