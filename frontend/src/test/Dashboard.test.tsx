import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from '../pages/DashboardPage';
import { BookListItem } from '../types';

describe('DashboardPage Component', () => {
  it('renders empty state when no books exist', () => {
    render(
      <DashboardPage
        books={[]}
        onOpenBook={vi.fn()}
        onNewBook={vi.fn()}
        onDuplicateBook={vi.fn()}
        onDeleteBook={vi.fn()}
        onGenerateIdeas={vi.fn()}
      />
    );

    expect(screen.getByText('No book projects found')).toBeInTheDocument();
    expect(screen.getByText('Start New Book')).toBeInTheDocument();
  });

  it('renders book project cards when books exist', () => {
    const mockBooks: BookListItem[] = [
      {
        id: 'book-1',
        title: 'Mastering AI Systems',
        subtitle: 'The Enterprise Playbook',
        author: 'Alex Mercer',
        genre: 'Technology',
        status: 'draft',
        target_word_count: 20000,
        chapter_count: 5,
        total_word_count: 4500,
        progress_percentage: 22.5,
        updated_at: new Date().toISOString()
      }
    ];

    render(
      <DashboardPage
        books={mockBooks}
        onOpenBook={vi.fn()}
        onNewBook={vi.fn()}
        onDuplicateBook={vi.fn()}
        onDeleteBook={vi.fn()}
        onGenerateIdeas={vi.fn()}
      />
    );

    expect(screen.getByText('Mastering AI Systems')).toBeInTheDocument();
    expect(screen.getByText('The Enterprise Playbook')).toBeInTheDocument();
    expect(screen.getByText(/Alex Mercer/i)).toBeInTheDocument();
    expect(screen.getByText('Resume Studio')).toBeInTheDocument();
  });
});

