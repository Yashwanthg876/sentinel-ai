from app.services.embeddings import EmbeddingService
from app.services.llm_provider import generate_completion
from app.services.agents import get_agent
from app.utils.logger import log_query

embedding_service = EmbeddingService()
embedding_service.load_data()
embedding_service.create_embeddings()

def generate_response(query: str, agent_type: str = "general"):
    sop_candidates = embedding_service.search(query)

    # Sort by lowest distance
    sop_candidates.sort(key=lambda x: x["distance"])

    best_match = sop_candidates[0]
    confidence_score = best_match["distance"]

    CONFIDENCE_THRESHOLD = 1.2  # You can tune this

    clarification = False

    if confidence_score > CONFIDENCE_THRESHOLD:
        clarification = True
        log_query(query, None, confidence_score, True)
        return {
            "answer": "⚠️ I'm not fully confident about the issue. Could you please provide more details?",
            "issue_type": "Clarification Required",
            "severity_level": "Unknown",
            "confidence": round(confidence_score, 2)
        }
    
    sop = best_match["sop"]

    log_query(query, sop["issue_id"], confidence_score, False)

    combined_context = f"""
Issue Type: {sop['issue_type']}
Immediate Actions: {sop['immediate_actions']}
Evidence Required: {sop['evidence_required']}
Reporting Steps: {sop['reporting_steps']}
Prevention Tips: {sop['prevention_tips']}
Legal References: {sop.get('legal_reference', 'No specific laws listed')}
"""

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

Use ONLY the following retrieved SOP data:

{combined_context}

User Query: {query}
"""

    agent = get_agent(agent_type)
    if agent:
         answer = agent.execute(query, combined_context)
    else:
         answer = generate_completion(prompt)
    
    return {
        "answer": answer,
        "issue_type": sop.get("issue_type", "Unknown"),
        "severity_level": sop.get("severity_level", "Unknown"),
        "confidence": round(confidence_score, 2)
    }

