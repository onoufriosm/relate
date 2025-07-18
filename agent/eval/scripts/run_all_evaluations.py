"""Run all evaluation tests for the research agent."""

import asyncio
import sys
from typing import Dict, Any
from datetime import datetime

# Add parent directory to path for imports
sys.path.append('.')

from eval.unit_tests.evaluate_classification import run_classification_evaluation
from eval.e2e_tests.evaluate_research_e2e import run_research_e2e_evaluation
from eval.utils.visualization import create_comparison_plot, save_results_plot
from eval.utils.evaluation_helpers import compare_evaluation_runs

async def run_all_evaluations() -> Dict[str, Any]:
    """Run all evaluation tests and generate comparison report.
    
    Returns:
        Dictionary with results from all evaluations
    """
    print("🚀 Starting comprehensive evaluation of research agent...")
    print("=" * 80)
    
    start_time = datetime.now()
    results = {}
    
    try:
        # Run unit tests
        print("\n📋 PHASE 1: Unit Tests")
        print("-" * 40)
        
        print("Running classification node evaluation...")
        classification_results = await run_classification_evaluation()
        results["classification"] = classification_results
        
        print("\n" + "=" * 40)
        
        # Run E2E tests
        print("\n🔄 PHASE 2: End-to-End Tests")
        print("-" * 40)
        
        print("Running complete workflow evaluation...")
        e2e_results = await run_research_e2e_evaluation()
        results["e2e"] = e2e_results
        
        print("\n" + "=" * 40)
        
        # Generate comparison report
        print("\n📊 PHASE 3: Comprehensive Report")
        print("-" * 40)
        
        generate_comprehensive_report(results)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"\n✅ All evaluations completed successfully!")
        print(f"⏱️  Total execution time: {duration:.1f} seconds")
        
        return results
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {str(e)}")
        raise

def generate_comprehensive_report(results: Dict[str, Any]) -> None:
    """Generate comprehensive evaluation report with visualizations.
    
    Args:
        results: Dictionary with results from all evaluations
    """
    print("Generating comprehensive evaluation report...")
    
    # Extract key metrics
    classification_accuracy = results.get("classification", {}).get("overall_score", 0.0)
    e2e_quality = results.get("e2e", {}).get("overall_score", 0.0)
    e2e_classification_acc = results.get("e2e", {}).get("classification_accuracy", 0.0)
    
    # Print summary table
    print("\n📋 EVALUATION SUMMARY")
    print("=" * 50)
    print(f"Classification Node Accuracy:  {classification_accuracy:.2f}")
    print(f"E2E Research Quality:          {e2e_quality:.2f}")
    print(f"E2E Classification Accuracy:   {e2e_classification_acc:.2f}")
    print("=" * 50)
    
    # Overall assessment
    overall_score = (classification_accuracy + e2e_quality + e2e_classification_acc) / 3
    print(f"Overall Agent Performance:     {overall_score:.2f}")
    
    if overall_score >= 0.8:
        print("🎉 EXCELLENT - Agent performing very well!")
    elif overall_score >= 0.6:
        print("✅ GOOD - Agent performing adequately with room for improvement")
    elif overall_score >= 0.4:
        print("⚠️  FAIR - Agent needs significant improvement")
    else:
        print("❌ POOR - Agent requires major fixes")
    
    # Create comparison visualization
    try:
        metrics = {
            "Classification\nAccuracy": classification_accuracy,
            "E2E Research\nQuality": e2e_quality,
            "E2E Classification\nAccuracy": e2e_classification_acc
        }
        
        from eval.utils.visualization import create_evaluation_plots
        create_evaluation_plots(metrics, "Research Agent: Comprehensive Evaluation Results")
        plot_path = save_results_plot("comprehensive_evaluation")
        print(f"\n📈 Comprehensive evaluation chart saved to: {plot_path}")
        
    except Exception as e:
        print(f"⚠️  Could not generate visualization: {e}")
    
    # Detailed breakdown
    print(f"\n🔍 DETAILED BREAKDOWN")
    print("-" * 30)
    
    # Classification results
    if "classification" in results:
        cls_results = results["classification"]
        print(f"Classification Node:")
        print(f"  • Total test cases: {cls_results.get('total_evaluations', 0)}")
        print(f"  • Correct predictions: {cls_results.get('classification_correct', 0)}")
        print(f"  • Pass rate: {cls_results.get('pass_rate', 0.0):.2f}")
    
    # E2E results
    if "e2e" in results:
        e2e_results = results["e2e"]
        print(f"End-to-End Workflow:")
        print(f"  • Total test cases: {e2e_results.get('total_evaluations', 0)}")
        print(f"  • Quality pass rate: {e2e_results.get('pass_rate', 0.0):.2f}")
        print(f"  • Average quality rating: {e2e_results.get('average_quality', 0.0):.1f}/5")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS")
    print("-" * 20)
    
    if classification_accuracy < 0.8:
        print("• Improve query classification prompt or add more training examples")
    
    if e2e_quality < 0.7:
        print("• Enhance search query planning and result summarization")
        print("• Review LLM prompts for research quality")
    
    if e2e_classification_acc < classification_accuracy - 0.1:
        print("• Investigate classification inconsistencies in full workflow")
    
    print()

async def run_specific_evaluation(eval_type: str) -> Dict[str, Any]:
    """Run a specific evaluation type.
    
    Args:
        eval_type: Type of evaluation ('classification', 'e2e', or 'all')
        
    Returns:
        Results from the specified evaluation
    """
    if eval_type == "classification":
        return await run_classification_evaluation()
    elif eval_type == "e2e":
        return await run_research_e2e_evaluation()
    elif eval_type == "all":
        return await run_all_evaluations()
    else:
        raise ValueError(f"Unknown evaluation type: {eval_type}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Run research agent evaluations")
    parser.add_argument(
        "--type", 
        choices=["classification", "e2e", "all"], 
        default="all",
        help="Type of evaluation to run"
    )
    
    args = parser.parse_args()
    
    try:
        results = asyncio.run(run_specific_evaluation(args.type))
        print(f"\n✅ Evaluation completed. Results available in LangSmith dashboard.")
    except KeyboardInterrupt:
        print(f"\n⚠️  Evaluation interrupted by user")
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        sys.exit(1)