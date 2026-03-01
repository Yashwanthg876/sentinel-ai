from fastapi import FastAPI
from app.routes.chat import router as chat_router

app = FastAPI(title="SentinelAI API")

app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "SentinelAI Backend Running"}
