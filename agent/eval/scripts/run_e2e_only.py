"""Run only the end-to-end evaluation."""

import asyncio
import sys

# Add parent directory to path for imports
sys.path.append('.')

from eval.e2e_tests.evaluate_research_e2e import run_research_e2e_evaluation

if __name__ == "__main__":
    try:
        print("🔄 Running end-to-end evaluation only...")
        results = asyncio.run(run_research_e2e_evaluation())
        print(f"\n✅ E2E evaluation completed!")
        print(f"📊 Quality Score: {results['overall_score']:.2f}")
        print(f"🎯 Classification Accuracy: {results['classification_accuracy']:.2f}")
        print(f"✅ Pass Rate: {results['pass_rate']:.2f}")
        print(f"⭐ Average Quality: {results['average_quality']:.1f}/5")
    except KeyboardInterrupt:
        print(f"\n⚠️  Evaluation interrupted by user")
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        sys.exit(1)