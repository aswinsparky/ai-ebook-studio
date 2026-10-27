import React from 'react';
import { BookOpen, Plus, Settings, Palette, Library, LayoutDashboard, Cpu } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'books' | 'templates' | 'cover-studio' | 'settings';
  onNavigate: (view: 'dashboard' | 'books' | 'templates' | 'cover-studio' | 'settings') => void;
  onNewBook: () => void;
  isMockAi: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onNewBook, isMockAi }) => {
  return (
    <header className="sticky top-0 z-40 bg-studio-900/90 backdrop-blur-md border-b border-studio-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Ebook Studio
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-brand-400">
              Pro Publishing Suite
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-studio-950/60 p-1.5 rounded-xl border border-studio-800">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-studio-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => onNavigate('books')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'books'
                ? 'bg-studio-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900/50'
            }`}
          >
            <Library className="w-4 h-4" />
            My Books
          </button>

          <button
            onClick={() => onNavigate('cover-studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'cover-studio'
                ? 'bg-studio-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Cover Studio
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-studio-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-900/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* AI Mode Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-studio-950/70 border-studio-800 text-slate-300">
            <Cpu className={`w-3.5 h-3.5 ${isMockAi ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>{isMockAi ? 'Mock AI (Offline)' : 'Gemini 2.5'}</span>
          </div>

          <button
            onClick={onNewBook}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Book</span>
          </button>
        </div>
      </div>
    </header>
  );
};

