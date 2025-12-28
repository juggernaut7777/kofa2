// API Configuration - Points to live Heroku backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://kofa-backend-david-0a6d58175f07.herokuapp.com';

export const API_ENDPOINTS = {
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  CREATE_PRODUCT: '/products',
  UPDATE_PRODUCT: (id) => `/products/${id}`,
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
  DELIVERY_CREATE: '/delivery/create',
  DELIVERY_TRACK: (trackingId) => `/delivery/track/${trackingId}`,
  DELIVERY_UPDATE_TRACKING: (trackingId) => `/delivery/track/${trackingId}/update`,

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

  // Receipts & Invoices
  GENERATE_RECEIPT: '/receipts/generate',
  GENERATE_INVOICE: '/invoices/generate',

  // Support & Troubleshooting
  SUBMIT_SUPPORT_TICKET: '/support/ticket',
  TROUBLESHOOTING_GUIDES: '/support/troubleshooting',
  FAQ: '/support/faq',

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

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
      throw new Error('API request timed out after 10 seconds');
    }

    console.error('API Call Error:', error);
    throw error;
  }
};

