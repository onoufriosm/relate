/**
 * Thread service for managing chat threads
 * Provides thread creation, management, and URL synchronization
 */

import { httpService } from './httpService';
import { configService } from './config';
import { errorService, ErrorType } from './errorService';
import type { AppError } from './errorService';

export interface ThreadInfo {
  id: string;
  created_at: Date;
  updated_at: Date;
  title?: string;
  message_count?: number;
}

export interface CreateThreadRequest {
  title?: string;
  initialMessage?: string;
}

export interface CreateThreadResponse {
  thread_id: string;
  created_at: string;
  title?: string;
}

export interface ThreadListResponse {
  threads: ThreadInfo[];
  total: number;
  page: number;
  per_page: number;
}

class ThreadService {
  private static instance: ThreadService;
  private apiClient: ReturnType<typeof httpService.createApiClient>;
  private currentThreadId: string | null = null;

  private constructor() {
    const config = configService.getConfig();
    this.apiClient = httpService.createApiClient(config.backendUrl);
  }

  public static getInstance(): ThreadService {
    if (!ThreadService.instance) {
      ThreadService.instance = new ThreadService();
    }
    return ThreadService.instance;
  }

  /**
   * Create a new thread
   */
  public async createThread(request: CreateThreadRequest = {}): Promise<CreateThreadResponse> {
    try {
      const response = await this.apiClient.post<CreateThreadResponse>('/threads', request);
      
      const threadData = {
        ...response.data,
        created_at: response.data.created_at || new Date().toISOString()
      };

      this.currentThreadId = threadData.thread_id;
      
      return threadData;
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'create_thread',
        data: request
      });
    }
  }

  /**
   * Get thread information
   */
  public async getThread(threadId: string): Promise<ThreadInfo> {
    try {
      const response = await this.apiClient.get<ThreadInfo>(`/threads/${threadId}`);
      
      return {
        ...response.data,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at)
      };
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'get_thread',
        threadId
      });
    }
  }

  /**
   * List all threads
   */
  public async listThreads(
    page: number = 1,
    perPage: number = 20
  ): Promise<ThreadListResponse> {
    try {
      const response = await this.apiClient.get<ThreadListResponse>('/threads', {
        headers: {
          'X-Page': page.toString(),
          'X-Per-Page': perPage.toString()
        }
      });

      return {
        ...response.data,
        threads: response.data.threads.map(thread => ({
          ...thread,
          created_at: new Date(thread.created_at),
          updated_at: new Date(thread.updated_at)
        }))
      };
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'list_threads',
        page,
        perPage
      });
    }
  }

  /**
   * Delete a thread
   */
  public async deleteThread(threadId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/threads/${threadId}`);
      
      // Clear current thread if it was deleted
      if (this.currentThreadId === threadId) {
        this.currentThreadId = null;
      }
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'delete_thread',
        threadId
      });
    }
  }

  /**
   * Update thread metadata
   */
  public async updateThread(
    threadId: string,
    updates: Partial<Pick<ThreadInfo, 'title'>>
  ): Promise<ThreadInfo> {
    try {
      const response = await this.apiClient.patch<ThreadInfo>(`/threads/${threadId}`, updates);
      
      return {
        ...response.data,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at)
      };
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'update_thread',
        threadId,
        data: updates
      });
    }
  }

  /**
   * Get or create thread from URL
   */
  public async getOrCreateThreadFromUrl(): Promise<string> {
    const threadId = this.getThreadIdFromUrl();
    
    if (threadId) {
      try {
        // Verify thread exists
        await this.getThread(threadId);
        this.currentThreadId = threadId;
        return threadId;
      } catch (error) {
        // Thread doesn't exist, create new one
        console.warn('Thread not found, creating new thread:', error);
      }
    }

    // Create new thread
    const newThread = await this.createThread();
    this.updateUrlWithThreadId(newThread.thread_id);
    return newThread.thread_id;
  }

  /**
   * Get thread ID from current URL
   */
  public getThreadIdFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('thread') || null;
  }

  /**
   * Update URL with thread ID
   */
  public updateUrlWithThreadId(threadId: string): void {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('thread', threadId);
    
    // Use history.replaceState to update URL without triggering navigation
    window.history.replaceState({}, '', url.toString());
    
    this.currentThreadId = threadId;
  }

  /**
   * Clear thread ID from URL
   */
  public clearThreadIdFromUrl(): void {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    url.searchParams.delete('thread');
    
    window.history.replaceState({}, '', url.toString());
    this.currentThreadId = null;
  }

  /**
   * Get current thread ID
   */
  public getCurrentThreadId(): string | null {
    return this.currentThreadId;
  }

  /**
   * Set current thread ID
   */
  public setCurrentThreadId(threadId: string | null): void {
    this.currentThreadId = threadId;
  }

  /**
   * Check if thread exists
   */
  public async threadExists(threadId: string): Promise<boolean> {
    try {
      await this.getThread(threadId);
      return true;
    } catch (error) {
      const appError = error as AppError;
      // If it's a 404 error, thread doesn't exist
      if (appError.statusCode === 404) {
        return false;
      }
      // For other errors, rethrow
      throw error;
    }
  }

  /**
   * Generate thread title from message
   */
  public generateThreadTitle(message: string): string {
    // Take first 50 characters and add ellipsis if longer
    const title = message.trim().substring(0, 50);
    return title.length < message.trim().length ? `${title}...` : title;
  }

  /**
   * Search threads
   */
  public async searchThreads(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ThreadListResponse> {
    try {
      const response = await this.apiClient.get<ThreadListResponse>('/threads/search', {
        headers: {
          'X-Query': query,
          'X-Page': page.toString(),
          'X-Per-Page': perPage.toString()
        }
      });

      return {
        ...response.data,
        threads: response.data.threads.map(thread => ({
          ...thread,
          created_at: new Date(thread.created_at),
          updated_at: new Date(thread.updated_at)
        }))
      };
    } catch (error) {
      throw errorService.handleError(error as Error, {
        operation: 'search_threads',
        query,
        page,
        perPage
      });
    }
  }
}

// Export singleton instance
export const threadService = ThreadService.getInstance();
export default threadService;