import { Button } from '~/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ChatHeaderProps {
  threadId: string | null;
  isWaitingForFeedback: boolean;
  isLoading: boolean;
  onNewChat: () => void;
  title?: string;
  subtitle?: string;
}

export function ChatHeader({
  threadId,
  isWaitingForFeedback,
  isLoading,
  onNewChat,
  title = "AI Assistant",
  subtitle
}: ChatHeaderProps) {
  const defaultSubtitle = threadId ? `Thread: ${threadId.slice(0, 8)}...` : 'Initializing...';
  
  return (
    <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {subtitle || defaultSubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={onNewChat}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
          <StatusBadge
            isWaitingForFeedback={isWaitingForFeedback}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}