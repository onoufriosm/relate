"""Research Agent Evaluation Framework.

This package provides comprehensive evaluation capabilities for the research agent,
including unit tests for individual nodes and end-to-end workflow testing.

Subpackages:
    unit_tests: Individual node evaluations (classification, planning, etc.)
    e2e_tests: Complete workflow evaluations with LLM-as-judge
    utils: Shared utilities for LangSmith, visualization, and evaluation helpers
    scripts: Command-line scripts for running evaluations

Quick Start:
    # Run all evaluations
    python -m eval.scripts.run_all_evaluations
    
    # Run specific evaluation
    python -m eval.scripts.run_classification_only
    python -m eval.scripts.run_e2e_only
"""

from .unit_tests import run_classification_evaluation
from .e2e_tests import run_research_e2e_evaluation
from .utils import get_client, create_evaluation_plots, format_evaluation_results

__version__ = "1.0.0"
__all__ = [
    "run_classification_evaluation",
    "run_research_e2e_evaluation", 
    "get_client",
    "create_evaluation_plots",
    "format_evaluation_results"
]