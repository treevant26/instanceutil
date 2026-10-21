import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { GUIDES_LIST, GuideArticle } from '../guidesData';

interface GuidesHomePageProps {
  onNavigateToArticle: (slug: string) => void;
  onNavigateToTool: (toolId: string) => void;
}

export const GuidesHomePage: React.FC<GuidesHomePageProps> = ({
  onNavigateToArticle,
  onNavigateToTool,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pdf' | 'image' | 'text'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = GUIDES_LIST.filter((guide) => {
    const matchesFilter = selectedFilter === 'all' || guide.categorySlug === selectedFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-12">
      {/* HERO HEADER */}
      <header className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold uppercase tracking-widest">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>InstanceUtil Guides &amp; Tutorials</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Practical guides for everyday office tasks.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Learn how to compress PDF files, convert image formats, and format text efficiently using our 100% private in-browser utilities.
        </p>

        {/* SEARCH AND FILTER BAR */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs w-full sm:w-auto justify-center">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('pdf')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedFilter === 'pdf'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDF Guides
            </button>
            <button
              onClick={() => setSelectedFilter('image')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedFilter === 'image'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Image Guides
            </button>
            <button
              onClick={() => setSelectedFilter('text')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedFilter === 'text'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Text Guides
            </button>
          </div>
        </div>
      </header>

      {/* ARTICLE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide) => (
          <article
            key={guide.slug}
            onClick={() => onNavigateToArticle(guide.slug)}
            className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col overflow-hidden"
          >
            {/* Visual Header / Banner */}
            <div className="h-44 bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-50/40 p-4 flex flex-col justify-between border-b border-slate-100 relative overflow-hidden">
              {guide.featuredImage && (
                <div className="absolute inset-0">
                  <img
                    src={guide.featuredImage.src}
                    alt={guide.featuredImage.alt}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
                </div>
              )}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/95 text-blue-700 border border-blue-100 shadow-2xs backdrop-blur-xs">
                  {guide.category}
                </span>
                <span className="text-[11px] text-slate-700 flex items-center gap-1 font-medium bg-white/90 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {guide.readTime}
                </span>
              </div>

              {/* Bottom bar of banner */}
              <div className="z-10 mt-auto flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-600/90 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-white/90 bg-slate-900/60 px-2 py-0.5 rounded-md backdrop-blur-xs group-hover:text-white transition-colors">
                  /guides/{guide.slug}/
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {guide.title}
                </h2>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {guide.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Updated {guide.updated}
                </span>
                <span className="font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Read guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-semibold text-slate-700">No guides found matching your search.</p>
          <button
            onClick={() => {
              setSelectedFilter('all');
              setSearchQuery('');
            }}
            className="text-xs text-blue-600 underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* QUICK JUMP TO TOOLS BANNER */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Ready to process your files right now?
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Our free tools run 100% inside your browser. No files uploaded to servers, no registration, and no quotas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 justify-center">
          <button
            onClick={() => onNavigateToTool('merge-pdf')}
            className="px-3.5 py-2 rounded-xl bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer shadow-xs"
          >
            Merge PDF
          </button>
          <button
            onClick={() => onNavigateToTool('image-to-pdf')}
            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Image to PDF
          </button>
          <button
            onClick={() => onNavigateToTool('image-compressor')}
            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Image Compressor
          </button>
        </div>
      </section>
    </div>
  );
};
