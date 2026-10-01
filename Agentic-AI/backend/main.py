from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import config
import db

from routers import papers, agents, evidence, pdf, corpus, sessions, discovery, collection, paper_chat

config.ensure_dirs()
db.init_db()

app = FastAPI(
    title="R-Lens Academic Research Assistant API",
    description=(
        "Agentic literature-review backend. Retrieves only from human-approved "
        "papers, exposes the agent's activity log, and computes citation support "
        "rather than asserting it."
    ),
    version="2.5.0",
)

# Enable CORS for frontend Vite development server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers. `sessions` + `corpus` are the review workflow; `discovery` and
# `collection` are the fresh-topic + vector-RAG additions; the older four are
# retained so the existing frontend pages keep working.
app.include_router(sessions.router)
app.include_router(corpus.router)
app.include_router(discovery.router)
app.include_router(collection.router)
app.include_router(papers.router)
app.include_router(agents.router)
app.include_router(evidence.router)
app.include_router(pdf.router)
app.include_router(paper_chat.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "name": "R-Lens Research Assistant API",
        "version": "2.5.0",
        "docs_url": "/docs",
        "workflow": "POST /api/sessions -> /approval -> /run",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
