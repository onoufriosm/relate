"""Visualization utilities for evaluation results."""

import os
import matplotlib.pyplot as plt
from datetime import datetime
from typing import Dict, List, Any

def create_evaluation_plots(scores: Dict[str, float], title: str = "Evaluation Results") -> None:
    """Create bar plots for evaluation scores.
    
    Args:
        scores: Dictionary mapping metric names to scores
        title: Overall title for the plots
    """
    plt.figure(figsize=(12, 6))
    
    metric_names = list(scores.keys())
    metric_values = [float(score) for score in scores.values()]
    colors = ['#2E8B57', '#4682B4', '#CD853F', '#9370DB', '#DC143C']
    
    if len(metric_names) == 1:
        # Single metric
        plt.bar(metric_names, metric_values, color=colors[0], width=0.5)
        plt.text(0, metric_values[0] + 0.02, f'{metric_values[0]:.2f}', 
                ha='center', fontweight='bold')
    else:
        # Multiple metrics
        for i, (name, value) in enumerate(zip(metric_names, metric_values)):
            plt.subplot(1, len(metric_names), i + 1)
            plt.bar([name], [value], color=colors[i % len(colors)], width=0.5)
            plt.ylabel('Score')
            plt.title(name.replace('_', ' ').title())
            plt.ylim(0, 1.1)
            plt.text(0, value + 0.02, f'{value:.2f}', ha='center', fontweight='bold')
    
    plt.suptitle(title)
    plt.tight_layout()

def save_results_plot(eval_type: str, output_dir: str = "eval/results") -> str:
    """Save the current plot to results directory.
    
    Args:
        eval_type: Type of evaluation (e.g., 'classification', 'e2e')
        output_dir: Directory to save results
        
    Returns:
        Path to saved plot
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    plot_path = f'{output_dir}/{eval_type}_evaluation_{timestamp}.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    return plot_path

def create_comparison_plot(results: List[Dict[str, Any]], metric_name: str, 
                         title: str = "Evaluation Comparison") -> None:
    """Create comparison plot across multiple evaluation runs.
    
    Args:
        results: List of evaluation result dictionaries
        metric_name: Name of metric to compare
        title: Plot title
    """
    plt.figure(figsize=(10, 6))
    
    run_names = [f"Run {i+1}" for i in range(len(results))]
    scores = [result.get(metric_name, 0.0) for result in results]
    
    plt.bar(run_names, scores, color='#4682B4')
    plt.ylabel('Score')
    plt.title(title)
    plt.ylim(0, 1.1)
    
    for i, score in enumerate(scores):
        plt.text(i, score + 0.02, f'{score:.2f}', ha='center', fontweight='bold')
    
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()