"""Thread management for the agent API."""

from .config import langgraph_client


async def check_thread_interrupt_status(thread_id: str) -> bool:
    """Check if thread has a pending interrupt that needs resolution."""
    try:
        # Get the thread state to check for interrupts using thread_id directly
        thread_state = await langgraph_client.threads.get_state(thread_id=thread_id)
        
        # Check if there's an interrupt in the thread state
        # LangGraph typically stores interrupt information in the state
        return thread_state.get("next", []) == ["__interrupt__"] or "interrupt" in str(thread_state)
    except Exception:
        return False