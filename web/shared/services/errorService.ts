/**
 * Error handling service for managing application errors
 * Provides centralized error handling, logging, and user-friendly error messages
 */

import { configService } from './config';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  STREAM = 'STREAM',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;
  userMessage: string;
}

export interface ErrorContext {
  operation?: string;
  threadId?: string;
  messageId?: string;
  streamId?: string;
  url?: string;
  method?: string;
  data?: any;
  message?: string;
  initialMessage?: string;
  title?: string;
  page?: number;
  query?: string;
  perPage?: number;
}

class ErrorService {
  private static instance: ErrorService;
  private errorHandlers: Map<ErrorType, (error: AppError) => void> = new Map();

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Create a structured error from various input types
   */
  public createError(
    error: Error | string | AppError,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: ErrorContext
  ): AppError {
    // If it's already an AppError, return it
    if (this.isAppError(error)) {
      return error;
    }

    const originalError = error instanceof Error ? error : new Error(String(error));
    const message = originalError.message || 'An unknown error occurred';
    
    // Determine error type and details based on the error
    const errorDetails = this.analyzeError(originalError);
    const finalType = type !== ErrorType.UNKNOWN ? type : errorDetails.type;
    
    return {
      type: finalType,
      message,
      originalError,
      statusCode: errorDetails.statusCode,
      timestamp: new Date(),
      context,
      retryable: this.isRetryable(finalType, errorDetails.statusCode),
      userMessage: this.getUserMessage(finalType, message, errorDetails.statusCode)
    };
  }

  /**
   * Handle errors with appropriate logging and user feedback
   */
  public handleError(error: string | Error | AppError, context?: ErrorContext): AppError {
    const appError = this.createError(error, ErrorType.UNKNOWN, context);
    
    // Log error if in debug mode
    if (configService.isDebug()) {
      console.error('Error handled:', {
        type: appError.type,
        message: appError.message,
        context: appError.context,
        originalError: appError.originalError,
        timestamp: appError.timestamp
      });
    }

    // Call registered error handlers
    const handler = this.errorHandlers.get(appError.type);
    if (handler) {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    return appError;
  }

  /**
   * Register error handlers for specific error types
   */
  public registerErrorHandler(type: ErrorType, handler: (error: AppError) => void): void {
    this.errorHandlers.set(type, handler);
  }

  /**
   * Handle network errors specifically
   */
  public handleNetworkError(error: Error, context?: ErrorContext): AppError {
    return this.handleError(error, { ...context, operation: 'network_request' });
  }

  /**
   * Handle streaming errors specifically
   */
  public handleStreamError(error: Error, context?: ErrorContext): AppError {
    const appError = this.createError(error, ErrorType.STREAM, context);
    return this.handleError(appError);
  }

  /**
   * Handle timeout errors specifically
   */
  public handleTimeoutError(operation: string, context?: ErrorContext): AppError {
    const error = new Error(`Operation timed out: ${operation}`);
    const appError = this.createError(error, ErrorType.TIMEOUT, context);
    return this.handleError(appError);
  }

  /**
   * Check if an error is retryable
   */
  public isRetryable(type: ErrorType, statusCode?: number): boolean {
    // Network errors are generally retryable
    if (type === ErrorType.NETWORK) {
      return true;
    }

    // Timeout errors are retryable
    if (type === ErrorType.TIMEOUT) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (statusCode && statusCode >= 500) {
      return true;
    }

    // Rate limiting (429) is retryable
    if (statusCode === 429) {
      return true;
    }

    // Client errors (4xx) are generally not retryable
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return false;
    }

    return false;
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(type: ErrorType, message: string, statusCode?: number): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection.';
      
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please try again.';
      
      case ErrorType.VALIDATION:
        return 'Invalid input provided. Please check your data.';
      
      case ErrorType.TIMEOUT:
        return 'The request took too long to complete. Please try again.';
      
      case ErrorType.STREAM:
        return 'Connection to the chat stream was interrupted. Please try again.';
      
      case ErrorType.SERVER:
        if (statusCode === 500) {
          return 'Server error occurred. Please try again later.';
        }
        if (statusCode === 503) {
          return 'Service temporarily unavailable. Please try again later.';
        }
        return 'Server error occurred. Please try again.';
      
      case ErrorType.CLIENT:
        if (statusCode === 400) {
          return 'Bad request. Please check your input.';
        }
        if (statusCode === 404) {
          return 'Requested resource not found.';
        }
        if (statusCode === 429) {
          return 'Too many requests. Please wait a moment before trying again.';
        }
        return 'Client error occurred. Please try again.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Analyze error to determine type and details
   */
  private analyzeError(error: Error): { type: ErrorType; statusCode?: number } {
    const message = error.message.toLowerCase();
    
    // Check for network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return { type: ErrorType.NETWORK };
    }

    // Check for timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return { type: ErrorType.TIMEOUT };
    }

    // Check for HTTP status codes in error message
    const httpStatusMatch = message.match(/(\d{3})/);
    if (httpStatusMatch) {
      const statusCode = parseInt(httpStatusMatch[1], 10);
      
      if (statusCode >= 400 && statusCode < 500) {
        return { type: ErrorType.CLIENT, statusCode };
      }
      
      if (statusCode >= 500) {
        return { type: ErrorType.SERVER, statusCode };
      }
    }

    // Check for authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return { type: ErrorType.AUTHENTICATION };
    }

    // Check for validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return { type: ErrorType.VALIDATION };
    }

    return { type: ErrorType.UNKNOWN };
  }

  /**
   * Check if error is an AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'userMessage' in error;
  }

  /**
   * Format error for logging
   */
  public formatErrorForLogging(error: AppError): string {
    return `[${error.type}] ${error.message} (${error.timestamp.toISOString()})${
      error.context ? ` - Context: ${JSON.stringify(error.context)}` : ''
    }`;
  }

  /**
   * Clear all error handlers
   */
  public clearErrorHandlers(): void {
    this.errorHandlers.clear();
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();
export default errorService;