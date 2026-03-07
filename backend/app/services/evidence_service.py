import pytesseract
from PIL import Image
import io
import json
import re
from app.services.llm_provider import generate_completion

def process_evidence_image(image_bytes: bytes) -> dict:
    # 1. Open image and extract text using OCR
    try:
        image = Image.open(io.BytesIO(image_bytes))
        extracted_text = pytesseract.image_to_string(image)
    except Exception as e:
        return {"error": f"Failed to process image: {str(e)}"}
    
    if not extracted_text.strip():
        return {"error": "No clear text detected in the uploaded image. Please ensure the screenshot is readable."}

    # 2. Analyze the extracted text using LLM to extract meaning
    prompt = f"""
You are an Evidence Analyzer for SentinelAI, a cyber crime assistance platform.
Below is raw OCR text extracted from a user's uploaded screenshot.
Analyze the text and identify:
1. Contact info: Phone numbers, Emails, or URLs.
2. Any fraud patterns (e.g., "OTP request", "urgent money demand", "fake login page", "suspicious threat").
3. Determine Risk/Severity Level strictly as: LOW, MEDIUM, HIGH, or CRITICAL.
4. Provide immediate suggested next steps based on the evidence.

You MUST return ONLY valid JSON.
Do not wrap it in ```json blocks. Just the raw JSON object.
Use this structure precisely:
{{
    "extracted_entities": ["str"],
    "risk_level": "str",
    "fraud_patterns": ["str"],
    "suggested_next_steps": "str"
}}

Extracted OCR text:
"{extracted_text}"
"""

    try:
        llm_response = generate_completion(prompt)
        
        # Strip codeblock wrappers if present
        clean_json = re.sub(r"^```json\s*", "", llm_response, flags=re.MULTILINE)
        clean_json = re.sub(r"^```\s*$", "", clean_json, flags=re.MULTILINE).strip()
        
        analysis = json.loads(clean_json)
        analysis["raw_text"] = extracted_text.strip()
        return analysis
    except json.JSONDecodeError:
         return {
             "raw_text": extracted_text.strip(),
             "error": "Failed to parse structured response from AI.",
             "raw_response": llm_response
         }
    except Exception as e:
         return {"error": f"LLM Analysis failed: {str(e)}"}
