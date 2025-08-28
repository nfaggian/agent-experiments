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

.PHONY: help
help:
	@uv run python -c "import re; \
	[[print(f'\033[36m{m[0]:<20}\033[0m {m[1]}') for m in re.findall(r'^([a-zA-Z_-]+):.*?## (.*)$$', open(makefile).read(), re.M)] for makefile in ('$(MAKEFILE_LIST)').strip().split()]"

.DEFAULT_GOAL := help