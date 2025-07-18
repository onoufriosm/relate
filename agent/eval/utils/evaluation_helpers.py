"""Helper functions for evaluation processing and reporting."""

import pandas as pd
from typing import Dict, Any, List

def format_evaluation_results(df_results: pd.DataFrame, evaluator_key: str) -> Dict[str, Any]:
    """Format evaluation results from pandas DataFrame.
    
    Args:
        df_results: Results DataFrame from LangSmith evaluation
        evaluator_key: Key for the evaluator feedback column
        
    Returns:
        Dictionary with formatted metrics and statistics
    """
    feedback_col = f'feedback.{evaluator_key}'
    
    if feedback_col not in df_results.columns:
        return {
            "error": f"No evaluation results found for {evaluator_key}",
            "total_evaluations": len(df_results)
        }
    
    # Calculate overall score
    overall_score = df_results[feedback_col].mean()
    total_evaluations = len(df_results)
    
    # Count classification accuracy if available
    classification_correct = 0
    for _, row in df_results.iterrows():
        feedback = row.get(feedback_col, {})
        if isinstance(feedback, dict) and feedback.get('classification_correct', False):
            classification_correct += 1
    
    classification_accuracy = classification_correct / total_evaluations if total_evaluations > 0 else 0.0
    
    # Grade distribution
    grades = {"pass": 0, "fail": 0}
    quality_scores = []
    
    for _, row in df_results.iterrows():
        feedback = row.get(feedback_col, {})
        if isinstance(feedback, dict):
            if feedback.get('grade', False):
                grades["pass"] += 1
            else:
                grades["fail"] += 1
            
            quality = feedback.get('overall_quality', 0)
            if quality > 0:
                quality_scores.append(quality)
    
    return {
        "overall_score": float(overall_score),
        "classification_accuracy": float(classification_accuracy),
        "classification_correct": classification_correct,
        "total_evaluations": total_evaluations,
        "pass_rate": grades["pass"] / total_evaluations if total_evaluations > 0 else 0.0,
        "grades": grades,
        "average_quality": sum(quality_scores) / len(quality_scores) if quality_scores else 0.0,
        "quality_scores": quality_scores
    }

def print_detailed_results(df_results: pd.DataFrame, evaluator_key: str) -> None:
    """Print detailed results for each test case.
    
    Args:
        df_results: Results DataFrame from LangSmith evaluation  
        evaluator_key: Key for the evaluator feedback column
    """
    feedback_col = f'feedback.{evaluator_key}'
    
    print("\n🔍 Detailed Results by Test Case:")
    
    for idx, row in df_results.iterrows():
        feedback = row.get(feedback_col, {})
        if isinstance(feedback, dict):
            query = row.get('inputs.query', 'Unknown query')
            if isinstance(query, str) and len(query) > 50:
                query = query[:50] + "..."
            
            grade = feedback.get('grade', False)
            quality = feedback.get('overall_quality', 0)
            classification_correct = feedback.get('classification_correct', False)
            
            print(f"  {int(idx)+1}. {query}")
            print(f"     Grade: {'✅ PASS' if grade else '❌ FAIL'} | Quality: {quality}/5 | Classification: {'✅' if classification_correct else '❌'}")
            
            justification = feedback.get('justification', '')
            if justification and isinstance(justification, str):
                print(f"     {justification[:150]}...")
            
            # Show criteria analysis if available
            criteria_analysis = feedback.get('criteria_analysis', '')
            if criteria_analysis and isinstance(criteria_analysis, str):
                print(f"     Analysis: {criteria_analysis[:100]}...")
            
            print()

def calculate_confidence_interval(scores: List[float], confidence: float = 0.95) -> Dict[str, float]:
    """Calculate confidence interval for evaluation scores.
    
    Args:
        scores: List of evaluation scores
        confidence: Confidence level (default 0.95)
        
    Returns:
        Dictionary with mean, lower_bound, upper_bound
    """
    import numpy as np
    from scipy import stats
    
    if not scores:
        return {"mean": 0.0, "lower_bound": 0.0, "upper_bound": 0.0}
    
    mean = np.mean(scores)
    std_err = stats.sem(scores)
    h = std_err * stats.t.ppv((1 + confidence) / 2., len(scores) - 1)
    
    return {
        "mean": float(mean),
        "lower_bound": float(mean - h),
        "upper_bound": float(mean + h)
    }

def compare_evaluation_runs(results_list: List[Dict[str, Any]], metric_names: List[str]) -> pd.DataFrame:
    """Compare multiple evaluation runs across different metrics.
    
    Args:
        results_list: List of evaluation result dictionaries
        metric_names: List of metric names to compare
        
    Returns:
        DataFrame with comparison results
    """
    comparison_data = []
    
    for i, results in enumerate(results_list):
        row = {"run": f"Run_{i+1}"}
        for metric in metric_names:
            row[metric] = results.get(metric, 0.0)
        comparison_data.append(row)
    
    return pd.DataFrame(comparison_data)