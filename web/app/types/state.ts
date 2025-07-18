export interface SearchResult {
  title: string;
  url: string;
  content: string;
  query: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  search_results?: SearchResult[];
}

export interface StateResponse {
  messages: ChatMessage[];
  search_results: SearchResult[];
  thread_id: string;
}

