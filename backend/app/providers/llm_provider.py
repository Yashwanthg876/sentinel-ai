import os

class BaseLLMProvider:
    def generate(self, prompt: str) -> str:
        raise NotImplementedError()

def get_llm_provider() -> BaseLLMProvider:
    provider_name = os.getenv("LLM_PROVIDER", "ollama").lower()
    
    if provider_name == "ollama":
        from app.providers.ollama_provider import OllamaProvider
        return OllamaProvider()
    elif provider_name == "openai":
        from app.providers.openai_provider import OpenAIProvider
        return OpenAIProvider()
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider_name}")
