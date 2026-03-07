from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat import router as chat_router
from app.routes.evidence import router as evidence_router

app = FastAPI(title="SentinelAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(evidence_router)

@app.get("/")
def root():
    return {"message": "SentinelAI Backend Running"}
