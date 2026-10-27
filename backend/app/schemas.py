from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

# ==================== Book Schemas ====================

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subtitle: Optional[str] = Field(default="", max_length=255)
    author: Optional[str] = Field(default="Anonymous", max_length=255)
    language: Optional[str] = Field(default="English", max_length=50)
    genre: Optional[str] = Field(default="Nonfiction", max_length=100)
    topic: Optional[str] = Field(default="", max_length=255)
    target_audience: Optional[str] = Field(default="General Readers", max_length=255)
    reader_promise: Optional[str] = Field(default="")
    writing_style: Optional[str] = Field(default="Engaging and Practical", max_length=100)
    tone: Optional[str] = Field(default="Conversational yet Authoritative", max_length=100)
    target_word_count: Optional[int] = Field(default=25000, ge=1000, le=200000)
    target_chapter_count: Optional[int] = Field(default=10, ge=1, le=50)
    custom_instructions: Optional[str] = Field(default="")

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    author: Optional[str] = None
    language: Optional[str] = None
    genre: Optional[str] = None
    topic: Optional[str] = None
    target_audience: Optional[str] = None
    reader_promise: Optional[str] = None
    writing_style: Optional[str] = None
    tone: Optional[str] = None
    target_word_count: Optional[int] = None
    target_chapter_count: Optional[int] = None
    custom_instructions: Optional[str] = None
    status: Optional[str] = None
    blueprint_json: Optional[str] = None

class ChapterBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_index: int
    title: str
    target_word_count: int
    status: str
    word_count: int = 0
    updated_at: datetime

class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    blueprint_json: Optional[str] = ""
    created_at: datetime
    updated_at: datetime
    chapter_count: int = 0
    total_word_count: int = 0
    chapters: List[ChapterBrief] = []

class BookListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    subtitle: str
    author: str
    genre: str
    status: str
    target_word_count: int
    chapter_count: int
    total_word_count: int
    progress_percentage: float
    updated_at: datetime

# ==================== Chapter Schemas ====================

class ChapterBase(BaseModel):
    order_index: int = 1
    title: str = Field(..., min_length=1, max_length=255)
    summary: Optional[str] = Field(default="")
    key_points_json: Optional[str] = Field(default="[]")
    target_word_count: Optional[int] = Field(default=2500, ge=100, le=20000)
    content: Optional[str] = Field(default="")
    status: Optional[str] = Field(default="planned")

class ChapterCreate(ChapterBase):
    book_id: str

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    key_points_json: Optional[str] = None
    target_word_count: Optional[int] = None
    content: Optional[str] = None
    status: Optional[str] = None
    order_index: Optional[int] = None

class ChapterReorderItem(BaseModel):
    id: str
    order_index: int

class ChapterReorderRequest(BaseModel):
    chapters: List[ChapterReorderItem]

class ChapterRevisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chapter_id: str
    revision_number: int
    change_summary: str
    word_count: int
    content: str
    created_at: datetime

class ChapterResponse(ChapterBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    book_id: str
    created_at: datetime
    updated_at: datetime
    word_count: int = 0
    revisions: List[ChapterRevisionResponse] = []

# ==================== Source Schemas ====================

class BookSourceBase(BaseModel):
    title: str
    url: Optional[str] = ""
    source_type: str = "note"  # url, note, document
    content: str = ""
    is_verified: bool = False
    verification_notes: Optional[str] = ""

class BookSourceCreate(BookSourceBase):
    pass

class BookSourceUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    content: Optional[str] = None
    is_verified: Optional[bool] = None
    verification_notes: Optional[str] = None

class BookSourceResponse(BookSourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    book_id: str
    created_at: datetime

# ==================== Cover & Settings Schemas ====================

class CoverAssetUpdate(BaseModel):
    template_id: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    author: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    background_style: Optional[str] = None
    uploaded_image_url: Optional[str] = None

class CoverAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    book_id: str
    template_id: str
    title: str
    subtitle: str
    author: str
    primary_color: str
    secondary_color: str
    accent_color: str
    font_family: str
    background_style: str
    uploaded_image_url: str
    exported_cover_path: str
    updated_at: datetime

class BookSettingsUpdate(BaseModel):
    trim_size: Optional[str] = None
    font_family: Optional[str] = None
    font_size_pt: Optional[int] = None
    line_spacing: Optional[float] = None
    margin_inches: Optional[float] = None
    include_toc: Optional[bool] = None
    include_page_numbers: Optional[bool] = None
    include_front_matter: Optional[bool] = None
    include_back_matter: Optional[bool] = None
    front_matter_json: Optional[str] = None
    back_matter_json: Optional[str] = None
    publishing_metadata_json: Optional[str] = None

class BookSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    book_id: str
    trim_size: str
    font_family: str
    font_size_pt: int
    line_spacing: float
    margin_inches: float
    include_toc: bool
    include_page_numbers: bool
    include_front_matter: bool
    include_back_matter: bool
    front_matter_json: str
    back_matter_json: str
    publishing_metadata_json: str

# ==================== AI & Generation Schemas ====================

class IdeaPromptRequest(BaseModel):
    niche: Optional[str] = ""
    genre: Optional[str] = "Nonfiction"
    target_audience: Optional[str] = ""
    keywords: Optional[str] = ""
    count: Optional[int] = 3

class IdeaOption(BaseModel):
    title: str
    subtitle: str
    target_audience: str
    hook: str
    reader_promise: str
    unique_angle: str
    sample_chapters: List[str] = []

class IdeaGenerationResponse(BaseModel):
    niche: str
    ideas: List[IdeaOption]

class ChapterBlueprintItem(BaseModel):
    order_index: int
    title: str
    summary: str
    key_points: List[str] = []
    target_word_count: int = 2500
    learning_objective: str = ""

class BlueprintResponse(BaseModel):
    book_id: str
    title: str
    subtitle: str
    core_concept: str
    target_audience_profile: str
    unique_selling_proposition: str
    reader_transformation: str
    suggested_tone: str
    proposed_structure: List[ChapterBlueprintItem]

class ChapterGenerationRequest(BaseModel):
    target_word_count: Optional[int] = None
    writing_instructions: Optional[str] = ""
    mode: Optional[str] = "full"  # full, continue, expand, shorten, rewrite

class AIEditRequest(BaseModel):
    action: str  # proofread, rewrite_tone, simplify, expand, shorten, remove_repetition, add_examples, add_exercises, add_faq
    selected_text: Optional[str] = None
    full_content: str
    tone_target: Optional[str] = "engaging and professional"
    custom_instruction: Optional[str] = ""

class AIEditResponse(BaseModel):
    action: str
    original_text: str
    modified_text: str
    diff_summary: str
    suggestions: List[str] = []

class ConsistencyCheckResponse(BaseModel):
    overall_score: int  # 0 to 100
    issues_found: int
    overlap_warnings: List[str] = []
    terminology_inconsistencies: List[str] = []
    continuity_contradictions: List[str] = []
    unverified_claims: List[str] = []
    recommendations: List[str] = []

class FrontBackMatterRequest(BaseModel):
    section_type: str  # introduction, conclusion, preface, acknowledgements, author_bio, glossary
    custom_details: Optional[str] = ""

class FrontBackMatterResponse(BaseModel):
    section_type: str
    title: str
    content: str

# ==================== Settings & Health Schemas ====================

class SettingsStatusResponse(BaseModel):
    status: str
    gemini_configured: bool
    active_model: str
    use_mock_ai: bool
    total_ai_requests: int
    mock_requests: int
    real_requests: int
    available_models: List[str]

class TestKeyRequest(BaseModel):
    api_key: Optional[str] = None
    model_name: Optional[str] = None

class TestKeyResponse(BaseModel):
    success: bool
    message: str
    model_tested: str
