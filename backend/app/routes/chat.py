from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.rag_pipeline import generate_response
from app.services.language_service import translate_query, translate_response

router = APIRouter()

class Query(BaseModel):
    question: str
    language: Optional[str] = "en"  # Default English, could be 'hi' (Hindi), 'ta' (Tamil), 'te' (Telugu)
    agent: Optional[str] = "general" # 'general', 'legal', 'reporting'

@router.post("/chat")
def chat(query: Query):
    # Step 1: Translate non-English to English for Vector Search
    en_query = query.question
    if query.language and query.language != "en":
        en_query, _ = translate_query(query.question)
        
    # Step 2: Run RAG Pipeline in English
    result = generate_response(en_query, agent_type=query.agent)
    
    # Step 3: Translate the final answer back to Native language
    if query.language and query.language != "en":
        result["answer"] = translate_response(result["answer"], query.language)
        result["issue_type"] = translate_response(result["issue_type"], query.language)
        
    return result
