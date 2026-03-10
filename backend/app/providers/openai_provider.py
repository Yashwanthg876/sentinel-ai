import os
from openai import OpenAI
from .llm_provider import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    def generate(self, prompt: str) -> str:
        model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")
        api_key = os.getenv("OPENAI_API_KEY", "")
        
        # Log model usage
        print(f"LLM Provider: openai | Model: {model_name}")

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return response.choices[0].message.content
