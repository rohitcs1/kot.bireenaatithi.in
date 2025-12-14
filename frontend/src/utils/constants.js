/**
 * Application Constants
 * 
 * Centralized constants for the KOT System
 */

/**
 * User Roles
 */
export const ROLES = {
  ADMIN: 'Admin',
  WAITER: 'Waiter',
  KITCHEN: 'Kitchen'
};

export const ROLE_LIST = [ROLES.ADMIN, ROLES.WAITER, ROLES.KITCHEN];

/**
 * Table Status
 */
export const TABLE_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning'
};

export const TABLE_STATUS_LIST = [
  TABLE_STATUS.AVAILABLE,
  TABLE_STATUS.OCCUPIED,
  TABLE_STATUS.RESERVED,
  TABLE_STATUS.CLEANING
];

/**
 * Menu Categories
 */
export const MENU_CATEGORIES = {
  ALL: 'All',
  STARTERS: 'Starters',
  MAIN: 'Main',
  DRINKS: 'Drinks',
  DESSERTS: 'Desserts'
};

export const MENU_CATEGORY_LIST = [
  MENU_CATEGORIES.ALL,
  MENU_CATEGORIES.STARTERS,
  MENU_CATEGORIES.MAIN,
  MENU_CATEGORIES.DRINKS,
  MENU_CATEGORIES.DESSERTS
];

/**
 * Order Status
 */
export const ORDER_STATUS = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const ORDER_STATUS_LIST = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.SERVED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED
];

/**
 * Kitchen Stations
 */
export const KITCHEN_STATIONS = {
  MAIN: 'Main',
  BAR: 'Bar',
  DESSERT: 'Dessert'
};

export const KITCHEN_STATION_LIST = [
  KITCHEN_STATIONS.MAIN,
  KITCHEN_STATIONS.BAR,
  KITCHEN_STATIONS.DESSERT
];

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  ORDER_READY: 'Order Ready',
  PRINTER_ERROR: 'Printer Error',
  LOW_STOCK: 'Low Stock',
  PAYMENT_RECEIVED: 'Payment Received',
  TABLE_STATUS: 'Table Status'
};

/**
 * Notification Priority
 */
export const NOTIFICATION_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI'
};

export const PAYMENT_METHOD_LIST = [
  PAYMENT_METHODS.CASH,
  PAYMENT_METHODS.CARD,
  PAYMENT_METHODS.UPI
];

/**
 * Tax and Charges
 */
export const GST_RATE = 18; // 18% GST
export const DEFAULT_SERVICE_CHARGE = 10; // 10% service charge

/**
 * Application Info
 */
export const APP_NAME = 'KOT System';
export const APP_VERSION = '1.0.0';

/**
 * Date Range Options
 */
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: '7days',
  LAST_30_DAYS: '30days',
  CUSTOM: 'custom'
};

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  USER: 'kot-user',
  TOKEN: 'kot-token',
  PENDING_QUEUE: 'kot-pending-queue',
  SETTINGS: 'kot-settings'
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    BY_TABLE: (tableId) => `/orders/table/${tableId}`
  },
  MENU: {
    BASE: '/menu',
    BY_ID: (id) => `/menu/${id}`,
    BY_CATEGORY: (category) => `/menu/category/${category}`
  },
  TABLES: {
    BASE: '/tables',
    BY_ID: (id) => `/tables/${id}`,
    UPDATE_STATUS: (id) => `/tables/${id}/status`
  },
  KITCHEN: {
    ORDERS: '/kitchen/orders',
    UPDATE_STATUS: (id) => `/kitchen/orders/${id}/status`
  },
  REPORTS: {
    BASE: '/reports',
    SALES: '/reports/sales',
    ITEMS: '/reports/items',
    WAITERS: '/reports/waiters'
  }
};

export default {
  ROLES,
  ROLE_LIST,
  TABLE_STATUS,
  TABLE_STATUS_LIST,
  MENU_CATEGORIES,
  MENU_CATEGORY_LIST,
  ORDER_STATUS,
  ORDER_STATUS_LIST,
  KITCHEN_STATIONS,
  KITCHEN_STATION_LIST,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LIST,
  GST_RATE,
  DEFAULT_SERVICE_CHARGE,
  APP_NAME,
  APP_VERSION,
  DATE_RANGES,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  STORAGE_KEYS,
  API_ENDPOINTS
};

