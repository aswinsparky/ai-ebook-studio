import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Book(Base):
    __tablename__ = "books"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), default="")
    author = Column(String(255), default="Anonymous")
    language = Column(String(50), default="English")
    genre = Column(String(100), default="Nonfiction")
    topic = Column(String(255), default="")
    target_audience = Column(String(255), default="General Readers")
    reader_promise = Column(Text, default="")
    writing_style = Column(String(100), default="Engaging and Practical")
    tone = Column(String(100), default="Conversational yet Authoritative")
    target_word_count = Column(Integer, default=25000)
    target_chapter_count = Column(Integer, default=10)
    custom_instructions = Column(Text, default="")
    status = Column(String(50), default="draft")  # draft, blueprint, writing, completed
    blueprint_json = Column(Text, default="")  # Structured blueprint details
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan", order_by="Chapter.order_index")
    sources = relationship("BookSource", back_populates="book", cascade="all, delete-orphan")
    settings = relationship("BookSettings", back_populates="book", uselist=False, cascade="all, delete-orphan")
    cover_asset = relationship("CoverAsset", back_populates="book", uselist=False, cascade="all, delete-orphan")
    jobs = relationship("GenerationJob", back_populates="book", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False, default=1)
    title = Column(String(255), nullable=False)
    summary = Column(Text, default="")
    key_points_json = Column(Text, default="[]")
    target_word_count = Column(Integer, default=2500)
    content = Column(Text, default="")
    status = Column(String(50), default="planned")  # planned, generating, draft, approved
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    book = relationship("Book", back_populates="chapters")
    revisions = relationship("ChapterRevision", back_populates="chapter", cascade="all, delete-orphan", order_by="desc(ChapterRevision.created_at)")

class ChapterRevision(Base):
    __tablename__ = "chapter_revisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chapter_id = Column(String(36), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    revision_number = Column(Integer, default=1)
    content = Column(Text, default="")
    change_summary = Column(String(255), default="Auto-saved revision")
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    chapter = relationship("Chapter", back_populates="revisions")

class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(String(36), nullable=True)
    job_type = Column(String(50), nullable=False)  # idea, blueprint, chapter, rewrite, proofread, consistency
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)
    prompt = Column(Text, default="")
    result = Column(Text, default="")
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    book = relationship("Book", back_populates="jobs")

class BookSource(Base):
    __tablename__ = "book_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    url = Column(String(500), default="")
    source_type = Column(String(50), default="note")  # url, note, document
    content = Column(Text, default="")
    is_verified = Column(Boolean, default=False)
    verification_notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)

    book = relationship("Book", back_populates="sources")

class BookSettings(Base):
    __tablename__ = "book_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), unique=True, nullable=False)
    trim_size = Column(String(50), default="6x9")  # 6x9, 8.5x11, A5, Kindle
    font_family = Column(String(100), default="Merriweather")
    font_size_pt = Column(Integer, default=11)
    line_spacing = Column(Float, default=1.4)
    margin_inches = Column(Float, default=0.75)
    include_toc = Column(Boolean, default=True)
    include_page_numbers = Column(Boolean, default=True)
    include_front_matter = Column(Boolean, default=True)
    include_back_matter = Column(Boolean, default=True)
    front_matter_json = Column(Text, default="{}")  # intro, preface, acknowledgements
    back_matter_json = Column(Text, default="{}")   # conclusion, author bio, glossary
    publishing_metadata_json = Column(Text, default="{}")  # keywords, description, categories, kdp checklist

    book = relationship("Book", back_populates="settings")

class CoverAsset(Base):
    __tablename__ = "cover_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    book_id = Column(String(36), ForeignKey("books.id", ondelete="CASCADE"), unique=True, nullable=False)
    template_id = Column(String(50), default="minimalist")  # minimalist, bold, modern, editorial, artistic
    title = Column(String(255), default="")
    subtitle = Column(String(255), default="")
    author = Column(String(255), default="")
    primary_color = Column(String(50), default="#1e293b")
    secondary_color = Column(String(50), default="#f8fafc")
    accent_color = Column(String(50), default="#3b82f6")
    font_family = Column(String(100), default="Playfair Display")
    background_style = Column(String(50), default="gradient")  # solid, gradient, pattern, custom_image
    uploaded_image_url = Column(String(500), default="")
    exported_cover_path = Column(String(500), default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    book = relationship("Book", back_populates="cover_asset")

class AppUsageStats(Base):
    __tablename__ = "app_usage_stats"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    total_ai_requests = Column(Integer, default=0)
    mock_requests = Column(Integer, default=0)
    real_requests = Column(Integer, default=0)
    last_model_used = Column(String(100), default="")
    last_status = Column(String(50), default="ready")
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

