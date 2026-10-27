import React, { useState } from 'react';
import { X, Sparkles, BookPlus, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { Book, IdeaOption } from '../types';
import { IdeaGeneratorModal } from './IdeaGeneratorModal';

interface BookWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (book: Book) => void;
  initialIdea?: IdeaOption | null;
}

export const BookWizardModal: React.FC<BookWizardModalProps> = ({ isOpen, onClose, onBookCreated, initialIdea }) => {
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: 'Anonymous Author',
    language: 'English',
    genre: 'Nonfiction',
    topic: '',
    target_audience: 'Aspiring creators and professionals',
    reader_promise: 'Achieve lasting clarity and actionable mastery',
    writing_style: 'Engaging, direct, and practical',
    tone: 'Conversational yet Authoritative',
    target_word_count: 25000,
    target_chapter_count: 8,
    custom_instructions: ''
  });

  React.useEffect(() => {
    if (initialIdea) {
      setFormData((prev) => ({
        ...prev,
        title: initialIdea.title,
        subtitle: initialIdea.subtitle,
        target_audience: initialIdea.target_audience,
        reader_promise: initialIdea.reader_promise,
        topic: initialIdea.unique_angle
      }));
    }
  }, [initialIdea]);

  if (!isOpen) return null;

  const handleIdeaSelected = (idea: IdeaOption) => {
    setFormData((prev) => ({
      ...prev,
      title: idea.title,
      subtitle: idea.subtitle,
      target_audience: idea.target_audience,
      reader_promise: idea.reader_promise,
      topic: idea.unique_angle
    }));
    setIsIdeaModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a book title.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const newBook = await api.createBook(formData);
      onBookCreated(newBook);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create book project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-studio-900 border border-studio-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-studio-800 bg-studio-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <BookPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Book Project</h2>
                <p className="text-sm text-slate-400">Define your project vision, target audience, and writing parameters</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-studio-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* AI Generator CTA Banner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 border border-amber-500/30 rounded-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-0.5">Need Inspiration?</span>
                <p className="text-sm text-slate-200">Generate market-tested book titles, angles, and promises in seconds.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsIdeaModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Idea Generator
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm">
                {error}
              </div>
            )}

            {/* Core Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Core Book Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Book Title <span className="text-brand-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Architecture of Focus"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. How to Master Deep Work and Outperform in the Age of Distraction"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Nonfiction">Nonfiction / Self-Help</option>
                    <option value="Business & Money">Business & Money</option>
                    <option value="Technology & AI">Technology & AI</option>
                    <option value="Productivity & Habits">Productivity & Habits</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Creative Nonfiction">Creative Nonfiction</option>
                    <option value="Fiction">Fiction</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audience & Promise */}
            <div className="space-y-4 pt-2 border-t border-studio-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Target Reader & Transformation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Primary Reader Promise</label>
                  <input
                    type="text"
                    value={formData.reader_promise}
                    onChange={(e) => setFormData({ ...formData, reader_promise: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Style & Scope */}
            <div className="space-y-4 pt-2 border-t border-studio-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Writing Style & Target Scope</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Writing Style</label>
                  <input
                    type="text"
                    value={formData.writing_style}
                    onChange={(e) => setFormData({ ...formData, writing_style: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Narrative Tone</label>
                  <input
                    type="text"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Chapter Count: <span className="text-brand-400 font-bold">{formData.target_chapter_count}</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="1"
                    value={formData.target_chapter_count}
                    onChange={(e) => setFormData({ ...formData, target_chapter_count: Number(e.target.value) })}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Total Words: <span className="text-brand-400 font-bold">{formData.target_word_count.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="75000"
                    step="2500"
                    value={formData.target_word_count}
                    onChange={(e) => setFormData({ ...formData, target_word_count: Number(e.target.value) })}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Custom Writing Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include bullet takeaways at end of chapters, focus heavily on real-world case studies, avoid fluff..."
                  value={formData.custom_instructions}
                  onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
                  className="w-full bg-studio-950 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-studio-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-studio-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-600/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing Book Studio...
                  </>
                ) : (
                  <>
                    <BookPlus className="w-4 h-4" />
                    Create Book Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <IdeaGeneratorModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        onSelectIdea={handleIdeaSelected}
      />
    </>
  );
};

