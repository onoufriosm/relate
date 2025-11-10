import { ChatMessage } from './ChatMessage';
import { StatusIndicator } from './StatusIndicator';
import { CollapsibleStatusIndicator } from './CollapsibleStatusIndicator';
import type { ChatMessage as ChatMessageType, SearchResult } from '~/types/chat';

interface MessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isWaitingForFeedback: boolean;
  isTyping: boolean;
  showStatusInline: boolean;
  statusMessages: string[];
  plannedQueries: string[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({ 
  messages, 
  isLoading, 
  isWaitingForFeedback, 
  isTyping, 
  showStatusInline, 
  statusMessages, 
  plannedQueries,
  messagesEndRef
}: MessageListProps) {
  console.log('messages1', messages);
    // Helper function to attach search results to assistant messages
    const attachSearchResults = (message: ChatMessageType, index: number): ChatMessageType => {
      if (message.type !== 'assistant') return message;

      const allSearchResults: SearchResult[] = [];
      
      // Look backwards from this message to find all tool messages
      for (let i = index - 1; i >= 0; i--) {
        const prevMessage = messages[i];
        if (prevMessage.type === 'assistant') break;
        if (prevMessage.type === 'tool' && prevMessage.searchResults) {
          allSearchResults.unshift(...prevMessage.searchResults);
        }
      }
      
      // Also check the preceding user message for search results (stored in statusData)
      if (allSearchResults.length === 0) {
        for (let i = index - 1; i >= 0; i--) {
          const prevMessage = messages[i];
          if (prevMessage.type === 'user' && prevMessage.statusData?.searchResults) {
            allSearchResults.push(...prevMessage.statusData.searchResults);
            break;
          }
        }
      }
      
      return allSearchResults.length > 0 
        ? { ...message, searchResults: allSearchResults }
        : message;
    };



    return (
      <div className="space-y-4">
        {messages.map((message, index) => {
          const messageWithSources = attachSearchResults(message, index);
          const isLastMessage = index === messages.length - 1;
          // Find if this is the last user message (for status indicator)
          const isLastUserMessage = message.type === 'user' && 
            !messages.slice(index + 1).some(m => m.type === 'user');
          
          return (
            <div key={message.id}>
              <ChatMessage 
                message={messageWithSources} 
                isTyping={isTyping && isLastMessage && message.type === 'assistant'} 
              />
              
              {/* Status indicator for active user messages - hide when response starts streaming */}
              {message.type === 'user' && 
               isLastUserMessage && 
               (isLoading || isWaitingForFeedback) && 
               showStatusInline && 
               !isTyping && 
               (!message.statusData || !message.statusData.isCompleted) && (
                <div className="ml-4 mt-2">
                  <StatusIndicator
                    messages={message.statusData?.statusMessages || statusMessages}
                    plannedQueries={message.statusData?.plannedQueries || plannedQueries}
                    isLoading={isLoading}
                    isWaitingForFeedback={isWaitingForFeedback}
                  />
                </div>
              )}
              
              {/* Collapsible status indicator for completed user messages - hide when response starts streaming */}
              {message.type === 'user' && 
               message.statusData && 
               (message.statusData.statusMessages.length > 0 || message.statusData.plannedQueries.length > 0) && 
               message.statusData.isCompleted && 
               showStatusInline && 
               !isTyping && 
               !(isLoading && isLastUserMessage) && (
                <CollapsibleStatusIndicator
                  statusMessages={message.statusData.statusMessages}
                  plannedQueries={message.statusData.plannedQueries}
                  isCompleted={message.statusData.isCompleted}
                  isCollapsed={true}
                  searchResults={message.statusData.searchResults || []}
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
}