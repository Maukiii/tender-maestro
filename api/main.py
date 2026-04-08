import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load api/.env (works whether you run from project root or api/ directory)
load_dotenv()

from routers import chat, knowledge, tender

app = FastAPI(
    title="Tender Maestro API",
    description="AI-powered tender proposal backend. Browse all endpoints at /docs.",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080,http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",")],
    allow_credentials=True,
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
