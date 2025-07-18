/**
 * Streaming service for handling Server-Sent Events (SSE) and real-time data
 * Provides robust streaming with automatic reconnection, error handling, and event processing
 */

import { configService } from './config';
import { errorService, ErrorType } from './errorService';
import type { AppError } from './errorService';

export interface StreamEvent {
  type: string;
  data: any;
  id?: string;
  timestamp: Date;
}

export interface StreamOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  autoReconnect?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  method?: 'GET' | 'POST';
  body?: string;
}

export interface StreamEventHandler {
  (event: StreamEvent): void;
}

export interface StreamErrorHandler {
  (error: AppError): void;
}

export interface StreamConnectionHandler {
  (): void;
}

class StreamService {
  private static instance: StreamService;
  private activeStreams: Map<string, StreamConnection> = new Map();

  private constructor() {}

  public static getInstance(): StreamService {
    if (!StreamService.instance) {
      StreamService.instance = new StreamService();
    }
    return StreamService.instance;
  }

  /**
   * Create a new stream connection
   */
  public createStream(
    url: string,
    options: StreamOptions = {}
  ): StreamConnection {
    const config = configService.getConfig();
    
    const finalOptions: Required<Omit<StreamOptions, 'body'>> & { body?: string } = {
      timeout: options.timeout || config.streamingTimeout,
      retryAttempts: options.retryAttempts ?? config.maxRetryAttempts,
      retryDelay: options.retryDelay || config.retryDelay,
      autoReconnect: options.autoReconnect ?? true,
      headers: options.headers || {},
      signal: options.signal || new AbortController().signal,
      method: options.method || 'GET',
      body: options.body
    };

    const streamId = this.generateStreamId();
    const connection = new StreamConnection(url, finalOptions, streamId);
    
    this.activeStreams.set(streamId, connection);
    
    // Clean up when connection closes
    connection.onClose(() => {
      this.activeStreams.delete(streamId);
    });

    return connection;
  }

  /**
   * Get active stream by ID
   */
  public getStream(streamId: string): StreamConnection | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Close all active streams
   */
  public closeAllStreams(): void {
    for (const connection of this.activeStreams.values()) {
      connection.close();
    }
    this.activeStreams.clear();
  }

  /**
   * Get count of active streams
   */
  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Generate unique stream ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Stream connection class for managing individual SSE connections
 */
export class StreamConnection {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();
  private buffer = '';
  private controller: AbortController;
  private reconnectAttempts = 0;
  private isConnected = false;
  private isClosed = false;
  
  private eventHandlers: Map<string, StreamEventHandler[]> = new Map();
  private errorHandlers: StreamErrorHandler[] = [];
  private connectionHandlers: StreamConnectionHandler[] = [];
  private closeHandlers: StreamConnectionHandler[] = [];

  constructor(
    private url: string,
    private options: Required<Omit<StreamOptions, 'body'>> & { body?: string },
    private id: string
  ) {
    this.controller = new AbortController();
  }

  /**
   * Start the stream connection
   */
  public async connect(): Promise<void> {
    if (this.isClosed) {
      throw errorService.createError(
        new Error('Cannot connect to closed stream'),
        ErrorType.STREAM,
        { streamId: this.id }
      );
    }

    try {
      const response = await fetch(this.url, {
        method: this.options.method,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.options.headers
        },
        body: this.options.body,
        signal: this.controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      this.reader = response.body.getReader();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Notify connection handlers
      this.connectionHandlers.forEach(handler => handler());

      // Start reading stream
      await this.readStream();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  /**
   * Read stream data
   */
  private async readStream(): Promise<void> {
    if (!this.reader) return;

    try {
      while (true) {
        const { done, value } = await this.reader.read();
        
        if (done) {
          this.handleStreamEnd();
          break;
        }

        this.buffer += this.decoder.decode(value, { stream: true });
        await this.processBuffer();
      }
    } catch (error) {
      if (!this.isClosed) {
        this.handleStreamError(error);
      }
    }
  }

  /**
   * Process buffered data and extract events
   */
  private async processBuffer(): Promise<void> {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const event: StreamEvent = {
            type: data.type || 'message',
            data: data.content || data,
            id: data.id,
            timestamp: new Date()
          };

          // Emit event to handlers
          this.emitEvent(event);
        } catch (parseError) {
          this.handleParseError(parseError, line);
        }
      } else if (line.startsWith('event: ')) {
        // Handle event type lines if needed
        // This is for future extensibility
      } else if (line.startsWith('id: ')) {
        // Handle event ID lines if needed
        // This is for future extensibility
      }
    }
  }

  /**
   * Emit event to registered handlers
   */
  private emitEvent(event: StreamEvent): void {
    // Emit to specific event type handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });

    // Emit to general event handlers
    const generalHandlers = this.eventHandlers.get('*') || [];
    generalHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in general event handler:', error);
      }
    });
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: any): void {
    const appError = errorService.createError(
      error,
      ErrorType.STREAM,
      { streamId: this.id, url: this.url }
    );

    this.errorHandlers.forEach(handler => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });

    // Attempt reconnection if enabled
    if (this.options.autoReconnect && this.reconnectAttempts < this.options.retryAttempts) {
      this.attemptReconnection();
    }
  }

  /**
   * Handle stream errors during reading
   */
  private handleStreamError(error: any): void {
    this.isConnected = false;
    
    if (error.name === 'AbortError') {
      // Stream was intentionally closed
      return;
    }

    this.handleConnectionError(error);
  }

  /**
   * Handle stream end
   */
  private handleStreamEnd(): void {
    this.isConnected = false;
    
    // Attempt reconnection if enabled
    if (this.options.autoReconnect && this.reconnectAttempts < this.options.retryAttempts) {
      this.attemptReconnection();
    }
  }

  /**
   * Handle parse errors
   */
  private handleParseError(error: any, line: string): void {
    if (configService.isDebug()) {
      console.warn('Failed to parse stream line:', line, error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnection(): Promise<void> {
    if (this.isClosed) return;

    this.reconnectAttempts++;
    
    // Exponential backoff
    const delay = this.options.retryDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    await this.delay(delay);
    
    if (!this.isClosed) {
      this.connect();
    }
  }

  /**
   * Register event handler
   */
  public on(eventType: string, handler: StreamEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Register error handler
   */
  public onError(handler: StreamErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Register connection handler
   */
  public onConnect(handler: StreamConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Register close handler
   */
  public onClose(handler: StreamConnectionHandler): void {
    this.closeHandlers.push(handler);
  }

  /**
   * Remove event handler
   */
  public off(eventType: string, handler: StreamEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Close the stream connection
   */
  public close(): void {
    if (this.isClosed) return;

    this.isClosed = true;
    this.isConnected = false;
    
    // Abort the request
    this.controller.abort();
    
    // Close reader
    if (this.reader) {
      this.reader.cancel();
      this.reader = null;
    }

    // Clear handlers
    this.eventHandlers.clear();
    this.errorHandlers.length = 0;
    this.connectionHandlers.length = 0;
    
    // Notify close handlers
    this.closeHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('Error in close handler:', error);
      }
    });
    this.closeHandlers.length = 0;
  }

  /**
   * Check if stream is connected
   */
  public isStreamConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get stream ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get stream URL
   */
  public getUrl(): string {
    return this.url;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const streamService = StreamService.getInstance();
export default streamService;