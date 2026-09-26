from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routers import papers, agents, evidence, pdf

app = FastAPI(
    title="R-Lens Academic Research Assistant API",
    description="Agentic AI Academic Research Assistant Backend API powering search, evidence synthesis, verification, and agent provenance.",
    version="1.0.0"
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

# Include Routers
app.include_router(papers.router)
app.include_router(agents.router)
app.include_router(evidence.router)
app.include_router(pdf.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "name": "R-Lens Research Assistant API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
