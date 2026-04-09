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
  SCAN_PRODUCT: '/products/scan-product',

  // Business AI
  BUSINESS_AI: '/business-ai',

  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id) => `/orders/${id}`,
  UPDATE_ORDER_STATUS: (id) => `/orders/${id}/status`,
  CREATE_ORDER: '/orders',

  // Sales (Walk-in / Quick Sale)
  SALES_RECORD: '/sales/record',
  SALES_CREDIT: '/sales/credit',
  SALES_MARK_PAID: (id) => `/sales/mark-paid/${id}`,
  MANUAL_SALE: '/sales/manual',

  // Credit Sales (who owes you money)
  CREDIT_SALES: '/sales/credit',
  CREDIT_SALES_SUMMARY: '/sales/credit/summary',
  CREDIT_PAYMENT: (id) => `/sales/credit/${id}/payment`,
  DELETE_CREDIT: (id) => `/sales/credit/${id}`,

  // Notifications (in-app alerts)
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD: '/notifications/unread-count',
  NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',

  // Bot Connections (WhatsApp/Instagram API)
  BOT_CONNECTIONS: '/vendor/bot-connections',
  CONNECT_WHATSAPP: '/vendor/bot-connections/whatsapp',
  CONNECT_INSTAGRAM: '/vendor/bot-connections/instagram',
  DISCONNECT_BOT: (platform) => `/vendor/bot-connections/${platform}`,

  // Users/Vendors
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,

  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  VERIFY_EMAIL: '/auth/verify',
  RESEND_CODE: '/auth/resend-code',

  // Dashboard
  DASHBOARD_SUMMARY: '/dashboard/summary',


  // Expenses
  LOG_EXPENSE: '/expenses/log',
  ADD_EXPENSE: '/expenses/log',
  EXPENSE_SUMMARY: '/expenses/summary',
  LIST_EXPENSES: '/expenses/list',
  SCAN_RECEIPT: '/expenses/scan-receipt',
  CONFIRM_PAYMENT: '/expenses/confirm-payment',

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



  // Receipts & Invoices
  GENERATE_RECEIPT: '/receipts/generate',
  GENERATE_INVOICE: '/invoices/generate',
  CREATE_INVOICE: '/invoices/generate',
  LIST_INVOICES: '/invoices',
  GET_INVOICE: (id) => `/invoices/${id}`,
  MARK_INVOICE_PAID: (id) => `/invoices/${id}/mark-paid`,

  // Sales Channels
  CHANNELS_SUMMARY: '/channels/summary',


  // CRM (Customers)
  CUSTOMERS_LIST: '/customers/list',
  CUSTOMERS_STATS: '/customers/stats',
  CUSTOMER_BY_ID: (id) => `/customers/${id}`,

  // Marketing (AI Ad Generation)
  MARKETING_GENERATE: '/marketing/generate',
  MARKETING_CAPTION: '/marketing/generate-caption',
  MARKETING_ASSETS: '/marketing/assets',
  MARKETING_DELETE_ASSET: (id) => `/marketing/assets/${id}`,

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

  // Add timeout to prevent hanging - 30 seconds for Heroku cold starts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
      throw new Error('API request timed out after 30 seconds');
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
