"""LangSmith client utilities for evaluation framework."""

import os
from langsmith import Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_client() -> Client:
    """Get configured LangSmith client."""
    return Client()

def create_dataset_if_not_exists(dataset_name: str, description: str, examples: list) -> None:
    """Create LangSmith dataset if it doesn't exist.
    
    Args:
        dataset_name: Name of the dataset
        description: Dataset description
        examples: List of examples to add to dataset
    """
    client = get_client()
    
    if not client.has_dataset(dataset_name=dataset_name):
        dataset = client.create_dataset(
            dataset_name=dataset_name,
            description=description
        )
        client.create_examples(dataset_id=dataset.id, examples=examples)
        print(f"✅ Created dataset: {dataset_name}")
    else:
        print(f"📁 Using existing dataset: {dataset_name}")