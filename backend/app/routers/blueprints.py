import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Book, Chapter
from app.schemas import (
    IdeaPromptRequest, IdeaGenerationResponse, BlueprintResponse, ChapterBlueprintItem
)
from app.ai.gemini_client import ai_client

router = APIRouter(prefix="/api/blueprints", tags=["Blueprints & Ideas"])

@router.post("/ideas", response_model=IdeaGenerationResponse)
def generate_ideas(prompt_in: IdeaPromptRequest):
    result = ai_client.generate_ideas(
        niche=prompt_in.niche,
        genre=prompt_in.genre,
        target_audience=prompt_in.target_audience,
        keywords=prompt_in.keywords,
        count=prompt_in.count or 3
    )
    return result

@router.post("/generate/{book_id}", response_model=BlueprintResponse)
def generate_book_blueprint(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    blueprint_dict = ai_client.generate_blueprint(
        title=book.title,
        subtitle=book.subtitle or "",
        author=book.author or "",
        genre=book.genre or "Nonfiction",
        topic=book.topic or "",
        target_audience=book.target_audience or "",
        reader_promise=book.reader_promise or "",
        writing_style=book.writing_style or "Engaging and Practical",
        tone=book.tone or "Conversational yet Authoritative",
        target_chapter_count=book.target_chapter_count or 10,
        target_word_count=book.target_word_count or 25000,
        custom_instructions=book.custom_instructions or ""
    )

    # Persist blueprint JSON to the book
    book.blueprint_json = json.dumps(blueprint_dict)
    book.status = "blueprint_generated"
    db.commit()

    return BlueprintResponse(
        book_id=book.id,
        title=blueprint_dict.get("title", book.title),
        subtitle=blueprint_dict.get("subtitle", book.subtitle or ""),
        core_concept=blueprint_dict.get("core_concept", ""),
        target_audience_profile=blueprint_dict.get("target_audience_profile", ""),
        unique_selling_proposition=blueprint_dict.get("unique_selling_proposition", ""),
        reader_transformation=blueprint_dict.get("reader_transformation", ""),
        suggested_tone=blueprint_dict.get("suggested_tone", book.tone or ""),
        proposed_structure=[
            ChapterBlueprintItem(**item) for item in blueprint_dict.get("proposed_structure", [])
        ]
    )

@router.get("/{book_id}", response_model=BlueprintResponse)
def get_book_blueprint(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if not book.blueprint_json:
        # If no blueprint yet, generate one on demand
        return generate_book_blueprint(book_id, db)

    blueprint_dict = json.loads(book.blueprint_json)
    return BlueprintResponse(
        book_id=book.id,
        title=blueprint_dict.get("title", book.title),
        subtitle=blueprint_dict.get("subtitle", book.subtitle or ""),
        core_concept=blueprint_dict.get("core_concept", ""),
        target_audience_profile=blueprint_dict.get("target_audience_profile", ""),
        unique_selling_proposition=blueprint_dict.get("unique_selling_proposition", ""),
        reader_transformation=blueprint_dict.get("reader_transformation", ""),
        suggested_tone=blueprint_dict.get("suggested_tone", book.tone or ""),
        proposed_structure=[
            ChapterBlueprintItem(**item) for item in blueprint_dict.get("proposed_structure", [])
        ]
    )

@router.post("/apply-to-outline/{book_id}")
def apply_blueprint_to_outline(book_id: str, db: Session = Depends(get_db)):
    """Convert approved blueprint structure into actual database Chapter records."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if not book.blueprint_json:
        raise HTTPException(status_code=400, detail="No blueprint found for this book. Generate one first.")

    blueprint = json.loads(book.blueprint_json)
    proposed = blueprint.get("proposed_structure", [])

    # Remove existing chapters or sync
    db.query(Chapter).filter(Chapter.book_id == book_id).delete()

    for item in proposed:
        ch = Chapter(
            book_id=book_id,
            order_index=item.get("order_index", 1),
            title=item.get("title", f"Chapter {item.get('order_index', 1)}"),
            summary=item.get("summary", ""),
            key_points_json=json.dumps(item.get("key_points", [])),
            target_word_count=item.get("target_word_count", 2500),
            status="planned"
        )
        db.add(ch)

    book.status = "outline_approved"
    db.commit()
    return {"success": True, "message": f"Created {len(proposed)} chapters from approved blueprint."}

