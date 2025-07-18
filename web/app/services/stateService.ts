// Re-export from shared services for backward compatibility
export { StateService } from '~/shared/services';

// Re-export the singleton instance as default
export { stateService as default } from '~/shared/services';

// Re-export types for backward compatibility
export type { 
  ThreadState, 
  MessageState, 
  SearchResult 
} from '~/shared/services';