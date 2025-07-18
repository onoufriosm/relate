/**
 * Chat service for managing chat interactions
 * Provides high-level chat functionality including message sending, streaming, and state management
 */

import { streamService, StreamConnection } from './streamService';
import { stateService } from './stateService';
import { threadService } from './threadService';
import { httpService } from './httpService';
import { configService } from './config';
import { errorService } from './errorService';
import type { AppError } from './errorService';

// Import types from existing chat types
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

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  query: string;
}

export interface InterruptData {
  message: string;
  type: 'human_review';
}

export interface StreamResponse {
  type: 'start' | 'status' | 'planning_summary' | 'planned_query' | 'summarization_start' | 'answer' | 'search_results' | 'tool_message' | 'interrupt' | 'error';
  content: string;
  id?: string;
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

export interface SendMessageOptions {
  isResponseToInterrupt?: boolean;
  timeout?: number;
  onStreamEvent?: (event: StreamResponse) => void;
  onStatusUpdate?: (status: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onStart?: (content: any) => void;
  onStatus?: (content: any) => void;
  onPlanningSummary?: (content: any) => void;
  onPlannedQuery?: (content: any) => void;
  onSummarizationStart?: (content: any) => void;
  onAnswer?: (content: any) => void;
  onSearchResults?: (content: any) => void;
  onToolMessage?: (content: any) => void;
  onInterrupt?: (content: any) => void;
  onComplete?: (content: any) => void;
  onError?: (content: any) => void;
}

export interface ChatEventHandlers {
  onMessageUpdate?: (message: ChatMessage) => void;
  onStateChange?: (state: Partial<ChatState>) => void;
  onError?: (error: AppError) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onInterrupt?: (interrupt: InterruptData) => void;
}

class ChatService {
  private static instance: ChatService;
  private activeStream: StreamConnection | null = null;
  private eventHandlers: ChatEventHandlers = {};

  private constructor() {
    // Constructor left empty as we use direct fetch calls
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Send a message to the chat agent
   */
  public async sendMessage(
    message: string,
    threadId: string,
    options: SendMessageOptions = {}
  ): Promise<void> {
    try {
      // Validate input
      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (!threadId) {
        throw new Error('Thread ID is required');
      }

      // Notify stream start
      this.eventHandlers.onStreamStart?.();

      // Send message and establish stream
      const stream = await this.createMessageStream(message, threadId, options);
      this.activeStream = stream;

      // Handle stream events
      this.setupStreamHandlers(stream, options);

      // Start the stream
      await stream.connect();

    } catch (error) {
      const appError = errorService.handleError(error as Error, {
        operation: 'send_message',
        threadId,
        message: message.substring(0, 100) // Log first 100 chars
      });

      this.eventHandlers.onError?.(appError);
      throw appError;
    }
  }

  /**
   * Create message stream connection
   */
  private async createMessageStream(
    message: string,
    threadId: string,
    options: SendMessageOptions
  ): Promise<StreamConnection> {
    const config = configService.getConfig();
    
    // Prepare request body
    const requestBody = {
      message: message.trim(),
      thread_id: threadId,
      is_response_to_interrupt: options.isResponseToInterrupt || false
    };

    // Create stream URL
    const streamUrl = `${config.backendUrl}/query-agent`;
    
    // Create stream with POST method and body
    const stream = streamService.createStream(streamUrl, {
      timeout: options.timeout || config.streamingTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      method: 'POST',
      body: JSON.stringify(requestBody),
      autoReconnect: false // Disable auto-reconnect for chat streams to prevent loops
    });

    return stream;
  }

  /**
   * Setup stream event handlers
   */
  private setupStreamHandlers(stream: StreamConnection, options: SendMessageOptions): void {
    // Handle stream events
    stream.on('*', (event) => {
      try {
        const streamEvent: StreamResponse = {
          type: event.type as any,
          content: event.data,
          id: event.id
        };

        // Call the generic stream event handler
        options.onStreamEvent?.(streamEvent);
        
        // Call specific event handlers based on event type
        switch (streamEvent.type) {
          case 'start':
            options.onStart?.(streamEvent.content);
            break;
          case 'status':
            options.onStatus?.(streamEvent.content);
            break;
          case 'planning_summary':
            options.onPlanningSummary?.(streamEvent.content);
            break;
          case 'planned_query':
            options.onPlannedQuery?.(streamEvent.content);
            break;
          case 'summarization_start':
            options.onSummarizationStart?.(streamEvent.content);
            break;
          case 'answer':
            options.onAnswer?.(streamEvent.content);
            break;
          case 'search_results':
            options.onSearchResults?.(streamEvent.content);
            break;
          case 'tool_message':
            options.onToolMessage?.(streamEvent.content);
            break;
          case 'interrupt':
            options.onInterrupt?.(streamEvent.content);
            break;
          case 'error':
            options.onError?.(streamEvent.content);
            break;
        }
        
        this.handleStreamEvent(streamEvent);
      } catch (error) {
        console.error('Error handling stream event:', error);
      }
    });

    // Handle stream errors
    stream.onError((error) => {
      this.eventHandlers.onError?.(error);
    });

    // Handle stream connection
    stream.onConnect(() => {
      this.eventHandlers.onStreamStart?.();
    });

    // Handle stream close
    stream.onClose(() => {
      this.activeStream = null;
      this.eventHandlers.onStreamEnd?.();
      options.onComplete?.('stream_complete');
    });
  }

  /**
   * Handle individual stream events
   */
  private handleStreamEvent(event: StreamResponse): void {
    switch (event.type) {
      case 'start':
        this.eventHandlers.onStateChange?.({
          isLoading: true,
          statusMessages: [event.content]
        });
        break;

      case 'status':
        this.eventHandlers.onStateChange?.({
          statusMessages: [event.content]
        });
        break;

      case 'planning_summary':
        this.eventHandlers.onStateChange?.({
          statusMessages: [event.content],
          plannedQueries: []
        });
        break;

      case 'planned_query':
        this.eventHandlers.onStateChange?.({
          plannedQueries: [event.content]
        });
        break;

      case 'summarization_start':
        this.eventHandlers.onStateChange?.({
          isInSummarization: true,
          showStatusInline: false
        });
        break;

      case 'answer':
        this.eventHandlers.onStateChange?.({
          isTyping: true
        });
        break;

      case 'interrupt':
        try {
          const interruptData: InterruptData = {
            message: event.content || 'Please review the planned queries',
            type: 'human_review'
          };

          this.eventHandlers.onInterrupt?.(interruptData);
          this.eventHandlers.onStateChange?.({
            isLoading: false,
            isWaitingForFeedback: true,
            currentInterrupt: interruptData
          });
        } catch (error) {
          console.error('Error parsing interrupt data:', error);
        }
        break;

      case 'error':
        const appError = errorService.createError(
          new Error(event.content),
          'STREAM' as any
        );
        this.eventHandlers.onError?.(appError);
        break;
    }
  }

  /**
   * Stop current stream
   */
  public stopStream(): void {
    if (this.activeStream) {
      this.activeStream.close();
      this.activeStream = null;
    }
  }

  /**
   * Check if stream is active
   */
  public isStreamActive(): boolean {
    return this.activeStream?.isStreamConnected() || false;
  }

  /**
   * Load thread messages
   */
  public async loadThreadMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const state = await stateService.getThreadState(threadId);
      
      return state.messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
        status: 'sent' as const,
        searchResults: msg.search_results
      }));
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'load_thread_messages',
        threadId
      });
    }
  }

  /**
   * Get thread search results
   */
  public async getThreadSearchResults(threadId: string): Promise<SearchResult[]> {
    try {
      return await stateService.getSearchResults(threadId);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_thread_search_results',
        threadId
      });
    }
  }

  /**
   * Create new thread
   */
  public async createThread(initialMessage?: string): Promise<string> {
    try {
      const thread = await threadService.createThread({
        initialMessage,
        title: initialMessage ? threadService.generateThreadTitle(initialMessage) : undefined
      });
      
      return thread.thread_id;
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'create_thread',
        initialMessage: initialMessage?.substring(0, 100)
      });
    }
  }

  /**
   * Get or create thread from URL
   */
  public async getOrCreateThreadFromUrl(): Promise<string> {
    try {
      return await threadService.getOrCreateThreadFromUrl();
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_or_create_thread_from_url'
      });
    }
  }

  /**
   * Update URL with thread ID
   */
  public updateUrlWithThreadId(threadId: string): void {
    threadService.updateUrlWithThreadId(threadId);
  }

  /**
   * Generate message ID
   */
  public generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register event handlers
   */
  public setEventHandlers(handlers: ChatEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Clear event handlers
   */
  public clearEventHandlers(): void {
    this.eventHandlers = {};
  }

  /**
   * Get current thread ID from URL
   */
  public getCurrentThreadId(): string | null {
    return threadService.getThreadIdFromUrl();
  }

  /**
   * Check if thread exists
   */
  public async threadExists(threadId: string): Promise<boolean> {
    try {
      return await threadService.threadExists(threadId);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'thread_exists',
        threadId
      });
    }
  }

  /**
   * Clear thread state
   */
  public async clearThreadState(threadId: string): Promise<void> {
    try {
      await stateService.clearThreadState(threadId);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'clear_thread_state',
        threadId
      });
    }
  }

  /**
   * Preload thread data
   */
  public async preloadThread(threadId: string): Promise<void> {
    try {
      await stateService.preloadThreadState(threadId);
    } catch (error) {
      // Ignore preload errors
      if (configService.isDebug()) {
        console.warn('Failed to preload thread:', error);
      }
    }
  }

  /**
   * Get thread info
   */
  public async getThreadInfo(threadId: string) {
    try {
      return await threadService.getThread(threadId);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_thread_info',
        threadId
      });
    }
  }

  /**
   * Update thread title
   */
  public async updateThreadTitle(threadId: string, title: string): Promise<void> {
    try {
      await threadService.updateThread(threadId, { title });
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'update_thread_title',
        threadId,
        title
      });
    }
  }

  /**
   * Delete thread
   */
  public async deleteThread(threadId: string): Promise<void> {
    try {
      await threadService.deleteThread(threadId);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'delete_thread',
        threadId
      });
    }
  }

  /**
   * List user threads
   */
  public async listThreads(page: number = 1, perPage: number = 20) {
    try {
      return await threadService.listThreads(page, perPage);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'list_threads',
        page,
        perPage
      });
    }
  }

  /**
   * Search threads
   */
  public async searchThreads(query: string, page: number = 1, perPage: number = 20) {
    try {
      return await threadService.searchThreads(query, page, perPage);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'search_threads',
        query,
        page,
        perPage
      });
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopStream();
    this.clearEventHandlers();
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();
export default chatService;