interface StatusDetailsProps {
  messages: string[];
  plannedQueries: string[];
}

export function StatusDetails({ messages, plannedQueries }: StatusDetailsProps) {
  return (
    <>
      {/* Status Messages */}
      {messages.map((message, index) => (
        <div 
          key={index} 
          className="text-xs text-muted-foreground mb-1 last:mb-0"
        >
          {message}
        </div>
      ))}
      
      {/* Planned Queries */}
      {plannedQueries.length > 0 && (
        <div className="mt-2">
          {plannedQueries.map((query, index) => (
            <div 
              key={index} 
              className="text-xs text-muted-foreground ml-4 mb-1"
            >
              {query}
            </div>
          ))}
        </div>
      )}
    </>
  );
}