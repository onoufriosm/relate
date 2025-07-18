import type { ChatMessage } from '~/types/chat.js';

interface MessageStatusProps {
  message: ChatMessage;
}

export function MessageStatus({ message }: MessageStatusProps) {
  return (
    <>
      {message.status === 'error' && (
        <div className="text-xs text-red-500 mt-1">
          Failed to send
        </div>
      )}
      <div className="text-xs opacity-60 mt-1">
        {message.timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </>
  );
}