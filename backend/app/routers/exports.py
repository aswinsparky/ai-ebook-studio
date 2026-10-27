import os
import re
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Book, Chapter, BookSettings
from app.schemas import BookSettingsUpdate, BookSettingsResponse
from app.services.docx_exporter import generate_docx
from app.services.pdf_exporter import generate_pdf
from app.services.epub_exporter import generate_epub

router = APIRouter(prefix="/api/exports", tags=["Export Center & Publishing Assistant"])

def sanitize_filename(name: str) -> str:
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    return clean.replace(" ", "_").strip("_")[:50]

@router.get("/{book_id}/settings", response_model=BookSettingsResponse)
def get_formatting_settings(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    b_settings = book.settings
    if not b_settings:
        b_settings = BookSettings(book_id=book.id)
        db.add(b_settings)
        db.commit()
        db.refresh(b_settings)

    return b_settings

@router.put("/{book_id}/settings", response_model=BookSettingsResponse)
def update_formatting_settings(book_id: str, update_in: BookSettingsUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    b_settings = book.settings
    if not b_settings:
        b_settings = BookSettings(book_id=book.id)
        db.add(b_settings)

    data = update_in.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(b_settings, field, val)

    db.commit()
    db.refresh(b_settings)
    return b_settings

@router.post("/{book_id}/build/{format_type}")
def build_export_document(book_id: str, format_type: str, db: Session = Depends(get_db)):
    fmt = format_type.lower()
    if fmt not in ["docx", "pdf", "epub"]:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{fmt}'. Choose 'docx', 'pdf', or 'epub'.")

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapters = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.order_index).all()
    if not chapters:
        raise HTTPException(status_code=400, detail="Cannot export a book with no chapters.")

    safe_title = sanitize_filename(book.title or "Book")
    filename = f"{safe_title}_{book.id[:8]}.{fmt}"
    output_path = os.path.abspath(os.path.join(settings.EXPORTS_DIR, filename))

    try:
        if fmt == "docx":
            generate_docx(book, chapters, book.settings, output_path)
        elif fmt == "pdf":
            generate_pdf(book, chapters, book.settings, output_path)
        elif fmt == "epub":
            generate_epub(book, chapters, book.settings, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export generation failed: {str(e)}")

    file_size_bytes = os.path.getsize(output_path)
    return {
        "success": True,
        "format": fmt,
        "filename": filename,
        "download_url": f"/api/exports/download/{filename}",
        "file_size_kb": round(file_size_bytes / 1024, 1)
    }

@router.get("/download/{filename}")
def download_export_file(filename: str):
    # Security: Strict path traversal prevention
    base_dir = os.path.abspath(settings.EXPORTS_DIR)
    target_path = os.path.abspath(os.path.join(base_dir, filename))

    if not target_path.startswith(base_dir) or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Requested file does not exist or access is forbidden.")

    media_types = {
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pdf": "application/pdf",
        ".epub": "application/epub+zip",
        ".txt": "text/plain"
    }
    ext = os.path.splitext(filename)[1].lower()
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        path=target_path,
        media_type=media_type,
        filename=filename
    )

@router.get("/{book_id}/kdp-checklist")
def get_kdp_checklist(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    checklist = [
        {"id": 1, "task": "Manuscript proofreading & spelling check complete", "completed": True},
        {"id": 2, "task": "Front matter (Title, Copyright, Table of Contents) formatted", "completed": True},
        {"id": 3, "task": "Chapter headings follow consistent H1/H2 hierarchy", "completed": True},
        {"id": 4, "task": "Cover image formatted to 1.6:1 aspect ratio (recommended 1600x2560px)", "completed": False},
        {"id": 5, "task": "KDP Book Description formatted with HTML tags (<b>, <h2>, <i>)", "completed": False},
        {"id": 6, "task": "7 Amazon Search Keywords selected based on reader intent", "completed": False},
        {"id": 7, "task": "3 Primary BISAC Categories identified", "completed": False},
        {"id": 8, "task": "Pricing strategy and KDP Select enrollment decided", "completed": False}
    ]

    return {
        "book_title": book.title,
        "author": book.author,
        "checklist": checklist,
        "disclaimer": "Note: Publishing platforms (Amazon KDP, Apple Books, Kobo) have specific distribution guidelines. Always preview your book inside Kindle Previewer before submitting."
    }

@router.get("/{book_id}/publishing-metadata")
def get_publishing_metadata(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    genre_clean = book.genre or "Self-Help / Business"
    topic_clean = book.topic or book.title

    html_description = f"""<h2>Are you ready to unlock {book.reader_promise or 'meaningful transformation'}?</h2>
<p>In <b>{book.title}</b>, author <i>{book.author or 'Anonymous'}</i> delivers a masterclass in navigating {topic_clean}. Packed with proven frameworks, actionable strategies, and real-world case studies, this book eliminates guesswork and puts you in control.</p>
<h3>Inside this book, you will discover:</h3>
<ul>
  <li>How to diagnose hidden friction points before they derail your momentum</li>
  <li>The step-by-step methodology to master {genre_clean} from first principles</li>
  <li>Practical exercises and diagnostic tools at the end of every chapter</li>
  <li>How to build resilient systems that compound over time</li>
</ul>
<p>Whether you are a beginner looking for clarity or an experienced practitioner aiming for the next level, <b>{book.title}</b> is your definitive field guide.</p>
<p><b>Scroll up and click 'Buy Now' to begin your transformation today!</b></p>"""

    keywords = [
        f"{genre_clean.lower()} guide",
        f"how to master {topic_clean.lower()}",
        f"{book.target_audience.lower()} handbook" if book.target_audience else "practical self development",
        "habit building and systems",
        "actionable productivity strategies",
        "first principles thinking",
        "step by step mastery playbook"
    ]

    categories = [
        f"Nonfiction > {genre_clean} > Personal Success",
        f"Nonfiction > Business & Money > Management & Leadership",
        f"Nonfiction > Self-Help > Creativity & Motivation"
    ]

    return {
        "title": book.title,
        "subtitle": book.subtitle or "",
        "author": book.author or "",
        "html_description": html_description,
        "keywords": keywords[:7],
        "bisac_categories": categories
    }

