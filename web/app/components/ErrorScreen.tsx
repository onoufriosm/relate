import { MessageCircle } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { ChatHeader } from './ChatHeader';

interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
  title?: string;
  subtitle?: string;
}

export function ErrorScreen({
  error,
  onRetry = () => window.location.reload(),
  title = "Unable to create conversation",
  subtitle = "Connection error"
}: ErrorScreenProps) {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <ChatHeader
        threadId={null}
        isWaitingForFeedback={false}
        isLoading={false}
        onNewChat={() => {}}
        title="AI Assistant"
        subtitle={subtitle}
      />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <MessageCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}