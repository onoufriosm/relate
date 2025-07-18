import { Sparkles } from 'lucide-react';
import { ChatHeader } from './ChatHeader';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function LoadingScreen({
  title = "Creating your conversation",
  subtitle = "Creating new conversation...",
  description = "Setting up a new chat thread..."
}: LoadingScreenProps) {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <ChatHeader
        threadId={null}
        isWaitingForFeedback={false}
        isLoading={true}
        onNewChat={() => {}}
        title="AI Assistant"
        subtitle={subtitle}
      />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}