import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Loader2, BookOpen, Target, Check } from 'lucide-react';
import { api } from '../api/client';
import { IdeaOption } from '../types';

interface IdeaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIdea: (idea: IdeaOption) => void;
}

export const IdeaGeneratorModal: React.FC<IdeaGeneratorModalProps> = ({ isOpen, onClose, onSelectIdea }) => {
  const [niche, setNiche] = useState('');
  const [genre, setGenre] = useState('Nonfiction');
  const [targetAudience, setTargetAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ideas, setIdeas] = useState<IdeaOption[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.generateIdeas({
        niche,
        genre,
        target_audience: targetAudience,
        keywords,
        count: 3
      });
      setIdeas(res.ideas);
    } catch (err: any) {
      setError(err.message || 'Failed to generate ideas. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-studio-900 border border-studio-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-studio-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Book Idea Generator</h2>
              <p className="text-sm text-slate-400">Explore bestselling niches, compelling hooks, and high-converting angles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-studio-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-studio-950 p-4 rounded-xl border border-studio-800">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Niche / Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Habit formation, Solo founder SaaS, Python for Finance"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Nonfiction">Nonfiction / Self-Help</option>
                <option value="Business & Money">Business & Money</option>
                <option value="Technology & AI">Technology & AI</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Memoir & Biography">Memoir & Biography</option>
                <option value="Sci-Fi / Fiction">Sci-Fi / Fiction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g. Overworked managers, aspiring creators, beginners"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Keywords / Key Themes
              </label>
              <input
                type="text"
                placeholder="e.g. speed, clarity, systems, burnout prevention"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Concepts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Book Concepts
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm">
              {error}
            </div>
          )}

          {/* Generated Ideas Grid */}
          <div className="space-y-4">
            {ideas.map((idea, index) => (
              <div
                key={index}
                className="bg-studio-950/80 border border-studio-800 hover:border-brand-500/60 rounded-xl p-5 transition-all shadow-md group flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Concept {index + 1}</span>
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                        {idea.title}
                      </h3>
                      <p className="text-sm text-slate-300 italic">{idea.subtitle}</p>
                    </div>
                    <button
                      onClick={() => onSelectIdea(idea)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-studio-800 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      Use This Idea
                    </button>
                  </div>

                  <p className="text-sm text-slate-300 mt-2 bg-studio-900/60 p-3 rounded-lg border border-studio-800/60">
                    <strong className="text-white">Hook:</strong> {idea.hook}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-300">
                      <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Target Reader:</span> {idea.target_audience}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <BookOpen className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Reader Promise:</span> {idea.reader_promise}
                      </div>
                    </div>
                  </div>

                  {idea.sample_chapters && idea.sample_chapters.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-studio-800/60">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Sample Chapter Progression:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {idea.sample_chapters.map((ch, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-studio-900 text-slate-300 rounded-md border border-studio-800">
                            {i + 1}. {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

