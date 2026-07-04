.PHONY: install backend-install frontend-install dev backend frontend test build

install: backend-install frontend-install

backend-install:
	cd backend && uv sync

frontend-install:
	npm install

dev:
	@echo "Start backend: make backend"
	@echo "Start frontend: make frontend"

backend:
	cd backend && uv run delta-command

frontend:
	npm run dev

test:
	cd backend && uv run pytest
	npm run build

build:
	npm run build
