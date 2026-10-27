import React, { useState } from 'react';
import { Palette, Sparkles, BookOpen } from 'lucide-react';
import { CoverCanvas } from '../components/CoverCanvas';
import { CoverAsset } from '../types';

export const CoverStudioPage: React.FC = () => {
  const [cover, setCover] = useState<CoverAsset>({
    id: 'preview',
    book_id: 'preview',
    template_id: 'minimalist',
    title: 'The Architecture of Focus',
    subtitle: 'How to Master Deep Work and Outperform',
    author: 'DR. DEV',
    primary_color: '#0f172a',
    secondary_color: '#f8fafc',
    accent_color: '#3b82f6',
    font_family: 'Playfair Display',
    background_style: 'gradient',
    uploaded_image_url: '',
    exported_cover_path: '',
    updated_at: new Date().toISOString()
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Standalone Cover Studio</h1>
            <p className="text-xs text-slate-400">
              Interactive ebook cover creator. Preview templates, test color palettes, and download vector SVG covers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <CoverCanvas cover={cover} />

          <div className="bg-studio-950 p-6 rounded-2xl border border-studio-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Template Preset
              </label>
              <select
                value={cover.template_id}
                onChange={(e) => setCover({ ...cover, template_id: e.target.value })}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="minimalist">Minimalist Elegance (Nonfiction / Literary)</option>
                <option value="bold">Bold Impact (Business / Self-Help)</option>
                <option value="modern">Modern Tech & Science (Innovation)</option>
                <option value="editorial">Editorial Prestige (Biography / History)</option>
                <option value="artistic">Artistic Canvas (Fiction / Creative)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Cover Title
              </label>
              <input
                type="text"
                value={cover.title}
                onChange={(e) => setCover({ ...cover, title: e.target.value })}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={cover.subtitle}
                onChange={(e) => setCover({ ...cover, subtitle: e.target.value })}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={cover.author}
                onChange={(e) => setCover({ ...cover, author: e.target.value })}
                className="w-full bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Primary</label>
                <input
                  type="color"
                  value={cover.primary_color}
                  onChange={(e) => setCover({ ...cover, primary_color: e.target.value })}
                  className="w-full h-8 rounded border-none cursor-pointer bg-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Secondary</label>
                <input
                  type="color"
                  value={cover.secondary_color}
                  onChange={(e) => setCover({ ...cover, secondary_color: e.target.value })}
                  className="w-full h-8 rounded border-none cursor-pointer bg-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Accent</label>
                <input
                  type="color"
                  value={cover.accent_color}
                  onChange={(e) => setCover({ ...cover, accent_color: e.target.value })}
                  className="w-full h-8 rounded border-none cursor-pointer bg-transparent"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-studio-800 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Click "Export High-Res SVG" on the cover preview to save vector file.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

