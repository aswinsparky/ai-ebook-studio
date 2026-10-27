import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Book, Chapter, BookSettings, CoverAsset, ChapterRevision
from app.schemas import (
    BookCreate, BookUpdate, BookResponse, BookListItem, ChapterBrief
)

router = APIRouter(prefix="/api/books", tags=["Books"])

def _calculate_book_stats(book: Book):
    chapter_count = len(book.chapters)
    total_words = 0
    for ch in book.chapters:
        words = len(ch.content.split()) if ch.content else 0
        total_words += words
    return chapter_count, total_words

@router.get("", response_model=List[BookListItem])
def list_books(search: str = "", db: Session = Depends(get_db)):
    query = db.query(Book)
    if search:
        s = f"%{search}%"
        query = query.filter((Book.title.ilike(s)) | (Book.topic.ilike(s)) | (Book.genre.ilike(s)))
    books = query.order_by(Book.updated_at.desc()).all()
    
    result = []
    for b in books:
        ch_count, total_words = _calculate_book_stats(b)
        progress = 0.0
        if b.target_word_count and b.target_word_count > 0:
            progress = min(100.0, round((total_words / b.target_word_count) * 100, 1))
        
        result.append(BookListItem(
            id=b.id,
            title=b.title,
            subtitle=b.subtitle or "",
            author=b.author or "Anonymous",
            genre=b.genre or "Nonfiction",
            status=b.status,
            target_word_count=b.target_word_count or 25000,
            chapter_count=ch_count,
            total_word_count=total_words,
            progress_percentage=progress,
            updated_at=b.updated_at
        ))
    return result

@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    book = Book(**book_in.model_dump())
    db.add(book)
    db.flush()

    # Initialize default settings and cover
    settings = BookSettings(book_id=book.id)
    cover = CoverAsset(
        book_id=book.id,
        title=book.title,
        subtitle=book.subtitle or "",
        author=book.author or ""
    )
    db.add(settings)
    db.add(cover)
    db.commit()
    db.refresh(book)

    return get_book(book.id, db)

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    ch_count, total_words = _calculate_book_stats(book)
    chapters_brief = [
        ChapterBrief(
            id=ch.id,
            order_index=ch.order_index,
            title=ch.title,
            target_word_count=ch.target_word_count,
            status=ch.status,
            word_count=len(ch.content.split()) if ch.content else 0,
            updated_at=ch.updated_at
        )
        for ch in book.chapters
    ]

    return BookResponse(
        id=book.id,
        title=book.title,
        subtitle=book.subtitle or "",
        author=book.author or "",
        language=book.language,
        genre=book.genre,
        topic=book.topic or "",
        target_audience=book.target_audience or "",
        reader_promise=book.reader_promise or "",
        writing_style=book.writing_style or "",
        tone=book.tone or "",
        target_word_count=book.target_word_count,
        target_chapter_count=book.target_chapter_count,
        custom_instructions=book.custom_instructions or "",
        status=book.status,
        blueprint_json=book.blueprint_json or "",
        created_at=book.created_at,
        updated_at=book.updated_at,
        chapter_count=ch_count,
        total_word_count=total_words,
        chapters=chapters_brief
    )

@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: str, update_in: BookUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = update_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    # Sync title/author to cover if changed
    if "title" in update_data and book.cover_asset:
        book.cover_asset.title = update_data["title"]
    if "author" in update_data and book.cover_asset:
        book.cover_asset.author = update_data["author"]

    db.commit()
    db.refresh(book)
    return get_book(book_id, db)

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(book)
    db.commit()
    return None

@router.post("/{book_id}/duplicate", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def duplicate_book(book_id: str, db: Session = Depends(get_db)):
    original = db.query(Book).filter(Book.id == book_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Book not found")

    new_book = Book(
        title=f"{original.title} (Copy)",
        subtitle=original.subtitle,
        author=original.author,
        language=original.language,
        genre=original.genre,
        topic=original.topic,
        target_audience=original.target_audience,
        reader_promise=original.reader_promise,
        writing_style=original.writing_style,
        tone=original.tone,
        target_word_count=original.target_word_count,
        target_chapter_count=original.target_chapter_count,
        custom_instructions=original.custom_instructions,
        status=original.status,
        blueprint_json=original.blueprint_json
    )
    db.add(new_book)
    db.flush()

    # Clone chapters
    for ch in original.chapters:
        new_ch = Chapter(
            book_id=new_book.id,
            order_index=ch.order_index,
            title=ch.title,
            summary=ch.summary,
            key_points_json=ch.key_points_json,
            target_word_count=ch.target_word_count,
            content=ch.content,
            status=ch.status
        )
        db.add(new_ch)

    # Clone settings and cover
    new_settings = BookSettings(
        book_id=new_book.id,
        trim_size=original.settings.trim_size if original.settings else "6x9",
        font_family=original.settings.font_family if original.settings else "Merriweather",
        front_matter_json=original.settings.front_matter_json if original.settings else "{}",
        back_matter_json=original.settings.back_matter_json if original.settings else "{}"
    )
    new_cover = CoverAsset(
        book_id=new_book.id,
        title=new_book.title,
        subtitle=new_book.subtitle,
        author=new_book.author
    )
    db.add(new_settings)
    db.add(new_cover)
    db.commit()
    db.refresh(new_book)
    return get_book(new_book.id, db)
