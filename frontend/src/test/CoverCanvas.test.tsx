import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CoverCanvas } from '../components/CoverCanvas';
import { CoverAsset } from '../types';

describe('CoverCanvas Component', () => {
  const sampleCover: CoverAsset = {
    id: 'cover-1',
    book_id: 'book-1',
    template_id: 'minimalist',
    title: 'The Unfair Advantage',
    subtitle: 'Outperform in the Age of Acceleration',
    author: 'DR. DEV',
    primary_color: '#0f172a',
    secondary_color: '#f8fafc',
    accent_color: '#3b82f6',
    font_family: 'Playfair Display',
    background_style: 'gradient',
    uploaded_image_url: '',
    exported_cover_path: '',
    updated_at: new Date().toISOString()
  };

  it('renders book title, subtitle and author on cover', () => {
    render(<CoverCanvas cover={sampleCover} />);
    
    expect(screen.getByText('The Unfair Advantage')).toBeInTheDocument();
    expect(screen.getByText('Outperform in the Age of Acceleration')).toBeInTheDocument();
    expect(screen.getByText('DR. DEV')).toBeInTheDocument();
  });

  it('renders template details and resolution info', () => {
    render(<CoverCanvas cover={sampleCover} />);
    
    expect(screen.getByText(/Template: minimalist/i)).toBeInTheDocument();
    expect(screen.getByText(/Export High-Res SVG/i)).toBeInTheDocument();
  });
});

