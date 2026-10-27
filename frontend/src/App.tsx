import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { BookWorkspace } from './pages/BookWorkspace';
import { BookWizardModal } from './pages/BookWizardModal';
import { IdeaGeneratorModal } from './pages/IdeaGeneratorModal';
import { SettingsPage } from './pages/SettingsPage';
import { CoverStudioPage } from './pages/CoverStudioPage';
import { api } from './api/client';
import { BookListItem, Book, IdeaOption } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'books' | 'templates' | 'cover-studio' | 'settings'>('dashboard');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaOption | null>(null);
  const [isMockAi, setIsMockAi] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadBooksAndSettings = async () => {
    try {
      const [booksData, settingsData] = await Promise.all([
        api.listBooks(),
        api.getSettingsStatus()
      ]);
      setBooks(booksData);
      setIsMockAi(settingsData.use_mock_ai);
    } catch {
      // Backend may be starting
    }
  };

  useEffect(() => {
    loadBooksAndSettings();
  }, []);

  const handleOpenBook = (id: string) => {
    setSelectedBookId(id);
  };

  const handleBookCreated = (newBook: Book) => {
    showToast(`Book project "${newBook.title}" created!`, 'success');
    loadBooksAndSettings();
    setSelectedBookId(newBook.id);
  };

  const handleDuplicateBook = async (id: string) => {
    try {
      const duplicated = await api.duplicateBook(id);
      showToast(`Duplicated into "${duplicated.title}".`, 'success');
      loadBooksAndSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate book.', 'error');
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await api.deleteBook(id);
      showToast('Book project permanently deleted.', 'info');
      if (selectedBookId === id) {
        setSelectedBookId(null);
      }
      loadBooksAndSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete book.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-studio-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedBookId(null);
          setCurrentView(view);
        }}
        onNewBook={() => setIsWizardOpen(true)}
        isMockAi={isMockAi}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBookId ? (
          <BookWorkspace
            bookId={selectedBookId}
            onBack={() => {
              setSelectedBookId(null);
              loadBooksAndSettings();
            }}
            showToast={showToast}
          />
        ) : (
          <>
            {(currentView === 'dashboard' || currentView === 'books') && (
              <DashboardPage
                books={books}
                onOpenBook={handleOpenBook}
                onNewBook={() => setIsWizardOpen(true)}
                onDuplicateBook={handleDuplicateBook}
                onDeleteBook={handleDeleteBook}
                onGenerateIdeas={() => setIsIdeaModalOpen(true)}
              />
            )}

            {currentView === 'cover-studio' && <CoverStudioPage />}

            {currentView === 'settings' && (
              <SettingsPage
                showToast={showToast}
                onSettingsUpdated={loadBooksAndSettings}
              />
            )}
          </>
        )}
      </main>

      {/* Creation Wizard Modal */}
      <BookWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedIdea(null);
        }}
        onBookCreated={handleBookCreated}
        initialIdea={selectedIdea}
      />

      {/* Standalone Idea Generator Modal */}
      <IdeaGeneratorModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        onSelectIdea={(idea: IdeaOption) => {
          setSelectedIdea(idea);
          setIsIdeaModalOpen(false);
          setIsWizardOpen(true);
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
