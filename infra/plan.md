# Deployment Plan for Relate

## Project Overview
Multi-service application with:
- **Web**: React + Vite frontend
- **Backend**: FastAPI server  
- **Agent**: LangGraph agent with human-in-the-loop capabilities

## IMMEDIATE PLANS

### Local Development (Current)
**Simple terminal-based setup** - optimal for solo developer rapid iteration:

```bash
# Terminal 1: Agent (LangGraph server)
cd agent && uv run langgraph dev

# Terminal 2: Backend (FastAPI)
cd backend && uv run uvicorn main:app --reload --port 8000

# Terminal 3: Web (Vite dev server)
cd web && npm run dev
```

**Service URLs**: Web (5173), Backend (8000), Agent (2024)

### Production Deployment (Deferred Decision)

#### Phase 1: Docker Infrastructure (Current Priority)
**Build Docker setup first** - enables deployment flexibility to any platform:

**Implementation Steps:**
1. Create Dockerfiles for each service with environment variable support
2. Build docker-compose.yml for local development and testing
3. Set up `.env.example` files for each service
4. Test full stack locally with Docker Desktop on Mac
5. Document deployment process

**Benefits:**
- ✅ **Platform agnostic** - same containers work everywhere
- ✅ **Local testing** - exact production environment on Mac
- ✅ **Decision flexibility** - choose platform when ready
- ✅ **No vendor lock-in** - can migrate easily

#### Phase 2: Platform Selection (Future)
**Planned deployment strategy:**
- **Web**: Vercel (free tier, perfect for React)
- **Backend**: Render ($7/month web service)
- **Agent**: Render ($7/month web service)
- **Database**: Render (free PostgreSQL + Redis)
- **Total Cost**: ~$14/month

#### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: ./web
    ports: ["${WEB_PORT:-5173}:${WEB_PORT:-5173}"]
    environment:
      - PORT=${WEB_PORT:-5173}
      - VITE_BACKEND_URL=${BACKEND_URL:-http://localhost:8000}
    
  backend:
    build: ./backend
    ports: ["${BACKEND_PORT:-8000}:${BACKEND_PORT:-8000}"]
    environment:
      - PORT=${BACKEND_PORT:-8000}
      - LANGGRAPH_SERVER_URL=${LANGGRAPH_URL:-http://langgraph-api:8000}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
    
  langgraph-api:
    build: ./agent
    ports: ["${AGENT_PORT:-2024}:8000"]
    environment:
      - PORT=8000
      - POSTGRES_URI=${DATABASE_URL:-postgres://postgres:postgres@postgres:5432/postgres}
      - REDIS_URI=${REDIS_URL:-redis://redis:6379}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-postgres}
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:6

volumes:
  postgres_data:
```

#### Phase 3: AWS Migration (Future Scaling)
**When outgrowing platform deployment** (~$46-98/month):

```
Internet → ALB → ECS Services
                 ├── Web (React)
                 ├── Backend (FastAPI)
                 └── Agent (LangGraph)
                 
Supporting:
- RDS PostgreSQL (agent checkpoints)
- Secrets Manager (API keys)
- ECR (container registry)
```

**Migration Benefits:**
- Auto-scaling capabilities
- Enterprise-grade reliability
- Advanced monitoring and logging
- Multi-region deployment options

## FUTURE PLANS

### Team Growth
- **Staging environment** on Render
- **CI/CD pipeline** with GitHub Actions
- **Environment separation** (dev/staging/prod)

### Scale Optimizations  
- **Vercel Pro** for advanced web features
- **Render scaling** for backend/agent services
- **CDN optimization** for global performance
- **Database scaling** and optimization

### Advanced Features
- **User authentication** system
- **Analytics and metrics** collection
- **Background job processing**
- **Real-time notifications**

### AWS Migration (When Needed)
- **Auto-scaling** ECS services
- **Multi-AZ RDS** for high availability
- **CloudWatch** monitoring and alerting
- **Lambda functions** for background processing

## Configuration Management

### Environment Variables Structure
```bash
# Development (.env files)
# web/.env
VITE_BACKEND_URL=http://localhost:8000

# backend/.env  
LANGGRAPH_SERVER_URL=http://localhost:2024
FRONTEND_URL=http://localhost:5173
PORT=8000

# agent/.env
PORT=2024
OPENAI_API_KEY=sk-...
LANGSMITH_API_KEY=lsv2_...
TAVILY_API_KEY=tvly-...

# Production (Platform-provided)
# Platforms auto-assign:
PORT=8000  # Platform assigns
DATABASE_URL=postgresql://...  # Platform provides
REDIS_URL=redis://...  # Platform provides

# Service URLs (platform-generated):
LANGGRAPH_SERVER_URL=https://agent-service.railway.app
VITE_BACKEND_URL=https://backend-service.railway.app
FRONTEND_URL=https://web-service.railway.app
```

### Secret Management
- **Development**: Local `.env` files (gitignored)
- **CI/CD**: GitHub Secrets for deployment
- **Production Runtime**: 
  - Vercel: Environment variables for web
  - Render: Platform secrets for backend/agent
- **Future AWS**: Secrets Manager integration

## Security and Secrets Configuration

### Required GitHub Secrets (For CI/CD)
When setting up automated deployment, add these secrets in GitHub repository settings:

```bash
# GitHub Repository → Settings → Secrets and variables → Actions

# API Keys (Required for agent functionality)
OPENAI_API_KEY=sk-proj-your_actual_openai_key_here
LANGSMITH_API_KEY=lsv2_pt_your_actual_langsmith_key_here
TAVILY_API_KEY=tvly-your_actual_tavily_key_here

# Platform Deployment (When using CI/CD)
VERCEL_TOKEN=your_vercel_deployment_token
RENDER_API_KEY=your_render_api_key

# Optional: Database URLs for production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port
```

### Environment Variable Security Practices

#### ✅ Safe to Commit (.env.example files)
```bash
# Port configurations
PORT=8000
WEB_PORT=5173
AGENT_PORT=2024

# Service URLs (templates)
LANGGRAPH_SERVER_URL=http://localhost:2024
VITE_BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Feature flags and configuration
NODE_ENV=development
LANGSMITH_TRACING=false
```

#### ❌ Never Commit (Local .env files)
```bash
# Real API keys - ADD TO .gitignore
OPENAI_API_KEY=sk-proj-real_key_here
LANGSMITH_API_KEY=lsv2_pt_real_key_here  
TAVILY_API_KEY=tvly-real_key_here

# Production URLs with actual domains
VITE_BACKEND_URL=https://api.yourdomain.com
DATABASE_URL=postgresql://real_connection_string
```

### Platform-Specific Secret Configuration

#### Vercel (Web Deployment)
```bash
# Dashboard → Project → Settings → Environment Variables
VITE_BACKEND_URL=https://your-backend.render.com
```

#### Render (Backend/Agent Deployment)  
```bash
# Dashboard → Service → Environment
OPENAI_API_KEY=sk-proj-...
LANGSMITH_API_KEY=lsv2_pt_...
TAVILY_API_KEY=tvly-...
LANGGRAPH_SERVER_URL=https://your-agent.render.com
FRONTEND_URL=https://your-app.vercel.app
```

### Local Development Security

#### Setup Process
1. Copy `.env.example` files to `.env` in each service directory
2. Replace placeholder values with real API keys
3. Ensure `.env` files are in `.gitignore`
4. Use Docker secrets for sensitive data in containers

#### Validation Commands
```bash
# Check for accidentally committed secrets
git log --all --full-history -- .env

# Validate environment setup
docker-compose config
```

### Production Security Checklist

#### Before Deployment
- [ ] All `.env` files added to `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] API keys added to platform secret managers
- [ ] Environment variables validated in staging
- [ ] Security scanning passed

#### Platform Security Features
- **Vercel**: Automatic HTTPS, environment variable encryption
- **Render**: Secret encryption, network isolation, HTTPS
- **AWS**: IAM roles, Secrets Manager, VPC isolation

## Implementation Timeline

### ✅ Completed
- Simple local development working
- Environment variable management
- Service communication established
- **Docker infrastructure implementation:**
  - ✅ Production-ready Dockerfiles for all services (web, backend, agent)
  - ✅ Comprehensive docker-compose.yml with development overrides
  - ✅ .env.example files for all services with security best practices
  - ✅ Complete Docker documentation (DOCKER.md, ENV_GUIDE.md, etc.)
  - ✅ Automated setup scripts and Makefile
  - ✅ Security practices and secret management documentation

### 🎯 Current (Ready to Execute)
1. **Test Docker setup locally:**
   ```bash
   # Copy environment files and add real API keys
   cp .env.example .env
   cp web/.env.example web/.env
   cp backend/.env.example backend/.env  
   cp agent/.env.example agent/.env
   
   # Start full stack
   docker-compose up --build
   ```

2. **Validate full stack integration:**
   - Test web → backend → agent communication
   - Verify database persistence (PostgreSQL)
   - Confirm environment variable configuration
   - Test development hot reload functionality

### 🔮 Next (When Ready to Deploy)
1. Deploy web to Vercel (free tier)
2. Deploy backend + agent to Render ($14/month)
3. Configure platform-specific environment variables
4. Set up CI/CD automation
5. Configure monitoring and alerts

## Decision Log
- **Simple local development** over Docker for rapid iteration
- **Docker-first infrastructure** for deployment flexibility
- **Platform deployment** (Vercel + Render) for cost-effective production
- **Environment variables** for all configuration (ports, URLs, secrets)
- **GitHub Secrets** for CI/CD, **Platform Secrets** for runtime
- **Local Docker testing** on Mac for production parity
- **AWS migration** deferred until scaling needs justify costs
- **Separate databases** for agent vs backend (when needed)
- **No LocalStack** - unnecessary complexity for current needs