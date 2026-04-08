import asyncio
import json
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

from agents.cost_agent import run_cost_agent
from agents.kb_parser import load_kb_profile
from agents.scoring_boss import run_scoring_boss
from agents.sections_agent import (
    run_exec_summary_agent,
    run_problem_framing_agent,
    run_methodology_agent,
    run_workplan_agent,
)
from agents.team_agent import run_team_agent
from agents.tender_extraction_agent import run_tender_extractor_agent
from models.schemas import (
    AnalyzeRequest,
    RevisionRequest,
    RevisionResult,
    ScoreRequest,
    ScoreResult,
    DraftRequest,
    GenerateSectionRequest,
    GenerateSectionResult,
    ProposalBlock,
)
from models.section_templates import get_template_by_id, get_template_by_label
from services import ai, pdf

router = APIRouter()


# ── Tender list ───────────────────────────────────────────────────────────────

@router.get("/list")
async def list_tenders():
    """Return all uploaded tenders from documents/tenders/, with scores if available."""
    return pdf.list_tenders()


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_tender(file: UploadFile = File(...)):
    """Save an uploaded tender document and return its document ID."""
    content = await file.read()
    doc_id = pdf.save_upload(content, file.filename or "tender.pdf")
    return {"documentId": doc_id}


# ── Score ─────────────────────────────────────────────────────────────────────

@router.post("/score", response_model=ScoreResult)
async def score_tender(request: ScoreRequest):
    """
    Run the full scoring pipeline for an uploaded tender:
      1. Extract structured data from the tender document.
      2. Load the company knowledge base.
      3. Run the Scoring Boss to produce a bid/no-bid decision with numeric scores.

    The result is persisted as a sidecar file so the /list endpoint can return
    it on subsequent page loads.
    """
    file_path = pdf.get_upload_path(request.documentId)
    if file_path is None:
        raise HTTPException(status_code=404, detail=f"Tender '{request.documentId}' not found.")

    try:
        tender_data = await run_tender_extractor_agent(file_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Tender extraction failed: {e}")

    kb_profile = load_kb_profile()

    try:
        score_raw = await run_scoring_boss(tender_data, kb_profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

    # Persist both extraction result (for /draft) and score
    pdf.save_tender_data(request.documentId, tender_data)
    pdf.save_score(request.documentId, score_raw)

    return ScoreResult(
        documentId=request.documentId,
        decision=score_raw.get("decision", "NO-BID"),
        company_fit_score=int(score_raw.get("company_fit_score", 0)),
        team_fit_score=int(score_raw.get("team_fit_score", 0)),
        overall_score=int(score_raw.get("overall_score", 0)),
        company_fit_reasoning=score_raw.get("company_fit_reasoning", ""),
        ko_criterion_triggered=score_raw.get("ko_criterion_triggered"),
        team_proposal=score_raw.get("team_proposal", []),
    )


# ── Draft (3-agent parallel proposal generation) ─────────────────────────────

@router.post("/draft")
async def draft_proposal(request: DraftRequest):
    """
    Streams SSE events while 6 agents build the proposal in parallel.
    Each section is streamed as soon as its agent finishes.

    SSE event types:
      {"type": "status",        "step": "...", "progress": 0-100}
      {"type": "section",       "section": {"section_id": "...", "blocks": [...]}}
      {"type": "section_error", "section_id": "...", "message": "..."}
      {"type": "done"}
      {"type": "error",         "message": "..."}  ← fatal pre-agent errors only
    """

    async def _named_task(coro, section_id: str) -> tuple[str, dict]:
        """Wrap a section coroutine so errors are returned (not raised) with their section_id."""
        try:
            return section_id, await coro
        except Exception as e:
            return section_id, {"__error__": str(e)}

    async def event_stream():
        def _status(step: str, progress: int) -> str:
            return f"data: {json.dumps({'type': 'status', 'step': step, 'progress': progress})}\n\n"

        # ── 1. Load tender data ────────────────────────────────────────────
        file_path = pdf.get_upload_path(request.documentId)
        if file_path is None:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Tender file not found.'})}\n\n"
            return

        yield _status("Loading tender data…", 10)

        tender_data = pdf.load_tender_data(request.documentId)
        if tender_data is None:
            # Re-extract if not cached (e.g. uploaded before scoring)
            try:
                tender_data = await run_tender_extractor_agent(file_path)
                pdf.save_tender_data(request.documentId, tender_data)
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Extraction failed: {e}'})}\n\n"
                return

        score_data = pdf.load_score(request.documentId)
        kb_profile = load_kb_profile()

        # ── 2. Launch all 6 agents concurrently ───────────────────────────
        yield _status("6 agents running in parallel…", 20)

        tasks = [
            asyncio.create_task(_named_task(run_exec_summary_agent(tender_data, kb_profile),    "exec-summary")),
            asyncio.create_task(_named_task(run_problem_framing_agent(tender_data, kb_profile), "problem-framing")),
            asyncio.create_task(_named_task(run_methodology_agent(tender_data, kb_profile),     "methodology")),
            asyncio.create_task(_named_task(run_workplan_agent(tender_data, kb_profile),        "workplan")),
            asyncio.create_task(_named_task(run_team_agent(tender_data, kb_profile),            "team")),
            asyncio.create_task(_named_task(run_cost_agent(tender_data, kb_profile, score_data), "pricing")),
        ]

        # ── 3. Stream each section as it completes ─────────────────────────
        completed = 0
        total = len(tasks)

        for coro in asyncio.as_completed(tasks):
            section_id, result = await coro
            completed += 1
            progress = 20 + int((completed / total) * 75)

            if "__error__" in result:
                yield f"data: {json.dumps({'type': 'section_error', 'section_id': section_id, 'message': result['__error__']})}\n\n"
            else:
                section = {
                    "section_id": result.get("section_id", section_id),
                    "blocks": result.get("blocks", []),
                }
                yield f"data: {json.dumps({'type': 'section', 'section': section})}\n\n"

            yield _status(f"Sections arriving… ({completed}/{total})", progress)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Analyze (SSE draft generation) ───────────────────────────────────────────

@router.post("/analyze")
async def analyze_tender(request: AnalyzeRequest):
    """
    Streams Server-Sent Events:
      data: {"type": "status", "step": "...", "progress": 0-100}
      data: {"type": "result", "markdown": "...", "score": 85}
      data: {"type": "error",  "message": "..."}
    """

    async def event_stream():
        statuses = [
            ("Extracting requirements...", 20),
            ("Scoring tender fit...", 45),
            ("Retrieving knowledge base context...", 65),
            ("Drafting initial response...", 80),
        ]
        for step, progress in statuses:
            yield f"data: {json.dumps({'type': 'status', 'step': step, 'progress': progress})}\n\n"
            await asyncio.sleep(0.4)

        # Attempt to read the uploaded PDF for context
        tender_text = ""
        file_path = pdf.get_upload_path(request.documentId)
        if file_path and file_path.suffix.lower() == ".pdf":
            try:
                tender_text = pdf.extract_text(file_path)
            except Exception:
                tender_text = ""

        system = (
            "You are an expert tender writer who crafts compelling, professional proposal responses. "
            "Generate a complete, well-structured tender response in Markdown. "
            "Include sections for: Executive Summary, Technical Approach, Team Composition, Pricing, and Risk Mitigation. "
            "Use proper Markdown headers, bullet points, and tables where appropriate."
        )

        if tender_text:
            user_msg = (
                f"Write a professional tender response for the following RFP:\n\n{tender_text[:8000]}\n\n"
                "Return ONLY the markdown content."
            )
        else:
            user_msg = (
                "Generate a comprehensive example tender response for a digital transformation project. "
                "Return ONLY the markdown content."
            )

        draft_chunks: list[str] = []
        try:
            async for chunk in ai.stream_text(
                messages=[{"role": "user", "content": user_msg}],
                system=system,
                max_tokens=4096,
            ):
                draft_chunks.append(chunk)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        draft = "".join(draft_chunks)
        yield f"data: {json.dumps({'type': 'result', 'markdown': draft, 'score': 85})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Revise ────────────────────────────────────────────────────────────────────

@router.post("/revise", response_model=RevisionResult)
async def revise_draft(request: RevisionRequest):
    system = (
        "You are an expert tender writer. Revise the given proposal draft based on the instruction. "
        "Return ONLY the revised markdown — no preamble, no explanation."
    )
    user_msg = (
        f"Current draft:\n\n{request.currentDraft}\n\n"
        f"Instruction: {request.instruction}\n\n"
        "Return the complete revised draft in Markdown."
    )

    try:
        revised = await ai.generate_text(
            messages=[{"role": "user", "content": user_msg}],
            system=system,
            max_tokens=4096,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return RevisionResult(
        markdown=revised.strip(),
        agentMessage=f"Done. I've updated the draft: {request.instruction}",
    )


# ── Generate section ──────────────────────────────────────────────────────────

@router.post("/generate-section", response_model=GenerateSectionResult)
async def generate_section(request: GenerateSectionRequest):
    """
    Returns pre-structured blocks for a given section type.

    The backend looks up the canonical template, optionally enriches
    the scaffold markdown via AI (if tenderContext is provided), and
    returns ready-to-use blocks.
    """
    template = get_template_by_id(request.sectionLabel) or get_template_by_label(
        request.sectionLabel
    )
    if not template:
        raise HTTPException(
            status_code=404,
            detail=f"No template found for section '{request.sectionLabel}'",
        )

    blocks: list[ProposalBlock] = []
    for bt in template.blocks:
        block_id = f"block-{uuid.uuid4().hex[:8]}"
        markdown = bt.markdown

        if request.tenderContext and request.tenderContext.strip():
            system = (
                "You are an expert tender writer. Fill in the following section block "
                "using the provided tender context. Keep the existing structure (especially tables). "
                "Return ONLY the markdown content."
            )
            user_msg = (
                f"Section: {template.label}\n"
                f"Block: {bt.title_suffix}\n"
                f"Scaffold:\n{bt.markdown}\n\n"
                f"Tender context:\n{request.tenderContext[:4000]}\n\n"
                "Fill in the content. Return ONLY markdown."
            )
            try:
                markdown = await ai.generate_text(
                    messages=[{"role": "user", "content": user_msg}],
                    system=system,
                    max_tokens=2048,
                )
            except Exception:
                pass  # fall back to scaffold

        blocks.append(
            ProposalBlock(id=block_id, title=bt.title_suffix, markdown=markdown)
        )

    return GenerateSectionResult(blocks=blocks)
