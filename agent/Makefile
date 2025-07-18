.PHONY: help eval install clean

help:
	@echo "Agent Evaluation Commands:"
	@echo "  eval     Run evaluations"
	@echo "  install  Install dependencies"
	@echo "  clean    Clean up cache"

eval:
	uv run python run_eval.py --type all

install:
	uv sync

clean:
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true