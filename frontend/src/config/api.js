// API Configuration - Points to Heroku EU backend (uses free student credits!)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kofa-backend-eu-2bb681b4e51a.herokuapp.com';

// Import browser-side cache utilities
import { getCache, setCache, clearCache, CACHE_KEYS } from '../utils/cache';

export { getCache, setCache, clearCache, CACHE_KEYS };

export const API_ENDPOINTS = {
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  CREATE_PRODUCT: '/products',
  UPDATE_PRODUCT: (id) => `/products/${id}`,
  DELETE_PRODUCT: (id) => `/products/${id}`,
  RESTOCK_PRODUCT: (id) => `/products/${id}/restock`,
  UPLOAD_PRODUCT_IMAGE: (id) => `/products/${id}/image`,
  DELETE_PRODUCT_IMAGE: (id) => `/products/${id}/image`,
  LOW_STOCK_PRODUCTS: '/products/low-stock',
  SEARCH_PRODUCTS: '/products/search',

  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id) => `/orders/${id}`,
  UPDATE_ORDER_STATUS: (id) => `/orders/${id}/status`,
  CREATE_ORDER: '/orders',

  // Sales
  MANUAL_SALE: '/sales/manual',

  // Users/Vendors
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,

  // Dashboard
  DASHBOARD_SUMMARY: '/dashboard/summary',

  // Delivery
  DELIVERY_ZONES: '/delivery/zones',
  DELIVERY_ESTIMATE: '/delivery/estimate',
  CREATE_SHIPMENT: '/delivery/create',
  TRACK_SHIPMENT: (trackingId) => `/delivery/track/${trackingId}`,
  UPDATE_SHIPMENT: (trackingId) => `/delivery/track/${trackingId}/update`,

  // Expenses
  LOG_EXPENSE: '/expenses/log',
  ADD_EXPENSE: '/expenses/log',
  EXPENSE_SUMMARY: '/expenses/summary',
  LIST_EXPENSES: '/expenses/list',

  // Profit & Loss (backend uses /profit-loss prefix)
  PROFIT_TODAY: '/profit-loss/today',
  PROFIT_SUMMARY: '/profit-loss/summary',
  PROFIT_REPORT: '/profit-loss/report',
  PROFIT_WEEK: '/profit-loss/week',
  PROFIT_MONTH: '/profit-loss/month',
  PROFIT_CHANNELS: '/profit-loss/channels',

  // Analytics
  ANALYTICS: '/analytics',

  // Bot Settings
  BOT_STYLE: '/settings/bot-style',
  BOT_PAUSE: '/bot/pause',
  BOT_STATUS: '/bot/status',

  // Vendor Settings
  VENDOR_SETTINGS: '/vendor/settings',
  VENDOR_PAYMENT_ACCOUNT: '/vendor/payment-account',
  VENDOR_BUSINESS_INFO: '/vendor/business-info',

  // Push Notifications
  DEVICE_TOKENS: '/device-tokens',

  // Subscription & Payments
  SUBSCRIPTION_PLANS: '/subscription/plans',
  PURCHASE_SUBSCRIPTION: '/subscription/purchase',
  SUBSCRIPTION_UPGRADE: '/subscription/upgrade',

  // Usage Stats (Freemium)
  USAGE_STATS: '/usage',

  // Receipts & Invoices
  GENERATE_RECEIPT: '/receipts/generate',
  GENERATE_INVOICE: '/invoices/generate',
  CREATE_INVOICE: '/invoices/generate',
  LIST_INVOICES: '/invoices',
  GET_INVOICE: (id) => `/invoices/${id}`,
  MARK_INVOICE_PAID: (id) => `/invoices/${id}/mark-paid`,

  // Sales Channels
  CHANNELS_SUMMARY: '/channels/summary',

  // Support & Troubleshooting
  SUBMIT_SUPPORT_TICKET: '/support/ticket',
  TROUBLESHOOTING_GUIDES: '/support/troubleshooting',
  FAQ: '/support/faq',

  // Business AI Assistant
  BUSINESS_AI: '/business-ai',

  // Health check
  HEALTH: '/health'
};


// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add timeout to prevent hanging - 5 seconds for fast failure
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('API request timed out after 5 seconds');
    }

    console.error('API Call Error:', error);
    throw error;
  }
};


/**
 * Cached API call with stale-while-revalidate strategy.
 * Returns cached data INSTANTLY, then refreshes in background.
 * 
 * @param {string} endpoint - API endpoint
 * @param {string} cacheKey - Key to store in localStorage
 * @param {function} onUpdate - Called when fresh data arrives (optional)
 * @returns {Promise} - Resolves with data (cached or fresh)
 */
export const cachedApiCall = async (endpoint, cacheKey, onUpdate = null) => {
  // Check cache first
  const cached = getCache(cacheKey);

  if (cached?.data) {
    // Return cached data immediately
    // If expired, fetch fresh data in background
    if (cached.isExpired) {
      apiCall(endpoint)
        .then(freshData => {
          setCache(cacheKey, freshData);
          if (onUpdate) onUpdate(freshData);
        })
        .catch(() => { }); // Silently fail background refresh
    }
    return cached.data;
  }

  // No cache - fetch from API
  const data = await apiCall(endpoint);
  setCache(cacheKey, data);
  return data;
};
