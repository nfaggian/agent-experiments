ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

TESTPATH := $(ROOT_DIR)/tests/

.PHONY: install
install: ## Install virtual environment with uv
	@echo "🚀 Creating virtual environment using uv"
	@uv sync

.PHONY: check
check: ## Check lock file consistency and run static code analysis
	@echo "🚀 Checking lock file consistency with 'pyproject.toml'"
	@uv lock --locked
	@echo "🚀 Linting code: Running ruff"
	@uvx ruff check --fix
	@echo "🚀 Static type checking: Running mypy"
	@uv run mypy src
	@echo "🚀 Checking for obsolete dependencies: Running deptry"
	@uv run deptry src

.PHONY: test
test: ## Run all tests
	@echo "🚀 Testing code: Running pytest"
	@uv run python -m pytest $(TESTPATH) \
		--cov \
		--cov-config=pyproject.toml \
		--cov-report=xml:coverage.xml \
		--cov-report=term-missing \
		--junitxml=junit.xml

.PHONY: web
web: ## Run the ADK web demo server
	@uv run adk web --reload src/agents/

.PHONY: api_server
api_server: ## Run the ADK FastAPI server
	@uv run adk api_server src/agents/

.PHONY: mobile-api
mobile-api: ## Run the Home Security Mobile API server
	@echo "🚀 Starting Home Security Mobile API server..."
	@PYTHONPATH=$(ROOT_DIR) uv run uvicorn src.mobile_api.app:app --host 0.0.0.0 --port 8000 --reload

.PHONY: home-security-web
home-security-web: ## Run the Home Security Agent via ADK web interface
	@uv run adk web --reload src/agents/home_security_agent/

.PHONY: prefect-server
prefect-server: ## Start Prefect server and serve flows
	@./scripts/start_prefect.sh

.PHONY: clean
clean: ## Remove build artifacts, cache files, and test reports
	@echo "🧹 Cleaning build artifacts and cache files..."
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@rm -f coverage.xml junit.xml .coverage 2>/dev/null || true
	@rm -rf htmlcov .pytest_cache .mypy_cache .ruff_cache 2>/dev/null || true
	@echo "✅ Clean complete"

.PHONY: help
help:
	@uv run python -c "import re; \
	[[print(f'\033[36m{m[0]:<20}\033[0m {m[1]}') for m in re.findall(r'^([a-zA-Z_-]+):.*?## (.*)$$', open(makefile).read(), re.M)] for makefile in ('$(MAKEFILE_LIST)').strip().split()]"

.DEFAULT_GOAL := help