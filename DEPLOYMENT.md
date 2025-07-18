# Deployment Guide

## Pre-Deployment Checklist

- [ ] API keys configured in environment files
- [ ] All tests pass locally
- [ ] No sensitive data in version control
- [ ] Environment variables documented
- [ ] HTTPS configured for production

## Local Testing

```bash
# Test complete application
./setup-docker.sh setup
curl -f http://localhost:8000/health
curl -f http://localhost:2024/health
curl -f http://localhost:5173

# Check for vulnerabilities
npm audit
pip check

# Verify no secrets in logs
docker-compose logs | grep -i "secret\|password\|key"
```

## Production Build

```bash
# Clean previous builds
rm -rf */build */dist

# Build all services
cd agent && uv sync --frozen --no-dev && cd ..
cd backend && uv sync --frozen --no-dev && cd ..
cd web && npm ci --only=production && npm run build && cd ..

# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Test production build
docker-compose -f docker-compose.prod.yml up -d
```

## Platform Deployment

### Docker Compose (VPS/Server)

```bash
# On production server
git clone <repository-url>
cd relate
./setup-docker.sh setup
cp docker-compose.prod.yml docker-compose.yml

# Deploy
docker-compose up -d

# Update
git pull origin main
docker-compose pull
docker-compose up -d --force-recreate
```

### Vercel (Frontend Only)

```bash
# Install and login
npm install -g vercel
vercel login

# Deploy
cd web
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add VITE_BACKEND_URL production
```

Create `vercel.json`:
```json
{
  "version": 2,
  "routes": [{"src": "/(.*)", "dest": "/"}],
  "env": {
    "VITE_BACKEND_URL": "@vite-backend-url"
  }
}
```

### Render (Full Stack)

Create `render.yaml`:
```yaml
services:
  - type: web
    name: relate-web
    env: node
    buildCommand: cd web && npm install && npm run build
    startCommand: cd web && npm run start
    envVars:
      - key: VITE_BACKEND_URL
        value: https://relate-backend.onrender.com

  - type: web
    name: relate-backend
    env: python
    buildCommand: cd backend && pip install uv && uv sync --frozen --no-dev
    startCommand: cd backend && uv run uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PORT
        value: 8000

  - type: web
    name: relate-agent
    env: python
    buildCommand: cd agent && pip install uv && uv sync --frozen --no-dev
    startCommand: cd agent && uv run langgraph up --host 0.0.0.0 --port $PORT
    envVars:
      - key: PORT
        value: 2024
      - key: OPENAI_API_KEY
        sync: false
      - key: LANGSMITH_API_KEY
        sync: false
      - key: TAVILY_API_KEY
        sync: false
```

### AWS ECS

```bash
# Install AWS CLI and configure
aws configure
ecs-cli configure --cluster relate-cluster --default-launch-type FARGATE

# Build and push images
docker build -t relate-web ./web
docker tag relate-web:latest $ECR_REPOSITORY_URI/relate-web:latest
docker push $ECR_REPOSITORY_URI/relate-web:latest

# Deploy
ecs-cli compose --file docker-compose.aws.yml up --create-log-groups
```

### Google Cloud Run

```bash
# Install Google Cloud SDK
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/relate-web ./web
gcloud run deploy relate-web --image gcr.io/YOUR_PROJECT_ID/relate-web --platform managed

# Repeat for backend and agent
```

## Environment Configuration

### Development
```env
NODE_ENV=development
DEBUG=true
VITE_BACKEND_URL=http://localhost:8000
```

### Production
```env
NODE_ENV=production
DEBUG=false
VITE_BACKEND_URL=https://api.yourdomain.com
```

## Security

### API Key Management
- Use environment-specific keys
- Development: Limited permissions
- Production: Full access

### Network Security
```yaml
# Docker network isolation
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### HTTPS Configuration
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

## Monitoring

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Logging
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Backup
```bash
# Database backup
pg_dump relate_db > backup_$(date +%Y%m%d).sql

# Application backup
docker save relate-web:latest | gzip > relate-web_backup_$(date +%Y%m%d).tar.gz
```

## Rollback

### Quick Rollback
```bash
# Stop current deployment
docker-compose down

# Rollback to previous version
git checkout HEAD~1
docker-compose up -d
```

### Database Rollback
```bash
# Stop application
docker-compose stop

# Restore database
psql relate_db < backup_20240101.sql

# Restart application
docker-compose start
```

## Post-Deployment Verification

```bash
# Check endpoints
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/status

# Monitor resources
docker stats

# Check logs for errors
docker-compose logs --tail=100 | grep -i error
```

## Troubleshooting

### Service Not Starting
```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Check port conflicts
netstat -tulpn | grep :8000
```

### Database Issues
```bash
# Check connectivity
docker-compose exec backend python -c "import psycopg2; print('DB OK')"

# Check connection string
echo $DATABASE_URL
```

### API Key Issues
```bash
# Verify format
echo $OPENAI_API_KEY | grep -E "^sk-"

# Test key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models"
```