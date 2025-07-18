"""Configuration and setup for the agent API."""

import os
import re
from langgraph_sdk import get_client
from dotenv import load_dotenv

# Load environment variables - local .env takes precedence over root .env
load_dotenv(dotenv_path="../../.env")  # Root .env first
load_dotenv(dotenv_path="../.env")  # Backend .env second (overrides root if present)

# Constants
SSE_HEADERS = {"Cache-Control": "no-cache", "Connection": "keep-alive"}
TOKEN_PATTERN = re.compile(r"\S+\s*|\n")

# LangGraph client setup - default to localhost for combined deployment
LANGGRAPH_SERVER_URL = os.getenv("LANGGRAPH_SERVER_URL", "http://localhost:2024")
langgraph_client = get_client(url=LANGGRAPH_SERVER_URL)

# Store mapping of custom thread IDs to actual LangGraph thread IDs
thread_id_mapping = {}