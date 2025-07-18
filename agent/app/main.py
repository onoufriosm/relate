"""Main entry point for the ReAct agent."""

import asyncio
from dotenv import load_dotenv

from app.runner import run_agent

# Load environment variables - local .env takes precedence over root .env
load_dotenv(dotenv_path="../../.env")  # Root .env first
load_dotenv()  # Local .env second (overrides root if present)


async def async_main():
    """Demonstrate persistent context across multiple queries."""
    # Use the same thread_id for both queries to maintain context
    thread_id = "demo-conversation-123"

    # Toggle between streaming modes
    use_langgraph_events = True  # Set to True to use LangGraph events
    use_memory = True  # Enable in-memory checkpointer for local execution

    # First query
    print("=" * 80)
    print("FIRST QUERY")
    print("=" * 80)
    await run_agent(
        "What are the top cities that are best for families?",
        thread_id,
        use_langgraph_events,
        use_memory,
    )

    print("\n" + "=" * 80)
    print("SECOND QUERY (with context)")
    print("=" * 80)
    # Second query that references the first
    await run_agent(
        "Print out the cities above in a list with only their names",
        thread_id,
        use_langgraph_events,
        use_memory,
    )


def main():
    """Synchronous main function for CLI entry point."""
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
