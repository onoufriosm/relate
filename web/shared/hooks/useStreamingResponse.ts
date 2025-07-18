import { useState, useCallback, useRef } from 'react';
import ChatService from '~/services/chatService';
import type { InterruptData } from '~/types/chat';

export interface UseStreamingResponseOptions {
  onStart?: (content: string) => void;
  onStatus?: (content: string) => void;
  onPlanningSummary?: (content: string) => void;
  onPlannedQuery?: (content: string) => void;
  onSummarizationStart?: (content: string) => void;
  onAnswer?: (content: string) => void;
  onSearchResults?: (content: any) => void;
  onToolMessage?: (content: any) => void;
  onInterrupt?: (content: string) => void;
  onError?: (error: Error) => void;
}

export interface UseStreamingResponseReturn {
  isStreaming: boolean;
  streamContent: string;
  isWaitingForFeedback: boolean;
  currentInterrupt?: InterruptData;
  sendMessage: (message: string, threadId: string, isResponseToInterrupt?: boolean) => Promise<void>;
  clearInterrupt: () => void;
}

export function useStreamingResponse(options: UseStreamingResponseOptions = {}): UseStreamingResponseReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [isWaitingForFeedback, setIsWaitingForFeedback] = useState(false);
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptData | undefined>();
  
  const streamContentRef = useRef('');

  const sendMessage = useCallback(async (message: string, threadId: string, isResponseToInterrupt?: boolean) => {
    if (!threadId) {
      throw new Error('Thread ID is required');
    }

    // Frontend timing tracking
    const startTime = Date.now();
    let lastEventTime = startTime;
    let searchCompleteTime: number | null = null;
    let firstAnswerTime: number | null = null;
    
    console.log('🔍 Frontend: Starting request at', new Date().toISOString());

    setIsStreaming(true);
    setStreamContent('');
    streamContentRef.current = '';
    setIsWaitingForFeedback(false);
    setCurrentInterrupt(undefined);

    try {
      await ChatService.sendMessage(
        message,
        threadId,
        {
          isResponseToInterrupt,
          onStart: (content: any) => {
            const now = Date.now();
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] START event`);
            lastEventTime = now;
            options.onStart?.(content);
          },
          onStatus: (content: any) => {
            const now = Date.now();
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] (+${((now - lastEventTime) / 1000).toFixed(2)}s) STATUS: ${content}`);
            lastEventTime = now;
            options.onStatus?.(content);
          },
          onPlanningSummary: (content: any) => {
            const now = Date.now();
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] PLANNING SUMMARY`);
            lastEventTime = now;
            options.onPlanningSummary?.(content);
          },
          onPlannedQuery: (content: any) => {
            const now = Date.now();
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] PLANNED QUERY: ${content}`);
            lastEventTime = now;
            options.onPlannedQuery?.(content);
          },
          onSummarizationStart: (content: any) => {
            const now = Date.now();
            const delaySinceSearch = searchCompleteTime ? ((now - searchCompleteTime) / 1000).toFixed(2) : 'N/A';
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] 🧠 SUMMARIZATION START (delay: ${delaySinceSearch}s)`);
            lastEventTime = now;
            options.onSummarizationStart?.(content);
          },
          onAnswer: (content: any) => {
            const now = Date.now();
            if (firstAnswerTime === null) {
              firstAnswerTime = now;
              const delaySinceSearch = searchCompleteTime ? ((now - searchCompleteTime) / 1000).toFixed(2) : 'N/A';
              console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] 💬 FIRST ANSWER TOKEN (delay: ${delaySinceSearch}s)`);
            }
            streamContentRef.current += content;
            setStreamContent(streamContentRef.current);
            options.onAnswer?.(content);
          },
          onSearchResults: (content: any) => {
            const now = Date.now();
            searchCompleteTime = now;
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] 📊 SEARCH RESULTS received`);
            lastEventTime = now;
            options.onSearchResults?.(content);
          },
          onToolMessage: (content: any) => {
            const now = Date.now();
            console.log(`🔍 Frontend: [${((now - startTime) / 1000).toFixed(2)}s] 🔧 TOOL MESSAGE received`);
            lastEventTime = now;
            options.onToolMessage?.(content);
          },
          onInterrupt: (content: any) => {
            try {
              console.log('🔄 Received interrupt data:', content);
              
              const interruptData: InterruptData = {
                message: content || 'Please review the planned queries',
                type: 'human_review'
              };
              
              setIsWaitingForFeedback(true);
              setCurrentInterrupt(interruptData);
              options.onInterrupt?.(content);
            } catch (error) {
              console.error('❌ Error parsing interrupt data:', error, content);
              // Fallback to generic review state
              const fallbackInterrupt: InterruptData = {
                message: 'Please review the planned queries',
                type: 'human_review'
              };
              setIsWaitingForFeedback(true);
              setCurrentInterrupt(fallbackInterrupt);
            }
          },
          onError: (content: any) => {
            // Handle different error content types
            let errorMessage: string;
            if (typeof content === 'string') {
              errorMessage = content;
            } else if (content && typeof content === 'object') {
              errorMessage = content.message || content.error || JSON.stringify(content);
            } else {
              errorMessage = String(content);
            }
            
            const error = new Error(errorMessage);
            options.onError?.(error);
            throw error;
          }
        }
      );
    } catch (error) {
      console.error('Error in streaming response:', error);
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    } finally {
      setIsStreaming(false);
    }
  }, [options]);

  const clearInterrupt = useCallback(() => {
    setIsWaitingForFeedback(false);
    setCurrentInterrupt(undefined);
  }, []);

  return {
    isStreaming,
    streamContent,
    isWaitingForFeedback,
    currentInterrupt,
    sendMessage,
    clearInterrupt,
  };
}