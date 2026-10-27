export interface ChapterBrief {
  id: string;
  order_index: number;
  title: string;
  target_word_count: number;
  status: 'planned' | 'generating' | 'draft' | 'approved';
  word_count: number;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  language: string;
  genre: string;
  topic: string;
  target_audience: string;
  reader_promise: string;
  writing_style: string;
  tone: string;
  target_word_count: number;
  target_chapter_count: number;
  custom_instructions: string;
  status: 'draft' | 'blueprint_generated' | 'outline_approved' | 'writing' | 'completed';
  blueprint_json?: string;
  created_at: string;
  updated_at: string;
  chapter_count: number;
  total_word_count: number;
  chapters: ChapterBrief[];
}

export interface BookListItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  status: string;
  target_word_count: number;
  chapter_count: number;
  total_word_count: number;
  progress_percentage: number;
  updated_at: string;
}

export interface ChapterRevision {
  id: string;
  chapter_id: string;
  revision_number: number;
  change_summary: string;
  word_count: number;
  content: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  order_index: number;
  title: string;
  summary: string;
  key_points_json: string;
  target_word_count: number;
  content: string;
  status: 'planned' | 'generating' | 'draft' | 'approved';
  created_at: string;
  updated_at: string;
  word_count: number;
  revisions: ChapterRevision[];
}

export interface IdeaOption {
  title: string;
  subtitle: string;
  target_audience: string;
  hook: string;
  reader_promise: string;
  unique_angle: string;
  sample_chapters: string[];
}

export interface IdeaGenerationResponse {
  niche: string;
  ideas: IdeaOption[];
}

export interface ChapterBlueprintItem {
  order_index: number;
  title: string;
  summary: string;
  key_points: string[];
  target_word_count: number;
  learning_objective: string;
}

export interface BlueprintResponse {
  book_id: string;
  title: string;
  subtitle: string;
  core_concept: string;
  target_audience_profile: string;
  unique_selling_proposition: string;
  reader_transformation: string;
  suggested_tone: string;
  proposed_structure: ChapterBlueprintItem[];
}

export interface BookSource {
  id: string;
  book_id: string;
  title: string;
  url: string;
  source_type: 'url' | 'note' | 'document';
  content: string;
  is_verified: boolean;
  verification_notes: string;
  created_at: string;
}

export interface CoverAsset {
  id: string;
  book_id: string;
  template_id: string;
  title: string;
  subtitle: string;
  author: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  background_style: string;
  uploaded_image_url: string;
  exported_cover_path: string;
  updated_at: string;
}

export interface BookSettings {
  id: string;
  book_id: string;
  trim_size: string;
  font_family: string;
  font_size_pt: number;
  line_spacing: number;
  margin_inches: number;
  include_toc: boolean;
  include_page_numbers: boolean;
  include_front_matter: boolean;
  include_back_matter: boolean;
  front_matter_json: string;
  back_matter_json: string;
  publishing_metadata_json: string;
}

export interface AIEditResponse {
  action: string;
  original_text: string;
  modified_text: string;
  diff_summary: string;
  suggestions: string[];
}

export interface ConsistencyCheckResponse {
  overall_score: number;
  issues_found: number;
  overlap_warnings: string[];
  terminology_inconsistencies: string[];
  continuity_contradictions: string[];
  unverified_claims: string[];
  recommendations: string[];
}

export interface SettingsStatusResponse {
  status: string;
  gemini_configured: boolean;
  active_model: string;
  use_mock_ai: boolean;
  total_ai_requests: number;
  mock_requests: number;
  real_requests: number;
  available_models: string[];
}

