/**
 * Base HTTP service for making API requests
 * Provides centralized HTTP client with retry logic, error handling, and request/response interceptors
 */

import { configService } from './config';
import { errorService, ErrorType } from './errorService';
import type { AppError } from './errorService';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface RequestInterceptor {
  (url: string, options: HttpRequestOptions): Promise<{ url: string; options: HttpRequestOptions }> | { url: string; options: HttpRequestOptions };
}

export interface ResponseInterceptor {
  (response: HttpResponse): Promise<HttpResponse> | HttpResponse;
}

class HttpService {
  private static instance: HttpService;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  private constructor() {}

  public static getInstance(): HttpService {
    if (!HttpService.instance) {
      HttpService.instance = new HttpService();
    }
    return HttpService.instance;
  }

  /**
   * Make an HTTP request with retry logic and error handling
   */
  public async request<T = any>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const config = configService.getConfig();
    
    const finalOptions: HttpRequestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || config.apiTimeout,
      retryAttempts: options.retryAttempts ?? config.maxRetryAttempts,
      retryDelay: options.retryDelay || config.retryDelay,
      ...options
    };

    // Apply request interceptors
    let interceptedUrl = url;
    let interceptedOptions = finalOptions;
    
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(interceptedUrl, interceptedOptions);
      interceptedUrl = result.url;
      interceptedOptions = result.options;
    }

    return this.executeRequest<T>(interceptedUrl, interceptedOptions);
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const maxAttempts = options.retryAttempts || 0;
    let lastError: AppError | null = null;

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.performRequest<T>(url, options);
        
        // Apply response interceptors
        let interceptedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          interceptedResponse = await interceptor(interceptedResponse);
        }
        
        return interceptedResponse;
      } catch (error) {
        lastError = errorService.handleError(error as Error, {
          operation: 'http_request',
          url,
          method: options.method
        });

        // Don't retry if it's not a retryable error or if it's the last attempt
        if (!lastError.retryable || attempt === maxAttempts) {
          throw lastError;
        }

        // Wait before retry
        if (options.retryDelay && options.retryDelay > 0) {
          await this.delay(options.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest<T>(
    url: string,
    options: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    // Use provided signal or create new one
    const signal = options.signal || controller.signal;

    try {
      const requestInit: RequestInit = {
        method: options.method,
        headers: options.headers,
        signal,
        body: options.body ? JSON.stringify(options.body) : undefined
      };

      const response = await fetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw errorService.createError(
            new Error('Request timeout'),
            ErrorType.TIMEOUT,
            { url, method: options.method }
          );
        }
        
        throw errorService.createError(
          error,
          ErrorType.NETWORK,
          { url, method: options.method }
        );
      }
      
      throw error;
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text() as T;
    }
    
    // For other content types, return as blob
    return await response.blob() as T;
  }

  /**
   * Convenience method for GET requests
   */
  public async get<T = any>(
    url: string,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  public async post<T = any>(
    url: string,
    data?: any,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body: data });
  }

  /**
   * Convenience method for PUT requests
   */
  public async put<T = any>(
    url: string,
    data?: any,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body: data });
  }

  /**
   * Convenience method for DELETE requests
   */
  public async delete<T = any>(
    url: string,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Convenience method for PATCH requests
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: data });
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Remove request interceptor
   */
  public removeRequestInterceptor(interceptor: RequestInterceptor): void {
    const index = this.requestInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.requestInterceptors.splice(index, 1);
    }
  }

  /**
   * Remove response interceptor
   */
  public removeResponseInterceptor(interceptor: ResponseInterceptor): void {
    const index = this.responseInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.responseInterceptors.splice(index, 1);
    }
  }

  /**
   * Clear all interceptors
   */
  public clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Create API client with base URL
   */
  public createApiClient(baseUrl: string) {
    return {
      get: <T = any>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
        this.get<T>(`${baseUrl}${path}`, options),
      
      post: <T = any>(path: string, data?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
        this.post<T>(`${baseUrl}${path}`, data, options),
      
      put: <T = any>(path: string, data?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
        this.put<T>(`${baseUrl}${path}`, data, options),
      
      delete: <T = any>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
        this.delete<T>(`${baseUrl}${path}`, options),
      
      patch: <T = any>(path: string, data?: any, options?: Omit<HttpRequestOptions, 'method' | 'body'>) =>
        this.patch<T>(`${baseUrl}${path}`, data, options)
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const httpService = HttpService.getInstance();
export default httpService;