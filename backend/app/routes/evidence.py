from fastapi import APIRouter, File, UploadFile
from app.services.evidence_service import process_evidence_image

router = APIRouter()

@router.post("/analyze-evidence")
async def analyze_evidence(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        return {"error": "Only image files (JPEG, PNG, etc) are supported"}
        
    image_bytes = await file.read()
    result = process_evidence_image(image_bytes)
    return result
