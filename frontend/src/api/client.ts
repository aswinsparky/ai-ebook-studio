import {
  Book, BookListItem, Chapter, BlueprintResponse, IdeaGenerationResponse,
  BookSource, CoverAsset, BookSettings, AIEditResponse,
  ConsistencyCheckResponse, SettingsStatusResponse
} from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorDetail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Use fallback
    }
    throw new Error(errorDetail);
  }
  if (res.status === 204) {
    return {} as T;
  }
  const data = await res.json();
  return data as T;
}

export const api = {
  // Books
  listBooks: (search = ''): Promise<BookListItem[]> =>
    request<BookListItem[]>(`${BASE_URL}/books?search=${encodeURIComponent(search)}`),

  getBook: (id: string): Promise<Book> =>
    request<Book>(`${BASE_URL}/books/${id}`),

  createBook: (data: Partial<Book>): Promise<Book> =>
    request<Book>(`${BASE_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  updateBook: (id: string, data: Partial<Book>): Promise<Book> =>
    request<Book>(`${BASE_URL}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  deleteBook: (id: string): Promise<void> =>
    request<void>(`${BASE_URL}/books/${id}`, { method: 'DELETE' }),

  duplicateBook: (id: string): Promise<Book> =>
    request<Book>(`${BASE_URL}/books/${id}/duplicate`, { method: 'POST' }),

  // Blueprints & Ideas
  generateIdeas: (data: { niche?: string; genre?: string; target_audience?: string; keywords?: string; count?: number }): Promise<IdeaGenerationResponse> =>
    request<IdeaGenerationResponse>(`${BASE_URL}/blueprints/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  generateBlueprint: (bookId: string): Promise<BlueprintResponse> =>
    request<BlueprintResponse>(`${BASE_URL}/blueprints/generate/${bookId}`, { method: 'POST' }),

  getBlueprint: (bookId: string): Promise<BlueprintResponse> =>
    request<BlueprintResponse>(`${BASE_URL}/blueprints/${bookId}`),

  applyBlueprintToOutline: (bookId: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>(`${BASE_URL}/blueprints/apply-to-outline/${bookId}`, { method: 'POST' }),

  // Chapters
  getChapters: (bookId: string): Promise<Chapter[]> =>
    request<Chapter[]>(`${BASE_URL}/chapters/by-book/${bookId}`),

  getChapter: (chapterId: string): Promise<Chapter> =>
    request<Chapter>(`${BASE_URL}/chapters/detail/${chapterId}`),

  createChapter: (data: { book_id: string; title: string; summary?: string; order_index?: number; target_word_count?: number }): Promise<Chapter> =>
    request<Chapter>(`${BASE_URL}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  updateChapter: (
    chapterId: string,
    data: Partial<Chapter>,
    saveRevision = false,
    revisionSummary = 'Editor save'
  ): Promise<Chapter> =>
    request<Chapter>(`${BASE_URL}/chapters/${chapterId}?save_revision=${saveRevision}&revision_summary=${encodeURIComponent(revisionSummary)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  deleteChapter: (chapterId: string): Promise<void> =>
    request<void>(`${BASE_URL}/chapters/${chapterId}`, { method: 'DELETE' }),

  reorderChapters: (chapters: { id: string; order_index: number }[]): Promise<{ success: boolean }> =>
    request<{ success: boolean }>(`${BASE_URL}/chapters/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters })
    }),

  generateChapter: (
    chapterId: string,
    data: { target_word_count?: number; writing_instructions?: string; mode?: 'full' | 'continue' | 'expand' | 'shorten' | 'rewrite' }
  ): Promise<Chapter> =>
    request<Chapter>(`${BASE_URL}/chapters/${chapterId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  restoreRevision: (chapterId: string, revisionId: string): Promise<Chapter> =>
    request<Chapter>(`${BASE_URL}/chapters/${chapterId}/restore-revision/${revisionId}`, { method: 'POST' }),

  // AI Assistant
  aiEdit: (data: { action: string; full_content: string; selected_text?: string; tone_target?: string; custom_instruction?: string }): Promise<AIEditResponse> =>
    request<AIEditResponse>(`${BASE_URL}/assistant/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  checkConsistency: (bookId: string): Promise<ConsistencyCheckResponse> =>
    request<ConsistencyCheckResponse>(`${BASE_URL}/assistant/consistency/${bookId}`, { method: 'POST' }),

  generateFrontBackMatter: (bookId: string, sectionType: string, customDetails = ''): Promise<{ section_type: string; title: string; content: string }> =>
    request<{ section_type: string; title: string; content: string }>(`${BASE_URL}/assistant/front-back-matter/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_type: sectionType, custom_details: customDetails })
    }),

  // Sources
  getSources: (bookId: string): Promise<BookSource[]> =>
    request<BookSource[]>(`${BASE_URL}/sources/by-book/${bookId}`),

  createSource: (bookId: string, data: Partial<BookSource>): Promise<BookSource> =>
    request<BookSource>(`${BASE_URL}/sources/by-book/${bookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  updateSource: (sourceId: string, data: Partial<BookSource>): Promise<BookSource> =>
    request<BookSource>(`${BASE_URL}/sources/${sourceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  deleteSource: (sourceId: string): Promise<void> =>
    request<void>(`${BASE_URL}/sources/${sourceId}`, { method: 'DELETE' }),

  // Covers
  getCoverTemplates: (): Promise<any[]> =>
    request<any[]>(`${BASE_URL}/covers/templates`),

  getCover: (bookId: string): Promise<CoverAsset> =>
    request<CoverAsset>(`${BASE_URL}/covers/by-book/${bookId}`),

  updateCover: (bookId: string, data: Partial<CoverAsset>): Promise<CoverAsset> =>
    request<CoverAsset>(`${BASE_URL}/covers/by-book/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  uploadCoverImage: (bookId: string, file: File): Promise<CoverAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<CoverAsset>(`${BASE_URL}/covers/by-book/${bookId}/upload-image`, {
      method: 'POST',
      body: formData
    });
  },

  getCoverAiPrompt: (bookId: string): Promise<{ disclaimer: string; prompt: string; recommended_dimensions: string }> =>
    request<{ disclaimer: string; prompt: string; recommended_dimensions: string }>(`${BASE_URL}/covers/ai-prompt-generator/${bookId}`, { method: 'POST' }),

  // Formatting & Exports
  getSettings: (bookId: string): Promise<BookSettings> =>
    request<BookSettings>(`${BASE_URL}/exports/${bookId}/settings`),

  updateSettings: (bookId: string, data: Partial<BookSettings>): Promise<BookSettings> =>
    request<BookSettings>(`${BASE_URL}/exports/${bookId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  buildExport: (bookId: string, format: 'docx' | 'pdf' | 'epub'): Promise<{ success: boolean; format: string; filename: string; download_url: string; file_size_kb: number }> =>
    request<{ success: boolean; format: string; filename: string; download_url: string; file_size_kb: number }>(`${BASE_URL}/exports/${bookId}/build/${format}`, { method: 'POST' }),

  getKdpChecklist: (bookId: string): Promise<any> =>
    request<any>(`${BASE_URL}/exports/${bookId}/kdp-checklist`),

  getPublishingMetadata: (bookId: string): Promise<{ title: string; subtitle: string; author: string; html_description: string; keywords: string[]; bisac_categories: string[] }> =>
    request<{ title: string; subtitle: string; author: string; html_description: string; keywords: string[]; bisac_categories: string[] }>(`${BASE_URL}/exports/${bookId}/publishing-metadata`),

  // Settings
  getSettingsStatus: (): Promise<SettingsStatusResponse> =>
    request<SettingsStatusResponse>(`${BASE_URL}/settings/status`),

  testGeminiKey: (apiKey?: string, modelName?: string): Promise<{ success: boolean; message: string; model_tested: string }> =>
    request<{ success: boolean; message: string; model_tested: string }>(`${BASE_URL}/settings/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, model_name: modelName })
    }),

  updateModel: (modelName: string): Promise<{ success: boolean; active_model: string }> =>
    request<{ success: boolean; active_model: string }>(`${BASE_URL}/settings/model`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: modelName })
    }),

  toggleMockMode: (useMock: boolean): Promise<{ success: boolean; use_mock_ai: boolean }> =>
    request<{ success: boolean; use_mock_ai: boolean }>(`${BASE_URL}/settings/mock-mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ use_mock: useMock })
    })
};

