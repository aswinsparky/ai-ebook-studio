# AI Ebook Studio 🚀
### Full-Stack AI Ebook Creation & Publishing Platform

AI Ebook Studio is an end-to-end ebook planning, writing, formatting, and publishing suite inspired by GravityWrite, Inkfluence AI, and BookAutoAI. It runs locally with a FastAPI + SQLite backend, a React + Vite + TypeScript frontend, official `google-genai` integration, and professional document export to DOCX, PDF, and EPUB.

---

## 🌟 Key Features

1. **Dashboard & Project Hub**: Word count targets, progress bars, recent drafts, instant duplicate, rename, search, and resume actions with zero data loss.
2. **Book Creation Wizard**: Full-spectrum project definition including title, subtitle, author, genre, target audience profile, reader transformation promise, writing style, and chapter count.
3. **AI Idea Generator**: High-converting nonfiction & fiction book ideas with hooks, niche analysis, unique selling angles, and sample chapter roadmaps.
4. **Book Blueprint Engine**: Generates foundational concept architecture, target reader psychographics, core value proposition, and chapter-by-chapter learning objectives before writing.
5. **Interactive Outline & Chapter Manager**: Add, edit, delete, reorder chapters, set chapter-specific word targets, and approve blueprints.
6. **Chapter-by-Chapter AI Writing**: High-retention long-form writing with modes for full draft, continuation, expansion, shortening, and targeted rewriting. Completed chapters persist immediately to SQLite.
7. **Pro Manuscript Editor**: Central writing workplace with chapter navigation, formatting controls (H1, H2, H3, Bold, Italic, Lists, Quotes), live word/character counters, search & replace, autosave, and complete revision history with rollback.
8. **AI Writing & Editing Tools**: Instant grammar proofreading, tone rewriting, simplification, repetition reduction, and auto-generation of examples, exercises, and reader FAQs.
9. **Book Consistency & Coherence Review**: Audits entire manuscripts for chapter overlaps, terminology contradictions, unsupported claims, and continuity gaps.
10. **Research Assistant**: Source library preserving URLs, reference notes, and distinguishing verified facts from unverified claims.
11. **Cover Studio**: 5 editable designer templates (Minimalist, Bold Impact, Modern Tech, Editorial Prestige, Artistic Canvas), color customization, background image upload, and live SVG/vector export. Includes optional AI cover prompt generator.
12. **Formatting & Layout Studio**: Trim sizes (6x9", 8.5x11", A5, Kindle), margin configurations, font selection, Table of Contents generator, dynamic page numbers, and front/back matter (introduction, conclusion, preface, author bio, glossary).
13. **Export Center**: Valid, downloadable **DOCX** (via `python-docx`), **PDF** (via `reportlab`), and **EPUB** (via `ebooklib`). Includes downloadable Amazon KDP Preparation Checklist and copy-pasteable publishing metadata (HTML description, 7 search keywords, BISAC categories).
14. **Settings & Model Selector**: Switch between supported Gemini models (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`), test connectivity, view usage metrics, or toggle the Mock AI provider for offline zero-quota testing.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, SQLite, Pydantic v2
- **AI Engine**: Official Google Gen AI SDK (`google-genai`), Mock AI Provider fallback
- **Document Generation**: `python-docx`, `reportlab`, `ebooklib`, `beautifulsoup4`
- **Testing**: `pytest`, `vitest`, `@testing-library/react`, Playwright E2E

---

## 📋 Prerequisites (Windows)

- **Python 3.12+**
- **Node.js v20+** and **npm**
- **Git**
- *(Optional)* Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Quick Start Guide (Windows PowerShell)

### 1. Clone & Set Up Backend

```powershell
cd "C:\ebook project"

# Create and activate Python virtual environment
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt

# Configure environment variables
Copy-Item backend\.env.example backend\.env
```

### 2. Configure Gemini API (Optional)

Open `backend\.env` in an editor and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
USE_MOCK_AI=false
```
> **Note**: If `GEMINI_API_KEY` is omitted or `USE_MOCK_AI=true`, AI Ebook Studio seamlessly activates its built-in Mock AI Provider. All features (ideas, blueprints, chapters, edits, audits) function completely offline without consuming API quota.

### 3. Set Up Frontend

In a separate PowerShell terminal:
```powershell
cd "C:\ebook project\frontend"
npm.cmd install
```

---

## 💻 Running the Application

### Start the Backend Server:
```powershell
cd "C:\ebook project\backend"
$env:PYTHONPATH = "."
..\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be available at: `http://127.0.0.1:8000`
Interactive Swagger Docs at: `http://127.0.0.1:8000/docs`

### Start the Frontend Dev Server:
```powershell
cd "C:\ebook project\frontend"
npm.cmd run dev
```
Open your browser and navigate to: `http://localhost:5173`

---

## 🧪 Running Automated Tests

### 1. Backend Tests (pytest)
```powershell
cd "C:\ebook project"
$env:PYTHONPATH = "backend"
backend\.venv\Scripts\pytest.exe backend\tests -v
```

### 2. Frontend Unit Tests (Vitest)
```powershell
cd "C:\ebook project\frontend"
npm.cmd test
```

### 3. Playwright End-to-End Tests
```powershell
cd "C:\ebook project\frontend"
npm.cmd run build
npx.cmd playwright test
```

---

## 🔒 Security & Secrets Management

- `GEMINI_API_KEY` is strictly held on the backend in `backend/.env`.
- Frontend code and browser network payloads never receive or expose secrets.
- Path traversal protection ensures file downloads are restricted exclusively to the `exports/` folder.
- User-provided URLs and HTML elements are sanitized before rendering.
- CORS origins are configured via environment settings.

---

## 📁 Project Structure

```
C:\ebook project\
├── backend\
│   ├── .env.example              # Environment configuration template
│   ├── requirements.txt          # Python dependencies
│   ├── app\
│   │   ├── main.py               # FastAPI entrypoint & middleware
│   │   ├── config.py             # App settings & directory initialization
│   │   ├── database.py           # SQLAlchemy engine & session factory
│   │   ├── models.py             # SQLite ORM models (Book, Chapter, etc.)
│   │   ├── schemas.py            # Pydantic v2 validation models
│   │   ├── ai\
│   │   │   ├── gemini_client.py  # Official Google Gen AI client
│   │   │   ├── mock_provider.py  # Realistic offline AI generator
│   │   │   └── prompts.py        # Structured prompt templates
│   │   ├── routers\              # REST endpoints (books, chapters, exports...)
│   │   └── services\             # Exporters (docx_exporter, pdf_exporter, epub_exporter)
│   └── tests\                    # pytest test suite
│
├── frontend\
│   ├── package.json              # React dependencies & scripts
│   ├── vite.config.ts            # Vite proxy & test config
│   ├── tailwind.config.js        # Design system & dark palette
│   ├── src\
│   │   ├── api\client.ts         # Type-safe API client
│   │   ├── types\index.ts        # TypeScript interfaces
│   │   ├── components\           # Navbar, CoverCanvas, Toast
│   │   └── pages\                # Dashboard, BookWorkspace, Wizard, Settings
│   └── e2e\                      # Playwright E2E test suite
└── README.md
```

