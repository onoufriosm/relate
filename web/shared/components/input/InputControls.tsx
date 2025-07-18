import { Button } from '~/components/ui/button';
import { Send } from 'lucide-react';

interface InputControlsProps {
  onSubmit: (e: React.FormEvent) => void;
  disabled: boolean;
  hasContent: boolean;
}

export function InputControls({ onSubmit, disabled, hasContent }: InputControlsProps) {
  return (
    <Button
      type="submit"
      onClick={onSubmit}
      disabled={!hasContent || disabled}
      size="icon"
    >
      <Send className="h-4 w-4" />
    </Button>
  );
}