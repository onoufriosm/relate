interface MessageTypingProps {
  isTyping: boolean;
}

export function MessageTyping({ isTyping }: MessageTypingProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-1 py-2">
      <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
      <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
}