import { useEffect, useRef } from 'react';

interface UseAutoScrollProps {
  dependencies: unknown[];
  threshold?: number;
}

export function useAutoScroll({ dependencies, threshold = 10 }: UseAutoScrollProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const isAtBottomRef = useRef(true);

  // Initialize scroll element reference
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (scrollElement) {
      scrollElementRef.current = scrollElement;
    }
  }, []);

  // Check if user is at bottom when they scroll
  const handleScroll = () => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      isAtBottomRef.current = isAtBottom;
    }
  };

  // Auto-scroll to bottom only if user was already at the bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAtBottomRef.current && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, dependencies);

  // Track scroll position during message updates
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return { scrollAreaRef, messagesEndRef };
}