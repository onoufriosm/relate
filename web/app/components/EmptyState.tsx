import { MessageCircle } from 'lucide-react';

interface SuggestedAction {
  text: string;
  description: string;
  action: () => void;
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  suggestedActions?: SuggestedAction[];
  isLoading?: boolean;
}

const defaultSuggestedActions: SuggestedAction[] = [
  {
    text: "AI Developments",
    description: "Latest trends and news",
    action: () => {}
  },
  {
    text: "Explain ML",
    description: "Understanding machine learning",
    action: () => {}
  },
  {
    text: "Web Development",
    description: "Tips and best practices",
    action: () => {}
  },
  {
    text: "Book Recommendations",
    description: "Find your next read",
    action: () => {}
  }
];

export function EmptyState({
  title = "AI Assistant",
  description = "I can help you with research, answer questions, and provide detailed information on various topics. What would you like to know?",
  suggestedActions = defaultSuggestedActions,
  isLoading = false
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-8 max-w-md">{description}</p>
      
      {suggestedActions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
          {suggestedActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-3 text-left border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              <div className="font-medium text-sm">{action.text}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}