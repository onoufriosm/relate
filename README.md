# Relate Project

AI-powered research and conversation platform with LangGraph agent, FastAPI backend, and React frontend.

## Quick Start

### Prerequisites
- Docker Desktop
- API keys: OpenAI, LangSmith, Tavily

### Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd relate

# 2. Run setup script
./setup-docker.sh setup

# 3. Configure API keys in agent/.env
OPENAI_API_KEY=sk-proj-your_key_here
LANGSMITH_API_KEY=lsv2_pt_your_key_here
TAVILY_API_KEY=tvly-dev_your_key_here

# 4. Start services
docker-compose up -d
```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Agent API**: http://localhost:2024
- **API Docs**: http://localhost:8000/docs

## Services

- **agent**: LangGraph AI agent (port 2024)
- **backend**: FastAPI backend (port 8000)
- **web**: React frontend (port 5173)

## Development

### Commands
```bash
# Start development
./setup-docker.sh start

# View logs
docker-compose logs -f

# Restart services
./setup-docker.sh restart

# Stop services
./setup-docker.sh stop

# Clean up
./setup-docker.sh cleanup
```

### Hot Reload
- **Web**: Vite HMR
- **Backend**: FastAPI auto-reload
- **Agent**: LangGraph development mode

## Production Deployment

### Docker Compose
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Platform-Specific
- **Vercel**: Frontend only
- **Render**: Full stack
- **AWS ECS**: Container orchestration
- **Google Cloud Run**: Serverless containers

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Environment Variables

### Required
```env
# agent/.env
OPENAI_API_KEY=sk-proj-your_key_here
LANGSMITH_API_KEY=lsv2_pt_your_key_here
TAVILY_API_KEY=tvly-dev_your_key_here

# backend/.env
PORT=8000

# web/.env
VITE_BACKEND_URL=http://localhost:8000
```

See [ENV_GUIDE.md](ENV_GUIDE.md) for complete configuration.

## Common Issues

### Port conflicts
```bash
# Find and kill process
lsof -i :5173
kill -9 $(lsof -t -i:5173)
```

### Environment variables
```bash
# Check files exist
ls -la .env*
cat agent/.env | grep OPENAI_API_KEY
```

### Services not starting
```bash
# Check logs
docker-compose logs -f
```

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more solutions.

## API Documentation

### Backend Endpoints
- `GET /health` - Health check
- `POST /api/chat` - Chat conversation
- `GET /api/threads` - List threads
- `POST /api/threads` - Create thread

### Agent Endpoints
- `GET /health` - Health check
- `POST /runs` - Execute workflow
- `GET /runs/{run_id}` - Get status
- `POST /runs/{run_id}/stream` - Stream results

## Features

### AI Agent
- LangGraph workflow orchestration
- OpenAI integration
- Tavily search
- LangSmith tracing

### Backend
- FastAPI with OpenAPI docs
- RESTful endpoints
- Real-time streaming
- Thread management

### Frontend
- React Router v7
- TypeScript
- Tailwind CSS
- Real-time chat interface

## Documentation

- **[DOCKER.md](DOCKER.md)**: Docker setup
- **[ENV_GUIDE.md](ENV_GUIDE.md)**: Environment configuration
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Production deployment
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: Common issues

## Security

- Never commit API keys
- Use environment variables
- Rotate keys regularly
- Use HTTPS in production
- Implement CORS properly

## Contributing

1. Fork repository
2. Create feature branch
3. Add tests
4. Submit pull request

Follow TypeScript/Python standards and ensure all services pass health checks.

## Support

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review logs: `docker-compose logs -f`
3. Verify environment configuration
4. Check API key validity

**Note**: Requires Docker and valid API keys for OpenAI, LangSmith, and Tavily.