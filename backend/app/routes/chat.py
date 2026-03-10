from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.rag_pipeline import generate_response
from app.services.language_service import translate_query, translate_response
from app.auth import get_current_user

router = APIRouter()

class Message(BaseModel):
    sender: str
    text: str

class Query(BaseModel):
    question: str
    language: Optional[str] = "en"  # Default English, could be 'hi' (Hindi), 'ta' (Tamil), 'te' (Telugu)
    agent: Optional[str] = "general" # 'general', 'legal', 'reporting'
    history: Optional[List[Message]] = []
    response_length: Optional[str] = "detailed" # 'brief', 'detailed'

@router.post("/chat")
def chat(query: Query, current_user = Depends(get_current_user)):
    # Step 1: Translate non-English to English for Vector Search
    en_query = query.question
    if query.language and query.language != "en":
        en_query, _ = translate_query(query.question)
        
    # Step 2: Run RAG Pipeline in English
    # Convert history into dictionaries if necessary or just pass directly
    hist_list = [{"sender": msg.sender, "text": msg.text} for msg in query.history]
    result = generate_response(en_query, agent_type=query.agent, history=hist_list, response_length=query.response_length)
    
    # Step 3: Translate the final answer back to Native language
    if query.language and query.language != "en":
        result["answer"] = translate_response(result["answer"], query.language)
        result["issue_type"] = translate_response(result["issue_type"], query.language)
        
    return result
