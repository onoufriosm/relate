export interface SearchResult {
  title: string;
  url: string;
  content: string;
  query: string;
}

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
    searchResults?: SearchResult[];
  };
  searchResults?: SearchResult[];
  toolCallId?: string;
}

export interface InterruptData {
  message: string;
  type: 'human_review';
}

export interface StreamResponse {
  type: 'start' | 'status' | 'planning_summary' | 'planned_query' | 'summarization_start' | 'answer' | 'search_results' | 'tool_message' | 'interrupt' | 'error';
  content: string;
}

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