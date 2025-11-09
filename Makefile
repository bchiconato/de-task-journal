.PHONY: help install lint format build dev test

help: ## Displays this help message.
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

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

format: ## Formats both client and server code.
	@echo "Formatting client code..."
	@npm run format --prefix ./client
	@echo "Formatting server code..."
	@npm run format --prefix ./server
	@echo "✔ Formatting complete."

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

test: ## Runs ALL tests (unit tests + E2E tests).
	@echo "Running unit tests (client + server)..."
	@npm test -- --run
	@echo "✔ Unit tests complete."
	@echo ""
	@echo "Running E2E tests..."
	@npx playwright test
	@echo "✔ E2E tests complete."
	@echo ""
	@echo "✔ All tests passed!"