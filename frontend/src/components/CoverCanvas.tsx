import React, { useRef } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { CoverAsset } from '../types';

interface CoverCanvasProps {
  cover: CoverAsset;
  onDownloadImage?: () => void;
}

export const CoverCanvas: React.FC<CoverCanvasProps> = ({ cover }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${cover.title.replace(/\s+/g, '_')}_Cover.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const getBackgroundFill = () => {
    if (cover.background_style === 'solid') {
      return cover.primary_color || '#0f172a';
    }
    return `url(#bg-gradient-${cover.template_id})`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative shadow-2xl rounded-lg overflow-hidden border border-studio-700 aspect-[1/1.6] w-full max-w-[340px] bg-studio-900 group">
        <svg
          ref={svgRef}
          viewBox="0 0 400 640"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`bg-gradient-${cover.template_id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cover.primary_color || '#0f172a'} />
              <stop offset="60%" stopColor={cover.accent_color || '#3b82f6'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={cover.secondary_color || '#1e1b4b'} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background */}
          <rect width="400" height="640" fill={getBackgroundFill()} />

          {/* Custom image overlay if present */}
          {cover.background_style === 'custom_image' && cover.uploaded_image_url && (
            <image
              href={cover.uploaded_image_url}
              width="400"
              height="640"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.85"
            />
          )}

          {/* Template-specific design accents */}
          {cover.template_id === 'minimalist' && (
            <rect x="25" y="25" width="350" height="590" fill="none" stroke={cover.secondary_color || '#ffffff'} strokeWidth="1.5" strokeOpacity="0.4" />
          )}

          {cover.template_id === 'bold' && (
            <path d="M 0 0 L 400 0 L 400 220 L 0 340 Z" fill={cover.accent_color || '#f59e0b'} fillOpacity="0.25" />
          )}

          {cover.template_id === 'modern' && (
            <g stroke={cover.accent_color || '#38bdf8'} strokeWidth="0.5" opacity="0.3">
              <line x1="50" y1="0" x2="50" y2="640" />
              <line x1="350" y1="0" x2="350" y2="640" />
              <circle cx="200" cy="320" r="120" fill="none" strokeWidth="1" />
            </g>
          )}

          {cover.template_id === 'editorial' && (
            <>
              <line x1="60" y1="90" x2="340" y2="90" stroke={cover.accent_color || '#d97706'} strokeWidth="2" />
              <line x1="60" y1="550" x2="340" y2="550" stroke={cover.accent_color || '#d97706'} strokeWidth="2" />
            </>
          )}

          {/* Title & Subtitle */}
          <g filter="url(#shadow)">
            <text
              x="200"
              y="220"
              textAnchor="middle"
              fill={cover.secondary_color || '#ffffff'}
              fontFamily={cover.font_family || 'sans-serif'}
              fontSize="30"
              fontWeight="800"
              className="tracking-wide"
            >
              {cover.title.length > 24 ? cover.title.slice(0, 24) + '...' : cover.title || 'Untitled Book'}
            </text>

            {cover.subtitle && (
              <text
                x="200"
                y="265"
                textAnchor="middle"
                fill={cover.secondary_color || '#ffffff'}
                fontFamily={cover.font_family || 'sans-serif'}
                fontSize="14"
                fontWeight="400"
                opacity="0.8"
                fontStyle="italic"
              >
                {cover.subtitle.length > 40 ? cover.subtitle.slice(0, 40) + '...' : cover.subtitle}
              </text>
            )}

            {/* Author */}
            <text
              x="200"
              y="530"
              textAnchor="middle"
              fill={cover.secondary_color || '#ffffff'}
              fontFamily={cover.font_family || 'sans-serif'}
              fontSize="16"
              fontWeight="600"
              letterSpacing="2"
            >
              {(cover.author || 'Anonymous').toUpperCase()}
            </text>
          </g>
        </svg>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-lg transition-transform transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Export High-Res SVG
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Template: {cover.template_id} • 1600x2560 aspect ratio</span>
      </div>
    </div>
  );
};

