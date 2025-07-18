"""Agent execution and streaming functions."""

from langchain_core.messages import HumanMessage, ToolMessage, AIMessage

from app.agent import create_agent, get_config
from app.state import AgentState

# Global agent instance to maintain memory across calls
_global_agent = None

def get_or_create_agent(use_memory: bool = False):
    """Get existing agent or create new one (for memory persistence)."""
    global _global_agent
    if _global_agent is None:
        _global_agent = create_agent(use_memory=use_memory)
    return _global_agent


async def run_agent_sse(query: str, thread_id: str, stream_callback=None, use_langgraph_events=False, use_memory: bool = False):
    """Run the agent with SSE streaming support and persistent memory."""
    agent = get_or_create_agent(use_memory=use_memory)
    config = get_config(thread_id)
    
    # Add the new user message to the conversation
    new_message = HumanMessage(content=query)
    
    start_msg = f"🤖 Processing query...\n📝 Query: {query}\n" + "=" * 60
    if stream_callback:
        await stream_callback({"type": "start", "content": start_msg})
    else:
        print(start_msg)
    
    # Create proper initial state with all required fields
    initial_state: AgentState = {
        "messages": [new_message],
        "search_count": 0,
        "original_query": "",
        "planned_queries": [],
        "search_results": [],
        "needs_search": False
    }
    
    if use_langgraph_events:
        # Use LangGraph's event streaming system
        async for event in agent.astream_events(initial_state, config=config, version="v1"):
            await handle_langgraph_event(event, stream_callback)
    else:
        # Use custom node-based streaming (current implementation)
        async for event in agent.astream(initial_state, config=config):
            await handle_custom_event(event, stream_callback)


async def handle_langgraph_event(event, stream_callback):
    """Handle LangGraph event streaming."""
    event_type = event.get("event", "")
    
    if event_type == "on_chat_model_stream":
        # Stream individual tokens from LLM
        chunk = event.get("data", {}).get("chunk", {})
        if hasattr(chunk, 'content') and chunk.content:
            if stream_callback:
                await stream_callback({"type": "answer", "content": str(chunk.content)})
            else:
                print(str(chunk.content), end="", flush=True)
    
    elif event_type == "on_tool_start":
        # Tool execution start (search)
        tool_name = event.get("name", "")
        if "search" in tool_name.lower():
            query = event.get("data", {}).get("input", {}).get("query", "")
            search_msg = f"🔍 Searching: '{query}'\n"
            if stream_callback:
                await stream_callback({"type": "search", "content": search_msg})
            else:
                print(search_msg)
    
    elif event_type == "on_tool_end":
        # Tool execution end
        tool_name = event.get("name", "")
        if "search" in tool_name.lower():
            results_msg = "📊 Search completed\n" + "-" * 40 + "\n"
            if stream_callback:
                await stream_callback({"type": "results", "content": results_msg})
            else:
                print(results_msg)
    
    elif event_type == "on_chain_start":
        # Node execution start
        node_name = event.get("name", "")
        if node_name == "planning":
            planning_msg = "🧠 Planning search queries...\n"
            if stream_callback:
                await stream_callback({"type": "planning", "content": planning_msg})
            else:
                print(planning_msg)
        elif node_name == "summarize":
            final_msg = "✅ Generating final answer...\n"
            if stream_callback:
                await stream_callback({"type": "final", "content": final_msg})
            else:
                print(final_msg)


async def handle_custom_event(event, stream_callback):
    """Handle custom node-based events (current implementation)."""
    # Handle different node types
    for node_name in ["planning", "search", "summarize"]:
        if node_name in event:
            state = event[node_name]
            if state["messages"]:
                last_msg = state["messages"][-1]
                if isinstance(last_msg, ToolMessage) and node_name == "search":
                    results_msg = f"📊 Search completed\n" + "-" * 40
                    if stream_callback:
                        await stream_callback({"type": "results", "content": results_msg})
                    else:
                        print(results_msg)
                elif isinstance(last_msg, AIMessage) and node_name == "summarize":
                    # This is the final answer
                    final_answer = f"\n🎯 Final Answer:\n{last_msg.content}\n"
                    if stream_callback:
                        await stream_callback({"type": "final_answer", "content": final_answer})
                    else:
                        print(final_answer)


async def run_agent(query: str, thread_id: str, use_langgraph_events=False, use_memory: bool = False):
    """Run the agent with streaming output."""
    await run_agent_sse(query, thread_id, use_langgraph_events=use_langgraph_events, use_memory=use_memory)