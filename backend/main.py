"""Main FastAPI application for the agent service."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import router

# Load environment variables
load_dotenv(dotenv_path="../.env")
load_dotenv()

app = FastAPI(title="Agent API", description="LangGraph agent streaming API")

# Get frontend URL from environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")

# Add CORS middleware
frontend_origins = [
    FRONTEND_URL.rstrip("/"),  # Remove trailing slash if present
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)