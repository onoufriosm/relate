interface StatusBadgeProps {
  isWaitingForFeedback: boolean;
  isLoading: boolean;
}

export function StatusBadge({ isWaitingForFeedback, isLoading }: StatusBadgeProps) {
  if (isWaitingForFeedback) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-amber-600">Awaiting Review</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-600">Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-2 h-2 rounded-full bg-green-300" />
      <span>Ready</span>
    </div>
  );
}