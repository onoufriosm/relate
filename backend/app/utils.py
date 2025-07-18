"""Utility functions for the agent API."""

import json


def get_status_message(chunk):
    """Generate contextual status messages based on stream data."""
    event = getattr(chunk, "event", "")
    data = getattr(chunk, "data", {})

    if event == "metadata":
        return "🤖 Initializing agent..."

    if event == "updates":
        if "classification" in data:
            return (
                "🔍 Query requires web search..."
                if data["classification"].get("needs_search")
                else "💬 Answering from history..."
            )
        if "search" in data:
            count = data["search"].get("search_count", 0)
            total = len(data["search"].get("planned_queries", []))
            return f"🔍 Searching ({count}/{total})..."

    return None


def json_sse(data):
    """Format data as SSE JSON."""
    return f"data: {json.dumps(data)}\n\n"
