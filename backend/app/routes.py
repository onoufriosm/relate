"""API routes for the agent service."""

import re
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langgraph_sdk.schema import Command
from pydantic import BaseModel

from .config import SSE_HEADERS, langgraph_client
from .models import AgentQuery
from .streaming import stream_agent_response
from .thread_manager import check_thread_interrupt_status
from .utils import json_sse

router = APIRouter()


@router.post("/query-agent")
async def query_agent(query: AgentQuery):
    """Query the LangGraph agent. Handles both new queries and resuming from interrupts."""
    
    # If this is a response to an interrupt, always resume regardless of thread state
    if query.is_response_to_interrupt:
        start_msg = f"🔄 Resuming thread with input: {query.message}\n" + "=" * 60
        
        return StreamingResponse(
            stream_agent_response(
                thread_id=query.thread_id,
                command=Command(resume=query.message),
                start_message=start_msg,
            ),
            media_type="text/plain",
            headers=SSE_HEADERS,
        )
    
    # For new queries, check if thread has a pending interrupt
    has_interrupt = await check_thread_interrupt_status(query.thread_id)

    if has_interrupt:
        # Thread has pending interrupt, treat message as resume value
        start_msg = f"🔄 Resuming thread with input: {query.message}\n" + "=" * 60

        return StreamingResponse(
            stream_agent_response(
                thread_id=query.thread_id,
                command=Command(resume=query.message),
                start_message=start_msg,
            ),
            media_type="text/plain",
            headers=SSE_HEADERS,
        )
    else:
        # Normal query processing
        input_payload = {"messages": [{"role": "user", "content": query.message}]}
        start_msg = f"🤖 Processing query...\n📝 Query: {query.message}\n" + "=" * 60

        return StreamingResponse(
            stream_agent_response(
                thread_id=query.thread_id,
                input_data=input_payload,
                start_message=start_msg,
            ),
            media_type="text/plain",
            headers=SSE_HEADERS,
        )


# State management models and endpoints
from typing import Optional


class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    query: str


class ChatMessage(BaseModel):
    id: str
    type: str  # 'user', 'assistant', or 'tool'
    content: str
    timestamp: Optional[str] = None
    search_results: Optional[List[SearchResult]] = None


class StateResponse(BaseModel):
    messages: List[ChatMessage]
    search_results: List[SearchResult]
    thread_id: str


def parse_tool_message_content(
    content: str, search_index: int, query_name: str
) -> List[SearchResult]:
    """Parse ToolMessage content to extract all search results with URLs using robust pattern matching."""
    results = []

    # Split by double newlines and parse each block
    result_blocks = content.split("\n\n")

    for block in result_blocks:
        if not block.strip():
            continue

        # Extract title, URL, and content using regex
        title_match = re.search(r"Title:\s*(.+?)(?=\n|$)", block, re.IGNORECASE)
        url_match = re.search(r"URL:\s*(.+?)(?=\n|$)", block, re.IGNORECASE)
        content_match = re.search(
            r"Content:\s*(.+?)(?=\n\nTitle:|$)", block, re.DOTALL | re.IGNORECASE
        )

        if title_match and url_match:
            title = title_match.group(1).strip()
            url = url_match.group(1).strip()
            content_text = content_match.group(1).strip() if content_match else ""

            results.append(
                SearchResult(
                    title=title,
                    url=url,
                    content=content_text,
                    query=query_name,
                )
            )

    # Fallback: If no results, try finding all URLs regardless of structure
    if not results:
        # Find all URLs in the content
        url_pattern = r"URL:\s*(https?://[^\s\n]+)"
        urls = re.findall(url_pattern, content, re.IGNORECASE)

        # Find all titles
        title_pattern = r"Title:\s*(.+?)(?=\n|$)"
        titles = re.findall(title_pattern, content, re.IGNORECASE)

        # Pair them up
        for i, url in enumerate(urls):
            title = titles[i] if i < len(titles) else f"Result {i + 1}"
            results.append(
                SearchResult(
                    title=title.strip(),
                    url=url.strip(),
                    content="",
                    query=query_name,
                )
            )

    return results


def extract_messages_and_searches(
    state: Dict[str, Any],
) -> tuple[List[ChatMessage], List[SearchResult]]:
    """Extract chat messages including tool messages from LangGraph state."""
    messages = []
    search_index = 0
    planned_queries = state.get("planned_queries", [])

    for msg in state.get("messages", []):
        msg_type = msg.get("type", "")
        content = msg.get("content", "")

        if msg_type == "human":
            messages.append(
                ChatMessage(
                    id=msg.get("id", f"human_{len(messages)}"),
                    type="user",
                    content=content,
                )
            )
        elif msg_type == "ai":
            # Skip internal classification/planning messages
            if not (
                content.startswith("Classification:") or content.startswith("Planned")
            ):
                messages.append(
                    ChatMessage(
                        id=msg.get("id", f"ai_{len(messages)}"),
                        type="assistant",
                        content=content,
                    )
                )
        elif msg_type == "tool":
            # Include tool messages as search result messages in the chronological flow
            query_name = (
                planned_queries[search_index]
                if search_index < len(planned_queries)
                else f"Search {search_index + 1}"
            )
            tool_results = parse_tool_message_content(content, search_index, query_name)

            # Add tool message as a special message type containing search results
            messages.append(
                ChatMessage(
                    id=msg.get("id", f"tool_{len(messages)}"),
                    type="tool",
                    content="",  # No content for tool messages
                    search_results=tool_results,
                )
            )
            search_index += 1

    # Return empty search_results since they're now embedded in messages
    return messages, []


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "Backend is running"}


@router.post("/threads/create")
async def create_thread():
    """Create a new LangGraph thread and return the thread ID."""
    try:
        print("🔄 Creating new thread...")
        new_thread = await langgraph_client.threads.create()
        thread_id = new_thread["thread_id"]
        print(f"✅ Created new thread: {thread_id}")

        return {"thread_id": thread_id}
    except Exception as e:
        print(f"❌ Error creating thread: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create thread: {str(e)}"
        )


@router.get("/state/{thread_id}", response_model=StateResponse)
async def get_thread_state(thread_id: str):
    """Fetch the complete state for a thread and extract messages and search results."""
    try:
        print(f"🔍 Fetching state for thread: {thread_id}")

        # Fetch state from LangGraph directly using the provided thread_id
        try:
            state = await langgraph_client.threads.get_state(
                thread_id=thread_id, subgraphs=True
            )
            print(f"🔍 Got state (async): {type(state)}")
        except TypeError:
            # If get_state is not async, call it directly
            state = langgraph_client.threads.get_state(
                thread_id=thread_id, subgraphs=True
            )
            print(f"🔍 Got state (sync): {type(state)}")
        except Exception as e:
            print(f"❌ Error getting state: {e}")
            # Handle 404 specifically - thread doesn't exist yet, return empty state
            if "404" in str(e):
                print(f"Thread {thread_id} doesn't exist yet, returning empty state")
                return StateResponse(
                    messages=[], search_results=[], thread_id=thread_id
                )
            raise

        # Print state as json using json
        import json

        # print(f"🔍 State: {json.dumps(state, indent=2)}")

        if not state:
            raise HTTPException(status_code=404, detail="Thread not found")

        # The state is a dict with a 'values' key containing the actual agent state
        if isinstance(state, dict) and "values" in state:
            state_values = state["values"]
            print(f"🔍 Using state['values']: {type(state_values)}")
        else:
            # Fallback: treat state as the state dict directly
            state_values = state
            print(f"🔍 Using state directly: {type(state_values)}")

        # Extract messages and search results
        messages, search_results = extract_messages_and_searches(state_values)

        print(
            f"🔍 Extracted {len(messages)} messages, {len(search_results)} search results"
        )

        return StateResponse(
            messages=messages, search_results=search_results, thread_id=thread_id
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in get_thread_state: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching state: {str(e)}")
