import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Book, Chapter, BookSettings
from app.schemas import (
    AIEditRequest, AIEditResponse,
    ConsistencyCheckResponse,
    FrontBackMatterRequest, FrontBackMatterResponse
)
from app.ai.gemini_client import ai_client

router = APIRouter(prefix="/api/assistant", tags=["AI Writing & Review Assistant"])

@router.post("/edit", response_model=AIEditResponse)
def execute_ai_edit(edit_req: AIEditRequest):
    result = ai_client.ai_edit(
        action=edit_req.action,
        full_content=edit_req.full_content,
        selected_text=edit_req.selected_text,
        tone_target=edit_req.tone_target or "engaging",
        custom_instruction=edit_req.custom_instruction or ""
    )
    return AIEditResponse(**result)

@router.post("/consistency/{book_id}", response_model=ConsistencyCheckResponse)
def check_book_consistency(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapters = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.order_index).all()
    if not chapters:
        raise HTTPException(status_code=400, detail="Cannot run consistency review without chapters.")

    chapters_summary_text = "\n\n".join([
        f"--- Chapter {c.order_index}: {c.title} ---\nSummary: {c.summary}\nSample Content:\n{c.content[:1500] if c.content else 'No content written yet.'}"
        for c in chapters
    ])

    result = ai_client.check_consistency(
        title=book.title,
        target_audience=book.target_audience or "General Readers",
        chapters_content=chapters_summary_text
    )
    return ConsistencyCheckResponse(**result)

@router.post("/front-back-matter/{book_id}", response_model=FrontBackMatterResponse)
def generate_front_back_matter(
    book_id: str,
    req: FrontBackMatterRequest,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    result = ai_client.generate_front_back_matter(
        section_type=req.section_type,
        title=book.title,
        subtitle=book.subtitle or "",
        author=book.author or "",
        genre=book.genre or "Nonfiction",
        target_audience=book.target_audience or "",
        reader_promise=book.reader_promise or "",
        custom_details=req.custom_details or ""
    )

    # Save into BookSettings
    settings = book.settings
    if not settings:
        settings = BookSettings(book_id=book.id)
        db.add(settings)
        db.flush()

    if req.section_type in ["introduction", "preface", "acknowledgements"]:
        try:
            fm = json.loads(settings.front_matter_json or "{}")
        except Exception:
            fm = {}
        fm[req.section_type] = result["content"]
        settings.front_matter_json = json.dumps(fm)
    elif req.section_type in ["conclusion", "author_bio", "glossary"]:
        try:
            bm = json.loads(settings.back_matter_json or "{}")
        except Exception:
            bm = {}
        bm[req.section_type] = result["content"]
        settings.back_matter_json = json.dumps(bm)

    db.commit()
    return FrontBackMatterResponse(**result)

