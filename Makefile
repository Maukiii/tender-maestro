.PHONY: dev frontend backend install setup kill

VENV = api/.venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip
UVICORN = $(VENV)/bin/uvicorn

# ── Start everything ──────────────────────────────────────────────────────────
# Runs frontend (port 8080) + backend (port 8000) together.
# Ctrl-C stops both.
dev:
	@echo "Starting Tender Maestro..."
	@echo "   Frontend → http://localhost:8080"
	@echo "   Backend  → http://localhost:8000"
	@echo "   API docs → http://localhost:8000/docs"
	@echo ""
	@trap 'kill 0' SIGINT; \
	  (cd api && ../$(UVICORN) main:app --reload --port 8000 --log-level info) & \
	  npm run dev & \
	  wait

# ── Individual services ───────────────────────────────────────────────────────
backend:
	cd api && ../$(UVICORN) main:app --reload --port 8000

frontend:
	npm run dev

# ── Setup ─────────────────────────────────────────────────────────────────────
# Run once after cloning: creates venv, installs all deps, copies .env
setup:
	@echo "Creating Python virtual environment..."
	python3 -m venv $(VENV)
	@echo "Installing Python dependencies..."
	$(PIP) install -r api/requirements.txt
	@echo "Installing Node dependencies..."
	npm install
	@if [ ! -f api/.env ]; then \
	  cp api/.env.example api/.env; \
	  echo ""; \
	  echo "Created api/.env — open it and add your API key, then run 'make dev'"; \
	else \
	  echo "api/.env already exists, skipping copy"; \
	fi

# Kill any stale backend/frontend processes (use when "address already in use")
kill:
	-lsof -ti :8000 | xargs kill -9 2>/dev/null
	-lsof -ti :8080 | xargs kill -9 2>/dev/null
	@echo "Ports 8000 and 8080 cleared."

# Install/update dependencies only (venv must already exist)
install:
	$(PIP) install -r api/requirements.txt
	npm install
