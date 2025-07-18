import { InlineSearchSources } from '~/components/InlineSearchSources';
import type { SearchResult } from '~/types/chat.js';

interface MessageSourcesProps {
  searchResults?: SearchResult[];
}

export function MessageSources({ searchResults }: MessageSourcesProps) {
  if (!searchResults || searchResults.length === 0) return null;

  return (
    <div className="max-w-[80%] mr-4 mb-2">
      <InlineSearchSources searchResults={searchResults} />
    </div>
  );
}