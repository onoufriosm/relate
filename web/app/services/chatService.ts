// Re-export from shared services for backward compatibility
export { ChatService } from '~/shared/services';

// Re-export the singleton instance as default
export { chatService as default } from '~/shared/services';

// Re-export types for backward compatibility
export type { 
  ChatMessage, 
  SearchResult, 
  InterruptData, 
  StreamResponse,
  SendMessageOptions,
  ChatEventHandlers 
} from '~/shared/services';