import type { ChatMessage as ChatMessageType } from '~/types/chat.js';
import { MessageRenderer } from '~/shared/components/message';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  return <MessageRenderer message={message} isTyping={isTyping} />;
}