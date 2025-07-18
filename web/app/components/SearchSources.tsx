import { useEffect, useState } from 'react';
import { ExternalLink, Search, Globe } from 'lucide-react';
import type { SearchResult } from '~/types/state';
import StateService from '~/services/stateService';
import { Card } from '~/components/ui/card';

interface SearchSourcesProps {
  threadId?: string;
  className?: string;
}

export function SearchSources({ threadId, className = '' }: SearchSourcesProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await StateService.getSearchResults(threadId);
        setSearchResults(response.search_results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch search results');
        console.error('Error fetching search results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [threadId]);

  if (!threadId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="w-4 h-4 animate-spin" />
          Loading sources...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 border-destructive ${className}`}>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Globe className="w-4 h-4" />
          Error loading sources: {error}
        </div>
      </Card>
    );
  }

  if (searchResults.length === 0) {
    return null;
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Search className="w-4 h-4" />
          Sources ({searchResults.length})
        </div>
        
        <div className="space-y-2">
          {searchResults.map((result, index) => (
            <div key={index} className="group">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-md border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Globe className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-1 group-hover:text-primary">
                    {result.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {new URL(result.url).hostname}
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}