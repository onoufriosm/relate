import { Button } from '~/components/ui/button';

interface QuickActionsProps {
  onQuickResponse: (response: string) => void;
  disabled: boolean;
}

export function QuickActions({ onQuickResponse, disabled }: QuickActionsProps) {
  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        onClick={() => onQuickResponse('approve')}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={disabled}
      >
        Approve
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => onQuickResponse('skip')}
        disabled={disabled}
      >
        Skip
      </Button>
    </div>
  );
}