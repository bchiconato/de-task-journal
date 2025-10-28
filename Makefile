.PHONY: dev backend frontend install install-backend install-frontend build clean

dev:
	@echo "Starting backend and frontend services..."
	@trap 'kill 0' EXIT; \
	cd server && npm run dev & \
	cd client && npm run dev

backend:
	cd server && npm run dev

frontend:
	cd client && npm run dev

install: install-backend install-frontend

install-backend:
	cd server && npm install

install-frontend:
	cd client && npm install

build:
	cd client && npm run build

clean:
	rm -rf server/node_modules client/node_modules client/dist
