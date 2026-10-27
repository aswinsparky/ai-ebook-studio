import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Sparkles, BookOpen, Layers, Edit3, CheckCircle2,
  Palette, Download, RefreshCw, FileText, Plus, Trash2, ArrowUp, ArrowDown,
  History, Search, Check, AlertTriangle, ShieldCheck, Link2, ExternalLink,
  HelpCircle, Sliders, Eye, X
} from 'lucide-react';
import { api } from '../api/client';
import {
  Book, Chapter, BlueprintResponse, ChapterRevision, BookSource,
  CoverAsset, BookSettings, AIEditResponse, ConsistencyCheckResponse
} from '../types';
import { CoverCanvas } from '../components/CoverCanvas';

interface BookWorkspaceProps {
  bookId: string;
  onBack: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const BookWorkspace: React.FC<BookWorkspaceProps> = ({ bookId, onBack, showToast }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'blueprint' | 'chapters' | 'manuscript' | 'review' | 'cover-formatting' | 'export'>('chapters');
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintResponse | null>(null);
  const [sources, setSources] = useState<BookSource[]>([]);
  const [cover, setCover] = useState<CoverAsset | null>(null);
  const [settings, setSettings] = useState<BookSettings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor states
  const [editorContent, setEditorContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  // AI Edit Tool states
  const [aiAction, setAiAction] = useState('proofread');
  const [aiToneTarget, setAiToneTarget] = useState('engaging and authoritative');
  const [aiCustomInstruction, setAiCustomInstruction] = useState('');
  const [aiEditResult, setAiEditResult] = useState<AIEditResponse | null>(null);

  // Consistency check states
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyCheckResponse | null>(null);

  // Export states
  const [exportStatus, setExportStatus] = useState<Record<string, { filename: string; url: string; size: number }>>({});
  const [publishingMeta, setPublishingMeta] = useState<any>(null);
  const [kdpChecklist, setKdpChecklist] = useState<any>(null);

  // Initial Data Fetch
  const loadBookData = async () => {
    setIsLoading(true);
    try {
      const [bookData, chapData, sourcesData, coverData, settingsData] = await Promise.all([
        api.getBook(bookId),
        api.getChapters(bookId),
        api.getSources(bookId),
        api.getCover(bookId),
        api.getSettings(bookId)
      ]);
      setBook(bookData);
      setChapters(chapData);
      if (chapData.length > 0 && !currentChapter) {
        setCurrentChapter(chapData[0]);
        setEditorContent(chapData[0].content || '');
      }
      setSources(sourcesData);
      setCover(coverData);
      setSettings(settingsData);

      if (bookData.blueprint_json) {
        try {
          const parsed = JSON.parse(bookData.blueprint_json);
          setBlueprint({ ...parsed, book_id: bookId });
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load project details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  // Autosave current chapter
  const handleSaveChapter = async (showNotification = false) => {
    if (!currentChapter) return;
    setIsSaving(true);
    try {
      const updated = await api.updateChapter(
        currentChapter.id,
        { content: editorContent },
        true,
        'Manual / Autosave'
      );
      setCurrentChapter(updated);
      setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (showNotification) {
        showToast('Chapter saved and revision snapshot created.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save chapter.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Blueprint generation
  const handleGenerateBlueprint = async () => {
    setIsGenerating(true);
    try {
      const bp = await api.generateBlueprint(bookId);
      setBlueprint(bp);
      showToast('Book blueprint generated successfully!', 'success');
      const updatedBook = await api.getBook(bookId);
      setBook(updatedBook);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate blueprint.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyBlueprint = async () => {
    setIsGenerating(true);
    try {
      await api.applyBlueprintToOutline(bookId);
      showToast('Approved blueprint and populated chapter outline!', 'success');
      const refreshedChapters = await api.getChapters(bookId);
      setChapters(refreshedChapters);
      if (refreshedChapters.length > 0) {
        setCurrentChapter(refreshedChapters[0]);
        setEditorContent(refreshedChapters[0].content || '');
      }
      setActiveTab('chapters');
    } catch (err: any) {
      showToast(err.message || 'Failed to apply blueprint to outline.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Chapter Generation
  const handleGenerateChapter = async (chapterId: string, mode: 'full' | 'continue' | 'expand' | 'shorten' | 'rewrite' = 'full') => {
    setIsGenerating(true);
    try {
      showToast(`Generating content for chapter (Mode: ${mode})...`, 'info');
      const updated = await api.generateChapter(chapterId, { mode });
      setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (currentChapter && currentChapter.id === chapterId) {
        setCurrentChapter(updated);
        setEditorContent(updated.content || '');
      }
      showToast(`Chapter content generated! (${updated.word_count} words)`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Chapter generation failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Edit tool execution
  const handleRunAiEdit = async () => {
    if (!editorContent.trim()) {
      showToast('Cannot run AI edit on empty chapter.', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.aiEdit({
        action: aiAction,
        full_content: editorContent,
        tone_target: aiToneTarget,
        custom_instruction: aiCustomInstruction
      });
      setAiEditResult(res);
      showToast(`AI editing completed for: ${aiAction}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'AI editing failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAiEdit = () => {
    if (!aiEditResult) return;
    setEditorContent(aiEditResult.modified_text);
    setAiEditResult(null);
    showToast('Applied AI suggestions to editor.', 'success');
  };

  // Book consistency check
  const handleRunConsistencyCheck = async () => {
    setIsGenerating(true);
    try {
      const res = await api.checkConsistency(bookId);
      setConsistencyResult(res);
      showToast(`Consistency audit complete! Score: ${res.overall_score}/100`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Consistency check failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Document Export
  const handleBuildExport = async (format: 'docx' | 'pdf' | 'epub') => {
    setIsGenerating(true);
    try {
      showToast(`Building ${format.toUpperCase()} document...`, 'info');
      const res = await api.buildExport(bookId, format);
      setExportStatus((prev) => ({
        ...prev,
        [format]: { filename: res.filename, url: res.download_url, size: res.file_size_kb }
      }));
      showToast(`${format.toUpperCase()} generated successfully (${res.file_size_kb} KB)!`, 'success');
    } catch (err: any) {
      showToast(err.message || `Failed to export ${format}.`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publishing info fetch
  const handleFetchPublishing = async () => {
    try {
      const [meta, chk] = await Promise.all([
        api.getPublishingMetadata(bookId),
        api.getKdpChecklist(bookId)
      ]);
      setPublishingMeta(meta);
      setKdpChecklist(chk);
    } catch (err: any) {
      showToast(err.message || 'Failed to load publishing metadata.', 'error');
    }
  };

  // Formatting actions
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('manuscript-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditorContent(newContent);
  };

  // Search and replace
  const handleReplace = () => {
    if (!searchTerm) return;
    const replaced = editorContent.replaceAll(searchTerm, replaceTerm);
    setEditorContent(replaced);
    showToast(`Replaced all occurrences of "${searchTerm}".`, 'info');
  };

  if (isLoading || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Opening project workspace...</p>
      </div>
    );
  }

  const currentWords = editorContent.split(/\s+/).filter(Boolean).length;
  const currentChars = editorContent.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-studio-900 border border-studio-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-studio-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{book.title}</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-studio-950 text-brand-400 border border-studio-800">
                {book.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              By {book.author || 'Anonymous'} • {book.genre} • Target: {book.target_word_count.toLocaleString()} words
            </p>
          </div>
        </div>

        {/* Guided Workflow Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-studio-950/70 p-1 rounded-xl border border-studio-800">
          {[
            { id: 'details', label: '1. Details' },
            { id: 'blueprint', label: '2. Blueprint' },
            { id: 'chapters', label: '3. Chapters' },
            { id: 'manuscript', label: '4. Manuscript' },
            { id: 'review', label: '5. Review' },
            { id: 'cover-formatting', label: '6. Cover & Layout' },
            { id: 'export', label: '7. Export' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'export' && !publishingMeta) {
                  handleFetchPublishing();
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== TAB 1: DETAILS ==================== */}
      {activeTab === 'details' && (
        <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-studio-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Book Metadata & Configuration</h2>
              <p className="text-xs text-slate-400">Core parameters guiding the tone, structure, and AI generation</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await api.updateBook(book.id, book);
                  showToast('Book details saved successfully!', 'success');
                } catch (e: any) {
                  showToast(e.message, 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={book.title}
                onChange={(e) => setBook({ ...book, title: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle</label>
              <input
                type="text"
                value={book.subtitle || ''}
                onChange={(e) => setBook({ ...book, subtitle: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Author</label>
              <input
                type="text"
                value={book.author || ''}
                onChange={(e) => setBook({ ...book, author: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Genre</label>
              <input
                type="text"
                value={book.genre}
                onChange={(e) => setBook({ ...book, genre: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
              <input
                type="text"
                value={book.target_audience || ''}
                onChange={(e) => setBook({ ...book, target_audience: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reader Promise</label>
              <input
                type="text"
                value={book.reader_promise || ''}
                onChange={(e) => setBook({ ...book, reader_promise: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Writing Style</label>
              <input
                type="text"
                value={book.writing_style || ''}
                onChange={(e) => setBook({ ...book, writing_style: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Narrative Tone</label>
              <input
                type="text"
                value={book.tone || ''}
                onChange={(e) => setBook({ ...book, tone: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Custom Instructions</label>
              <textarea
                rows={3}
                value={book.custom_instructions || ''}
                onChange={(e) => setBook({ ...book, custom_instructions: e.target.value })}
                className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: BLUEPRINT ==================== */}
      {activeTab === 'blueprint' && (
        <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-studio-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Book Blueprint Architecture</h2>
              <p className="text-xs text-slate-400">Strategic framework, transformation promise, and chapter breakdown</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateBlueprint}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-studio-800 hover:bg-studio-700 disabled:opacity-50 text-slate-200 border border-studio-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{blueprint ? 'Regenerate Blueprint' : 'Generate Blueprint with AI'}</span>
              </button>

              {blueprint && (
                <button
                  onClick={handleApplyBlueprint}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Create Outline</span>
                </button>
              )}
            </div>
          </div>

          {!blueprint ? (
            <div className="text-center py-14 border border-dashed border-studio-800 rounded-xl bg-studio-950/40">
              <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Blueprint Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Generate an in-depth blueprint to lock in your unique angle, reader transformation, and chapter structure.
              </p>
              <button
                onClick={handleGenerateBlueprint}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
              >
                Generate Blueprint Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Strategic Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400 block mb-1">Core Concept</span>
                  <p className="text-sm text-slate-200 leading-relaxed">{blueprint.core_concept}</p>
                </div>

                <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Unique Selling Proposition</span>
                  <p className="text-sm text-slate-200 leading-relaxed">{blueprint.unique_selling_proposition}</p>
                </div>

                <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">Reader Transformation</span>
                  <p className="text-sm text-slate-200 leading-relaxed">{blueprint.reader_transformation}</p>
                </div>

                <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">Target Audience Profile</span>
                  <p className="text-sm text-slate-200 leading-relaxed">{blueprint.target_audience_profile}</p>
                </div>
              </div>

              {/* Proposed Chapters Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Proposed Chapter Structure ({blueprint.proposed_structure.length} Chapters)
                </h3>
                <div className="space-y-3">
                  {blueprint.proposed_structure.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-studio-950 p-4 rounded-xl border border-studio-800 hover:border-brand-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <h4 className="text-sm font-bold text-white">
                          {item.title}
                        </h4>
                        <span className="text-xs text-brand-400 font-medium">
                          ~{item.target_word_count.toLocaleString()} words
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{item.summary}</p>
                      {item.learning_objective && (
                        <p className="text-xs text-slate-400 italic">
                          <strong className="text-slate-300">Objective:</strong> {item.learning_objective}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: CHAPTERS ==================== */}
      {activeTab === 'chapters' && (
        <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-studio-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Interactive Chapter Outline</h2>
              <p className="text-xs text-slate-400">Manage structure, word targets, and generate chapters individually</p>
            </div>

            <button
              onClick={async () => {
                const title = prompt('Enter new chapter title:');
                if (!title) return;
                try {
                  const newCh = await api.createChapter({
                    book_id: bookId,
                    title,
                    order_index: chapters.length + 1,
                    target_word_count: 2500
                  });
                  setChapters([...chapters, newCh]);
                  showToast('Added new chapter to outline.', 'success');
                } catch (e: any) {
                  showToast(e.message, 'error');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </div>

          <div className="space-y-3">
            {chapters.map((ch, idx) => (
              <div
                key={ch.id}
                className="bg-studio-950 p-4 rounded-xl border border-studio-800 hover:border-studio-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-studio-900 border border-studio-700 text-brand-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {ch.order_index}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{ch.title}</h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        ch.status === 'draft' || ch.word_count > 100
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : ch.status === 'generating'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-studio-900 text-slate-400'
                      }`}>
                        {ch.status}
                      </span>
                    </div>
                    {ch.summary && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ch.summary}</p>}
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {ch.word_count.toLocaleString()} / {ch.target_word_count.toLocaleString()} words
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Reorder buttons */}
                  <button
                    disabled={idx === 0}
                    onClick={async () => {
                      if (idx === 0) return;
                      const copy = [...chapters];
                      const temp = copy[idx - 1];
                      copy[idx - 1] = copy[idx];
                      copy[idx] = temp;
                      copy.forEach((c, i) => (c.order_index = i + 1));
                      setChapters(copy);
                      await api.reorderChapters(copy.map((c) => ({ id: c.id, order_index: c.order_index })));
                    }}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded hover:bg-studio-900"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    disabled={idx === chapters.length - 1}
                    onClick={async () => {
                      if (idx === chapters.length - 1) return;
                      const copy = [...chapters];
                      const temp = copy[idx + 1];
                      copy[idx + 1] = copy[idx];
                      copy[idx] = temp;
                      copy.forEach((c, i) => (c.order_index = i + 1));
                      setChapters(copy);
                      await api.reorderChapters(copy.map((c) => ({ id: c.id, order_index: c.order_index })));
                    }}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded hover:bg-studio-900"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Chapter-by-chapter AI Generation */}
                  <button
                    onClick={() => handleGenerateChapter(ch.id, 'full')}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ch.content ? 'Regenerate' : 'Generate AI'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentChapter(ch);
                      setEditorContent(ch.content || '');
                      setActiveTab('manuscript');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600/90 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Write</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm(`Delete chapter "${ch.title}"?`)) return;
                      await api.deleteChapter(ch.id);
                      setChapters(chapters.filter((c) => c.id !== ch.id));
                      showToast('Chapter deleted.', 'info');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-studio-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: MANUSCRIPT EDITOR ==================== */}
      {activeTab === 'manuscript' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chapter Navigation Sidebar */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-4 shadow-xl space-y-3 lg:col-span-1 h-[75vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-studio-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Chapters</span>
              <span className="text-xs text-brand-400 font-medium">{chapters.length} Total</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    handleSaveChapter(false);
                    setCurrentChapter(ch);
                    setEditorContent(ch.content || '');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                    currentChapter?.id === ch.id
                      ? 'bg-brand-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-studio-950/80 hover:text-white'
                  }`}
                >
                  <span className="line-clamp-1">{ch.order_index}. {ch.title}</span>
                  <span className={`text-[10px] shrink-0 ${currentChapter?.id === ch.id ? 'text-brand-200' : 'text-slate-500'}`}>
                    {ch.word_count || 0}w
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Central Writing Workspace */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-4 lg:col-span-3 h-[75vh] flex flex-col">
            {/* Editor Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-studio-800 pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => insertFormatting('# ')}
                  className="px-2 py-1 text-xs font-bold bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  H1
                </button>
                <button
                  onClick={() => insertFormatting('## ')}
                  className="px-2 py-1 text-xs font-bold bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  H2
                </button>
                <button
                  onClick={() => insertFormatting('### ')}
                  className="px-2 py-1 text-xs font-bold bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  H3
                </button>
                <button
                  onClick={() => insertFormatting('**', '**')}
                  className="px-2 py-1 text-xs font-bold bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  B
                </button>
                <button
                  onClick={() => insertFormatting('*', '*')}
                  className="px-2 py-1 text-xs italic bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  I
                </button>
                <button
                  onClick={() => insertFormatting('- ')}
                  className="px-2 py-1 text-xs bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  • List
                </button>
                <button
                  onClick={() => insertFormatting('> ')}
                  className="px-2 py-1 text-xs bg-studio-950 hover:bg-studio-800 text-slate-300 rounded border border-studio-800"
                >
                  Quote
                </button>

                <div className="h-4 w-px bg-studio-800 mx-1" />

                <button
                  onClick={() => setShowSearchReplace(!showSearchReplace)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-studio-800"
                  title="Search & Replace"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowRevisions(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-studio-950 hover:bg-studio-800 rounded border border-studio-800"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Revisions ({currentChapter?.revisions?.length || 0})</span>
                </button>
              </div>

              {/* Save & Status Actions */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {currentWords.toLocaleString()} words • {currentChars.toLocaleString()} chars
                </span>
                <button
                  onClick={() => handleSaveChapter(true)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Chapter'}</span>
                </button>
              </div>
            </div>

            {/* Search and Replace bar */}
            {showSearchReplace && (
              <div className="flex items-center gap-2 p-2 bg-studio-950 rounded-lg border border-studio-800">
                <input
                  type="text"
                  placeholder="Find..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-studio-900 border border-studio-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="bg-studio-900 border border-studio-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleReplace}
                  className="px-3 py-1 bg-studio-800 hover:bg-studio-700 text-white text-xs font-medium rounded"
                >
                  Replace All
                </button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              id="manuscript-textarea"
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Start writing or generate with AI..."
              className="flex-1 w-full bg-studio-950/60 border border-studio-800 rounded-xl p-5 text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-brand-500/80 resize-none selection:bg-brand-500/30"
            />
          </div>

          {/* Revision History Modal */}
          {showRevisions && currentChapter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-studio-900 border border-studio-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-studio-800 pb-3 mb-4">
                  <h3 className="text-base font-bold text-white">Revision History: {currentChapter.title}</h3>
                  <button onClick={() => setShowRevisions(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {currentChapter.revisions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No saved revisions yet for this chapter.</p>
                  ) : (
                    currentChapter.revisions.map((rev) => (
                      <div key={rev.id} className="p-3 bg-studio-950 rounded-xl border border-studio-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Revision #{rev.revision_number} — {rev.change_summary}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {rev.word_count} words • {new Date(rev.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`Restore Revision #${rev.revision_number}? Current changes will be archived.`)) return;
                            const restored = await api.restoreRevision(currentChapter.id, rev.id);
                            setCurrentChapter(restored);
                            setEditorContent(restored.content || '');
                            setShowRevisions(false);
                            showToast(`Restored Revision #${rev.revision_number}.`, 'success');
                          }}
                          className="px-3 py-1.5 bg-studio-800 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: REVIEW & AI EDITING ==================== */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* AI Editing Tools */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">AI Writing & Editing Assistant</h2>
              <p className="text-xs text-slate-400">Proofread, alter tone, simplify, expand, or add interactive exercises</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Action</label>
                <select
                  value={aiAction}
                  onChange={(e) => setAiAction(e.target.value)}
                  className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="proofread">Proofread & Grammar Check</option>
                  <option value="rewrite_tone">Rewrite Tone</option>
                  <option value="simplify">Simplify & Clarify</option>
                  <option value="expand">Expand Passage</option>
                  <option value="shorten">Shorten & Condense</option>
                  <option value="remove_repetition">Remove Redundancy</option>
                  <option value="add_examples">Add Concrete Examples</option>
                  <option value="add_exercises">Generate Chapter Exercises</option>
                  <option value="add_faq">Generate Reader FAQ</option>
                </select>
              </div>

              {aiAction === 'rewrite_tone' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Target Tone</label>
                  <input
                    type="text"
                    value={aiToneTarget}
                    onChange={(e) => setAiToneTarget(e.target.value)}
                    placeholder="e.g. Inspiring, academic, direct, playful"
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={handleRunAiEdit}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute AI Tool</span>
                </button>
              </div>
            </div>

            {/* AI Edit Preview & Diff Modal / Banner */}
            {aiEditResult && (
              <div className="p-4 bg-studio-950 border border-brand-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                    AI Suggestions: {aiEditResult.diff_summary}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAiEditResult(null)}
                      className="px-3 py-1 bg-studio-800 hover:bg-studio-700 text-slate-300 rounded text-xs"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleAcceptAiEdit}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      Accept Changes
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-studio-900 rounded-lg text-xs font-mono text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {aiEditResult.modified_text}
                </div>
              </div>
            )}
          </div>

          {/* Book Consistency Review */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-studio-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Book Consistency & Quality Auditor</h2>
                <p className="text-xs text-slate-400">Detect chapter overlaps, terminology contradictions, and unsupported claims</p>
              </div>
              <button
                onClick={handleRunConsistencyCheck}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-studio-800 hover:bg-studio-700 text-slate-200 border border-studio-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audit Entire Manuscript</span>
              </button>
            </div>

            {consistencyResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-studio-950 rounded-xl border border-studio-800">
                  <div className="text-3xl font-extrabold text-emerald-400">{consistencyResult.overall_score}/100</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Coherence Score</h4>
                    <p className="text-xs text-slate-400">
                      {consistencyResult.issues_found} potential flags identified across chapters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
                    <span className="text-xs font-bold text-amber-400 block mb-2">Overlap & Repetition:</span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                      {consistencyResult.overlap_warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-studio-950 p-4 rounded-xl border border-studio-800">
                    <span className="text-xs font-bold text-rose-400 block mb-2">Unverified Claims / Continuity:</span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                      {consistencyResult.unverified_claims.concat(consistencyResult.continuity_contradictions).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Run the audit to review cross-chapter coherence without altering text.</p>
            )}
          </div>

          {/* Research Sources Library */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-studio-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Research Assistant & Source Library</h2>
                <p className="text-xs text-slate-400">User-provided references, URLs, and verified factual citations</p>
              </div>
              <button
                onClick={async () => {
                  const title = prompt('Source title:');
                  if (!title) return;
                  const url = prompt('Source URL (optional):') || '';
                  const content = prompt('Source notes or excerpts:') || '';
                  try {
                    const newSource = await api.createSource(bookId, { title, url, content, is_verified: false });
                    setSources([newSource, ...sources]);
                    showToast('Added source to research library.', 'success');
                  } catch (e: any) {
                    showToast(e.message, 'error');
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source</span>
              </button>
            </div>

            <div className="space-y-3">
              {sources.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No research sources added yet.</p>
              ) : (
                sources.map((s) => (
                  <div key={s.id} className="p-3.5 bg-studio-950 rounded-xl border border-studio-800 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{s.title}</h4>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          s.is_verified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-studio-900 text-slate-400'
                        }`}>
                          {s.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{s.content}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          const updated = await api.updateSource(s.id, { is_verified: !s.is_verified });
                          setSources(sources.map((item) => (item.id === s.id ? updated : item)));
                        }}
                        className="text-xs px-2.5 py-1 bg-studio-800 hover:bg-studio-700 text-slate-300 rounded"
                      >
                        {s.is_verified ? 'Mark Unverified' : 'Mark Verified'}
                      </button>
                      <button
                        onClick={async () => {
                          await api.deleteSource(s.id);
                          setSources(sources.filter((item) => item.id !== s.id));
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: COVER & FORMATTING ==================== */}
      {activeTab === 'cover-formatting' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cover Studio */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-white">Cover Studio</h2>

            {cover && (
              <div className="flex flex-col sm:flex-row gap-6">
                <CoverCanvas cover={cover} />

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Template Style
                    </label>
                    <select
                      value={cover.template_id}
                      onChange={async (e) => {
                        const updated = await api.updateCover(bookId, { template_id: e.target.value });
                        setCover(updated);
                      }}
                      className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="minimalist">Minimalist Elegance</option>
                      <option value="bold">Bold Impact</option>
                      <option value="modern">Modern Tech</option>
                      <option value="editorial">Editorial Prestige</option>
                      <option value="artistic">Artistic Canvas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cover.primary_color || '#0f172a'}
                        onChange={(e) => setCover({ ...cover, primary_color: e.target.value })}
                        onBlur={async () => {
                          const updated = await api.updateCover(bookId, { primary_color: cover.primary_color });
                          setCover(updated);
                        }}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-400">{cover.primary_color}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Upload Custom Cover Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const updated = await api.uploadCoverImage(bookId, e.target.files[0]);
                            setCover(updated);
                            showToast('Cover image uploaded!', 'success');
                          } catch (err: any) {
                            showToast(err.message, 'error');
                          }
                        }
                      }}
                      className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
                    />
                  </div>

                  {/* AI Cover Image Prompt Generator */}
                  <div className="pt-3 border-t border-studio-800">
                    <button
                      onClick={async () => {
                        const promptRes = await api.getCoverAiPrompt(bookId);
                        alert(`AI Image Prompt (Midjourney / DALL-E / Imagen):\n\n${promptRes.prompt}\n\n${promptRes.disclaimer}`);
                      }}
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate External AI Image Prompt</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formatting Studio */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-white">Formatting & Layout Studio</h2>

            {settings && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Trim Size
                    </label>
                    <select
                      value={settings.trim_size}
                      onChange={(e) => setSettings({ ...settings, trim_size: e.target.value })}
                      className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="6x9">6 x 9 inches (Standard Trade)</option>
                      <option value="8.5x11">8.5 x 11 inches (Workbook / Manual)</option>
                      <option value="A5">A5 (International Digest)</option>
                      <option value="Kindle">Kindle Digital Default</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Font Family
                    </label>
                    <select
                      value={settings.font_family}
                      onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}
                      className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="Merriweather">Merriweather (Serif)</option>
                      <option value="Georgia">Georgia (Classic Book)</option>
                      <option value="Inter">Inter (Modern Clean)</option>
                      <option value="Helvetica">Helvetica / Arial (Neutral)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-studio-800">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.include_toc}
                      onChange={(e) => setSettings({ ...settings, include_toc: e.target.checked })}
                      className="rounded accent-brand-500"
                    />
                    Include Table of Contents
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.include_page_numbers}
                      onChange={(e) => setSettings({ ...settings, include_page_numbers: e.target.checked })}
                      className="rounded accent-brand-500"
                    />
                    Include Dynamic Page Numbers (PDF)
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.include_front_matter}
                      onChange={(e) => setSettings({ ...settings, include_front_matter: e.target.checked })}
                      className="rounded accent-brand-500"
                    />
                    Include Front Matter (Introduction, Preface, Acknowledgements)
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.include_back_matter}
                      onChange={(e) => setSettings({ ...settings, include_back_matter: e.target.checked })}
                      className="rounded accent-brand-500"
                    />
                    Include Back Matter (Conclusion, Author Bio, Glossary)
                  </label>
                </div>

                {/* Supplementary section generator */}
                <div className="pt-3 border-t border-studio-800 flex flex-wrap gap-2">
                  {['introduction', 'conclusion', 'preface', 'acknowledgements', 'author_bio', 'glossary'].map((sec) => (
                    <button
                      key={sec}
                      onClick={async () => {
                        try {
                          showToast(`Generating ${sec}...`, 'info');
                          await api.generateFrontBackMatter(bookId, sec);
                          showToast(`Generated and attached ${sec}!`, 'success');
                          const updatedSettings = await api.getSettings(bookId);
                          setSettings(updatedSettings);
                        } catch (e: any) {
                          showToast(e.message, 'error');
                        }
                      }}
                      className="px-2.5 py-1 bg-studio-950 hover:bg-brand-600 border border-studio-800 rounded text-[11px] text-slate-300 transition-colors"
                    >
                      + Gen {sec.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={async () => {
                      await api.updateSettings(bookId, settings);
                      showToast('Formatting settings updated!', 'success');
                    }}
                    className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Save Formatting Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 7: EXPORT ==================== */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Document Exports Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DOCX Card */}
            <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Microsoft Word (.DOCX)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Fully styled Word document with H1/H2 heading hierarchy, margins, and Table of Contents.
                </p>
              </div>

              <div>
                {exportStatus['docx'] ? (
                  <a
                    href={exportStatus['docx'].url}
                    download
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download DOCX ({exportStatus['docx'].size} KB)
                  </a>
                ) : (
                  <button
                    onClick={() => handleBuildExport('docx')}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Generate DOCX
                  </button>
                )}
              </div>
            </div>

            {/* PDF Card */}
            <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Print-Ready PDF</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Typeset via ReportLab with running headers, dynamic page numbering, and title page.
                </p>
              </div>

              <div>
                {exportStatus['pdf'] ? (
                  <a
                    href={exportStatus['pdf'].url}
                    download
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF ({exportStatus['pdf'].size} KB)
                  </a>
                ) : (
                  <button
                    onClick={() => handleBuildExport('pdf')}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Generate PDF
                  </button>
                )}
              </div>
            </div>

            {/* EPUB Card */}
            <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Standard EPUB</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Validated eBook container conforming to IDPF specifications for Apple Books, Kobo, and Kindle.
                </p>
              </div>

              <div>
                {exportStatus['epub'] ? (
                  <a
                    href={exportStatus['epub'].url}
                    download
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download EPUB ({exportStatus['epub'].size} KB)
                  </a>
                ) : (
                  <button
                    onClick={() => handleBuildExport('epub')}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Generate EPUB
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Publishing Assistant & KDP Checklist */}
          {publishingMeta && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">Amazon KDP Preparation Checklist</h3>
                <div className="space-y-2">
                  {kdpChecklist?.checklist?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.task}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 italic mt-3">{kdpChecklist?.disclaimer}</p>
              </div>

              <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">KDP Publishing Metadata</h3>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Recommended 7 Amazon Keywords:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {publishingMeta.keywords.map((kw: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-studio-950 text-slate-300 rounded border border-studio-800">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    BISAC / Amazon Categories:
                  </span>
                  <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                    {publishingMeta.bisac_categories.map((cat: string, i: number) => (
                      <li key={i}>{cat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
