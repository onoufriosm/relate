import type { ReactNode } from 'react';
import { ScrollArea } from '~/components/ui/scroll-area';
import { ChatInput } from './ChatInput';
import { StatusIndicator } from './StatusIndicator';
import type { InterruptData } from '~/types/chat';

interface ChatContainerProps {
  children: ReactNode;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (message: string, isResponseToInterrupt?: boolean) => void;
  isLoading: boolean;
  threadId: string | null;
  isWaitingForFeedback: boolean;
  currentInterrupt?: InterruptData;
  showStatusIndicator?: boolean;
  statusMessages?: string[];
  plannedQueries?: string[];
}

export function ChatContainer({
  children,
  scrollAreaRef,
  onSendMessage,
  isLoading,
  threadId,
  isWaitingForFeedback,
  currentInterrupt,
  showStatusIndicator = false,
  statusMessages = [],
  plannedQueries = []
}: ChatContainerProps) {
  return (
    <div className="flex-1 min-h-0 relative">
      <ScrollArea ref={scrollAreaRef} className="h-full p-4">
        <div className="max-w-4xl mx-auto pb-24">
          {children}
          
          {/* Status indicator for when there are no messages yet */}
          {showStatusIndicator && (
            <div className="space-y-4">
              <StatusIndicator
                messages={statusMessages}
                plannedQueries={plannedQueries}
                isLoading={isLoading}
                isWaitingForFeedback={isWaitingForFeedback}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Fixed Chat Input */}
      <div className="flex-shrink-0 fixed bottom-4 left-4 right-4 z-20">
        <div className="max-w-4xl mx-auto bg-background border rounded-lg shadow-lg p-4">
          <ChatInput 
            onSendMessage={onSendMessage} 
            isLoading={isLoading} 
            disabled={!threadId}
            isWaitingForFeedback={isWaitingForFeedback}
            interruptMessage={currentInterrupt?.message}
          />
        </div>
      </div>
    </div>
  );
}