/**
 * Browser-side caching for KOFA API responses.
 * Makes the app feel instant by showing cached data immediately,
 * then refreshing in the background.
 */

const CACHE_PREFIX = 'kofa_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data from localStorage
 */
export const getCache = (key) => {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

        // Return data even if expired (we'll refresh in background)
        return { data, isExpired };
    } catch (e) {
        return null;
    }
};

/**
 * Set cache data in localStorage
 */
export const setCache = (key, data) => {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        // localStorage might be full or disabled
        console.warn('Failed to cache:', key);
    }
};

/**
 * Clear specific cache key
 */
export const clearCache = (key) => {
    try {
        if (key) {
            localStorage.removeItem(CACHE_PREFIX + key);
        } else {
            // Clear all KOFA cache
            Object.keys(localStorage)
                .filter(k => k.startsWith(CACHE_PREFIX))
                .forEach(k => localStorage.removeItem(k));
        }
    } catch (e) {
        console.warn('Failed to clear cache');
    }
};

/**
 * Cache keys for different endpoints
 */
export const CACHE_KEYS = {
    PRODUCTS: 'products',
    ORDERS: 'orders',
    PROFIT_SUMMARY: 'profit_summary',
    DASHBOARD: 'dashboard'
};
