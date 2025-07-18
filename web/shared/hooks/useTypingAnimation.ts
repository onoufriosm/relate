import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseTypingAnimationOptions {
  onContentUpdate?: (content: string) => void;
  typingSpeed?: number; // milliseconds between character reveals
  charactersPerInterval?: number; // characters to reveal per interval
}

export interface UseTypingAnimationReturn {
  isTyping: boolean;
  displayedContent: string;
  startTyping: (fullContent: string) => void;
  stopTyping: () => void;
  updateStreamContent: (newContent: string) => void;
}

export function useTypingAnimation(options: UseTypingAnimationOptions = {}): UseTypingAnimationReturn {
  const {
    onContentUpdate,
    typingSpeed = 20,
    charactersPerInterval = 2,
  } = options;

  const [isTyping, setIsTyping] = useState(false);
  const [displayedContent, setDisplayedContent] = useState('');
  
  const streamedContentRef = useRef('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);

  const startTyping = useCallback((fullContent: string) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    streamedContentRef.current = fullContent;
    setDisplayedContent('');
    setIsTyping(true);
    isStreamingRef.current = true;
    
    typingIntervalRef.current = setInterval(() => {
      const streamed = streamedContentRef.current;
      
      setDisplayedContent(current => {
        if (current.length < streamed.length) {
          // Reveal 2-3 characters at a time for faster animation
          const nextLength = Math.min(
            current.length + (Math.random() > 0.3 ? charactersPerInterval + 1 : charactersPerInterval), 
            streamed.length
          );
          const nextDisplayed = streamed.substring(0, nextLength);
          onContentUpdate?.(nextDisplayed);
          return nextDisplayed;
        } else if (isStreamingRef.current) {
          // Still streaming but caught up - keep animation running but don't reveal more
          return current;
        } else {
          // All content is displayed and streaming finished, stop typing animation
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          setIsTyping(false);
          return current;
        }
      });
    }, typingSpeed);
  }, [onContentUpdate, typingSpeed, charactersPerInterval]);

  const stopTyping = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    
    setIsTyping(false);
    isStreamingRef.current = false;
    
    // Immediately show all remaining content
    const fullContent = streamedContentRef.current;
    setDisplayedContent(fullContent);
    onContentUpdate?.(fullContent);
  }, [onContentUpdate]);

  const updateStreamContent = useCallback((newContent: string) => {
    streamedContentRef.current = newContent;
    
    // If not currently typing, start the animation
    if (!isTyping && !typingIntervalRef.current) {
      startTyping(newContent);
    }
  }, [isTyping, startTyping]);

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    displayedContent,
    startTyping,
    stopTyping,
    updateStreamContent,
  };
}