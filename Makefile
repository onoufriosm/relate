.DEFAULT_GOAL := help

.PHONY: help build up down logs clean dev

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

build: ## Build all services
	docker-compose build

up: ## Start services
	docker-compose up -d

dev: ## Start in development mode
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

down: ## Stop services
	docker-compose down

logs: ## View logs
	docker-compose logs -f

clean: ## Remove containers and images
	docker-compose down -v --rmi all