"""Unit test evaluation for query classification node."""

from langsmith import Client
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage

from .classification_dataset import examples_classification
from eval.utils import (
    get_client, create_dataset_if_not_exists, create_evaluation_plots, 
    save_results_plot, format_evaluation_results, print_detailed_results
)
from app.agent import classification
from app.state import AgentState

# Load environment variables
load_dotenv()

# Dataset configuration
DATASET_NAME = "Research Agent: Query Classification Dataset"
DATASET_DESCRIPTION = "A dataset of queries and their classification decisions (NEEDS_SEARCH vs DIRECT_ANSWER)."

def target_classification_node(inputs: dict) -> dict:
    """Process a query through the real classification node from agent.py.
    
    Args:
        inputs: A dictionary containing the query field from the dataset
        
    Returns:
        A formatted dictionary with the classification decision
    """
    try:
        # Create AgentState with the query as a HumanMessage
        state: AgentState = {
            "messages": [HumanMessage(content=inputs["query"])],
            "search_count": 0,
            "original_query": "",
            "planned_queries": [],
            "search_results": [],
            "needs_search": False,
            "user_feedback": ""
        }
        
        # Run the actual classification node from agent.py
        result = classification(state)
        
        # Extract classification from the Command result
        if hasattr(result, 'update') and result.update and 'needs_search' in result.update:
            needs_search = result.update['needs_search']
            classification = "NEEDS_SEARCH" if needs_search else "DIRECT_ANSWER"
            return {"classification_decision": classification}
        else:
            print("No needs_search found in classification result")
            return {"classification_decision": "UNKNOWN"}
    except Exception as e:
        print(f"Error in classification node: {e}")
        return {"classification_decision": "UNKNOWN"}

def classification_evaluator(outputs: dict, reference_outputs: dict) -> dict:
    """Check if the classification exactly matches the expected classification."""
    is_correct = outputs["classification_decision"] == reference_outputs["classification"]
    return {"key": "classification_evaluator", "score": 1.0 if is_correct else 0.0}

async def run_classification_evaluation():
    """Run the classification node evaluation."""
    print("🚀 Starting classification node evaluation...")
    
    # Setup dataset
    client = get_client()
    create_dataset_if_not_exists(DATASET_NAME, DATASET_DESCRIPTION, examples_classification)
    
    # Import aevaluate for async support
    from langsmith import aevaluate
    
    # Run evaluation
    experiment_results = await aevaluate(
        target_classification_node,
        data=DATASET_NAME,
        evaluators=[classification_evaluator],
        experiment_prefix="Research Agent: Query Classification",
        max_concurrency=2,
        metadata={
            "evaluation_type": "unit_test_classification",
            "node": "classification"
        }
    )
    
    # Process results
    df_results = experiment_results.to_pandas()
    results = format_evaluation_results(df_results, "classification_evaluator")
    
    print(f"\n📊 Classification Evaluation Results:")
    print(f"Overall Accuracy: {results['overall_score']:.2f}")
    print(f"Correct Classifications: {results['classification_correct']}/{results['total_evaluations']}")
    print(f"Pass Rate: {results['pass_rate']:.2f}")
    
    # Create visualization
    scores = {"Classification Accuracy": results['overall_score']}
    create_evaluation_plots(scores, "Query Classification Node Performance")
    plot_path = save_results_plot("classification")
    print(f"\n📈 Visualization saved to: {plot_path}")
    
    # Print detailed results
    print_detailed_results(df_results, "classification_evaluator")
    
    print("✅ Classification evaluation completed!")
    return results

# Run evaluation if called directly
if __name__ == "__main__":
    import asyncio
    asyncio.run(run_classification_evaluation())