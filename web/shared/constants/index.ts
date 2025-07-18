// UI Constants
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOAST: 1100,
    TOOLTIP: 1200,
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
  },
} as const;

// Chat Constants
export const CHAT_CONSTANTS = {
  MESSAGE_TYPES: {
    USER: 'user',
    ASSISTANT: 'assistant',
    TOOL: 'tool',
  },
  MESSAGE_STATUS: {
    SENDING: 'sending',
    SENT: 'sent',
    ERROR: 'error',
  },
  STREAM_TYPES: {
    START: 'start',
    STATUS: 'status',
    PLANNING_SUMMARY: 'planning_summary',
    PLANNED_QUERY: 'planned_query',
    SUMMARIZATION_START: 'summarization_start',
    ANSWER: 'answer',
    INTERRUPT: 'interrupt',
    ERROR: 'error',
  },
} as const;

// Search Constants
export const SEARCH_CONSTANTS = {
  MAX_RESULTS: 10,
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  CHAT_HISTORY: 'chat_history',
  USER_PREFERENCES: 'user_preferences',
  THREAD_STATE: 'thread_state',
  SEARCH_HISTORY: 'search_history',
} as const;

// API Routes
export const API_ROUTES = {
  CHAT: '/api/chat',
  STATE: '/api/state',
  SEARCH: '/api/search',
  THREAD: '/api/thread',
} as const;

// Event Names
export const EVENT_NAMES = {
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  TYPING_START: 'typing:start',
  TYPING_END: 'typing:end',
  SEARCH_STARTED: 'search:started',
  SEARCH_COMPLETED: 'search:completed',
  THREAD_CREATED: 'thread:created',
  THREAD_UPDATED: 'thread:updated',
} as const;