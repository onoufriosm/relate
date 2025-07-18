import { useState, useCallback } from 'react';
import type { ChatMessage } from '~/types/chat';
import { generateUUID } from '~/lib/utils';

export interface UseMessagesReturn {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateUUID(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    updateMessage,
    setMessages,
    clearMessages,
  };
}