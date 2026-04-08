import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Always load the .env that sits next to this file, regardless of CWD.
# This works whether you start uvicorn from the project root or from api/.
load_dotenv(Path(__file__).parent / ".env")

from routers import chat, knowledge, tender

app = FastAPI(
    title="Tender Maestro API",
    description="AI-powered tender proposal backend. Browse all endpoints at /docs.",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Default is "*" so the backend works from any origin (Lovable preview, local dev, etc.).
# Set ALLOWED_ORIGINS to a comma-separated list to restrict to specific origins.
# Note: allow_credentials=True is incompatible with allow_origins=["*"] in CORS spec.
_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
_allow_all = _origins_raw.strip() == "*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else [o.strip() for o in _origins_raw.split(",")],
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"])
app.include_router(tender.router, prefix="/tender", tags=["Tender"])
app.include_router(chat.router, tags=["Chat"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    provider = os.getenv("AI_PROVIDER", "anthropic").lower()
    key_var = "ANTHROPIC_API_KEY" if provider == "anthropic" else "OPENAI_API_KEY"
    return {
        "status": "ok",
        "ai_provider": provider,
        "api_key_configured": bool(os.getenv(key_var)),
        "docs": "http://localhost:8000/docs",
    }
