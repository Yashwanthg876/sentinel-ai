from app.services.embeddings import EmbeddingService
from app.services.llm_provider import generate_completion
from app.services.agents import get_agent
from app.utils.logger import log_query

embedding_service = EmbeddingService()
embedding_service.load_data()
embedding_service.create_embeddings()

def generate_response(query: str, agent_type: str = "general", history: list = None, response_length: str = "detailed"):
    # Enhance Context Memory: Append last user message to query for better semantic retrieval
    search_query = query
    if history:
        user_msgs = [m["text"] for m in history if m["sender"] == "user"]
        if user_msgs:
            # combine last user message with current query for vector search
            search_query = f"{user_msgs[-1]} {query}"

    sop_candidates = embedding_service.search(search_query)

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

    CONFIDENCE_THRESHOLD = 1.3  # Loosened slightly to accommodate memory-based longer queries

    # If confidence is extremely poor, handle as clarification
    if confidence_score > CONFIDENCE_THRESHOLD and not history:
         log_query(query, None, confidence_score, True)
         return {
             "answer": "⚠️ I'm not fully confident about the issue. Could you please provide more details?",
             "issue_type": "Clarification Required",
             "severity_level": "Unknown",
             "confidence": round(confidence_score, 2)
         }
    
    sop = best_match["sop"] if confidence_score <= CONFIDENCE_THRESHOLD else {"issue_id": "Unknown", "issue_type": "General Support", "immediate_actions": [], "evidence_required": [], "reporting_steps": [], "prevention_tips": []}

    log_query(query, sop["issue_id"], confidence_score, False)

    combined_context = f"""
Matched Database SOP Type: {sop['issue_type']}
Immediate Actions: {sop['immediate_actions']}
Evidence Required: {sop['evidence_required']}
Reporting Steps: {sop['reporting_steps']}
Prevention Tips: {sop['prevention_tips']}
Legal References: {sop.get('legal_reference', 'No specific laws listed')}
""" if confidence_score <= CONFIDENCE_THRESHOLD else "No exact SOP match. Rely on general cybersecurity best practices."

    length_instruction = ""
    if response_length == "brief":
        length_instruction = "IMPORTANT: Keep the response extremely brief, summarizing the core steps only. Use short bullet points to maximize your generation speed."
    else:
        length_instruction = "IMPORTANT: Provide a detailed explanation for each step."
        
    # Fully delegate generation to the loaded Workflow Agent
    agent = get_agent(agent_type)
    answer_raw = agent.execute(query, combined_context, history_context, length_instruction)
    
    # Parse dynamic classification out of the LLM response
    import re
    issue_type = sop.get("issue_type", "Unknown")
    severity_level = sop.get("severity_level", "Unknown")
    response_text = answer_raw

    issue_match = re.search(r"ISSUE_CLASSIFICATION:\s*(.+)", answer_raw, re.IGNORECASE)
    if issue_match:
        issue_type = issue_match.group(1).strip()
        
    severity_match = re.search(r"SEVERITY_LEVEL:\s*(.+)", answer_raw, re.IGNORECASE)
    if severity_match:
        severity_level = severity_match.group(1).strip()
        
    response_match = re.search(r"RESPONSE:\s*(.*)", answer_raw, re.IGNORECASE | re.DOTALL)
    if response_match:
        response_text = response_match.group(1).strip()
    else:
        # Fallback if LLM misses RESPONSE: tag
        response_text = re.sub(r"ISSUE_CLASSIFICATION:.*?\n", "", response_text, flags=re.IGNORECASE)
        response_text = re.sub(r"SEVERITY_LEVEL:.*?\n", "", response_text, flags=re.IGNORECASE).strip()

    return {
        "answer": response_text,
        "issue_type": issue_type,
        "severity_level": severity_level,
        "confidence": round(confidence_score, 2)
    }

