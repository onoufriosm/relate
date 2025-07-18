interface LoadingIndicatorProps {
  isLoading: boolean;
  isWaitingForFeedback: boolean;
  hasMessages: boolean;
}

export function LoadingIndicator({ 
  isLoading, 
  isWaitingForFeedback, 
  hasMessages 
}: LoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <span className="text-xs text-muted-foreground">
        {isWaitingForFeedback ? "Waiting for review..." : 
         !hasMessages ? "Initializing..." : "Processing..."}
      </span>
    </div>
  );
}