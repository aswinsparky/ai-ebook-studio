from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from bs4 import BeautifulSoup
from app.database import get_db
from app.models import Book, BookSource
from app.schemas import (
    BookSourceCreate, BookSourceUpdate, BookSourceResponse
)

router = APIRouter(prefix="/api/sources", tags=["Research Assistant & Sources"])

@router.get("/by-book/{book_id}", response_model=List[BookSourceResponse])
def get_book_sources(book_id: str, db: Session = Depends(get_db)):
    sources = db.query(BookSource).filter(BookSource.book_id == book_id).order_by(BookSource.created_at.desc()).all()
    return sources

@router.post("/by-book/{book_id}", response_model=BookSourceResponse, status_code=status.HTTP_201_CREATED)
def create_book_source(book_id: str, source_in: BookSourceCreate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    content = source_in.content
    title = source_in.title

    # Optional URL content extraction if URL is provided and content is empty
    if source_in.url and not content:
        try:
            with httpx.Client(timeout=6.0, follow_redirects=True) as client:
                resp = client.get(source_in.url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    if not title or title == "New Source":
                        title = soup.title.string.strip() if soup.title and soup.title.string else source_in.url
                    # Extract readable paragraph text
                    paragraphs = [p.get_text().strip() for p in soup.find_all("p")]
                    content = "\n\n".join([p for p in paragraphs if len(p) > 20])[:4000]
        except Exception:
            pass  # Fallback to whatever user submitted

    source = BookSource(
        book_id=book_id,
        title=title or "Untitled Source",
        url=source_in.url or "",
        source_type=source_in.source_type or "note",
        content=content or "No text content recorded.",
        is_verified=source_in.is_verified,
        verification_notes=source_in.verification_notes or ""
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.put("/{source_id}", response_model=BookSourceResponse)
def update_book_source(source_id: str, update_in: BookSourceUpdate, db: Session = Depends(get_db)):
    source = db.query(BookSource).filter(BookSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    data = update_in.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(source, field, val)

    db.commit()
    db.refresh(source)
    return source

@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book_source(source_id: str, db: Session = Depends(get_db)):
    source = db.query(BookSource).filter(BookSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
    return None

