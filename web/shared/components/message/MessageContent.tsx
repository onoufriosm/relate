import Markdown from '~/components/Markdown';
import type { ChatMessage } from '~/types/chat.js';
import { MessageTyping } from './MessageTyping';

interface MessageContentProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function MessageContent({ message, isTyping = false }: MessageContentProps) {
  const isUser = message.type === 'user';

  if (isUser) {
    return (
      <div className="whitespace-pre-wrap">{message.content}</div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {message.status === 'sending' && !message.content ? (
        <MessageTyping isTyping={true} />
      ) : (
        <div className="typing-animation" data-updating={isTyping ? "true" : "false"}>
          <Markdown>
           {message.content}
          </Markdown>
        </div>
      )}
    </div>
  );
}