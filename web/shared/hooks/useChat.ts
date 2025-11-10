import { useCallback, useRef } from 'react';
import type { ChatMessage, SearchResult } from '~/types/chat';
import { useMessages } from './useMessages';
import { useChatState } from './useChatState';
import { useTypingAnimation } from './useTypingAnimation';
import { useStreamingResponse } from './useStreamingResponse';
import { useUrlThreadId } from '~/hooks/useUrlThreadId';
import { useStateRestore } from '~/hooks/useStateRestore';

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  statusMessages: string[];
  plannedQueries: string[];
  isTyping: boolean;
  showStatusInline: boolean;
  isInSummarization: boolean;
  isWaitingForFeedback: boolean;
  currentInterrupt?: any;
  searchResults: SearchResult[];
  sendMessage: (content: string, isResponseToInterrupt?: boolean) => Promise<void>;
  threadId: string;
  isCreatingThread: boolean;
  threadError: string | null;
}

export function useChat(): UseChatReturn {
  const { messages, addMessage, updateMessage, setMessages } = useMessages();
  const {
    state,
    setLoading,
    addStatusMessage,
    setStatusMessages,
    addPlannedQuery,
    setPlannedQueries,
    clearPlannedQueries,
    setShowStatusInline,
    setInSummarization,
    setWaitingForFeedback,
    setCurrentInterrupt,
    addSearchResults,
    setSearchResults,
    resetState: _resetState,
  } = useChatState();

  // Use URL-based thread ID management
  const { threadId, isCreatingThread, error: threadError } = useUrlThreadId();

  // Refs for tracking current state
  const currentUserMessageIdRef = useRef<string>('');
  const currentStatusMessagesRef = useRef<string[]>([]);
  const currentPlannedQueriesRef = useRef<string[]>([]);
  const currentMessageIdRef = useRef<string>('');
  const currentResponseRef = useRef<string>('');
  const streamedContentLengthRef = useRef<number>(0);

  // Callback to load restored messages into chat state
  const handleMessagesLoaded = useCallback((restoredMessages: ChatMessage[]) => {
    setMessages(restoredMessages);
    
    // Extract search results from restored messages
    const allSearchResults: SearchResult[] = [];
    restoredMessages.forEach(message => {
      if (message.type === 'tool' && message.searchResults) {
        allSearchResults.push(...message.searchResults);
      }
    });
    setSearchResults(allSearchResults);
  }, [setMessages, setSearchResults]);

  // Restore thread state from backend
  useStateRestore(threadId, {
    onMessagesLoaded: handleMessagesLoaded
  });

  // Typing animation for assistant messages
  const typingAnimation = useTypingAnimation({
    onContentUpdate: (content: string) => {
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, {
          content,
          status: 'sent',
        });
      }
    },
  });

  // Streaming response handler
  const streamingResponse = useStreamingResponse({
    onStart: (content) => {
      setStatusMessages([content]);
    },
    onStatus: (content) => {
      currentStatusMessagesRef.current.push(content);
      addStatusMessage(content);
      
      // Update user message with status data
      if (currentUserMessageIdRef.current) {
        updateMessage(currentUserMessageIdRef.current, {
          statusData: {
            statusMessages: currentStatusMessagesRef.current,
            plannedQueries: currentPlannedQueriesRef.current,
            isCompleted: false,
          },
        });
      }
    },
    onPlanningSummary: (content) => {
      currentStatusMessagesRef.current.push(content);
      addStatusMessage(content);
      clearPlannedQueries();
    },
    onPlannedQuery: (content) => {
      currentPlannedQueriesRef.current.push(content);
      addPlannedQuery(content);
      
      // Update user message with planned query data
      if (currentUserMessageIdRef.current) {
        updateMessage(currentUserMessageIdRef.current, {
          statusData: {
            statusMessages: currentStatusMessagesRef.current,
            plannedQueries: currentPlannedQueriesRef.current,
            isCompleted: false,
          },
        });
      }
    },
    onSummarizationStart: (content) => {
      // Keep the message for status indicator and continue showing it during summarization prep
      currentStatusMessagesRef.current.push(content);
      setInSummarization(true);
      addStatusMessage(content);
      
      // Create assistant message with loading state
      currentResponseRef.current = '';
      streamedContentLengthRef.current = 0;
      const assistantMessageId = addMessage({
        type: 'assistant',
        content: '',
        status: 'sending',
      });
      currentMessageIdRef.current = assistantMessageId;
    },
    onAnswer: (content) => {
      // Hide status indicator when first answer token arrives (searches are done)
      setShowStatusInline(false);
      
      // Mark user message status as completed and attach search results
      if (currentUserMessageIdRef.current) {
        updateMessage(currentUserMessageIdRef.current, {
          statusData: {
            statusMessages: currentStatusMessagesRef.current,
            plannedQueries: currentPlannedQueriesRef.current,
            isCompleted: true,
            searchResults: state.searchResults, // Attach search results for display
          },
        });
      }
      
      // Create assistant message if it doesn't exist (for direct answers)
      if (!currentMessageIdRef.current) {
        currentResponseRef.current = '';
        streamedContentLengthRef.current = 0;
        const assistantMessageId = addMessage({
          type: 'assistant',
          content: '',
          status: 'sending',
        });
        currentMessageIdRef.current = assistantMessageId;
      }
      
      const incomingContent = typeof content === 'string' ? content : String(content ?? '');
      if (incomingContent.length === 0) {
        return;
      }

      const existingContent = currentResponseRef.current;
      const existingLength = streamedContentLengthRef.current;
      const looksLikeCumulativeUpdate =
        existingLength > 0
          ? incomingContent.length >= existingLength &&
            incomingContent.startsWith(existingContent.slice(0, existingLength))
          : incomingContent.length >= existingLength;

      if (looksLikeCumulativeUpdate) {
        if (incomingContent.length === existingLength) {
          return;
        }
        currentResponseRef.current = incomingContent;
        streamedContentLengthRef.current = incomingContent.length;
        typingAnimation.updateStreamContent(currentResponseRef.current);
        return;
      }

      currentResponseRef.current = existingContent + incomingContent;
      streamedContentLengthRef.current = currentResponseRef.current.length;
      typingAnimation.updateStreamContent(currentResponseRef.current);
    },
    onSearchResults: (content) => {
      // Add search results to the global state
      if (Array.isArray(content) && content.length > 0) {
        addSearchResults(content);
        
        // Create one tool message per search operation (all results from this event share the same query)
        const firstResult = content[0];
        if (firstResult && firstResult.query) {
          const toolMessage: ChatMessage = {
            id: `tool_${Date.now()}`,
            type: 'tool',
            content: `Search: ${firstResult.query}`,
            timestamp: new Date(),
            status: 'sent',
            searchResults: content, // All results from this search operation
            toolCallId: `search_${Date.now()}`
          };
          
          // Add tool message to message array
          addMessage(toolMessage);
        }
      }
    },
    onToolMessage: (content) => {
      // Create tool message object for consistency with thread restore
      if (content && typeof content === 'object') {
        const toolMessage: ChatMessage = {
          id: content.id || `tool_${Date.now()}`,
          type: 'tool',
          content: content.content || '',
          timestamp: content.timestamp ? new Date(content.timestamp) : new Date(),
          status: 'sent',
          searchResults: content.search_results || [],
          toolCallId: content.tool_call_id
        };
        
        // Add tool message to message array
        addMessage(toolMessage);
        
        // Also add search results to global state for backward compatibility
        if (content.search_results && Array.isArray(content.search_results)) {
          addSearchResults(content.search_results);
        }
      }
    },
    onInterrupt: (content) => {
      setWaitingForFeedback(true);
      setCurrentInterrupt({
        message: content || 'Please review the planned queries',
        type: 'human_review'
      });
      addStatusMessage('Waiting for your review...');
    },
    onError: (error) => {
      console.error('Error in streaming response:', error);
      
      // Create error message if no assistant message exists
      if (!currentMessageIdRef.current) {
        const assistantMessageId = addMessage({
          type: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
          status: 'error',
        });
        currentMessageIdRef.current = assistantMessageId;
      } else {
        updateMessage(currentMessageIdRef.current, {
          content: 'Sorry, I encountered an error processing your request.',
          status: 'error',
        });
      }
    },
  });

  const sendMessage = useCallback(async (content: string, isResponseToInterrupt: boolean = false) => {
    if (!content.trim() || state.isLoading || !threadId) return;

    // If responding to interrupt, clear interrupt state and start loading
    if (isResponseToInterrupt) {
      setLoading(true);
      setWaitingForFeedback(false);
      setCurrentInterrupt(undefined);
    }

    let userMessageId = '';
    
    // For interrupt responses, handle differently based on content
    if (isResponseToInterrupt) {
      const trimmedContent = content.trim().toLowerCase();
      
      if (trimmedContent === 'approve' || trimmedContent === 'skip') {
        // For approve/skip, don't add a message bubble - just update status
        const lastUserMessage = messages.find(msg => msg.type === 'user' && !msg.statusData?.isCompleted);
        if (lastUserMessage) {
          userMessageId = lastUserMessage.id;
          updateMessage(lastUserMessage.id, {
            statusData: {
              ...lastUserMessage.statusData!,
              statusMessages: [...(lastUserMessage.statusData?.statusMessages || []), 
                `✓ User ${trimmedContent === 'approve' ? 'approved' : 'skipped'} queries`],
              isCompleted: false, // Keep as not completed so progress can continue
            }
          });
        }
      } else {
        // For custom feedback, show as a message bubble
        userMessageId = addMessage({
          type: 'user',
          content: content.trim(),
          statusData: {
            statusMessages: [],
            plannedQueries: [],
            isCompleted: false,
          },
        });
      }
    } else {
      // Normal message - add user message
      userMessageId = addMessage({
        type: 'user',
        content: content.trim(),
        statusData: {
          statusMessages: [],
          plannedQueries: [],
          isCompleted: false,
        },
      });
    }

    // Track current user message for status updates
    currentUserMessageIdRef.current = userMessageId;
    currentStatusMessagesRef.current = [];
    currentPlannedQueriesRef.current = [];

    currentMessageIdRef.current = '';
    currentResponseRef.current = '';
    streamedContentLengthRef.current = 0;
    
    // Stop any existing typing animation
    typingAnimation.stopTyping();

    // Reset state for new message (but keep search results if this is continuing a conversation)
    setLoading(true);
    setStatusMessages([]);
    setPlannedQueries([]);
    setShowStatusInline(true);
    setInSummarization(false);
    
    // Only clear search results if this is not a response to interrupt
    if (!isResponseToInterrupt) {
      setSearchResults([]);
    }

    try {
      await streamingResponse.sendMessage(content.trim(), threadId, isResponseToInterrupt);
      
      // Finalize the assistant message
      typingAnimation.stopTyping();
      
      // Update final message if we have one
      if (currentMessageIdRef.current) {
        updateMessage(currentMessageIdRef.current, {
          content: currentResponseRef.current,
          status: 'sent',
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling is done in the streaming response onError callback
    } finally {
      currentStatusMessagesRef.current = [];
      currentPlannedQueriesRef.current = [];
      setLoading(false);
      setStatusMessages([]);
      setPlannedQueries([]);
      // Don't reset showStatusInline - let it stay false to keep search sources visible
      setInSummarization(false);
    }
  }, [
    state.isLoading,
    threadId,
    messages,
    addMessage,
    updateMessage,
    setLoading,
    addStatusMessage,
    setStatusMessages,
    addPlannedQuery,
    setPlannedQueries,
    clearPlannedQueries,
    setShowStatusInline,
    setInSummarization,
    setWaitingForFeedback,
    setCurrentInterrupt,
    setSearchResults,
    addSearchResults,
    typingAnimation,
    streamingResponse,
  ]);

  return {
    messages,
    isLoading: state.isLoading,
    statusMessages: state.statusMessages,
    plannedQueries: state.plannedQueries,
    isTyping: typingAnimation.isTyping,
    showStatusInline: state.showStatusInline,
    isInSummarization: state.isInSummarization,
    isWaitingForFeedback: state.isWaitingForFeedback,
    currentInterrupt: state.currentInterrupt,
    searchResults: state.searchResults,
    sendMessage,
    threadId,
    isCreatingThread,
    threadError,
  };
}