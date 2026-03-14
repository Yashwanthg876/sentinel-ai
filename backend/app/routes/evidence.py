from fastapi import APIRouter, File, UploadFile, Form, Depends
from fastapi.concurrency import run_in_threadpool
from app.services.evidence_service import process_evidence_image
from app.services.language_service import translate_response
from app.auth import get_current_user

router = APIRouter()

@router.post("/analyze-evidence")
async def analyze_evidence(file: UploadFile = File(...), language: str = Form("en"), current_user = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        return {"error": "Only image files (JPEG, PNG, etc) are supported"}
        
    image_bytes = await file.read()
    result = await run_in_threadpool(process_evidence_image, image_bytes)
    
    if language and language != "en" and "suggested_next_steps" in result:
        result["suggested_next_steps"] = translate_response(result["suggested_next_steps"], language)
        if "extracted_entities" in result:
             result["extracted_entities"] = [translate_response(e, language) for e in result["extracted_entities"]]
        if "fraud_patterns" in result:
             result["fraud_patterns"] = [translate_response(p, language) for p in result["fraud_patterns"]]
             
    return result
