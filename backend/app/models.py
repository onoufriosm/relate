"""Data models for the agent API."""

from pydantic import BaseModel


class AgentQuery(BaseModel):
    """Model for querying the agent."""
    message: str
    thread_id: str
    is_response_to_interrupt: bool = False


class AgentResume(BaseModel):
    """Model for resuming agent execution from interrupt."""
    resume_value: str
    thread_id: str