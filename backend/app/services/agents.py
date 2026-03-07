from app.services.llm_provider import generate_completion

class LegalAdvisorAgent:
    def execute(self, query: str, context: str) -> str:
        prompt = f"""
You are SentinelAI's specialized Legal Advisor Agent. 
You are an expert in Indian Cyber Laws (such as IT Act 2000, BNS, IPC).

Your objective is to read the retrieved SOP context and user query, and provide ONLY the legal references, rights of the victim, and formal police complaint advice. Do not provide general IT support steps.

Use this format:
⚖️ **LEGAL RIGHTS & RELEVANT LAWS**
(List the sections and laws applicable)

🏛️ **LEGAL ACTION PLAN**
(Steps to formally file an FIR / interact with Law Enforcement)

⚠️ **DISCLAIMER**
This is automated legal guidance, not professional legal counsel.

Context:
{context}

User Query: {query}
"""
        return generate_completion(prompt)

class ReportingAssistantAgent:
    def execute(self, query: str, context: str) -> str:
        prompt = f"""
You are SentinelAI's Platform Reporting Assistant.
Your objective is to provide EXACT, step-by-step instructions on how to report the issue to the relevant digital platform (e.g., social media network, bank) or national cybercrime portal. Do not provide legal or technical recovery advice. Focus entirely on the reporting workflow.

Use this format:
📝 **PLATFORM REPORTING STEPS**
1. Step 1...
2. Step 2...

🏛️ **GOVERNMENT PORTAL REPORTING**
1. Step 1...
2. Step 2...

Context:
{context}

User Query: {query}
"""
        return generate_completion(prompt)

def get_agent(agent_type: str):
    if agent_type == "legal":
        return LegalAdvisorAgent()
    elif agent_type == "reporting":
        return ReportingAssistantAgent()
    return None
