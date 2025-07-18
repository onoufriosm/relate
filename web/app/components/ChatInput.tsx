import { useState } from 'react';
import { InputField, InputControls, InterruptBanner } from '~/shared/components/input';

interface ChatInputProps {
  onSendMessage: (message: string, isResponseToInterrupt?: boolean) => void;
  isLoading: boolean;
  disabled?: boolean;
  isWaitingForFeedback?: boolean;
  interruptMessage?: string;
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  disabled = false,
  isWaitingForFeedback = false,
  interruptMessage 
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const isDisabled = isLoading || disabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message, isWaitingForFeedback);
      setMessage('');
    }
  };

  const handleQuickResponse = (response: string) => {
    onSendMessage(response, true);
  };

  // Dynamic placeholder based on state
  const getPlaceholder = () => {
    if (disabled) return "Initializing...";
    if (isWaitingForFeedback) return "Type 'approve', 'skip', or provide feedback...";
    return "Ask me anything...";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-background p-4">
      <InterruptBanner
        isVisible={isWaitingForFeedback}
        message={interruptMessage}
        onQuickResponse={handleQuickResponse}
        disabled={isDisabled}
      />
      
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <InputField
            value={message}
            onChange={setMessage}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isDisabled}
          />
          <InputControls
            onSubmit={handleSubmit}
            disabled={isDisabled}
            hasContent={!!message.trim()}
          />
        </div>
      </form>
    </div>
  );
}