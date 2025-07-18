# Relate: AI-Powered Research Assistant

Relate is an intelligent research assistant that combines large language models with web search capabilities to help users explore complex topics. Unlike traditional chatbots, Relate features a sophisticated AI agent that breaks down research questions, searches the web strategically, and learns from user feedback.

## LangGraph graph
<img src="Screenshot%202025-07-14%20at%2016.17.04.png" alt="Agent Workflow" width="600">

## Core Features

**🧠 Smart Agent Workflow**: LangGraph-powered agent with structured reasoning that classifies queries, plans research strategies, pauses for human approval, and executes targeted web searches.

**🤝 Human-in-the-Loop**: Before searching, the agent presents its plan for user approval, feedback, or modifications - ensuring research stays focused and relevant.

**🧭 Memory & Learning**: Episodic memory system learns user preferences and patterns over time, becoming smarter about when to search and what queries to suggest.

**⚡ Real-time Streaming**: Live updates as research progresses with server-sent events for responsive user experience.

**🔍 Advanced Search**: Tavily web search integration with intelligent result synthesis and source attribution.

**📊 Observability**: LangSmith integration for complete workflow tracing, evaluation, and performance monitoring.

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI with streaming support  
- **Agent**: LangGraph + OpenAI GPT-4 + Tavily Search
- **Infrastructure**: Docker containerization

## Development Setup

### Prerequisites
- Docker Desktop
- API keys: OpenAI, LangSmith, Tavily

### Quick Start

```bash
# 1. Clone and navigate
git clone <repository-url>
cd relate

# 2. Configure API keys in agent/.env
OPENAI_API_KEY=sk-proj-your_key_here
LANGSMITH_API_KEY=lsv2_pt_your_key_here
TAVILY_API_KEY=tvly-dev_your_key_here

# 3. Start all services
docker-compose -f docker-compose.dev.yml up -d
```

**Access URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000  
- Agent API: http://localhost:2024
- API Docs: http://localhost:8000/docs

## Development Commands

```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart services  
docker-compose -f docker-compose.dev.yml restart

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild services
docker-compose -f docker-compose.dev.yml build
```

**Hot Reload**: All services support live reloading during development.

## Environment Configuration

**Required API Keys** (add to `agent/.env`):
```env
OPENAI_API_KEY=sk-proj-your_key_here
LANGSMITH_API_KEY=lsv2_pt_your_key_here
TAVILY_API_KEY=tvly-dev_your_key_here
```

**Optional** (backend/web have sensible defaults):
```env
# backend/.env
PORT=8000

# web/.env  
VITE_BACKEND_URL=http://localhost:8000
```

## Troubleshooting

**Port conflicts**: `lsof -i :5173` and `kill -9 $(lsof -t -i:5173)`

**Missing API keys**: Check `agent/.env` exists and has valid keys

**Services not starting**: Run `docker-compose -f docker-compose.dev.yml logs -f`

## Contributing

1. Fork repository
2. Create feature branch  
3. Test your changes
4. Submit pull request

**Note**: Requires Docker and valid API keys for OpenAI, LangSmith, and Tavily.