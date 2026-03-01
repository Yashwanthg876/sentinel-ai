from app.services.embeddings import EmbeddingService
from app.services.llm_provider import generate_completion

embedding_service = EmbeddingService()
embedding_service.load_data()
embedding_service.create_embeddings()

def generate_response(query: str):
    sop = embedding_service.search(query)

    prompt = f"""
    You are SentinelAI, a cyber incident guidance assistant.

    ISSUE TYPE: {sop['issue_type']}

    Immediate Actions: {sop['immediate_actions']}
    Evidence Required: {sop['evidence_required']}
    Reporting Steps: {sop['reporting_steps']}
    Prevention Tips: {sop['prevention_tips']}

    User Query: {query}

    Respond in structured SOP format.
    """

    return generate_completion(prompt)
