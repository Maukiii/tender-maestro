from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel


# ── Knowledge ─────────────────────────────────────────────────────────────────

class KnowledgeStats(BaseModel):
    pastTenders: int
    teamCVs: int
    policyDocs: int
    templateLibrary: int


# ── Tender ────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    documentId: str


class ScoreRequest(BaseModel):
    documentId: str


class ScoreResult(BaseModel):
    documentId: str
    decision: str                          # "BID" | "NO-BID"
    company_fit_score: int                 # 0-100
    team_fit_score: int                    # 0-100
    overall_score: int                     # 0-100
    company_fit_reasoning: str
    ko_criterion_triggered: Optional[str]  # null when decision is BID
    # Kept as Any so minor AI output variations don't cause 500s
    team_proposal: list[Any]


class RevisionRequest(BaseModel):
    instruction: str
    currentDraft: str


class RevisionResult(BaseModel):
    markdown: str
    agentMessage: str


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatContext(BaseModel):
    text: str
    blockTitle: Optional[str] = None
    sectionLabel: Optional[str] = None


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[ChatContext] = None
    history: Optional[list[ChatMessage]] = None


# ── Blocks ────────────────────────────────────────────────────────────────────

class ProposalBlock(BaseModel):
    id: str
    title: str
    markdown: str


class EnhanceBlockRequest(BaseModel):
    markdown: str
    blockTitle: str
    instruction: Optional[str] = None
    sectionLabel: Optional[str] = None


class EnhanceBlockResult(BaseModel):
    markdown: str


class GenerateSectionRequest(BaseModel):
    sectionLabel: str
    tenderContext: Optional[str] = None


class GenerateSectionResult(BaseModel):
    blocks: list[ProposalBlock]
