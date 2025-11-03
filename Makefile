.PHONY: help all install lint lint-fix format check build dev test

help: ## Displays this help message.
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

all: install check ## Installs dependencies and runs all checks.

install: ## Installs dependencies for both client and server.
	@echo "Installing client dependencies..."
	@npm install --prefix ./client
	@echo "Installing server dependencies..."
	@npm install --prefix ./server
	@echo "✔ Dependencies installed successfully."

lint: ## Lints both client and server code.
	@echo "Linting client..."
	@npm run lint --prefix ./client
	@echo "Linting server..."
	@npm run lint --prefix ./server
	@echo "✔ Linting complete."

lint-fix: ## Fixes linting issues in both client and server.
	@echo "Fixing client lint issues..."
	@npm run lint:fix --prefix ./client
	@echo "Fixing server lint issues..."
	@npm run lint:fix --prefix ./server
	@echo "✔ Lint fixing complete."

format: ## Formats both client and server code.
	@echo "Formatting client code..."
	@npm run format --prefix ./client
	@echo "Formatting server code..."
	@npm run format --prefix ./server
	@echo "✔ Formatting complete."

check: lint ## Runs linting and format checks on both client and server.
	@echo "Checking client code formatting..."
	@npm run format:check --prefix ./client
	@echo "Checking server code formatting..."
	@npm run format:check --prefix ./server
	@echo "✔ All checks passed successfully."

build: ## Builds the client application.
	@echo "Building client application..."
	@npm run build --prefix ./client
	@echo "✔ Client build complete. (Server does not require a build step)"

dev: ## Starts the development servers for both client and server.
	@echo "Starting server in development mode..."
	@cd ./server && npm run dev & \
		echo "Starting client in development mode..." && \
		cd ./client && npm run dev
	@echo "✔ Development servers are running."

test: ## Runs the entire Vitest suite across client and server.
	@echo "Running full test suite..."
	@npm test -- --run
