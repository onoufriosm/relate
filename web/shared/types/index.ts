// Search related types
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  query: string;
}

// Chat message types
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  statusData?: {
    statusMessages: string[];
    plannedQueries: string[];
    isCompleted: boolean;
  };
  searchResults?: SearchResult[];
}

// Interrupt types
export interface InterruptData {
  message: string;
  type: 'human_review';
}

// Stream response types
export interface StreamResponse {
  type: 'start' | 'status' | 'planning_summary' | 'planned_query' | 'summarization_start' | 'answer' | 'interrupt' | 'error';
  content: string;
}

// Chat state types
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  statusMessages: string[];
  plannedQueries: string[];
  isTyping: boolean;
  showStatusInline: boolean;
  isInSummarization: boolean;
  isWaitingForFeedback: boolean;
  currentInterrupt?: InterruptData;
}

// API response types
export interface StateResponse {
  messages: ChatMessage[];
  search_results: SearchResult[];
  thread_id: string;
}

// Legacy types for backward compatibility (to be removed after migration)
export interface LegacyChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}