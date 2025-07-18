/**
 * Service layer exports - centralized access to all services
 * This provides a clean API for consuming services throughout the application
 */

// Core Services
export { default as ConfigService } from './config';
export { default as ErrorService } from './errorService';
export { default as HttpService } from './httpService';

// Business Services
export { default as ChatService } from './chatService';
export { default as StateService } from './stateService';
export { default as ThreadService } from './threadService';
export { default as StreamService } from './streamService';

// Service Instances (Singletons)
export { configService } from './config';
export { errorService } from './errorService';
export { httpService } from './httpService';
export { chatService } from './chatService';
export { stateService } from './stateService';
export { threadService } from './threadService';
export { streamService } from './streamService';

// Types from different services
export type {
  AppError,
  ErrorContext,
  ErrorType
} from './errorService';

export type {
  ChatMessage,
  SearchResult,
  InterruptData,
  StreamResponse,
  SendMessageOptions,
  ChatEventHandlers
} from './chatService';

// Re-export from individual services
export * from './config';
export * from './errorService';
export * from './httpService';
export * from './chatService';
export * from './stateService';
export * from './threadService';
export * from './streamService';