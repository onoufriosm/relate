import type { ChatMessage } from '~/types/chat.js';
import { cn } from '~/lib/utils';
import { MessageContent } from './MessageContent';
import { MessageSources } from './MessageSources';
import { MessageStatus } from './MessageStatus';

interface MessageRendererProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function MessageRenderer({ message, isTyping = false }: MessageRendererProps) {
  const isUser = message.type === 'user';
  const isTool = message.type === 'tool';
  
  // Tool messages are invisible - they just provide sources for the next assistant message
  if (isTool) {
    return null;
  }

  
  return (
    <div className={cn(
      "flex flex-col w-full mb-4",
      isUser ? "items-end" : "items-start"
    )}>
      {/* Show search sources above assistant messages when they come from a preceding tool message */}
      {!isUser && (
        <MessageSources searchResults={message.searchResults} />
      )}
      
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2 text-sm",
        isUser 
          ? "bg-primary text-primary-foreground ml-4" 
          : "bg-muted mr-4"
      )}>
        <div className="break-words">
          <MessageContent message={message} isTyping={isTyping} />
        </div>
        <MessageStatus message={message} />
      </div>
    </div>
  );
}