# R-Lens — Academic Research Assistant & Evidence Matrix

> **Agentic AI Academic Research Assistant** for systematic literature review, empirical evidence synthesis, paper auditing, and human-in-the-loop validation.

---

## 📁 Monorepo Structure

```
e:\Agentic ai project\
├── frontend/                     # React 18 + Vite + Tailwind CSS + TypeScript
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── assets/               # Logos and researcher profile imagery
│   │   ├── components/layout/    # AppLayout, Sidebar, Topbar
│   │   ├── context/              # ResearchContext (React Context API)
│   │   ├── data/                 # Mock research dataset & citations
│   │   ├── pages/                # Workspace, Evidence, Analysis, AI tools
│   │   ├── services/             # Paper, Agent, and Research services
│   │   └── types/                # Core TypeScript interfaces & types
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Python FastAPI REST API
│   ├── data/
│   │   └── mock_data.py          # Python dataset mirrored from frontend
│   ├── models/
│   │   └── schemas.py            # Pydantic schemas (Paper, Evidence, Steps)
│   ├── routers/
│   │   ├── agents.py             # Provenance steps, autopilot endpoints
│   │   ├── evidence.py           # Evidence matrix, BibTeX & CSV exports
│   │   └── papers.py             # Paper search, detail, validation endpoints
│   ├── services/
│   │   ├── agent_service.py      # Autopilot & step tracking logic
│   │   ├── paper_service.py      # Search, filter, sorting logic
│   │   └── research_service.py   # Matrix manipulation & export formatting
│   ├── main.py                   # FastAPI app entry point with CORS
│   └── requirements.txt          # Backend dependencies
│
├── design/                       # UI/UX Specifications & Prototype References
│   ├── DESIGN.md                 # Design system specification & token guide
│   ├── screens/                  # Rendered reference PNGs
│   │   ├── evidence_matrix.png
│   │   ├── literature_review.png
│   │   ├── paper_analysis.png
│   │   ├── rec_scholar_overview.png
│   │   ├── research_home.png
│   │   └── research_workspace.png
│   ├── prototypes/               # Interactive Stitch HTML prototypes
│   │   ├── evidence_matrix.html
│   │   ├── literature_review.html
│   │   ├── paper_analysis.html
│   │   ├── rec_scholar_overview.html
│   │   ├── research_home.html
│   │   └── research_workspace.html
│   └── assets/                   # Profile & logo source images
│       ├── dr_ramanathan.png
│       ├── logo.svg
│       └── r_lens_logo.png
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later ([Download Node.js](https://nodejs.org/))
- **Python**: v3.9 or later ([Download Python](https://www.python.org/))
- **Package Managers**: `npm` (bundled with Node) and `pip` (bundled with Python)

---

### 1. Frontend Setup & Run (React / Vite)

1. Open a terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

5. *(Optional)* Build for production:
   ```bash
   npm run build
   ```

---

### 2. Backend Setup & Run (FastAPI / Python)

1. Open a separate terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. *(Recommended)* Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the FastAPI server with live reload:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Explore the interactive API documentation (Swagger UI):
   ```
   http://localhost:8000/docs
   ```
   Or the alternative ReDoc documentation:
   ```
   http://localhost:8000/redoc
   ```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/papers` | List, search, filter, and sort academic papers |
| `GET` | `/api/papers/{id}` | Get detailed paper metadata, metrics, and sections |
| `PATCH` | `/api/papers/{id}/validation` | Update validation status (`Accepted`, `Needs Review`, etc.) |
| `GET` | `/api/evidence/matrix` | Retrieve full empirical evidence matrix rows |
| `PATCH` | `/api/evidence/matrix/{id}/status` | Update evidence claim support status |
| `GET` | `/api/evidence/citations` | Get report citations with confidence scores |
| `GET` | `/api/evidence/export/bibtex` | Download aggregated `.bib` BibTeX reference file |
| `GET` | `/api/evidence/export/csv` | Download evidence matrix as `.csv` table |
| `GET` | `/api/agents/steps` | Retrieve agent pipeline provenance steps |
| `POST` | `/api/agents/instruction` | Submit interactive dynamic prompt/instruction |
| `GET` | `/api/agents/autopilot` | Check autopilot execution status |
| `POST` | `/api/agents/autopilot` | Toggle autopilot on or off |

---

## 🎨 Design System & Reference Prototypes

All original Stitch prototypes and high-resolution screen mocks are indexed in the `design/` folder:
- **Design Specifications**: [design/DESIGN.md](file:///e:/Agentic%20ai%20project/design/DESIGN.md)
- **Interactive Prototypes**: Open any file in `design/prototypes/*.html` in your browser.
- **Reference Screenshots**: Browse pixel-accurate UI states in `design/screens/*.png`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Vite
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2
- **Architecture**: Monorepo with segregated concerns (Frontend / Backend / Design)
