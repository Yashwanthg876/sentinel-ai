from app.config import settings
import ollama
from openai import OpenAI

def generate_completion(prompt: str) -> str:
    if settings.LLM_PROVIDER == "openai":
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return response.choices[0].message.content
    elif settings.LLM_PROVIDER == "ollama":
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"]
    else:
        raise ValueError(f"Invalid LLM_PROVIDER: {settings.LLM_PROVIDER}")
