import { useEffect, useState, useCallback } from 'react';
import type { StateResponse } from '~/types/state';
import type { ChatMessage } from '~/types/chat';
import StateService from '~/services/stateService';

interface StateRestoreOptions {
  onMessagesLoaded?: (messages: ChatMessage[]) => void;
}

export interface UseStateRestoreReturn {
  state: StateResponse | null;
  isLoading: boolean;
  error: string | null;
  hasMessages: boolean;
  hasSearchResults: boolean;
  restoreState: () => Promise<void>;
}

export function useStateRestore(threadId?: string, options?: StateRestoreOptions): UseStateRestoreReturn {
  const [state, setState] = useState<StateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restoreState = useCallback(async () => {
    if (!threadId) {
      setState(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await StateService.getThreadState(threadId);
      setState(response);
      
      // Convert backend messages to frontend chat messages
      if (response.messages && response.messages.length > 0 && options?.onMessagesLoaded) {
        
        const chatMessages: ChatMessage[] = response.messages.map((msg: any, index: number) => {
          const baseMessage: ChatMessage = {
            id: msg.id || `restored_${index}`,
            type: msg.type as 'user' | 'assistant' | 'tool',
            content: msg.content,
            timestamp: new Date(), // Add timestamp for restored messages
            status: 'sent'
          };

          // Include search results if they exist in the message (for tool messages)
          if (msg.search_results && msg.search_results.length > 0) {
            baseMessage.searchResults = msg.search_results;
          }

          return baseMessage;
        });
        
        options.onMessagesLoaded(chatMessages);
      }
    } catch (err) {
      console.error('Error restoring state:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore state');
      setState(null);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, options?.onMessagesLoaded]);

  useEffect(() => {
    restoreState();
  }, [restoreState]);

  return {
    state,
    isLoading,
    error,
    hasMessages: Boolean(state?.messages && state.messages.length > 0),
    hasSearchResults: Boolean(state?.search_results && state.search_results.length > 0),
    restoreState // Expose function for manual refresh
  };
}