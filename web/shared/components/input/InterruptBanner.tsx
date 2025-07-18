import { QuickActions } from './QuickActions';

interface InterruptBannerProps {
  isVisible: boolean;
  message?: string;
  onQuickResponse: (response: string) => void;
  disabled: boolean;
}

export function InterruptBanner({ 
  isVisible, 
  message, 
  onQuickResponse, 
  disabled 
}: InterruptBannerProps) {
  
  if (!isVisible || !message) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl mx-auto">
      <p className="text-sm text-blue-800 mb-3">{message}</p>
      <QuickActions onQuickResponse={onQuickResponse} disabled={disabled} />
    </div>
  );
}