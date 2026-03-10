import os
import ollama
from .llm_provider import BaseLLMProvider

class OllamaProvider(BaseLLMProvider):
    def generate(self, prompt: str) -> str:
        model_name = os.getenv("LLM_MODEL", "phi3")
        
        # Log model usage
        print(f"LLM Provider: ollama | Model: {model_name}")

        response = ollama.chat(
            model=model_name,
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"]
