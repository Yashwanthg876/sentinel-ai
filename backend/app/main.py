from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.chat import router as chat_router
from app.routes.evidence import router as evidence_router
from app.routes.cases import router as cases_router
from app.routes.auth_routes import router as auth_router
from app.routes.admin import router as admin_router
from app.database import Base, engine, run_migrations

# Create tables (new installs) then run safe column migrations (existing installs)
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="SentinelAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(chat_router)
app.include_router(evidence_router)
app.include_router(cases_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "SentinelAI Backend Running"}
