"""Run only the classification node evaluation."""

import asyncio
import sys

# Add parent directory to path for imports
sys.path.append('.')

from eval.unit_tests.evaluate_classification import run_classification_evaluation

if __name__ == "__main__":
    try:
        print("🎯 Running classification node evaluation only...")
        results = asyncio.run(run_classification_evaluation())
        print(f"\n✅ Classification evaluation completed!")
        print(f"📊 Accuracy: {results['overall_score']:.2f}")
        print(f"🎯 Correct: {results['classification_correct']}/{results['total_evaluations']}")
    except KeyboardInterrupt:
        print(f"\n⚠️  Evaluation interrupted by user")
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        sys.exit(1)