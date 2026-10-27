import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Book, Chapter, ChapterRevision, BookSource
from app.schemas import (
    ChapterCreate, ChapterUpdate, ChapterResponse, ChapterReorderRequest,
    ChapterGenerationRequest, ChapterRevisionResponse
)
from app.ai.gemini_client import ai_client

router = APIRouter(prefix="/api/chapters", tags=["Chapters"])

def _count_words(text: str) -> int:
    return len(text.split()) if text else 0

@router.get("/by-book/{book_id}", response_model=List[ChapterResponse])
def get_book_chapters(book_id: str, db: Session = Depends(get_db)):
    chapters = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.order_index).all()
    results = []
    for ch in chapters:
        revs = [
            ChapterRevisionResponse(
                id=r.id,
                chapter_id=r.chapter_id,
                revision_number=r.revision_number,
                change_summary=r.change_summary,
                word_count=r.word_count,
                content=r.content,
                created_at=r.created_at
            )
            for r in ch.revisions
        ]
        results.append(ChapterResponse(
            id=ch.id,
            book_id=ch.book_id,
            order_index=ch.order_index,
            title=ch.title,
            summary=ch.summary or "",
            key_points_json=ch.key_points_json or "[]",
            target_word_count=ch.target_word_count,
            content=ch.content or "",
            status=ch.status,
            created_at=ch.created_at,
            updated_at=ch.updated_at,
            word_count=_count_words(ch.content),
            revisions=revs
        ))
    return results

@router.post("", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(chapter_in: ChapterCreate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == chapter_in.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    chapter = Chapter(**chapter_in.model_dump())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)

    return ChapterResponse(
        id=chapter.id,
        book_id=chapter.book_id,
        order_index=chapter.order_index,
        title=chapter.title,
        summary=chapter.summary or "",
        key_points_json=chapter.key_points_json or "[]",
        target_word_count=chapter.target_word_count,
        content=chapter.content or "",
        status=chapter.status,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
        word_count=_count_words(chapter.content),
        revisions=[]
    )

@router.get("/detail/{chapter_id}", response_model=ChapterResponse)
def get_chapter(chapter_id: str, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    revs = [
        ChapterRevisionResponse(
            id=r.id,
            chapter_id=r.chapter_id,
            revision_number=r.revision_number,
            change_summary=r.change_summary,
            word_count=r.word_count,
            content=r.content,
            created_at=r.created_at
        )
        for r in chapter.revisions
    ]

    return ChapterResponse(
        id=chapter.id,
        book_id=chapter.book_id,
        order_index=chapter.order_index,
        title=chapter.title,
        summary=chapter.summary or "",
        key_points_json=chapter.key_points_json or "[]",
        target_word_count=chapter.target_word_count,
        content=chapter.content or "",
        status=chapter.status,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
        word_count=_count_words(chapter.content),
        revisions=revs
    )

@router.put("/{chapter_id}", response_model=ChapterResponse)
def update_chapter(
    chapter_id: str,
    update_in: ChapterUpdate,
    save_revision: bool = False,
    revision_summary: str = "Editor save",
    db: Session = Depends(get_db)
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    update_data = update_in.model_dump(exclude_unset=True)
    content_changed = "content" in update_data and update_data["content"] != chapter.content

    for field, value in update_data.items():
        setattr(chapter, field, value)

    if content_changed and save_revision:
        rev_count = db.query(ChapterRevision).filter(ChapterRevision.chapter_id == chapter_id).count()
        rev = ChapterRevision(
            chapter_id=chapter.id,
            revision_number=rev_count + 1,
            content=chapter.content or "",
            change_summary=revision_summary,
            word_count=_count_words(chapter.content)
        )
        db.add(rev)

    db.commit()
    db.refresh(chapter)
    return get_chapter(chapter_id, db)

@router.delete("/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(chapter_id: str, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    book_id = chapter.book_id
    db.delete(chapter)
    db.commit()

    # Re-normalize remaining chapter orders
    remaining = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.order_index).all()
    for idx, ch in enumerate(remaining, start=1):
        ch.order_index = idx
    db.commit()
    return None

@router.post("/reorder")
def reorder_chapters(reorder_req: ChapterReorderRequest, db: Session = Depends(get_db)):
    for item in reorder_req.chapters:
        ch = db.query(Chapter).filter(Chapter.id == item.id).first()
        if ch:
            ch.order_index = item.order_index
    db.commit()
    return {"success": True, "message": "Chapter order updated."}

@router.post("/{chapter_id}/generate", response_model=ChapterResponse)
def generate_chapter_content(
    chapter_id: str,
    gen_req: ChapterGenerationRequest,
    db: Session = Depends(get_db)
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    book = chapter.book
    target_words = gen_req.target_word_count or chapter.target_word_count or 2500

    # Collect previous chapters context for narrative continuity
    prev_chapters = db.query(Chapter).filter(
        Chapter.book_id == book.id,
        Chapter.order_index < chapter.order_index
    ).order_by(Chapter.order_index).all()
    
    prev_summary = " ; ".join([f"Ch {c.order_index} ({c.title}): {c.summary}" for c in prev_chapters])

    # Collect verified research sources
    sources = db.query(BookSource).filter(BookSource.book_id == book.id).all()
    sources_summary = "\n".join([f"- {s.title} ({s.url}): {s.content[:200]}" for s in sources])

    key_points = []
    if chapter.key_points_json:
        try:
            key_points = json.loads(chapter.key_points_json)
        except Exception:
            key_points = []

    # Update chapter status to generating
    chapter.status = "generating"
    db.commit()

    try:
        generated = ai_client.generate_chapter(
            book_title=book.title,
            chapter_title=chapter.title,
            order_index=chapter.order_index,
            genre=book.genre or "Nonfiction",
            topic=book.topic or "",
            target_audience=book.target_audience or "",
            reader_promise=book.reader_promise or "",
            writing_style=book.writing_style or "Engaging",
            tone=book.tone or "Conversational",
            summary=chapter.summary or "",
            key_points=key_points,
            target_word_count=target_words,
            previous_context=prev_summary,
            sources_summary=sources_summary,
            writing_instructions=gen_req.writing_instructions or book.custom_instructions or "",
            mode=gen_req.mode or "full",
            existing_content=chapter.content or ""
        )

        chapter.content = generated
        chapter.status = "draft"
        chapter.target_word_count = target_words

        # Create revision snapshot
        rev_count = db.query(ChapterRevision).filter(ChapterRevision.chapter_id == chapter_id).count()
        rev = ChapterRevision(
            chapter_id=chapter.id,
            revision_number=rev_count + 1,
            content=generated,
            change_summary=f"AI Generation ({gen_req.mode or 'full'})",
            word_count=_count_words(generated)
        )
        db.add(rev)

        # Update book status to writing if still draft/blueprint
        if book.status in ["draft", "blueprint_generated", "outline_approved"]:
            book.status = "writing"

        db.commit()
        db.refresh(chapter)
        return get_chapter(chapter_id, db)
    except Exception as e:
        chapter.status = "planned"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/{chapter_id}/restore-revision/{revision_id}", response_model=ChapterResponse)
def restore_chapter_revision(chapter_id: str, revision_id: str, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    rev = db.query(ChapterRevision).filter(ChapterRevision.id == revision_id, ChapterRevision.chapter_id == chapter_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Revision snapshot not found")

    chapter.content = rev.content
    chapter.status = "draft"

    # Log restoration revision
    rev_count = db.query(ChapterRevision).filter(ChapterRevision.chapter_id == chapter_id).count()
    new_rev = ChapterRevision(
        chapter_id=chapter.id,
        revision_number=rev_count + 1,
        content=rev.content,
        change_summary=f"Restored from Revision #{rev.revision_number}",
        word_count=_count_words(rev.content)
    )
    db.add(new_rev)
    db.commit()
    db.refresh(chapter)

    return get_chapter(chapter_id, db)

