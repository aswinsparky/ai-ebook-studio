import React, { useState } from 'react';
import {
  BookOpen, Plus, Search, Copy, Trash2, ArrowRight, FileText, CheckCircle2,
  Clock, TrendingUp, Sparkles, AlertCircle
} from 'lucide-react';
import { BookListItem } from '../types';

interface DashboardPageProps {
  books: BookListItem[];
  onOpenBook: (id: string) => void;
  onNewBook: () => void;
  onDuplicateBook: (id: string) => void;
  onDeleteBook: (id: string) => void;
  onGenerateIdeas: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  books,
  onOpenBook,
  onNewBook,
  onDuplicateBook,
  onDeleteBook,
  onGenerateIdeas
}) => {
  const [search, setSearch] = useState('');
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.genre.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = books.reduce((acc, b) => acc + (b.total_word_count || 0), 0);
  const totalChapters = books.reduce((acc, b) => acc + (b.chapter_count || 0), 0);
  const completedProjects = books.filter((b) => b.status === 'completed' || b.progress_percentage >= 100).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-studio-900 via-studio-900 to-brand-950/40 border border-studio-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Writing & Publishing Workstation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to AI Ebook Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              From initial idea to published masterpiece. Plan blueprints, write chapters with Gemini AI, design high-impact covers, and export valid DOCX, PDF, and EPUBs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGenerateIdeas}
              className="flex items-center gap-2 px-4 py-2.5 bg-studio-800 hover:bg-studio-700 text-slate-200 border border-studio-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Idea Generator</span>
            </button>

            <button
              onClick={onNewBook}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Book</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-studio-800">
          <div className="bg-studio-950/60 p-4 rounded-xl border border-studio-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Projects</span>
              <BookOpen className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{books.length}</p>
          </div>

          <div className="bg-studio-950/60 p-4 rounded-xl border border-studio-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Words Generated</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{totalWords.toLocaleString()}</p>
          </div>

          <div className="bg-studio-950/60 p-4 rounded-xl border border-studio-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Chapters Structured</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{totalChapters}</p>
          </div>

          <div className="bg-studio-950/60 p-4 rounded-xl border border-studio-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Completed / Exported</span>
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{completedProjects}</p>
          </div>
        </div>
      </div>

      {/* Projects Section Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Your Book Projects</h2>
          <p className="text-xs text-slate-400">Continue writing or manage your ebook drafts</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, genre, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-studio-900 border border-studio-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Book Projects Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-studio-800 rounded-2xl bg-studio-950/40">
          <div className="w-16 h-16 rounded-2xl bg-studio-900 border border-studio-700 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No book projects found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {search ? 'Try adjusting your search query.' : 'Create your very first AI-powered ebook project or explore creative niches with the Idea Generator.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onGenerateIdeas}
              className="px-4 py-2 bg-studio-800 hover:bg-studio-700 text-slate-200 border border-studio-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Generate Book Ideas
            </button>
            <button
              onClick={onNewBook}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
            >
              Start New Book
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const isCompleted = book.status === 'completed' || book.progress_percentage >= 100;

            return (
              <div
                key={book.id}
                className="bg-studio-900 border border-studio-800 hover:border-brand-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-studio-950 text-brand-400 border border-studio-800">
                      {book.genre || 'Nonfiction'}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isCompleted
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : book.status === 'writing'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-studio-800 text-slate-300'
                      }`}
                    >
                      {book.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3
                    onClick={() => onOpenBook(book.id)}
                    className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors cursor-pointer line-clamp-1"
                  >
                    {book.title}
                  </h3>
                  {book.subtitle && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 italic">
                      {book.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    By <span className="text-slate-300">{book.author}</span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-studio-800/80 space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{book.total_word_count.toLocaleString()} / {book.target_word_count.toLocaleString()} words</span>
                      <span className="font-semibold text-slate-200">{book.progress_percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-studio-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, book.progress_percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        title="Duplicate book"
                        onClick={() => onDuplicateBook(book.id)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-studio-800 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete book"
                        onClick={() => setBookToDelete(book.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-studio-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => onOpenBook(book.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600/90 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                    >
                      <span>Resume Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-studio-900 border border-studio-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Book Project?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete this book? All associated chapters, revisions, sources, and generated covers will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-studio-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bookToDelete) {
                    onDeleteBook(bookToDelete);
                    setBookToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

