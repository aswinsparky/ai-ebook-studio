import os
import shutil
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Book, CoverAsset
from app.schemas import CoverAssetUpdate, CoverAssetResponse

router = APIRouter(prefix="/api/covers", tags=["Cover Studio"])

COVER_TEMPLATES = [
    {
        "id": "minimalist",
        "name": "Minimalist Elegance",
        "category": "Nonfiction / Literary",
        "description": "Clean, spacious layout with refined serif typography and subtle framing.",
        "primary_color": "#0f172a",
        "secondary_color": "#f8fafc",
        "accent_color": "#e2e8f0",
        "font_family": "Cinzel",
        "background_style": "solid"
    },
    {
        "id": "bold",
        "name": "Bold Impact",
        "category": "Business / Self-Help",
        "description": "High-contrast bold headings, dynamic banner accents, and commanding presence.",
        "primary_color": "#1e1b4b",
        "secondary_color": "#ffffff",
        "accent_color": "#f59e0b",
        "font_family": "Montserrat",
        "background_style": "gradient"
    },
    {
        "id": "modern",
        "name": "Modern Tech & Science",
        "category": "Technology / Innovation",
        "description": "Futuristic geometric grid accents, sleek sans-serif fonts, and deep gradient mesh.",
        "primary_color": "#090d16",
        "secondary_color": "#38bdf8",
        "accent_color": "#818cf8",
        "font_family": "Inter",
        "background_style": "gradient"
    },
    {
        "id": "editorial",
        "name": "Editorial Prestige",
        "category": "Biography / History",
        "description": "Classic magazine aesthetic with structured columns, ornate borders, and gold accents.",
        "primary_color": "#1c1917",
        "secondary_color": "#fef3c7",
        "accent_color": "#d97706",
        "font_family": "Playfair Display",
        "background_style": "solid"
    },
    {
        "id": "artistic",
        "name": "Artistic Canvas",
        "category": "Fiction / Creative",
        "description": "Atmospheric, rich palette suitable for book cover image overlays and evocative moods.",
        "primary_color": "#2e1065",
        "secondary_color": "#fdf4ff",
        "accent_color": "#ec4899",
        "font_family": "Lora",
        "background_style": "gradient"
    }
]

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

@router.get("/templates", response_model=List[Dict[str, Any]])
def get_cover_templates():
    return COVER_TEMPLATES

@router.get("/by-book/{book_id}", response_model=CoverAssetResponse)
def get_book_cover(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    cover = book.cover_asset
    if not cover:
        cover = CoverAsset(
            book_id=book.id,
            title=book.title,
            subtitle=book.subtitle or "",
            author=book.author or ""
        )
        db.add(cover)
        db.commit()
        db.refresh(cover)

    return cover

@router.put("/by-book/{book_id}", response_model=CoverAssetResponse)
def update_book_cover(book_id: str, update_in: CoverAssetUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    cover = book.cover_asset
    if not cover:
        cover = CoverAsset(book_id=book.id)
        db.add(cover)

    data = update_in.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(cover, field, val)

    db.commit()
    db.refresh(cover)
    return cover

@router.post("/by-book/{book_id}/upload-image", response_model=CoverAssetResponse)
def upload_cover_image(book_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: PNG, JPG, JPEG, WEBP.")

    filename = f"cover_{book_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(settings.UPLOADS_DIR, filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")

    cover = book.cover_asset
    if not cover:
        cover = CoverAsset(book_id=book.id)
        db.add(cover)

    cover.uploaded_image_url = f"/uploads/{filename}"
    cover.background_style = "custom_image"
    db.commit()
    db.refresh(cover)
    return cover

@router.post("/ai-prompt-generator/{book_id}")
def generate_cover_ai_prompt(book_id: str, db: Session = Depends(get_db)):
    """
    Generates an optimized Midjourney / DALL-E / Imagen prompt for authors who want to
    generate a background image externally.
    Note: Clearly discloses that automated AI image generation is not run silently.
    """
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    prompt = (
        f"Professional book cover illustration for a {book.genre} book titled '{book.title}'. "
        f"Topic: {book.topic or book.title}. Target mood: {book.tone}, minimalist, high resolution, "
        f"commercial quality, cinematic lighting, dramatic composition, vector or painterly finish, "
        f"clean background center for typography --ar 2:3 --v 6.0"
    )

    return {
        "disclaimer": "AI image generation services may require paid credits. You can copy this tailored prompt to your preferred image generation tool (Midjourney, DALL-E, Imagen) and upload the resulting image to the Cover Studio.",
        "prompt": prompt,
        "recommended_dimensions": "1600 x 2560 pixels (standard 1:1.6 ebook cover ratio)"
    }

