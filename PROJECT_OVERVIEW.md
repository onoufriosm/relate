# Relate: AI-Powered Research Assistant

![Agent Workflow](Screenshot%202025-07-14%20at%2016.17.04.png)

## What It Does

Relate is an intelligent research assistant that combines the power of large language models with web search capabilities to help users explore complex topics. Unlike traditional chatbots, Relate features a sophisticated AI agent that can break down research questions, search the web strategically, and learn from user feedback to become more helpful over time.

## The Agent at the Heart

The core of Relate is a **LangGraph-powered agent** that orchestrates a sophisticated research workflow using advanced AI patterns. Rather than simply answering questions, the agent implements:

### **Planning and Reasoning**
The agent employs **chain-of-thought reasoning** to classify queries and strategically plan research approaches. It breaks down complex questions into focused search strategies while providing confidence scores and detailed reasoning for each decision.

### **Conditional Routing & Dynamic Execution**
Using **LangGraph's conditional edges**, the workflow dynamically routes based on intermediate results. The agent can classify queries as needing search versus direct answers, then adapt its path based on user feedback and learned patterns.

### **Tool Use Integration**
The agent leverages **Tavily search API** as its primary research tool, executing targeted web searches with intelligent result processing and synthesis capabilities.

### **State Management**
Advanced **state persistence** tracks conversation history, search results, user feedback, and learning patterns across the entire workflow, enabling sophisticated multi-turn interactions.

The complete workflow:
1. **Analyzes** incoming queries with structured reasoning
2. **Plans** targeted search strategies using decomposition
3. **Pauses** for human approval (Human-in-the-Loop)
4. **Executes** tool-based web searches when approved
5. **Synthesizes** results into comprehensive answers
6. **Learns** from each interaction through episodic memory

## Human-in-the-Loop (HITL) Integration

What makes Relate special is its **collaborative approach**. Before executing web searches, the agent pauses execution and presents its search plan to the user. Users can:

- **Approve** the suggested searches
- **Skip** unnecessary searches  
- **Provide feedback** to refine the search strategy
- **Add context** to guide the research direction

This ensures that research stays focused and relevant while building trust through transparency.

## Memory & Learning Systems

Relate doesn't just respond to queries—it **learns and evolves** through sophisticated memory patterns:

### **Episodic Memory**
The agent maintains **episodic memory** of past interactions using semantic search to find similar situations. Each episode stores:
- User preferences and decision patterns  
- Search quality and relevance assessments
- Query complexity and context patterns
- Feedback and outcome relationships

### **Short and Long-term Memory**
- **Short-term**: Conversation context and current session state
- **Long-term**: Persistent episodic memories that improve decision-making over time

The system becomes increasingly intelligent about when to search, what to search for, and when users are likely to approve or skip certain queries. High-confidence decisions can even be automated based on learned patterns, reducing friction while maintaining control.

## Evaluation & Observability

Relate takes quality seriously with comprehensive **evaluation and observability using LangSmith**:

- **End-to-end testing** of complete research workflows
- **Unit tests** for individual components like query classification  
- **LLM-as-Judge** evaluation using GPT-4 for quality assessment
- **Performance tracking** with visualizations and metrics
- **LangSmith tracing** for complete observability and debugging
- **Automated evaluation pipelines** with dataset management

This ensures the agent maintains high performance while providing full visibility into decision-making processes.

## Technology Stack

**Frontend**: React with TypeScript and Tailwind CSS for a responsive, **real-time streaming** interface

**Backend**: FastAPI with **server-sent events (SSE)** for streaming responses and thread management

**Agent**: LangGraph for workflow orchestration and **deployment**, OpenAI GPT-4 for reasoning, Tavily for **tool-based** web search

**Memory**: LangMem for semantic search across episodic memories

**Infrastructure**: Docker containerization with multi-service orchestration

**Observability**: **LangSmith integration** for tracing, evaluation, and performance monitoring

## Key Features

- **Planning and Reasoning**: Chain-of-thought query classification and strategic research planning
- **Conditional Routing**: Dynamic workflow execution based on intermediate results
- **Human-in-the-Loop**: Collaborative search approval with user feedback integration
- **Tool Use**: Tavily web search integration for comprehensive research
- **Streaming Responses**: Real-time updates as research progresses  
- **Episodic Memory**: Learns user preferences and patterns over time
- **State Management**: Advanced workflow state persistence across interactions
- **LangSmith Observability**: Complete evaluation and performance monitoring
- **Source Integration**: Displays search results with links and content

## Getting Started

The entire stack runs with Docker:

```bash
# Copy environment template
cp .env.docker.example .env

# Add your API keys (OpenAI, LangSmith, Tavily)
# Then start all services
docker-compose up -d
```

Access the application at http://localhost:5173 with the backend API at http://localhost:8000 and agent at http://localhost:2024.

---

Relate represents the future of research assistance—intelligent, collaborative, and continuously learning. By combining cutting-edge AI with human oversight and memory, it creates a research experience that's both powerful and trustworthy.