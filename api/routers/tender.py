import asyncio
import json
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

from models.schemas import (
    AnalyzeRequest,
    RevisionRequest,
    RevisionResult,
    GenerateSectionRequest,
    GenerateSectionResult,
    ProposalBlock,
)
from models.section_templates import get_template_by_id, get_template_by_label
from services import ai, pdf

router = APIRouter()


@router.post("/upload")
async def upload_tender(file: UploadFile = File(...)):
    content = await file.read()
    doc_id = pdf.save_upload(content, file.filename or "tender.pdf")
    return {"documentId": doc_id}


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

        # Attempt to read an uploaded PDF
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


@router.post("/generate-section", response_model=GenerateSectionResult)
async def generate_section(request: GenerateSectionRequest):
    """
    Returns pre-structured blocks for a given section type.

    The backend looks up the canonical template, optionally enriches
    the scaffold markdown via AI (if tenderContext is provided), and
    returns ready-to-use blocks.

    Frontend can call this when the user adds a new section to get
    properly structured blocks instantly.
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

        # If tender context is provided, ask the AI to fill the scaffold
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
