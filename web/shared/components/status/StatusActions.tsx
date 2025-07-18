import { AlertCircle } from 'lucide-react';

interface StatusActionsProps {
  isWaitingForFeedback: boolean;
}

export function StatusActions({ isWaitingForFeedback }: StatusActionsProps) {
  if (!isWaitingForFeedback) return null;

  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <span className="text-sm text-amber-700 font-medium">Review Required</span>
      <span className="text-xs text-amber-600">Please review the planned queries below and choose an action.</span>
    </div>
  );
}