# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Relate is an AI-powered research assistant that combines LLMs with web search capabilities. The system features a sophisticated LangGraph agent that classifies queries, plans research strategies, pauses for human approval, and executes targeted web searches with episodic memory learning.

## Architecture

**Three-tier Docker architecture:**

1. **Agent Service** (port 2024): LangGraph-powered agent with query classification, planning, search execution, and episodic memory
2. **Backend Service** (port 8000): FastAPI server handling streaming, thread management, and state coordination
3. **Web Service** (port 5173): React + TypeScript frontend with real-time SSE updates

**Key workflow:**
```
User Query → Classification → [NEEDS_SEARCH: Planning → Memory Check → Human Review → Multi-Search → Summarization]
                          → [DIRECT_ANSWER: Answer from conversation history]
```

## Development Setup

**Start all services in development mode:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**View logs:**
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

**Restart a single service:**
```bash
docker-compose -f docker-compose.dev.yml restart [agent|backend|web]
```

**Rebuild services after dependency changes:**
```bash
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
```

**Stop all services:**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Required environment variables** (in `agent/.env`):
```
OPENAI_API_KEY=sk-proj-...
LANGSMITH_API_KEY=lsv2_pt_...
TAVILY_API_KEY=tvly-dev_...
```

## Agent Architecture

**Core components:**

- `agent/app/agent.py`: Main agent logic with LangGraph workflow defining classification, planning, search execution, and summarization nodes
- `agent/app/state.py`: AgentState TypedDict defining conversation state (messages, search_count, planned_queries, search_results, user_feedback)
- `agent/app/memory.py`: EpisodicMemoryManager for learning user preferences using semantic search over past review episodes
- `agent/app/tools.py`: Tavily search integration
- `agent/app/prompts.py`: Prompt templates for classification, planning, and summarization

**Agent flow:**

1. **Classification**: Uses GPT-4o-mini with structured output to classify query as NEEDS_SEARCH or DIRECT_ANSWER
2. **Planning**: Generates 1-3 targeted search queries based on user intent
3. **Memory Check**: Queries episodic memory to potentially auto-approve/skip based on learned patterns (requires ≥3 similar episodes with ≥0.8 confidence)
4. **Human Review**: Presents planned queries with interrupt for user approval, feedback, or skip
5. **Search Execution**: Executes searches sequentially using Tavily
6. **Summarization**: Combines all results into comprehensive answer with source citations

**Node routing functions:** Agent uses conditional edge functions (after_planning, after_memory_check, after_process_feedback, after_search, after_pre_summarize) to determine next node in workflow based on state

**Human-in-the-loop:** Uses LangGraph's `interrupt()` to pause at human_review node, frontend sends resume Command through backend via is_response_to_interrupt flag

**Episodic memory:** Stores rich episodes (EpisodicReviewMemory) with query complexity, search quality, user decision, and feedback for semantic similarity learning using LangMem store

## Backend Architecture

**Core components:**

- `backend/app/routes.py`: Query handling, thread management, state extraction
- `backend/app/streaming.py`: SSE streaming from LangGraph agent
- `backend/app/thread_manager.py`: Thread interrupt status checking
- `backend/main.py`: FastAPI app initialization

**Key endpoints:**

- `POST /query-agent`: Send query or resume interrupt (handles is_response_to_interrupt flag)
- `GET /state/{thread_id}`: Fetch thread state with messages and search results
- `POST /threads/create`: Create new thread

**Streaming protocol:** Uses Server-Sent Events (SSE) to stream agent events in real-time. Supports incremental token streaming during summarization/direct_answer phases via messages/partial and messages/complete events

## Frontend Architecture

**Technology:** React Router v7 + TypeScript + Tailwind CSS v4

**Core components:**

- `web/app/home/`: Main chat interface
- `web/app/components/`: Reusable UI components (ChatMessage, SearchResultsDisplay, MarkdownContent)
- `web/app/services/`: Backend API client
- `web/app/hooks/`: Custom React hooks (useStreamingChat for SSE handling)

**State management:** React hooks for thread state, streaming state, and interrupt handling

**Key hooks:**

- `web/app/hooks/useChat.ts`: Main chat logic for sending messages and handling streaming responses
- `web/app/hooks/useStateRestore.ts`: Restores thread state from backend on component mount
- `web/app/hooks/useUrlThreadId.ts`: Manages thread_id from URL parameters
- `web/app/hooks/useAutoScroll.ts`: Auto-scrolls chat to bottom on new messages

**Frontend dev commands:**
```bash
cd web
npm install              # Install dependencies
npm run dev             # Start dev server (runs on port 5173)
npm run build           # Production build
npm run typecheck       # TypeScript checking
npm run lint            # ESLint
npm run format          # Format code with Prettier
```

## Testing

**Agent evaluation:**
```bash
cd agent
uv run python run_eval.py --type all              # Run all evaluations
uv run python run_eval.py --type classification   # Classification tests only
uv run python run_eval.py --type e2e              # End-to-end tests only
```

Evaluation uses LangSmith datasets for classification accuracy testing

**Python dependency management:**
```bash
cd agent
uv sync                  # Sync dependencies from pyproject.toml
uv add <package>         # Add new dependency
uv pip install <package> # Install package in venv
```

## Key Patterns

**State updates:** Always use `create_state_update(state, **updates)` helper in agent nodes to preserve all state fields

**Message filtering:** Filter out ToolMessages before sending to OpenAI API (causes errors without proper tool_calls context)

**LangGraph deployment:** Agent uses LangGraph server's built-in persistence, no custom checkpointer in production

**Streaming:** Backend uses async generators to stream SSE events from LangGraph to frontend

**Thread management:** Backend checks interrupt status before processing to determine if message is new query or resume value

## Troubleshooting

**Port conflicts:**
```bash
lsof -i :5173
kill -9 $(lsof -t -i:5173)
```

**Service not starting:** Check logs with `docker-compose -f docker-compose.dev.yml logs -f [service]`

**Missing API keys:** Verify `agent/.env` exists with valid OpenAI, LangSmith, and Tavily keys

**Hot reload not working:** Restart the specific service with `docker-compose -f docker-compose.dev.yml restart [service]`

## Access URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Agent API: http://localhost:2024
- API Docs: http://localhost:8000/docs

## Code Style

- Python: Use `uv` for dependency management
- TypeScript: Follow React Router v7 conventions
- Keep code concise and clear
- Brief commit messages
- Always ask before committing and pushing to git
