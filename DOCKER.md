# Docker Setup

## Quick Start

```bash
# 1. Copy environment file
cp .env.docker.example .env

# 2. Set API keys in .env
OPENAI_API_KEY=sk-proj-your_key_here
LANGSMITH_API_KEY=lsv2_pt_your_key_here
TAVILY_API_KEY=tvly-dev-your_key_here

# 3. Run production
docker-compose up -d

# 4. Run development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Services

- **agent**: LangGraph agent (port 2024)
- **backend**: FastAPI backend (port 8000)
- **web**: React frontend (port 3000/5173)
- **postgres**: Database (port 5432)
- **redis**: Cache (port 6379)

## Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Build services
docker-compose build

# Restart services
docker-compose restart
```

### Development Mode
```bash
# Start with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Build and start
docker-compose up --build
```

### Debugging
```bash
# Check service status
docker-compose ps

# Access container
docker-compose exec backend bash

# Follow specific service logs
docker-compose logs -f agent
```

### Database
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U relate_user -d relate_db

# Backup database
docker-compose exec postgres pg_dump -U relate_user relate_db > backup.sql
```

### Cleanup
```bash
# Remove containers and volumes
docker-compose down -v

# Clean build cache
docker-compose build --no-cache

# Remove everything
docker system prune -a
```

## Common Issues

### Port conflicts
```bash
# Change port in .env
BACKEND_PORT=8001

# Or kill process
kill -9 $(lsof -t -i:8000)
```

### Build failures
```bash
# Clean build
docker-compose build --no-cache

# Remove images and rebuild
docker-compose down --rmi all
docker-compose up --build
```

### Environment variables
```bash
# Check if .env files exist
ls -la .env*

# Verify environment in container
docker-compose exec agent printenv | grep OPENAI
```

### Database issues
```bash
# Check database health
docker-compose exec postgres pg_isready -U relate_user

# Reset database
docker-compose down -v postgres
docker-compose up postgres
```

## Production

```bash
# Set production environment
NODE_ENV=production

# Use resource limits
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## Security

- Never commit `.env` files
- Use strong database passwords
- Limit exposed ports in production
- Use secrets management
- Regular security updates