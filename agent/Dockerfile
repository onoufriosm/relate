FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install uv

# Copy all files first
COPY . .

# Try sync with lockfile, fallback to installing from pyproject.toml
RUN uv sync --no-dev || uv pip install --system -e .

EXPOSE 2024

CMD ["uv", "run", "langgraph", "dev", "--host", "0.0.0.0", "--port", "2024"]