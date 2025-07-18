#!/usr/bin/env python3
"""Main evaluation runner for the research agent project."""

import asyncio
import sys
import argparse
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from eval.scripts.run_all_evaluations import run_specific_evaluation

def main():
    """Main entry point for evaluations."""
    parser = argparse.ArgumentParser(
        description="Run evaluations for the research agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_eval.py --type all              # Run all evaluations
  python run_eval.py --type classification   # Run classification unit tests only
  python run_eval.py --type e2e              # Run end-to-end tests only
  
  # Alternative: Run specific evaluation modules directly
  python -m eval.scripts.run_classification_only
  python -m eval.scripts.run_e2e_only
  python -m eval.scripts.run_all_evaluations
        """
    )
    
    parser.add_argument(
        "--type", 
        choices=["classification", "e2e", "all"], 
        default="all",
        help="Type of evaluation to run (default: all)"
    )
    
    parser.add_argument(
        "--verbose", "-v", 
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"🚀 Starting {args.type} evaluation...")
        print(f"📁 Working directory: {Path.cwd()}")
        print(f"🐍 Python path: {sys.path[0]}")
        print("-" * 50)
    
    try:
        results = asyncio.run(run_specific_evaluation(args.type))
        
        if args.verbose:
            print(f"\n✅ Evaluation completed successfully!")
            print(f"📊 Results summary:")
            for eval_name, eval_results in results.items():
                if isinstance(eval_results, dict):
                    score = eval_results.get('overall_score', 0.0)
                    total = eval_results.get('total_evaluations', 0)
                    print(f"   {eval_name}: {score:.2f} ({total} tests)")
        
        return 0
        
    except KeyboardInterrupt:
        print(f"\n⚠️  Evaluation interrupted by user")
        return 130
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())