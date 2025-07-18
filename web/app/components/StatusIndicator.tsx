import { StatusDetails, StatusActions, LoadingIndicator } from '~/shared/components/status';

interface StatusIndicatorProps {
  messages: string[];
  plannedQueries: string[];
  isLoading: boolean;
  isWaitingForFeedback?: boolean;
}

export function StatusIndicator({ 
  messages, 
  plannedQueries, 
  isLoading,
  isWaitingForFeedback = false 
}: StatusIndicatorProps) {
  // Always show when loading or waiting for feedback, otherwise check for content
  if (!isLoading && !isWaitingForFeedback && messages.length === 0 && plannedQueries.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 bg-muted/50 border-t">
      <div className="max-w-4xl mx-auto">
        <StatusDetails messages={messages} plannedQueries={plannedQueries} />
        <StatusActions isWaitingForFeedback={isWaitingForFeedback} />
        <LoadingIndicator 
          isLoading={isLoading}
          isWaitingForFeedback={isWaitingForFeedback}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
}