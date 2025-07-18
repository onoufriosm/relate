import { useState, useEffect, useCallback } from 'react';
import ThreadService from '~/services/threadService';

export interface UseUrlThreadIdReturn {
  threadId: string;
  setThreadId: (threadId: string) => void;
  isCreatingThread: boolean;
  error: string | null;
}

export function useUrlThreadId(): UseUrlThreadIdReturn {
  const [threadId, setThreadId] = useState<string>('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewThread = useCallback(async () => {
    setIsCreatingThread(true);
    setError(null);
    
    try {
      const response = await ThreadService.createThread();
      const newThreadId = response.thread_id;

      setThreadId(newThreadId);
      
      // Update URL without page reload
      ThreadService.updateUrlWithThreadId(newThreadId, true);
      
    } catch (err) {
      console.error('❌ Error creating thread:', err);
      setError(err instanceof Error ? err.message : 'Failed to create thread');
    } finally {
      setIsCreatingThread(false);
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check URL params for thread_id
    const urlThreadId = ThreadService.getThreadIdFromUrl();

    if (urlThreadId) {
      setThreadId(urlThreadId);
    } else {
      // Request new thread from backend
      createNewThread();
    }
  }, [createNewThread]);

  // Function to manually update thread ID and URL
  const updateThreadId = useCallback((newThreadId: string) => {
    setThreadId(newThreadId);
    ThreadService.updateUrlWithThreadId(newThreadId, false);
  }, []);

  return {
    threadId,
    setThreadId: updateThreadId,
    isCreatingThread,
    error
  };
}