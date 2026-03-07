from app.services.embeddings import EmbeddingService
from app.services.llm_provider import generate_completion
from app.services.agents import get_agent
from app.utils.logger import log_query

embedding_service = EmbeddingService()
embedding_service.load_data()
embedding_service.create_embeddings()

def generate_response(query: str, agent_type: str = "general", history: list = None, response_length: str = "detailed"):
    sop_candidates = embedding_service.search(query)

    # Sort by lowest distance
    sop_candidates.sort(key=lambda x: x["distance"])

    best_match = sop_candidates[0]
    confidence_score = best_match["distance"]

    history_context = ""
    if history:
        # Keep last 6 messages
        recent_history = history[-6:]
        history_str = "\n".join([f"{msg['sender'].capitalize()}: {msg['text']}" for msg in recent_history])
        history_context = f"Conversation History:\n{history_str}\n"

    CONFIDENCE_THRESHOLD = 1.2  # You can tune this

    # Follow-up Conversation Check
    if confidence_score > CONFIDENCE_THRESHOLD:
        if history and len(history) > 0:
            log_query(query, "follow-up", confidence_score, False)
            follow_up_prompt = f"""
You are SentinelAI, a helpful Cyber Incident Assistance System.

The user is asking a follow-up question. Answer it directly and concisely based on the conversation history. Keep your answer brief to ensure a fast response time.

{history_context}

User Follow-up Query: {query}
"""
            answer = generate_completion(follow_up_prompt)
            return {
                "answer": answer,
                "issue_type": "Follow-up",
                "severity_level": "Unknown",
                "confidence": round(confidence_score, 2)
            }
        else:
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

    length_instruction = ""
    if response_length == "brief":
        length_instruction = "IMPORTANT: Keep the response extremely brief, summarizing the core steps only. Use short bullet points to maximize your generation speed."
    else:
        length_instruction = "IMPORTANT: Provide a detailed explanation for each step."

    prompt = f"""
You are SentinelAI, an AI-powered Cyber Incident Assistance System.

{length_instruction}

You MUST respond ONLY in the structured format below. Keep generation fast and concise.

STRUCTURED FORMAT:

🔎 ISSUE IDENTIFIED:
(Briefly summarize)

🚨 IMMEDIATE ACTION:
- Step 1

📂 EVIDENCE TO COLLECT:
- Item 1

📝 REPORTING PROCESS:
- Step 1

🛡️ PREVENTION TIPS:
- Tip 1

📌 NOTE: Guidance only, not legal advice.

Use ONLY the following retrieved SOP data:
{combined_context}

{history_context}

User Query: {query}
"""

    agent = get_agent(agent_type)
    if agent:
         answer = agent.execute(query, combined_context, history_context, length_instruction)
    else:
         answer = generate_completion(prompt)
    
    return {
        "answer": answer,
        "issue_type": sop.get("issue_type", "Unknown"),
        "severity_level": sop.get("severity_level", "Unknown"),
        "confidence": round(confidence_score, 2)
    }

