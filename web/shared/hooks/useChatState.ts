import { useState, useCallback } from 'react';
import type { InterruptData, SearchResult } from '~/types/chat';

export interface ChatState {
  isLoading: boolean;
  statusMessages: string[];
  plannedQueries: string[];
  showStatusInline: boolean;
  isInSummarization: boolean;
  isWaitingForFeedback: boolean;
  currentInterrupt?: InterruptData;
  searchResults: SearchResult[];
}

export interface UseChatStateReturn {
  state: ChatState;
  setLoading: (loading: boolean) => void;
  addStatusMessage: (message: string) => void;
  setStatusMessages: (messages: string[]) => void;
  addPlannedQuery: (query: string) => void;
  setPlannedQueries: (queries: string[]) => void;
  clearPlannedQueries: () => void;
  setShowStatusInline: (show: boolean) => void;
  setInSummarization: (inSummarization: boolean) => void;
  setWaitingForFeedback: (waiting: boolean) => void;
  setCurrentInterrupt: (interrupt: InterruptData | undefined) => void;
  addSearchResults: (results: SearchResult[]) => void;
  setSearchResults: (results: SearchResult[]) => void;
  resetState: () => void;
}

const initialState: ChatState = {
  isLoading: false,
  statusMessages: [],
  plannedQueries: [],
  showStatusInline: true,
  isInSummarization: false,
  isWaitingForFeedback: false,
  currentInterrupt: undefined,
  searchResults: [],
};

export function useChatState(): UseChatStateReturn {
  const [state, setState] = useState<ChatState>(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const addStatusMessage = useCallback((message: string) => {
    setState(prev => ({ 
      ...prev, 
      statusMessages: [...prev.statusMessages, message] 
    }));
  }, []);

  const setStatusMessages = useCallback((messages: string[]) => {
    setState(prev => ({ ...prev, statusMessages: messages }));
  }, []);

  const addPlannedQuery = useCallback((query: string) => {
    setState(prev => ({ 
      ...prev, 
      plannedQueries: [...prev.plannedQueries, query] 
    }));
  }, []);

  const setPlannedQueries = useCallback((queries: string[]) => {
    setState(prev => ({ ...prev, plannedQueries: queries }));
  }, []);

  const clearPlannedQueries = useCallback(() => {
    setState(prev => ({ ...prev, plannedQueries: [] }));
  }, []);

  const setShowStatusInline = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showStatusInline: show }));
  }, []);

  const setInSummarization = useCallback((inSummarization: boolean) => {
    setState(prev => ({ ...prev, isInSummarization: inSummarization }));
  }, []);

  const setWaitingForFeedback = useCallback((waiting: boolean) => {
    setState(prev => ({ ...prev, isWaitingForFeedback: waiting }));
  }, []);

  const setCurrentInterrupt = useCallback((interrupt: InterruptData | undefined) => {
    setState(prev => ({ ...prev, currentInterrupt: interrupt }));
  }, []);

  const addSearchResults = useCallback((results: SearchResult[]) => {
    setState(prev => ({ 
      ...prev, 
      searchResults: [...prev.searchResults, ...results] 
    }));
  }, []);

  const setSearchResults = useCallback((results: SearchResult[]) => {
    setState(prev => ({ ...prev, searchResults: results }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
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
    resetState,
  };
}