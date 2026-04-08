from __future__ import annotations

from typing import Optional
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
