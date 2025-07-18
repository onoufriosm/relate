"""Core agent logic with multi-query search capability."""

from typing import Literal, Dict, Any
import uuid
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command, interrupt
from langsmith import traceable
from langsmith.run_helpers import get_current_run_tree
import time


from app.state import AgentState
from app.tools import tavily_search
from app.memory import EpisodicMemoryManager
from app.prompts import (
    SUMMARIZATION_TEMPLATE,
    QUERY_CLASSIFICATION_TEMPLATE,
    QUERY_PLANNING_TEMPLATE,
    DIRECT_ANSWER_TEMPLATE,
    current_date,
)


# Structured output schema for classification
class QueryClassification(BaseModel):
    """Classification of user query to determine processing approach."""

    classification: Literal["NEEDS_SEARCH", "DIRECT_ANSWER"] = Field(
        description="Whether the query needs web search or can be answered from conversation history"
    )
    reasoning: str = Field(
        description="Brief explanation of why this classification was chosen"
    )
    confidence: float = Field(
        description="Confidence score from 0.0 to 1.0 for this classification decision",
        ge=0.0,
        le=1.0,
    )


def create_state_update(state: AgentState, **updates) -> Dict[str, Any]:
    """Create a state update that preserves all existing fields."""
    start_time = time.time()
    
    result = {
        "messages": state.get("messages", []),
        "search_count": state.get("search_count", 0),
        "original_query": state.get("original_query", ""),
        "planned_queries": state.get("planned_queries", []),
        "search_results": state.get("search_results", []),
        "needs_search": state.get("needs_search", False),
        "user_feedback": state.get("user_feedback", ""),
        **updates,
    }
    
    total_time = time.time() - start_time
    if total_time > 0.01:  # Only log if takes more than 10ms
        search_results_size = len(str(result.get("search_results", [])))
        messages_size = len(str(result.get("messages", [])))
        print(f"🔍 TRACE: create_state_update took {total_time:.3f}s (search_results: {search_results_size} chars, messages: {messages_size} chars)")
    
    return result


def classification(
    state: AgentState,
) -> Command[Literal["planning", "direct_answer"]]:
    """Classify whether query needs search or can be answered directly."""
    # Use structured output for reliable classification
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(
        QueryClassification
    )

    # Get the current user message
    last_message = state["messages"][-1]
    current_query = (
        str(last_message.content) if isinstance(last_message, HumanMessage) else ""
    )

    # Filter conversation history to only include user and assistant messages
    # OpenAI API doesn't accept ToolMessage without proper tool_calls context
    # Exclude the current user message (last message)
    conversation_messages = []
    for msg in state["messages"][:-1]:  # Exclude current user message
        if isinstance(msg, (HumanMessage, AIMessage)):
            # Skip classification messages from previous runs
            if isinstance(msg, AIMessage) and str(msg.content).startswith(
                "Classification:"
            ):
                continue
            conversation_messages.append(msg)
        # Skip ToolMessage objects as they cause OpenAI API errors

    # Format conversation history for inclusion in system message
    conversation_history = ""
    if conversation_messages:
        history_parts = []
        for msg in conversation_messages:
            if isinstance(msg, HumanMessage):
                history_parts.append(f"User: {msg.content}")
            elif isinstance(msg, AIMessage):
                history_parts.append(f"Assistant: {msg.content}")
        conversation_history = "\n".join(history_parts)
    else:
        conversation_history = "No previous conversation history."

    # Create system message with conversation history embedded
    system_message = {
        "role": "system",
        "content": QUERY_CLASSIFICATION_TEMPLATE.format(
            current_query=current_query, conversation_history=conversation_history
        ),
    }

    # Create a simple user message with just the current query
    user_message = {"role": "user", "content": current_query}

    # Pass system message + current query to LLM
    messages_for_llm = [system_message, user_message]

    # Get structured classification response
    classification_result: QueryClassification = llm.invoke(messages_for_llm)

    # Extract classification decision
    needs_search = classification_result.classification == "NEEDS_SEARCH"

    if needs_search:
        print(f"🔍 Classification: NEEDS_SEARCH - {classification_result.reasoning}")
        print(f"   Confidence: {classification_result.confidence:.2f}")
        goto = "planning"
        update = {
            "original_query": current_query,
            "planned_queries": [],
            "search_results": [],
            "search_count": 0,
            "needs_search": True,
        }
    else:
        print(f"💬 Classification: DIRECT_ANSWER - {classification_result.reasoning}")
        print(f"   Confidence: {classification_result.confidence:.2f}")
        goto = "direct_answer"
        update = {"original_query": current_query, "needs_search": False}

    return Command(goto=goto, update=update)


async def direct_answer(state: AgentState) -> Dict[str, Any]:
    """Answer query directly from conversation history."""
    llm = ChatOpenAI(model="gpt-4o-mini", streaming=True, temperature=0)

    # Get the current user message
    original_query = state["original_query"]

    # Filter conversation history to only include user and assistant messages
    # OpenAI API doesn't accept ToolMessage without proper tool_calls context
    conversation_messages = []
    for msg in state["messages"]:
        if isinstance(msg, (HumanMessage, AIMessage)):
            # Skip classification messages from previous runs
            if isinstance(msg, AIMessage) and str(msg.content).startswith(
                "Classification:"
            ):
                continue
            conversation_messages.append(msg)
        # Skip ToolMessage objects as they cause OpenAI API errors

    # Format conversation history for inclusion in system message
    conversation_history = ""
    if conversation_messages:
        history_parts = []
        for msg in conversation_messages:
            if isinstance(msg, HumanMessage):
                history_parts.append(f"User: {msg.content}")
            elif isinstance(msg, AIMessage):
                history_parts.append(f"Assistant: {msg.content}")
        conversation_history = "\n".join(history_parts)
    else:
        conversation_history = "No previous conversation history."

    # Create system message with conversation history embedded
    system_message = {
        "role": "system",
        "content": DIRECT_ANSWER_TEMPLATE.format(
            original_query=original_query, conversation_history=conversation_history
        ),
    }

    # Create a simple user message with just the current query
    user_message = {"role": "user", "content": original_query}

    # Pass system message + current query to LLM
    messages_for_llm = [system_message, user_message]

    response_content = ""
    
    # Use the same streaming pattern as summarization_node
    async for chunk in llm.astream([HumanMessage(content=system_message["content"] + "\n\n" + user_message["content"])]):
        if hasattr(chunk, "content") and chunk.content:
            response_content += str(chunk.content)

    return create_state_update(
        state,
        messages=[AIMessage(content=response_content)],
        original_query=original_query,
    )


async def planning(state: AgentState) -> Dict[str, Any]:
    """Analyze user query and plan search queries."""
    llm = ChatOpenAI(model="gpt-4o-mini", streaming=True, temperature=0)

    # Get the current user message
    last_message = state["messages"][-1]
    current_query = (
        str(last_message.content) if isinstance(last_message, HumanMessage) else ""
    )

    # Filter conversation history to only include user and assistant messages
    # OpenAI API doesn't accept ToolMessage without proper tool_calls context
    conversation_messages = []
    for msg in state["messages"][:-1]:  # Exclude current user message
        if isinstance(msg, (HumanMessage, AIMessage)):
            # Skip classification messages from previous runs
            if isinstance(msg, AIMessage) and str(msg.content).startswith(
                "Classification:"
            ):
                continue
            conversation_messages.append(msg)
        # Skip ToolMessage objects as they cause OpenAI API errors

    # Format conversation history for inclusion in system message
    conversation_history = ""
    if conversation_messages:
        history_parts = []
        for msg in conversation_messages:
            if isinstance(msg, HumanMessage):
                history_parts.append(f"User: {msg.content}")
            elif isinstance(msg, AIMessage):
                history_parts.append(f"Assistant: {msg.content}")
        conversation_history = "\n".join(history_parts)
    else:
        conversation_history = "No previous conversation history."

    # Check if there's user feedback to incorporate
    user_feedback = state.get("user_feedback", "")
    
    # Create system message with conversation history embedded
    planning_message = QUERY_PLANNING_TEMPLATE.format(
        current_query=current_query,
        conversation_history=conversation_history,
        current_date=current_date
    )

    if user_feedback:
        planning_message += f"\n\nUser feedback on previous queries: {user_feedback}\nPlease revise the queries based on this feedback."

    # Create system message for planning
    system_message = {
        "role": "system",
        "content": planning_message
    }

    # Create a simple user message with just the current query
    user_message = {
        "role": "user", 
        "content": current_query
    }

    # Pass system message + current query to LLM
    messages_for_llm = [system_message, user_message]

    response_content = ""
    async for chunk in llm.astream(messages_for_llm):
        if hasattr(chunk, "content") and chunk.content:
            response_content += str(chunk.content)

    # Parse queries from response
    queries = [q.strip() for q in response_content.strip().split("\n") if q.strip()]
    queries = queries[:3]  # Limit to 3 queries max

    return create_state_update(
        state,
        messages=[AIMessage(content=f"Planned {len(queries)} search queries")],
        original_query=current_query,
        planned_queries=queries,
        search_results=[],
        search_count=0,
        user_feedback="",  # Clear feedback after using it
    )


@traceable
def human_review(state: AgentState) -> Dict[str, Any]:
    """Present planned queries to user for review and feedback."""
    queries = state.get("planned_queries", [])
    current_query = state.get("original_query", "")

    print(f"🔄 DEBUG: human_review called - queries: {queries}")

    # Present queries to user for review using interrupt
    review_message = f"""I've planned the following search queries for: "{current_query}"

Planned queries:
{chr(10).join(f"{i + 1}. {q}" for i, q in enumerate(queries))}

Options:
- Type "approve" to proceed with these queries
- Provide feedback to improve the queries (e.g., "focus more on recent developments" or "add query about pricing")
- Type "skip" to answer without searching"""

    print(f"🔄 DEBUG: About to call interrupt with message: {review_message[:100]}...")

    # Use interrupt to pause and wait for user input
    user_feedback_raw = interrupt(review_message)

    print(f"🔄 DEBUG: interrupt returned: {user_feedback_raw}")

    # Extract the actual user input from the resume dictionary
    if isinstance(user_feedback_raw, dict):
        # Get the first (and should be only) value from the resume dict
        user_feedback = next(iter(user_feedback_raw.values()))
    else:
        user_feedback = user_feedback_raw

    print(f"🔄 DEBUG: processed user_feedback: {user_feedback}")

    # Update state with user feedback
    return create_state_update(state, user_feedback=user_feedback)


def process_feedback_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    """Process user feedback from human review and store episodic memory."""
    user_input = state.get("user_feedback", "")

    # Store rich episodic memory from this interaction
    current_query = state.get("original_query", "")
    planned_queries = state.get("planned_queries", [])

    memory_manager = EpisodicMemoryManager(config)
    if memory_manager.is_enabled() and current_query and planned_queries:
        # Determine user action
        if user_input and user_input.lower() == "approve":
            action = "approve"
        elif user_input and user_input.lower() == "skip":
            action = "skip"
        else:
            action = "feedback"

        # Store rich episode for future learning
        memory_manager.store_episode(
            original_query=current_query,
            planned_searches=planned_queries,
            user_decision=action,
            user_feedback_text=user_input if action == "feedback" else None,
        )

    if user_input and user_input.lower() == "approve":
        # User approved, proceed to search
        return create_state_update(state)
    elif user_input and user_input.lower() == "skip":
        # User wants to skip search and get direct answer
        return create_state_update(state)
    else:
        # User provided feedback or no input, go back to planning with feedback
        feedback = user_input if user_input else "Please revise the queries"
        return create_state_update(
            state,
            messages=state["messages"]
            + [HumanMessage(content=f"User feedback on planned queries: {feedback}")],
            user_feedback=feedback,
        )


@traceable
async def search_execution_node(state: AgentState) -> Dict[str, Any]:
    """Execute the next planned search query."""
    run_tree = get_current_run_tree()
    start_time = time.time()

    planned_queries = state.get("planned_queries", [])
    search_count = state.get("search_count", 0)
    search_results = state.get("search_results", [])

    if search_count >= len(planned_queries):
        print(f"🔍 TRACE: No more searches needed (count: {search_count}, planned: {len(planned_queries)})")
        return state  # No more queries to execute

    current_query = planned_queries[search_count]
    print(f"🔍 TRACE: Starting search {search_count + 1}/{len(planned_queries)}: '{current_query}'")

    if run_tree:
        run_tree.extra = {
            "node": "search_execution",
            "search_count": search_count + 1,
            "query": current_query,
            "start_time": start_time,
        }

    search_start = time.time()
    results = await tavily_search.ainvoke({"query": current_query})
    search_time = time.time() - search_start

    print(f"⚡ TRACE: Search {search_count + 1} completed in {search_time:.2f}s")
    print(f"📏 TRACE: Results length: {len(str(results))} characters")

    if run_tree:
        run_tree.extra.update(
            {
                "search_time": search_time,
                "results_length": len(str(results)),
                "total_time": time.time() - start_time,
            }
        )

    search_results.append({"query": current_query, "results": results})

    # Track state update time
    state_update_start = time.time()
    result = create_state_update(
        state,
        messages=[ToolMessage(content=results, tool_call_id=f"search_{search_count}")],
        search_count=search_count + 1,
        search_results=search_results,
    )
    state_update_time = time.time() - state_update_start
    
    total_time = time.time() - start_time
    print(f"🔍 TRACE: Search {search_count + 1} node completed in {total_time:.3f}s (state_update: {state_update_time:.3f}s)")
    
    # Check if this was the last search
    if search_count + 1 >= len(planned_queries):
        print(f"🔍 TRACE: ✅ All searches completed ({search_count + 1}/{len(planned_queries)})")
    
    return result


@traceable
def pre_summarize_node(state: AgentState) -> Dict[str, Any]:
    """Signal that we're about to start summarization."""
    start_time = time.time()
    print(f"🔍 TRACE: pre_summarize_node entered at {start_time}")
    
    # Track state processing time
    state_start = time.time()
    result = create_state_update(state)
    state_time = time.time() - state_start
    
    total_time = time.time() - start_time
    print(f"🔍 TRACE: pre_summarize_node completed in {total_time:.3f}s (state_update: {state_time:.3f}s)")
    
    return result


@traceable
async def summarization_node(state: AgentState) -> Dict[str, Any]:
    """Combine all search results into a comprehensive answer."""
    run_tree = get_current_run_tree()
    start_time = time.time()

    if run_tree:
        run_tree.extra = {"node": "summarization", "start_time": start_time}

    print(f"🔍 TRACE: Summarization node started at {start_time}")

    # Track LLM initialization time
    llm_init_start = time.time()
    llm = ChatOpenAI(model="gpt-4o-mini", streaming=True, temperature=0)
    llm_init_time = time.time() - llm_init_start
    print(f"⚡ TRACE: LLM initialization took {llm_init_time:.2f}s")

    original_query = state.get("original_query", "")
    search_results = state.get("search_results", [])

    # Track data processing time
    processing_start = time.time()
    combined_results = ""
    for i, result in enumerate(search_results, 1):
        combined_results += (
            f"\n--- Search {i}: {result['query']} ---\n{result['results']}\n"
        )

    summary_prompt = SUMMARIZATION_TEMPLATE.format(
        original_query=original_query, combined_results=combined_results
    )
    processing_time = time.time() - processing_start
    print(f"📊 TRACE: Data processing took {processing_time:.2f}s")
    print(f"📏 TRACE: Prompt length: {len(summary_prompt)} characters")

    if run_tree:
        run_tree.extra.update(
            {
                "llm_init_time": llm_init_time,
                "processing_time": processing_time,
                "prompt_length": len(summary_prompt),
                "search_results_count": len(search_results),
            }
        )

    # Track time to first token and streaming
    streaming_start = time.time()
    first_token_time = None
    response_content = ""
    token_count = 0

    print(f"🚀 TRACE: Starting LLM streaming at {streaming_start}")

    try:
        async for chunk in llm.astream([HumanMessage(content=summary_prompt)]):
            if hasattr(chunk, "content") and chunk.content:
                if first_token_time is None:
                    first_token_time = time.time()
                    ttft = first_token_time - streaming_start
                    print(f"⚡ TRACE: Time to first token: {ttft:.2f}s")

                    if run_tree:
                        run_tree.extra.update(
                            {
                                "time_to_first_token": ttft,
                                "first_token_at": first_token_time,
                            }
                        )

                response_content += str(chunk.content)
                token_count += 1

                # Log progress every 50 tokens
                if token_count % 50 == 0:
                    elapsed = time.time() - streaming_start
                    print(f"🔄 TRACE: {token_count} tokens in {elapsed:.2f}s")

    except Exception as e:
        error_time = time.time() - start_time
        print(f"❌ TRACE: Error after {error_time:.2f}s: {e}")
        if run_tree:
            run_tree.extra.update({"error": str(e), "error_time": error_time})
        raise

    total_time = time.time() - start_time
    streaming_time = time.time() - streaming_start

    print(f"✅ TRACE: Summarization completed in {total_time:.2f}s")
    print(f"📈 TRACE: Streaming took {streaming_time:.2f}s for {token_count} tokens")
    print(f"📊 TRACE: Average token rate: {token_count / streaming_time:.1f} tokens/s")

    if run_tree:
        run_tree.extra.update(
            {
                "total_time": total_time,
                "streaming_time": streaming_time,
                "token_count": token_count,
                "tokens_per_second": token_count / streaming_time
                if streaming_time > 0
                else 0,
                "response_length": len(response_content),
            }
        )

    return create_state_update(state, messages=[AIMessage(content=response_content)])


def memory_check_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    """Check if we should auto-decide based on learned episodic patterns."""
    # Get current query and planned searches
    current_query = state.get("original_query", "")
    planned_searches = state.get("planned_queries", [])

    print(
        f"🔄 DEBUG: memory_check_node - query: '{current_query}', searches: {planned_searches}"
    )

    # Initialize episodic memory manager with config for store access
    memory_manager = EpisodicMemoryManager(config)

    print(f"🔄 DEBUG: memory_manager.is_enabled(): {memory_manager.is_enabled()}")

    if memory_manager.is_enabled() and current_query and planned_searches:
        # Use episodic memory to determine if we should auto-decide
        auto_decision = memory_manager.should_auto_decide(
            current_query, planned_searches
        )

        print(f"🔄 DEBUG: auto_decision: {auto_decision}")

        if auto_decision:
            # Store the auto-decision as user feedback for downstream processing
            return create_state_update(state, user_feedback=auto_decision)
    else:
        print("🔄 DEBUG: Memory not enabled or missing data")

    # No auto-decision made, proceed with normal flow
    print("🔄 DEBUG: No auto-decision, proceeding to human review")
    return create_state_update(state)


def after_memory_check(
    state: AgentState,
) -> Literal["human_review", "process_feedback"]:
    """Determine next step after memory check."""
    user_feedback = state.get("user_feedback", "")

    print(f"🔄 DEBUG: after_memory_check - user_feedback: '{user_feedback}'")

    # If memory made an auto-decision, skip human review
    if user_feedback in ["approve", "skip"]:
        print(f"🧠 Memory auto-decided: {user_feedback}")
        return "process_feedback"

    # Otherwise, ask human for review
    print("👤 Going to human review")
    return "human_review"


def after_planning(state: AgentState) -> Literal["memory_check"]:
    """Determine next step after planning queries."""
    return "memory_check"


def after_human_review(state: AgentState) -> Literal["process_feedback"]:
    """Determine next step after human review."""
    return "process_feedback"


def after_process_feedback(
    state: AgentState,
) -> Literal["planning", "search", "direct_answer"]:
    """Determine next step after processing feedback."""
    user_feedback = state.get("user_feedback", "")

    # If user provided feedback (not approve/skip), go back to planning
    if user_feedback and user_feedback.lower() not in ["approve", "skip"]:
        return "planning"

    # If user said skip, answer directly from conversation history
    if user_feedback and user_feedback.lower() == "skip":
        return "direct_answer"

    # Otherwise proceed to search (user said approve)
    return "search"


def after_search(state: AgentState) -> Literal["search", "pre_summarize", "__end__"]:
    """Determine next step after executing a search."""
    start_time = time.time()
    print(f"🔍 TRACE: after_search routing entered at {start_time}")
    
    planned_queries = state.get("planned_queries", [])
    search_count = state.get("search_count", 0)
    
    print(f"🔍 TRACE: after_search - search_count: {search_count}, planned_queries: {len(planned_queries)}")

    # If we have more searches to do, continue searching
    if search_count < len(planned_queries):
        decision = "search"
        print(f"🔍 TRACE: after_search decision: {decision} (more searches needed)")
        return decision

    # If we've done all searches, go to pre-summarization signal
    if search_count >= len(planned_queries) and search_count > 0:
        decision = "pre_summarize"
        total_time = time.time() - start_time
        print(f"🔍 TRACE: after_search decision: {decision} (all searches complete) - took {total_time:.3f}s")
        return decision

    # Fallback (shouldn't happen)
    decision = "__end__"
    print(f"🔍 TRACE: after_search decision: {decision} (fallback)")
    return decision


def after_pre_summarize(state: AgentState) -> Literal["summarize"]:
    """Determine next step after pre-summarization signal."""
    start_time = time.time()
    print(f"🔍 TRACE: after_pre_summarize routing entered at {start_time}")
    
    decision = "summarize"
    total_time = time.time() - start_time
    print(f"🔍 TRACE: after_pre_summarize decision: {decision} - took {total_time:.3f}s")
    
    return decision


def create_agent(use_memory: bool = False):
    """Create the multi-query search agent graph with optional memory.

    Args:
        use_memory: Enable LangGraph checkpointing for conversation state
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("classification", classification)
    workflow.add_node("direct_answer", direct_answer)
    workflow.add_node("planning", planning)
    workflow.add_node("memory_check", memory_check_node)
    workflow.add_node("human_review", human_review)
    workflow.add_node("process_feedback", process_feedback_node)
    workflow.add_node("search", search_execution_node)
    workflow.add_node("pre_summarize", pre_summarize_node)
    workflow.add_node("summarize", summarization_node)

    workflow.set_entry_point("classification")
    # classification node uses Command with goto, so no conditional edges needed
    workflow.add_conditional_edges("direct_answer", lambda _: END)
    workflow.add_conditional_edges("planning", after_planning)
    workflow.add_conditional_edges("memory_check", after_memory_check)
    workflow.add_conditional_edges("human_review", after_human_review)
    workflow.add_conditional_edges("process_feedback", after_process_feedback)
    workflow.add_conditional_edges("search", after_search)
    workflow.add_conditional_edges("pre_summarize", after_pre_summarize)
    workflow.add_conditional_edges("summarize", lambda _: END)

    # Add in-memory checkpointer if requested (only for local development)
    if use_memory:
        from langgraph.checkpoint.memory import MemorySaver

        memory = MemorySaver()
        return workflow.compile(checkpointer=memory)
    else:
        return workflow.compile()


# Create the compiled graph for LangGraph deployment
# Note: LangGraph server provides automatic persistence, so no custom checkpointer needed
agent = create_agent(use_memory=False)

# Examples of memory usage:
#
# Standard agent (no conversation memory):
# agent = create_agent()
#
# With conversation state memory:
# agent = create_agent(use_memory=True)


def get_config(thread_id=None) -> RunnableConfig:
    """Get configuration with thread_id for agent execution."""
    if thread_id is None:
        thread_id = str(uuid.uuid4())

    return {"configurable": {"thread_id": thread_id}}
