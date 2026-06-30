from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingest, wiki, srs, evaluate, schedule, plan, lint, notebooks, llm, sessions

app = FastAPI(title="YachaqAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(wiki.router, prefix="/wiki", tags=["wiki"])
app.include_router(srs.router, prefix="/srs", tags=["srs"])
app.include_router(evaluate.router, prefix="/evaluate", tags=["evaluate"])
app.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
app.include_router(plan.router, prefix="/plan", tags=["plan"])
app.include_router(lint.router, prefix="/lint", tags=["lint"])
app.include_router(notebooks.router, prefix="/api/notebooks", tags=["notebooks"])
app.include_router(llm.router, prefix="/llm", tags=["llm"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])


@app.get("/health")
def health():
    return {"status": "ok"}
