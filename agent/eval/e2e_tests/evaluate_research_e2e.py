"""End-to-end evaluation of research agent using LLM-as-judge following eval_template patterns."""

import asyncio
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langgraph_sdk import get_client as get_langgraph_client
from langgraph_sdk.schema import Command
import os

from eval.e2e_tests.research_e2e_dataset import examples_research_e2e
from eval.utils import (
    get_client,
    create_dataset_if_not_exists,
    create_evaluation_plots,
    save_results_plot,
    format_evaluation_results,
    print_detailed_results,
)
from app.agent import create_agent, get_config
from app.state import AgentState
from eval.e2e_tests.evaluation_prompts import RESEARCH_QUALITY_EVALUATION_PROMPT

# Load environment variables
load_dotenv()

# Dataset configuration
DATASET_NAME = "Research Agent: End-to-End Evaluation Dataset"
DATASET_DESCRIPTION = "End-to-end evaluation dataset for research agent with LLM-as-judge quality assessment."


# Structured output schema for LLM-as-judge evaluation
class ResearchQualityGrade(BaseModel):
    """Structured evaluation of research agent response quality."""

    classification_correct: bool = Field(
        description="Does the classification (NEEDS_SEARCH vs DIRECT_ANSWER) match expected behavior?"
    )
    criteria_analysis: str = Field(
        description="Detailed analysis of how well each success criteria bullet point is met, with specific examples from the response."
    )
    overall_quality: int = Field(
        description="Overall quality score from 1-5 where 5=excellent, 4=good, 3=adequate, 2=poor, 1=very poor"
    )
    grade: bool = Field(
        description="Does the response meet the success criteria and demonstrate high research quality? True only if criteria_met >= 4 out of 5 criteria."
    )
    justification: str = Field(
        description="Brief justification for the grade with specific examples from the response."
    )


# LLM evaluator with structured output
evaluator_llm = ChatOpenAI(model="gpt-4o", temperature=0).with_structured_output(
    ResearchQualityGrade
)


async def target_research_agent_e2e(inputs: dict) -> dict:
    """Run complete research agent workflow for end-to-end evaluation.
    Automatically approves any interrupts to simulate automated evaluation.

    Args:
        inputs: Dictionary containing the query field from the dataset

    Returns:
        Dictionary with the complete agent response and metadata
    """
    try:
        # Set up LangGraph client for proper interrupt handling
        langgraph_server_url = os.getenv("LANGGRAPH_SERVER_URL")
        if not langgraph_server_url:
            raise ValueError("LANGGRAPH_SERVER_URL environment variable not set")

        langgraph_client = get_langgraph_client(url=langgraph_server_url)

        # Create a new thread for this evaluation
        thread = await langgraph_client.threads.create()
        thread_id = thread["thread_id"]

        # Create initial state
        query = inputs["query"]

        # Handle conversation history if provided
        messages = []
        if "conversation_history" in inputs:
            for msg in inputs["conversation_history"]:
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    messages.append({"role": "assistant", "content": msg["content"]})

        # Add current query
        messages.append({"role": "user", "content": query})

        initial_input = {"messages": messages}

        # Execute workflow with automatic interrupt handling using LangGraph client
        result_messages = []
        final_result = None

        # Start the initial run
        async for chunk in langgraph_client.runs.stream(
            thread_id=thread_id,
            assistant_id="agent",
            input=initial_input,
            stream_mode=["values", "events"],
        ):
            if chunk.event == "values":
                final_result = chunk.data
                if "messages" in chunk.data:
                    result_messages = chunk.data["messages"]

        # Check if we hit an interrupt by looking for planned queries without completion
        if (
            final_result
            and final_result.get("planned_queries")
            and not final_result.get("user_feedback")
        ):
            print("🔄 Evaluation: Detected interrupt state, auto-approving...")

            # Resume with "approve" using Command
            async for chunk in langgraph_client.runs.stream(
                thread_id=thread_id,
                assistant_id="agent",
                command=Command(resume="approve"),
                stream_mode=["values", "events"],
            ):
                if chunk.event == "values":
                    final_result = chunk.data
                    if "messages" in chunk.data:
                        result_messages = chunk.data["messages"]

        # Convert result to expected format
        result = final_result or {
            "messages": result_messages,
            "search_count": 0,
            "planned_queries": [],
            "search_results": [],
            "needs_search": False,
            "user_feedback": "",
        }

        # Validate result structure
        if not result or not isinstance(result, dict):
            raise ValueError("Agent returned invalid result structure")

        if "messages" not in result:
            raise ValueError("Agent result missing messages field")

        # Extract final response and metadata
        final_message = result["messages"][-1] if result["messages"] else None
        if final_message:
            # Handle both LangGraph message format and LangChain message format
            if hasattr(final_message, "content"):
                final_response = final_message.content
            elif isinstance(final_message, dict) and "content" in final_message:
                final_response = final_message["content"]
            else:
                final_response = str(final_message)
        else:
            final_response = "No response generated"

        # Validate response quality
        if not final_response or final_response.strip() == "":
            final_response = "ERROR: Empty response generated"

        return {
            "final_response": final_response,
            "classification_decision": "NEEDS_SEARCH"
            if result.get("needs_search", False)
            else "DIRECT_ANSWER",
            "search_count": result.get("search_count", 0),
            "planned_queries": result.get("planned_queries", []),
            "workflow_metadata": {
                "total_messages": len(result["messages"]),
                "search_performed": result.get("search_count", 0) > 0,
                "conversation_history_length": len(messages)
                - 1,  # Exclude current query
            },
        }

    except Exception as e:
        error_msg = f"Agent execution failed: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "final_response": f"ERROR: {error_msg}",
            "classification_decision": "ERROR",
            "search_count": 0,
            "planned_queries": [],
            "workflow_metadata": {"error": str(e), "error_type": type(e).__name__},
        }


def research_quality_evaluator(outputs: dict, reference_outputs: dict) -> dict:
    """LLM-as-judge evaluator for research agent response quality.

    Args:
        outputs: Agent's response from target_research_agent_e2e
        reference_outputs: Expected outputs with success criteria

    Returns:
        Evaluation results with structured feedback
    """
    try:
        # Extract data
        final_response = outputs["final_response"]
        actual_classification = outputs.get("classification_decision", "UNKNOWN")
        expected_classification = reference_outputs["classification"]
        success_criteria = reference_outputs["success_criteria"]

        # Handle error responses
        if actual_classification == "ERROR" or final_response.startswith("ERROR:"):
            return {
                "key": "research_quality_evaluator",
                "score": 0.0,
                "feedback": {
                    "classification_correct": False,
                    "criteria_analysis": "Agent execution failed - cannot evaluate criteria",
                    "overall_quality": 1,
                    "justification": f"Agent failed to execute properly: {final_response}",
                    "grade": False,
                    "error": True,
                },
            }

        # Format criteria for evaluation
        criteria_text = "\n".join(success_criteria)

        # Create evaluation prompt
        evaluation_prompt = RESEARCH_QUALITY_EVALUATION_PROMPT.format(
            expected_classification=expected_classification,
            actual_classification=actual_classification,
            criteria_text=criteria_text,
            final_response=final_response,
        )

        # Get LLM evaluation
        eval_result = evaluator_llm.invoke([HumanMessage(content=evaluation_prompt)])

        # Cast to proper type for structured output
        if isinstance(eval_result, ResearchQualityGrade):
            grade_result = eval_result
        else:
            # Fallback for unexpected response format
            grade_result = ResearchQualityGrade(
                classification_correct=False,
                criteria_analysis="Evaluation failed - unexpected response format",
                overall_quality=1,
                grade=False,
                justification="Error in evaluation processing",
            )

        # Return structured evaluation
        return {
            "key": "research_quality_evaluator",
            "score": 1.0 if grade_result.grade else 0.0,
            "feedback": {
                "classification_correct": bool(grade_result.classification_correct),
                "criteria_analysis": str(grade_result.criteria_analysis),
                "overall_quality": int(grade_result.overall_quality),
                "justification": str(grade_result.justification),
                "grade": bool(grade_result.grade),
            },
        }

    except Exception as e:
        print(f"Error in evaluation: {e}")
        return {
            "key": "research_quality_evaluator",
            "score": 0.0,
            "feedback": {"error": str(e)},
        }


async def run_research_e2e_evaluation():
    """Run the end-to-end research agent evaluation."""
    print("🚀 Starting end-to-end research agent evaluation...")

    # Setup dataset
    create_dataset_if_not_exists(
        DATASET_NAME, DATASET_DESCRIPTION, examples_research_e2e
    )

    # Import aevaluate for async support
    from langsmith import aevaluate

    experiment_results = await aevaluate(
        # Target function that runs complete research workflow
        target_research_agent_e2e,
        # Dataset name
        data=DATASET_NAME,
        # LLM-as-judge evaluator
        evaluators=[research_quality_evaluator],
        # Experiment name
        experiment_prefix="Research Agent: End-to-End LLM-as-Judge",
        # Concurrency
        max_concurrency=1,  # Keep low to avoid rate limits
        # Metadata
        metadata={
            "evaluation_type": "end_to_end_llm_judge",
            "agent_version": "research_agent_v1",
        },
    )

    # Convert results to pandas for analysis
    df_results = experiment_results.to_pandas()
    results = format_evaluation_results(df_results, "research_quality_evaluator")

    print("\n📊 E2E Evaluation Results:")
    print(f"Overall Quality Score: {results['overall_score']:.2f}")
    print(
        f"Classification Accuracy: {results['classification_accuracy']:.2f} ({results['classification_correct']}/{results['total_evaluations']})"
    )
    print(f"Pass Rate: {results['pass_rate']:.2f}")
    print(f"Average Quality Rating: {results['average_quality']:.1f}/5")

    # Create visualization
    scores = {
        "Research Quality": results["overall_score"],
        "Classification Accuracy": results["classification_accuracy"],
    }
    create_evaluation_plots(scores, "End-to-End Research Agent Performance")
    plot_path = save_results_plot("research_e2e")
    print(f"\n📈 Evaluation visualization saved to: {plot_path}")

    # Print detailed results
    print_detailed_results(df_results, "research_quality_evaluator")

    print("✅ End-to-end evaluation completed!")
    return results


# Run the evaluation
if __name__ == "__main__":
    asyncio.run(run_research_e2e_evaluation())
