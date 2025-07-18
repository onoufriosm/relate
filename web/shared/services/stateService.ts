/**
 * State service for managing thread state and search results
 * Provides state restoration, search result management, and thread data synchronization
 */

import { httpService } from './httpService';
import { configService } from './config';
import { errorService } from './errorService';
import type { AppError } from './errorService';

// Import types from the existing state and chat types
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  query: string;
}

export interface StateMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: string;
  search_results?: SearchResult[];
}

export interface StateResponse {
  messages: StateMessage[];
  search_results: SearchResult[];
  thread_id: string;
  metadata?: {
    created_at?: string;
    updated_at?: string;
    title?: string;
    message_count?: number;
  };
}

export interface StateUpdateRequest {
  thread_id: string;
  message?: StateMessage;
  search_results?: SearchResult[];
  metadata?: Record<string, any>;
}

class StateService {
  private static instance: StateService;
  private apiClient: ReturnType<typeof httpService.createApiClient>;
  private stateCache: Map<string, StateResponse> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    const config = configService.getConfig();
    this.apiClient = httpService.createApiClient(config.backendUrl);
  }

  public static getInstance(): StateService {
    if (!StateService.instance) {
      StateService.instance = new StateService();
    }
    return StateService.instance;
  }

  /**
   * Get complete thread state including messages and search results
   */
  public async getThreadState(threadId: string, useCache: boolean = true): Promise<StateResponse> {
    try {
      // Check cache first
      if (useCache && this.isStateCached(threadId)) {
        const cached = this.stateCache.get(threadId);
        if (cached) {
          return cached;
        }
      }

      const response = await this.apiClient.get<StateResponse>(`/state/${threadId}`);
      
      const stateData: StateResponse = {
        ...response.data,
        messages: response.data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString()
        })),
        search_results: response.data.search_results || []
      };

      // Cache the response
      this.cacheState(threadId, stateData);
      
      return stateData;
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_thread_state',
        threadId
      });
    }
  }

  /**
   * Get search results for a thread
   */
  public async getSearchResults(threadId: string, useCache: boolean = true): Promise<SearchResult[]> {
    try {
      const state = await this.getThreadState(threadId, useCache);
      return state.search_results || [];
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_search_results',
        threadId
      });
    }
  }

  /**
   * Get messages for a thread
   */
  public async getMessages(threadId: string, useCache: boolean = true): Promise<StateMessage[]> {
    try {
      const state = await this.getThreadState(threadId, useCache);
      return state.messages || [];
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_messages',
        threadId
      });
    }
  }

  /**
   * Update thread state
   */
  public async updateThreadState(request: StateUpdateRequest): Promise<StateResponse> {
    try {
      const response = await this.apiClient.post<StateResponse>('/state/update', request);
      
      const stateData: StateResponse = {
        ...response.data,
        messages: response.data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString()
        })),
        search_results: response.data.search_results || []
      };

      // Update cache
      this.cacheState(request.thread_id, stateData);
      
      return stateData;
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'update_thread_state',
        threadId: request.thread_id,
        data: request
      });
    }
  }

  /**
   * Clear thread state
   */
  public async clearThreadState(threadId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/state/${threadId}`);
      
      // Clear from cache
      this.stateCache.delete(threadId);
      this.cacheExpiry.delete(threadId);
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'clear_thread_state',
        threadId
      });
    }
  }

  /**
   * Get thread metadata
   */
  public async getThreadMetadata(threadId: string): Promise<Record<string, any>> {
    try {
      const response = await this.apiClient.get<Record<string, any>>(`/state/${threadId}/metadata`);
      return response.data || {};
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_thread_metadata',
        threadId
      });
    }
  }

  /**
   * Update thread metadata
   */
  public async updateThreadMetadata(
    threadId: string,
    metadata: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const response = await this.apiClient.patch<Record<string, any>>(
        `/state/${threadId}/metadata`,
        metadata
      );
      
      // Update cache if state is cached
      if (this.isStateCached(threadId)) {
        const cached = this.stateCache.get(threadId);
        if (cached) {
          cached.metadata = { ...cached.metadata, ...metadata };
        }
      }
      
      return response.data || {};
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'update_thread_metadata',
        threadId,
        data: metadata
      });
    }
  }

  /**
   * Check if thread has messages
   */
  public async hasMessages(threadId: string): Promise<boolean> {
    try {
      const messages = await this.getMessages(threadId);
      return messages.length > 0;
    } catch (error) {
      // If thread doesn't exist, it has no messages
      const appError = error as AppError;
      if (appError.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if thread has search results
   */
  public async hasSearchResults(threadId: string): Promise<boolean> {
    try {
      const searchResults = await this.getSearchResults(threadId);
      return searchResults.length > 0;
    } catch (error) {
      // If thread doesn't exist, it has no search results
      const appError = error as AppError;
      if (appError.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get last message from thread
   */
  public async getLastMessage(threadId: string): Promise<StateMessage | null> {
    try {
      const messages = await this.getMessages(threadId);
      return messages.length > 0 ? messages[messages.length - 1] : null;
    } catch (error) {
      const appError = error as AppError;
      if (appError.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get message count for thread
   */
  public async getMessageCount(threadId: string): Promise<number> {
    try {
      const messages = await this.getMessages(threadId);
      return messages.length;
    } catch (error) {
      const appError = error as AppError;
      if (appError.statusCode === 404) {
        return 0;
      }
      throw error;
    }
  }

  /**
   * Cache state data
   */
  private cacheState(threadId: string, state: StateResponse): void {
    this.stateCache.set(threadId, state);
    this.cacheExpiry.set(threadId, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Check if state is cached and not expired
   */
  private isStateCached(threadId: string): boolean {
    const expiry = this.cacheExpiry.get(threadId);
    if (!expiry || Date.now() > expiry) {
      // Clean up expired cache
      this.stateCache.delete(threadId);
      this.cacheExpiry.delete(threadId);
      return false;
    }
    return this.stateCache.has(threadId);
  }

  /**
   * Invalidate cache for thread
   */
  public invalidateCache(threadId: string): void {
    this.stateCache.delete(threadId);
    this.cacheExpiry.delete(threadId);
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.stateCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache size
   */
  public getCacheSize(): number {
    return this.stateCache.size;
  }

  /**
   * Clean up expired cache entries
   */
  public cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [threadId, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.stateCache.delete(threadId);
        this.cacheExpiry.delete(threadId);
      }
    }
  }

  /**
   * Preload thread state
   */
  public async preloadThreadState(threadId: string): Promise<void> {
    try {
      await this.getThreadState(threadId, false); // Force fresh load
    } catch (error) {
      // Ignore errors during preload
      if (configService.isDebug()) {
        console.warn('Failed to preload thread state:', error);
      }
    }
  }
}

// Export singleton instance
export const stateService = StateService.getInstance();
export default stateService;