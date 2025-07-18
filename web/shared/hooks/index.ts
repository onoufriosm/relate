// Main chat hook - orchestrates all chat functionality
export { useChat } from './useChat';

// Focused hooks for specific responsibilities
export { useMessages } from './useMessages';
export { useStreamingResponse } from './useStreamingResponse';
export { useTypingAnimation } from './useTypingAnimation';
export { useChatState } from './useChatState';

// Hook types
export type { UseMessagesReturn } from './useMessages';
export type { UseStreamingResponseReturn, UseStreamingResponseOptions } from './useStreamingResponse';
export type { UseTypingAnimationReturn, UseTypingAnimationOptions } from './useTypingAnimation';
export type { UseChatStateReturn } from './useChatState';
export type { UseChatReturn } from './useChat';