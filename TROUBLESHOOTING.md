# Troubleshooting

## Quick Diagnostics

```bash
# Check Docker status
docker --version
docker-compose --version
docker ps
docker-compose ps

# Check service logs
docker-compose logs -f
docker-compose logs agent

# Check service health
curl -f http://localhost:2024/health
curl -f http://localhost:8000/health
curl -f http://localhost:5173

# Check resources
docker stats
```

## Quick Reset

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (data loss)
docker-compose down -v

# Clean system
docker system prune -a

# Restart from scratch
./setup-docker.sh setup
```

## Common Issues

### Port Already in Use

**Symptoms:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find and kill process
lsof -i :5173
kill -9 $(lsof -t -i:5173)

# Or change port in docker-compose.yml
ports:
  - "5174:5173"
```

### Environment Variables Not Loading

**Symptoms:**
```
KeyError: 'OPENAI_API_KEY'
```

**Solution:**
```bash
# Check if .env files exist
ls -la .env*
ls -la agent/.env*

# Verify file contents
cat agent/.env | grep OPENAI_API_KEY

# Check Docker environment
docker-compose exec agent printenv | grep OPENAI

# Rebuild
docker-compose down
docker-compose up --build -d
```

### Service Won't Start

**Symptoms:**
```
Container exits immediately
Service unhealthy
```

**Solution:**
```bash
# Check logs
docker-compose logs agent

# Run interactively
docker-compose exec agent /bin/bash

# Check health endpoint
docker-compose exec agent curl -f http://localhost:2024/health
```

### Build Failures

**Symptoms:**
```
failed to solve with frontend dockerfile
```

**Solution:**
```bash
# Clear build cache
docker builder prune -a

# Build without cache
docker-compose build --no-cache

# Check permissions
ls -la web/
chmod 755 web/
```

### Memory Issues

**Symptoms:**
```
Container killed (OOMKilled)
Service running slowly
```

**Solution:**
```bash
# Check memory usage
docker stats --no-stream

# Increase memory limits
services:
  agent:
    deploy:
      resources:
        limits:
          memory: 4G

# Clean up
docker container prune
docker image prune
```

### Volume Mount Issues

**Symptoms:**
```
File changes not reflected
Permission denied errors
```

**Solution:**
```bash
# Check volume mounts
docker-compose exec web ls -la /app

# Fix permissions (Linux/macOS)
sudo chown -R $(id -u):$(id -g) .

# Reset volumes
docker-compose down -v
docker-compose up -d
```

## Platform-Specific Issues

### macOS
```bash
# File system performance
volumes:
  - ./web:/app:cached

# Docker Desktop not starting
# Applications → Docker → Troubleshoot → Reset to factory defaults
```

### Windows
```bash
# Line ending problems
git config --global core.autocrlf true
dos2unix setup-docker.sh

# WSL2 issues
wsl --update
```

### Linux
```bash
# Permission denied
sudo usermod -aG docker $USER
newgrp docker

# SELinux problems
sudo setenforce 0
```

## Performance Issues

### Slow Build Times
```bash
# Use .dockerignore
echo "node_modules" >> .dockerignore
echo "__pycache__" >> .dockerignore
echo ".git" >> .dockerignore

# Enable BuildKit
export DOCKER_BUILDKIT=1
```

### Slow Container Startup
```bash
# Check resource limits
docker stats

# Use lighter base images
FROM node:20-alpine
FROM python:3.11-slim
```

## Network Issues

### Service Communication Failures
```bash
# Check network connectivity
docker-compose exec web ping backend

# Use correct URLs
VITE_BACKEND_URL=http://localhost:8000  # Correct for external access

# Check network configuration
docker network ls
```

### CORS Errors
```bash
# Check CORS in backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Verify frontend URL
VITE_BACKEND_URL=http://localhost:8000
```

## Security Issues

### API Keys Exposed
```bash
# Check git history
git log --oneline --grep="api_key"

# Rotate exposed keys immediately
# Update .env files
# Restart services
```

### Container Running as Root
```dockerfile
# Add non-root user
RUN useradd --create-home --shell /bin/bash app
USER app
RUN chown -R app:app /app
```

## Development Issues

### Hot Reload Not Working
```bash
# Check volume mounts
volumes:
  - ./web:/app
  - /app/node_modules

# Use polling
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--poll"]
```

### Debugger Not Connecting
```bash
# Expose debug port
ports:
  - "5173:5173"
  - "9229:9229"

# Enable debug mode
CMD ["node", "--inspect=0.0.0.0:9229", "index.js"]
```

## Production Issues

### Container Crashes
```bash
# Check logs
docker-compose logs --tail=100 service-name

# Add health checks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3

# Set restart policy
restart: unless-stopped
```

### Performance Degradation
```bash
# Monitor resources
docker stats --no-stream

# Set resource limits
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
```

## Debugging Tools

### Container Inspection
```bash
# Inspect container
docker inspect container-name

# Execute commands
docker-compose exec service-name /bin/bash

# Copy files
docker cp container:/app/logs/error.log ./error.log
```

### Network Debugging
```bash
# Check network
docker network ls
docker network inspect network-name

# Test connectivity
docker-compose exec web ping backend
docker-compose exec web telnet backend 8000
```

### Log Analysis
```bash
# Follow logs
docker-compose logs -f service-name

# Search logs
docker-compose logs service-name | grep ERROR

# Export logs
docker-compose logs > relate-logs.txt
```

## Recovery Procedures

### Complete Reset
```bash
# Stop everything
docker-compose down

# Remove everything
docker system prune -a --volumes

# Rebuild from scratch
./setup-docker.sh setup
```

### Partial Reset
```bash
# Reset single service
docker-compose stop web
docker-compose rm -f web
docker-compose up -d web

# Reset volumes
docker-compose down -v
docker-compose up -d
```

## Getting Help

### Collect Information
```bash
# Collect all logs
docker-compose logs > all-logs.txt

# Collect system info
docker version > system-info.txt
docker-compose version >> system-info.txt
docker info >> system-info.txt
```

### Include When Seeking Help
- System information (OS, Docker version)
- Complete error messages
- Service logs
- Configuration files (sanitized)
- Steps to reproduce

**Remember**: Always check logs first (`docker-compose logs -f`) - they contain the most useful troubleshooting information.