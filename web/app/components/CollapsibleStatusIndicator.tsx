import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, Brain } from 'lucide-react';
import { StaticSearchSources } from './StaticSearchSources';
import type { SearchResult } from '~/types/chat';

interface CollapsibleStatusIndicatorProps {
  statusMessages: string[];
  plannedQueries: string[];
  isCompleted: boolean;
  isCollapsed?: boolean;
  searchResults?: SearchResult[];
}

export function CollapsibleStatusIndicator({ 
  statusMessages, 
  plannedQueries, 
  isCompleted,
  isCollapsed = false,
  searchResults = []
}: CollapsibleStatusIndicatorProps) {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  // Auto-collapse when summarization starts (isCompleted becomes true)
  useEffect(() => {
    if (isCompleted) {
      setCollapsed(true);
    }
  }, [isCompleted]);

  if (statusMessages.length === 0 && plannedQueries.length === 0) {
    return null;
  }

  const toggleCollapsed = () => setCollapsed(!collapsed);

  // Only show collapse button after completion
  const showCollapseButton = isCompleted;
  
  // Button text changes based on state
  const getButtonText = () => {
    if (!isCompleted) {
      return 'Researching...';
    }
    if (collapsed) {
      return 'See sources';
    }
    return 'Hide sources';
  };

  return (
    <div className="ml-4 mt-2 border-l-2 border-muted pl-3">
      {showCollapseButton ? (
        <button
          onClick={toggleCollapsed}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <Search className="h-3 w-3" />
          <span>
            {getButtonText()}
            {plannedQueries.length > 0 && ` (${plannedQueries.length} queries)`}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-3 w-3" />
          <span>
            {getButtonText()}
            {plannedQueries.length > 0 && ` (${plannedQueries.length} queries)`}
          </span>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
      
      {!collapsed && (
        <div className="mt-2 space-y-1 text-xs">
          {/* If completed and has search results, show sources instead of progress */}
          {isCompleted && searchResults.length > 0 ? (
            <StaticSearchSources searchResults={searchResults} />
          ) : (
            <>
              {/* Status Messages */}
              {statusMessages.map((message, index) => (
                <div key={index} className="text-muted-foreground">
                  {message}
                </div>
              ))}
              
              {/* Planned Queries */}
              {plannedQueries.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-muted-foreground font-medium mb-1">
                    <Brain className="h-3 w-3" />
                    Search queries:
                  </div>
                  {plannedQueries.map((query, index) => (
                    <div key={index} className="text-muted-foreground ml-4">
                      {query}
                    </div>
                  ))}
                </div>
              )}
              
              {isCompleted && (
                <div className="text-green-600 text-xs mt-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {statusMessages.some(msg => msg.includes('approved')) ? 'Queries approved & executed' : 
                   statusMessages.some(msg => msg.includes('skipped')) ? 'Queries skipped' : 
                   'Research completed'}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}