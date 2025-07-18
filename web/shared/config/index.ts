// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.MODE === 'production' 
    ? 'https://api.relate.com' 
    : 'http://localhost:8000',
  ENDPOINTS: {
    CHAT: '/chat',
    STATE: '/state',
    THREAD: '/thread',
    SEARCH: '/search',
  },
  TIMEOUT: 30000, // 30 seconds
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: import.meta.env.MODE === 'production' 
    ? 'wss://api.relate.com/ws' 
    : 'ws://localhost:8000/ws',
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

// UI Configuration
export const UI_CONFIG = {
  CHAT: {
    MAX_MESSAGE_LENGTH: 4000,
    TYPING_INDICATOR_DELAY: 500,
    AUTO_SCROLL_THRESHOLD: 100,
    MESSAGE_BATCH_SIZE: 50,
  },
  SEARCH: {
    MAX_RESULTS: 10,
    DEBOUNCE_DELAY: 300,
  },
  THREAD: {
    MAX_THREAD_TITLE_LENGTH: 100,
    DEFAULT_THREAD_TITLE: 'New Conversation',
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_VOICE_INPUT: false,
  ENABLE_FILE_UPLOAD: false,
  ENABLE_THREAD_SHARING: false,
  ENABLE_SEARCH_SUGGESTIONS: true,
  ENABLE_STATUS_INDICATORS: true,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
} as const;

// Export all configs as a single object for convenience
export const CONFIG = {
  API: API_CONFIG,
  WEBSOCKET: WEBSOCKET_CONFIG,
  UI: UI_CONFIG,
  FEATURES: FEATURE_FLAGS,
  ERRORS: ERROR_MESSAGES,
} as const;