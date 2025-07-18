"""Search tools for the agent."""

import os
import aiohttp
from langchain_core.tools import tool


@tool
async def tavily_search(query: str) -> str:
    """Search the web using Tavily API."""
    api_key = os.getenv("TAVILY_API_KEY")
    url = "https://api.tavily.com/search"
    
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 3
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            data = await response.json()
    
    results = []
    for result in data.get("results", []):
        results.append(f"Title: {result['title']}\nURL: {result['url']}\nContent: {result['content'][:200]}...")
    
    return "\n\n".join(results)