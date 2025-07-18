"""Streaming functionality for the agent API."""

import asyncio
import time
from typing import AsyncGenerator, Optional
from langgraph_sdk.schema import Command

from .config import langgraph_client, TOKEN_PATTERN
from .utils import get_status_message, json_sse


async def stream_agent_response(
    thread_id: str,
    input_data: Optional[dict] = None,
    command: Optional[Command] = None,
    start_message: str = "",
) -> AsyncGenerator[str, None]:
    """Stream agent responses."""
    try:
        # Use thread_id directly - it comes from backend thread creation
        actual_thread_id = thread_id

        # Track timing for first answer detection
        first_answer_time = None

        if start_message:
            yield json_sse({"type": "start", "content": start_message})

        # Build stream parameters
        params = {
            "thread_id": actual_thread_id,
            "assistant_id": "agent",
            "stream_mode": ["values", "updates", "events", "messages"],
            **({"command": command} if command else {"input": input_data}),
        }

        previous_messages = []
        interrupt_sent = False  # Track if we've already sent an interrupt
        previous_content_length = 0  # Track content length for incremental streaming
        current_ai_message_id = None  # Track current AI message to detect new responses
        in_summarization = False  # Track if we're in summarization phase
        in_direct_answer = False
        async for chunk in langgraph_client.runs.stream(**params):
            event = chunk.event
            data = chunk.data or {}

            # Track current time for first answer detection
            current_time = time.time()

            # Detect when we're entering direct_answer node for streaming
            if event == "messages/metadata":
                # Check all run entries for direct_answer checkpoint
                for run_id, run_data in data.items():
                    if isinstance(run_data, dict) and "metadata" in run_data:
                        checkpoint_ns = run_data["metadata"].get("checkpoint_ns", "")
                        if checkpoint_ns.startswith("direct_answer"):
                            in_direct_answer = True
                            yield json_sse(
                                {
                                    "type": "summarization_start",
                                    "content": "🧠 Generating direct answer...",
                                }
                            )
                            break

            # Send status updates
            status_msg = get_status_message(chunk)
            if status_msg:
                yield json_sse({"type": "status", "content": status_msg})

            # Handle planning - inline the logic
            if event == "updates" and "planning" in data:
                queries = data["planning"].get("planned_queries", [])
                if queries:
                    yield json_sse(
                        {
                            "type": "planning_summary",
                            "content": f"🧠 Planned {len(queries)} search queries:",
                        }
                    )
                    for i, query in enumerate(queries, 1):
                        yield json_sse(
                            {"type": "planned_query", "content": f"{i}. {query}"}
                        )

            # Handle search operations
            elif event == "updates" and "search" in data:
                pass

            # Handle entering summarization node
            elif event == "updates" and "pre_summarize" in data:
                in_summarization = True
                yield json_sse(
                    {
                        "type": "summarization_start",
                        "content": "🧠 Generating comprehensive answer...",
                    }
                )

            # Handle summarization operations
            elif event == "updates" and "summarize" in data:
                in_summarization = True

            # Handle streaming LLM tokens in real-time - during summarization OR direct answer
            elif (event == "messages/partial" or event == "messages/complete") and (
                in_summarization or in_direct_answer
            ):
                # This is the real-time streaming from the LLM
                if isinstance(data, list) and len(data) > 0:
                    message_data = data[0]  # Get the first (and likely only) message
                    if message_data.get("type") == "ai":
                        message_id = message_data.get("id")
                        full_content = message_data.get("content", "")

                        # Reset content length if this is a new AI message
                        if current_ai_message_id != message_id:
                            current_ai_message_id = message_id
                            previous_content_length = 0

                        # Extract only the new content since last update
                        new_content = full_content[previous_content_length:]

                        if new_content:
                            if first_answer_time is None:
                                first_answer_time = current_time

                            # Stream only the new token(s)
                            yield json_sse({"type": "answer", "content": new_content})

                            # Update the previous content length
                            previous_content_length = len(full_content)

            # Handle search results from values event
            elif event == "values" and "search" in data:
                search_data = data["search"]
                search_results = search_data.get("search_results", [])
                tool_messages = search_data.get("messages", [])
                
                # Send tool messages with search results attached (for consistency with thread restore)
                for i, tool_message in enumerate(tool_messages):
                    if tool_message.get("type") == "tool":
                        # Extract tool_call_id to match with search results
                        tool_call_id = tool_message.get("tool_call_id", f"search_{i+1}")
                        
                        # Find corresponding search result
                        matching_search_result = None
                        for search_result in search_results:
                            if search_result.get("query", "").endswith(f"_{i+1}") or i < len(search_results):
                                matching_search_result = search_result
                                break
                        
                        # Create tool message with search results
                        tool_msg_data = {
                            "id": tool_message.get("id", f"tool_{i}"),
                            "type": "tool",
                            "content": tool_message.get("content", ""),
                            "search_results": [matching_search_result] if matching_search_result else [],
                            "tool_call_id": tool_call_id,
                            "timestamp": tool_message.get("timestamp", "")
                        }
                        yield json_sse({"type": "tool_message", "content": tool_msg_data})
                
                # Also send search results for backward compatibility
                if search_results:
                    yield json_sse(
                        {"type": "search_results", "content": search_results}
                    )

            # Handle final answers and tool messages
            elif event == "values":
                current_messages = data.get("messages", [])

                # Check for new tool messages (search results)
                if len(current_messages) > len(previous_messages):
                    for i in range(len(previous_messages), len(current_messages)):
                        msg = current_messages[i]
                        if msg.get("type") == "tool":
                            # Parse and emit search results
                            from .routes import parse_tool_message_content

                            search_index = sum(
                                1
                                for m in current_messages[:i]
                                if m.get("type") == "tool"
                            )
                            planned_queries = data.get("planned_queries", [])
                            query_name = (
                                planned_queries[search_index]
                                if search_index < len(planned_queries)
                                else f"Search {search_index + 1}"
                            )

                            results = parse_tool_message_content(
                                msg.get("content", ""), search_index, query_name
                            )
                            if results:
                                # Convert SearchResult objects to dictionaries for JSON serialization
                                results_dict = [
                                    {
                                        "title": result.title,
                                        "url": result.url,
                                        "content": result.content,
                                        "query": result.query,
                                    }
                                    for result in results
                                ]
                                yield json_sse(
                                    {"type": "search_results", "content": results_dict}
                                )

                # Skip streaming completed AI messages since we now handle them in real-time via "messages" mode
                # Only handle final state tracking here
                if (
                    len(current_messages) > len(previous_messages)
                    and current_messages
                    and current_messages[-1].get("type") == "ai"
                ):
                    content = current_messages[-1].get("content", "")
                    # Only log completion, don't stream tokens here
                    if content and not any(
                        skip_phrase in content
                        for skip_phrase in ["Planned", "Classification:"]
                    ):
                        pass

                previous_messages = current_messages

            # Handle interrupts - check multiple possible event types
            elif not interrupt_sent and (
                event in ["interrupt", "on_interrupt"] or "interrupt" in event.lower()
            ):
                try:
                    # If data is a string (the interrupt message), use it directly
                    if isinstance(data, str):
                        interrupt_content = data
                    # If data is a dict, look for common interrupt message fields
                    elif isinstance(data, dict):
                        interrupt_content = data.get(
                            "message", data.get("content", str(data))
                        )
                    else:
                        interrupt_content = str(data)

                    yield json_sse({"type": "interrupt", "content": interrupt_content})
                    interrupt_sent = True  # Mark that we've sent an interrupt
                except Exception:
                    yield json_sse(
                        {
                            "type": "interrupt",
                            "content": "Please provide feedback on the planned queries.",
                        }
                    )
                    interrupt_sent = True

            # Handle LangGraph interrupt signal
            elif not interrupt_sent and event == "updates" and "__interrupt__" in data:
                # This is the proper interrupt from LangGraph
                review_message = "Please provide feedback on the planned queries."
                yield json_sse({"type": "interrupt", "content": review_message})
                interrupt_sent = True

                # Break out of the stream loop to pause execution
                # The stream will be resumed when user provides feedback
                break

    except Exception as e:
        yield json_sse({"type": "error", "message": str(e)})
