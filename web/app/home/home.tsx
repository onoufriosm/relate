import { useChat } from '~/hooks/useChat';
import { useAutoScroll } from '~/hooks/useAutoScroll';
import { ChatHeader } from '~/components/ChatHeader';
import { LoadingScreen } from '~/components/LoadingScreen';
import { ErrorScreen } from '~/components/ErrorScreen';
import { EmptyState } from '~/components/EmptyState';
import { MessageList } from '~/components/MessageList';
import { ChatContainer } from '~/components/ChatContainer';

export function Home() {
  const chatState = useChat();
  const {
    messages,
    isLoading,
    statusMessages,
    plannedQueries,
    isTyping,
    showStatusInline,
    isWaitingForFeedback,
    currentInterrupt,
    sendMessage,
    threadId,
    isCreatingThread,
    threadError,
  } = chatState;

  const { scrollAreaRef, messagesEndRef } = useAutoScroll({ 
    dependencies: [messages] 
  });

  // Navigation helper
  const startNewChat = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('thread_id');
    window.location.href = newUrl.toString();
  };

  // Suggested actions for empty state
  const suggestedActions = [
    {
      text: "AI Developments",
      description: "Latest trends and news",
      action: () => sendMessage("What are the latest developments in AI?")
    },
    {
      text: "Explain ML",
      description: "Understanding machine learning",
      action: () => sendMessage("How does machine learning work?")
    },
    {
      text: "Web Development",
      description: "Tips and best practices",
      action: () => sendMessage("Best practices for web development")
    },
    {
      text: "Book Recommendations",
      description: "Find your next read",
      action: () => sendMessage("Recommend a good book to read")
    }
  ];

  // Loading states
  if (isCreatingThread) {
    return <LoadingScreen />;
  }

  if (threadError) {
    return <ErrorScreen error={threadError} />;
  }

  // Main chat interface
  const hasMessages = messages.length > 0;
  const showEmptyStatusIndicator = !hasMessages && (isLoading || isWaitingForFeedback) && showStatusInline;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <ChatHeader
        threadId={threadId}
        isWaitingForFeedback={isWaitingForFeedback}
        isLoading={isLoading}
        onNewChat={startNewChat}
      />

      <ChatContainer
        scrollAreaRef={scrollAreaRef}
        onSendMessage={sendMessage}
        isLoading={isLoading}
        threadId={threadId}
        isWaitingForFeedback={isWaitingForFeedback}
        currentInterrupt={currentInterrupt}
        showStatusIndicator={showEmptyStatusIndicator}
        statusMessages={statusMessages}
        plannedQueries={plannedQueries}
      >
        {!hasMessages ? (
          <EmptyState
            suggestedActions={suggestedActions}
            isLoading={isLoading}
          />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            isWaitingForFeedback={isWaitingForFeedback}
            isTyping={isTyping}
            showStatusInline={showStatusInline}
            statusMessages={statusMessages}
            plannedQueries={plannedQueries}
            messagesEndRef={messagesEndRef}
          />
        )}
      </ChatContainer>
    </div>
  );
}