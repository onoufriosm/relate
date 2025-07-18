import { Search, Globe, ExternalLink } from 'lucide-react';
import type { SearchResult } from '~/types/chat';
import { Card } from '~/components/ui/card';

interface StaticSearchSourcesProps {
  searchResults: SearchResult[];
  className?: string;
}

export function StaticSearchSources({ searchResults, className = '' }: StaticSearchSourcesProps) {
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