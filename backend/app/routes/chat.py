from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_pipeline import generate_response

router = APIRouter()

class Query(BaseModel):
    question: str

@router.post("/chat")
def chat(query: Query):
    answer = generate_response(query.question)
    return {"response": answer}
