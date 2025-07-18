# Environment Variables

## Required Variables

### Agent Service (`agent/.env`)
```env
# Required API Keys
OPENAI_API_KEY=sk-proj-your_key_here
LANGSMITH_API_KEY=lsv2_pt_your_key_here
TAVILY_API_KEY=tvly-dev-your_key_here

# Optional
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=relate-project
```

### Backend Service (`backend/.env`)
```env
PORT=8000
```

### Web Service (`web/.env`)
```env
VITE_BACKEND_URL=http://localhost:8000
```

### Root Configuration (`.env`)
```env
LANGGRAPH_SERVER_URL=http://localhost:2024
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

## API Key Sources

- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **LangSmith**: [smith.langchain.com](https://smith.langchain.com/)
- **Tavily**: [tavily.com](https://tavily.com/)

## Key Formats

- **OpenAI**: `sk-proj-...` or `sk-...`
- **LangSmith**: `lsv2_pt_...` or `lsv2_sk_...`
- **Tavily**: `tvly-dev-...` or `tvly-prod-...`

## Environment Setup

### Development
```bash
# Copy example files
cp agent/.env.example agent/.env
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp .env.example .env

# Edit and add your API keys
nano agent/.env
```

### Production
```env
# Use production URLs
VITE_BACKEND_URL=https://api.yourdomain.com
LANGSMITH_PROJECT=relate-prod
```

## Platform-Specific

### Vercel
```env
VITE_BACKEND_URL=https://your-backend-url.vercel.app
```

### Docker Compose
```yaml
services:
  agent:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
    env_file:
      - ./agent/.env
```

## Security

- Never commit `.env` files to version control
- Add `*.env` to `.gitignore`
- Use environment-specific keys
- Rotate keys every 90 days
- Use secrets management in production

## Validation

```bash
# Check if files exist
ls -la .env*
ls -la agent/.env* backend/.env* web/.env*

# Verify key format
grep "OPENAI_API_KEY" agent/.env
echo $OPENAI_API_KEY | grep -E "^sk-"

# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models"
```

## Troubleshooting

### API Key Not Found
```bash
# Check environment files
ls -la .env*
grep "OPENAI_API_KEY" agent/.env
```

### Invalid Format
```bash
# OpenAI keys start with sk-
# LangSmith keys start with lsv2_
# Tavily keys start with tvly-
```

### Not Loading in Docker
```bash
# Check Docker environment
docker-compose exec agent printenv | grep OPENAI
docker-compose exec backend printenv | grep PORT
docker-compose exec web printenv | grep VITE
```

### CORS Issues
```bash
# Verify backend URL
curl -I http://localhost:8000/health
```

## Validation Script

```bash
#!/bin/bash
# validate-env.sh

check_env_var() {
    local var_name=$1
    local file_path=$2
    
    if [ -f "$file_path" ] && grep -q "^${var_name}=" "$file_path"; then
        echo "✅ $var_name found in $file_path"
    else
        echo "❌ $var_name missing in $file_path"
        return 1
    fi
}

check_env_var "OPENAI_API_KEY" "agent/.env"
check_env_var "LANGSMITH_API_KEY" "agent/.env"
check_env_var "TAVILY_API_KEY" "agent/.env"
check_env_var "PORT" "backend/.env"
check_env_var "VITE_BACKEND_URL" "web/.env"
```