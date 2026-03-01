import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")

settings = Settings()
