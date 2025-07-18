import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Search, Globe } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import type { SearchResult } from '~/types/chat';

interface InlineSearchSourcesProps {
  searchResults: SearchResult[];
  className?: string;
}

export function InlineSearchSources({ searchResults, className = '' }: InlineSearchSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);


  if (!searchResults || searchResults.length === 0) {
    return null;
  }

  return (
    <Card className={`mb-3 ${className}`}>
      <CardContent className="p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Search className="w-4 h-4" />
          <span>Sources ({searchResults.length})</span>
        </button>
        
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {searchResults.map((result, index) => (
              <div key={index} className="group">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-md border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-2 group-hover:text-primary">
                      {result.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {new URL(result.url).hostname}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}