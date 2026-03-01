from app.services.embeddings import EmbeddingService
from app.services.llm_provider import generate_completion

embedding_service = EmbeddingService()
embedding_service.load_data()
embedding_service.create_embeddings()

def generate_response(query: str):
    sop = embedding_service.search(query)

    prompt = f"""
You are SentinelAI, an AI-powered Cyber Incident Assistance System.

You MUST respond ONLY in the structured format below.
Do NOT add extra sections.
Do NOT change section titles.
Do NOT skip sections.

STRUCTURED FORMAT:

🔎 ISSUE IDENTIFIED:
(Briefly summarize the issue)

🚨 IMMEDIATE ACTION:
- Step 1
- Step 2
- Step 3

📂 EVIDENCE TO COLLECT:
- Item 1
- Item 2

📝 REPORTING PROCESS:
- Step 1
- Step 2

🛡️ PREVENTION TIPS:
- Tip 1
- Tip 2

📌 IMPORTANT NOTE:
This is guidance information, not legal advice.

Use ONLY the following SOP data:

Issue Type: {sop['issue_type']}

Immediate Actions: {sop['immediate_actions']}
Evidence Required: {sop['evidence_required']}
Reporting Steps: {sop['reporting_steps']}
Prevention Tips: {sop['prevention_tips']}

User Query: {query}
"""

    return generate_completion(prompt)
