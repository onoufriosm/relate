"""Agent state definition."""

from typing import Annotated, List, TypedDict, Dict, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    search_count: int
    original_query: str
    planned_queries: List[str]
    search_results: List[Dict[str, Any]]
    needs_search: bool
    user_feedback: str