"""Test the evaluation structure without running actual evaluations."""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all evaluation modules can be imported."""
    print("🧪 Testing evaluation structure...")
    
    try:
        # Test utils imports
        from eval.utils import get_client, create_evaluation_plots, format_evaluation_results
        print("✅ Utils imports: OK")
        
        # Test unit test imports  
        from eval.unit_tests.classification_dataset import examples_classification
        print(f"✅ Classification dataset: {len(examples_classification)} examples")
        
        # Test E2E imports
        from eval.e2e_tests.research_e2e_dataset import examples_research_e2e
        print(f"✅ E2E dataset: {len(examples_research_e2e)} examples")
        
        # Test main package imports
        from eval import run_classification_evaluation, run_research_e2e_evaluation
        print("✅ Main package imports: OK")
        
        # Test agent imports
        from app.agent import query_classification_node, create_agent
        from app.state import AgentState
        print("✅ Agent imports: OK")
        
        print("\n🎉 All imports successful! Evaluation structure is working correctly.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_structure():
    """Test the evaluation directory structure."""
    print("\n📁 Testing directory structure...")
    
    eval_dir = Path("eval")
    required_dirs = ["unit_tests", "e2e_tests", "utils", "scripts", "results"]
    
    for dir_name in required_dirs:
        dir_path = eval_dir / dir_name
        if dir_path.exists():
            print(f"✅ {dir_name}/: exists")
        else:
            print(f"❌ {dir_name}/: missing")
            return False
    
    # Test key files
    key_files = [
        "eval/__init__.py",
        "eval/unit_tests/classification_dataset.py",
        "eval/e2e_tests/research_e2e_dataset.py", 
        "eval/utils/visualization.py",
        "eval/scripts/run_all_evaluations.py",
        "run_eval.py",
        "Makefile"
    ]
    
    for file_path in key_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}: exists")
        else:
            print(f"❌ {file_path}: missing")
            return False
    
    print("\n🎉 Directory structure is correct!")
    return True

def test_datasets():
    """Test dataset contents."""
    print("\n📊 Testing datasets...")
    
    try:
        from eval.unit_tests.classification_dataset import examples_classification
        from eval.e2e_tests.research_e2e_dataset import examples_research_e2e
        
        # Test classification dataset
        if examples_classification and len(examples_classification) > 0:
            print(f"✅ Classification dataset: {len(examples_classification)} examples")
            
            # Check format
            first_example = examples_classification[0]
            if "inputs" in first_example and "outputs" in first_example:
                print("✅ Classification dataset format: correct")
            else:
                print("❌ Classification dataset format: incorrect")
                return False
        else:
            print("❌ Classification dataset: empty or missing")
            return False
            
        # Test E2E dataset
        if examples_research_e2e and len(examples_research_e2e) > 0:
            print(f"✅ E2E dataset: {len(examples_research_e2e)} examples")
            
            # Check format
            first_example = examples_research_e2e[0]
            if "inputs" in first_example and "outputs" in first_example:
                if "success_criteria" in first_example["outputs"]:
                    print("✅ E2E dataset format: correct")
                else:
                    print("❌ E2E dataset format: missing success_criteria")
                    return False
            else:
                print("❌ E2E dataset format: incorrect")
                return False
        else:
            print("❌ E2E dataset: empty or missing")
            return False
            
        print("\n🎉 All datasets are properly formatted!")
        return True
        
    except Exception as e:
        print(f"❌ Dataset test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Research Agent Evaluation Structure")
    print("=" * 60)
    
    tests = [
        ("Import Tests", test_imports),
        ("Structure Tests", test_structure), 
        ("Dataset Tests", test_datasets)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 30)
        if not test_func():
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED - Evaluation structure is ready!")
        print("\nNext steps:")
        print("1. Set environment variables (LANGSMITH_API_KEY, OPENAI_API_KEY, TAVILY_API_KEY)")
        print("2. Run: make eval-classification")
        print("3. Run: make eval-e2e") 
        print("4. Run: make eval-all")
    else:
        print("❌ SOME TESTS FAILED - Please fix the issues above")
        sys.exit(1)