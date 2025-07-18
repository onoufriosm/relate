"""Long-term memory management for learning user review preferences."""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from langchain_core.runnables import RunnableConfig




class EpisodicDecision(BaseModel):
    """Structured output for episodic memory auto-decision."""
    
    decision: Literal["approve", "skip", "review"] = Field(
        description="Whether to auto-approve, auto-skip, or proceed to human review"
    )
    reasoning: str = Field(
        description="Brief explanation of why this decision was made based on similar episodes"
    )
    confidence: float = Field(
        description="Confidence score from 0.0 to 1.0 for this decision",
        ge=0.0,
        le=1.0,
    )


class EpisodicReviewMemory(BaseModel):
    """Rich episode of a user review interaction for semantic learning."""

    original_query: str = Field(description="The exact user query that was processed")
    planned_searches: List[str] = Field(
        description="The search queries that were planned for this user query"
    )
    user_decision: Literal["approve", "skip", "feedback"] = Field(
        description="What the user ultimately decided to do"
    )
    user_feedback_text: Optional[str] = Field(
        default=None, description="Exact feedback text if user provided feedback"
    )
    decision_context: str = Field(
        description="Analysis of why this decision made sense given the query and searches"
    )
    query_complexity: Literal["simple", "moderate", "complex"] = Field(
        description="Assessed complexity of the original query"
    )
    search_quality: Literal["focused", "broad", "specific", "comprehensive"] = Field(
        description="Quality and scope of the planned searches"
    )
    timestamp: str = Field(description="When this episode occurred")
    
    def get_searchable_content(self) -> str:
        """Create content string for semantic search embedding."""
        content = f"Query: {self.original_query}\n"
        content += f"Planned searches: {', '.join(self.planned_searches)}\n"
        content += f"Complexity: {self.query_complexity}, Search quality: {self.search_quality}\n"
        content += f"User decision: {self.user_decision}\n"
        if self.user_feedback_text:
            content += f"User feedback: {self.user_feedback_text}\n"
        content += f"Context: {self.decision_context}"
        return content




class EpisodicMemoryManager:
    """Manages episodic memory for learning from user review interactions using semantic search."""

    def __init__(self, config: Optional[RunnableConfig] = None):
        self.config = config
        self.episode_manager = None
        self.llm = None

        # Only initialize if langmem is available
        try:
            from langmem import create_memory_store_manager
            from langchain_openai import ChatOpenAI

            # Get user_id from config for store namespacing
            user_id = "default_user"  # fallback
            if config and "configurable" in config:
                user_id = config["configurable"].get("user_id", "default_user")

            # Episode manager using store for semantic search
            self.episode_manager = create_memory_store_manager(
                "openai:gpt-4o-mini",
                namespace=("users", user_id, "episodic_reviews"),
                schemas=[EpisodicReviewMemory],
                instructions="Store rich episodes of user review interactions for semantic similarity learning.",
                enable_inserts=True,  # Allow multiple episodes
            )

            # LLM for decision making with structured output
            self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(
                EpisodicDecision
            )

        except ImportError:
            print("📝 Episodic memory disabled: langmem not available")

    def is_enabled(self) -> bool:
        """Check if episodic memory is enabled."""
        return self.episode_manager is not None and self.llm is not None

    def should_auto_decide(
        self, 
        current_query: str, 
        planned_searches: List[str]
    ) -> Optional[Literal["approve", "skip"]]:
        """Use episodic memory and LLM reasoning to decide if we should auto-approve/skip."""
        if not self.is_enabled():
            return None

        try:
            # Find similar episodes using semantic search
            similar_episodes = self._find_similar_episodes(current_query, planned_searches)
            
            # Need at least 3 episodes for confident decision
            if len(similar_episodes) < 3:
                print("📝 Insufficient episodic data for auto-decision")
                return None

            # Use LLM to reason about the decision based on similar episodes
            decision = self._llm_decide_with_episodes(
                current_query, planned_searches, similar_episodes
            )
            
            return decision

        except Exception as e:
            print(f"📝 Error in episodic auto-decision: {e}")
            return None

    def _find_similar_episodes(
        self, 
        current_query: str, 
        planned_searches: List[str]
    ) -> List[EpisodicReviewMemory]:
        """Find semantically similar episodes from memory store."""
        try:
            from langgraph.config import get_store
            
            # Get store from config
            store = get_store() if self.config else None
            if not store:
                return []

            # Get user_id for namespace
            user_id = "default_user"
            if self.config and "configurable" in self.config:
                user_id = self.config["configurable"].get("user_id", "default_user")

            # Create search content for current situation
            search_content = f"Query: {current_query}\nPlanned searches: {', '.join(planned_searches)}"
            
            # Search for similar episodes
            results = store.search(
                namespace=("users", user_id, "episodic_reviews"),
                query=search_content,
                limit=5  # Get top 5 most similar
            )

            episodes = []
            for result in results:
                if hasattr(result, 'value') and isinstance(result.value, dict):
                    try:
                        episode = EpisodicReviewMemory(**result.value)
                        episodes.append(episode)
                    except Exception:
                        continue

            return episodes

        except Exception as e:
            print(f"📝 Error finding similar episodes: {e}")
            return []

    def _llm_decide_with_episodes(
        self,
        current_query: str,
        planned_searches: List[str],
        similar_episodes: List[EpisodicReviewMemory]
    ) -> Optional[Literal["approve", "skip"]]:
        """Use LLM to make decision based on similar episodes."""
        
        # Build context from similar episodes
        episodes_context = "\n\n".join([
            f"Episode {i+1}:\n{episode.get_searchable_content()}" 
            for i, episode in enumerate(similar_episodes)
        ])

        from app.prompts import EPISODIC_DECISION_TEMPLATE
        
        prompt = EPISODIC_DECISION_TEMPLATE.format(
            current_query=current_query,
            planned_searches=', '.join(planned_searches),
            episodes_context=episodes_context
        )

        try:
            decision_result: EpisodicDecision = self.llm.invoke([{"role": "user", "content": prompt}])
            
            print(f"🧠 Episodic decision: {decision_result.decision}")
            print(f"📝 Reasoning: {decision_result.reasoning}")
            print(f"📝 Confidence: {decision_result.confidence:.2f}")
            print(f"📝 Based on {len(similar_episodes)} similar episodes")
            
            # Only auto-decide if confidence is high enough
            if decision_result.confidence >= 0.8 and decision_result.decision in ["approve", "skip"]:
                return decision_result.decision
            else:
                print("🧠 Confidence too low, proceeding to human review")
                return None

        except Exception as e:
            print(f"📝 Error in LLM decision making: {e}")
            return None

    def store_episode(
        self,
        original_query: str,
        planned_searches: List[str],
        user_decision: str,
        user_feedback_text: Optional[str] = None
    ):
        """Store a rich episode after user review interaction."""
        if not self.is_enabled():
            return

        try:
            from datetime import datetime

            # Analyze query complexity
            complexity = self._assess_query_complexity(original_query)
            
            # Analyze search quality  
            search_quality = self._assess_search_quality(planned_searches)
            
            # Generate decision context
            decision_context = self._generate_decision_context(
                original_query, planned_searches, user_decision, user_feedback_text
            )

            # Create rich episode
            episode = EpisodicReviewMemory(
                original_query=original_query,
                planned_searches=planned_searches,
                user_decision=user_decision,
                user_feedback_text=user_feedback_text,
                decision_context=decision_context,
                query_complexity=complexity,
                search_quality=search_quality,
                timestamp=datetime.now().isoformat()
            )

            # Store episode using langmem
            conversation = [{
                "role": "user", 
                "content": f"Store this review episode: {episode.get_searchable_content()}"
            }]
            
            if self.episode_manager:
                self.episode_manager.invoke({"messages": conversation})
                print(f"📝 Stored episodic memory: {user_decision} for '{original_query[:50]}...'")

        except Exception as e:
            print(f"📝 Error storing episode: {e}")

    def _assess_query_complexity(self, query: str) -> Literal["simple", "moderate", "complex"]:
        """Assess complexity of user query."""
        query_lower = query.lower()
        
        # Simple patterns
        if any(word in query_lower for word in ["weather", "time", "what is"]):
            return "simple"
        
        # Complex patterns  
        if any(word in query_lower for word in ["compare", "analyze", "research", "comprehensive"]):
            return "complex"
            
        return "moderate"

    def _assess_search_quality(self, searches: List[str]) -> Literal["focused", "broad", "specific", "comprehensive"]:
        """Assess quality and scope of planned searches."""
        if len(searches) <= 1:
            return "focused"
        elif len(searches) >= 4:
            return "comprehensive"
        elif any(len(search) > 50 for search in searches):
            return "specific"
        else:
            return "broad"

    def _generate_decision_context(
        self, 
        query: str, 
        searches: List[str], 
        decision: str, 
        feedback: Optional[str]
    ) -> str:
        """Generate context about why this decision made sense."""
        context = f"User {decision}ed a {self._assess_query_complexity(query)} query "
        context += f"with {len(searches)} {self._assess_search_quality(searches)} searches. "
        
        if feedback:
            context += f"Feedback: {feedback}. "
        
        if decision == "approve":
            context += "Searches were well-aligned with user intent."
        elif decision == "skip":
            context += "User preferred direct answer without search."
        else:
            context += "User provided feedback to improve searches."
            
        return context
