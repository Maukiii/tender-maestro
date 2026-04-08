from fastapi import APIRouter, UploadFile, File
from models.schemas import KnowledgeStats
from services import pdf

router = APIRouter()

# In-memory stats — replace with a real database later
_stats = {"pastTenders": 45, "teamCVs": 12, "policyDocs": 8, "templateLibrary": 23}


@router.get("/stats", response_model=KnowledgeStats)
async def get_stats():
    return _stats


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    pdf.save_upload(content, file.filename or "document.pdf")
    _stats["policyDocs"] += 1
    # TODO: chunk & embed into a vector store
    return {"success": True}
