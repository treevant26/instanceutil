import React from 'react';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  CheckCircle2,
  ArrowRight,
  Shield,
  BookOpen,
  Sliders,
  HelpCircle,
  FileCheck,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { GuideArticle, GUIDES_LIST } from '../guidesData';
import { ActiveTool } from '../App';

interface GuideArticlePageProps {
  article: GuideArticle;
  onNavigateHome: () => void;
  onNavigateToArticle: (slug: string) => void;
  onNavigateToTool: (toolId: ActiveTool) => void;
}

export const GuideArticlePage: React.FC<GuideArticlePageProps> = ({
  article,
  onNavigateHome,
  onNavigateToArticle,
  onNavigateToTool,
}) => {
  const otherGuides = GUIDES_LIST.filter((g) => g.slug !== article.slug);

  return (
    <div className="space-y-10">
      {/* BREADCRUMB NAVIGATION */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={onNavigateHome}
          className="hover:text-blue-600 transition-colors cursor-pointer"
        >
          Guides
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400 capitalize">{article.category}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs sm:max-w-md">
          {article.title}
        </span>
      </nav>

      {/* ARTICLE LAYOUT: 2-COLUMN (MAIN CONTENT + STICKY SIDEBAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* MAIN COLUMN (8 cols) */}
        <main className="lg:col-span-8 space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-2xs">
          {/* HEADER */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                {article.category}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {article.readTime}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Published {article.date}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {article.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {article.description}
            </p>
          </div>

          {/* TABLE OF CONTENTS QUICK JUMP */}
          {article.tableOfContents && article.tableOfContents.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Table of Contents
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {article.tableOfContents.map((toc) => (
                  <li key={toc.id}>
                    <a
                      href={`#${toc.id}`}
                      className="text-slate-600 hover:text-blue-600 hover:underline transition-colors block py-0.5"
                    >
                      {toc.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* DEDICATED VISUAL INFOGRAPHIC FOR HOW TO COMPRESS A PDF */}
          {article.slug === 'how-to-compress-pdf' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white p-2 sm:p-3">
              <img
                src="/assets/aistudio/How_to_Compress_a_PDF_Without_Losing_Quality_3e6b8023.png"
                alt="How to Compress a PDF Without Losing Quality - Infographic Overview"
                className="w-full h-auto rounded-xl object-contain mx-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* DEDICATED VISUAL INFOGRAPHIC MATRIX FOR JPG VS PNG VS WEBP */}
          {article.slug === 'jpg-vs-png-vs-webp' && (
            <div className="space-y-6">
              {/* FEATURED COMPARISON INFOGRAPHIC BANNER */}
              <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white p-2 sm:p-3">
                <img
                  src="/assets/aistudio/JPG_vs_PNG_vs_WebP_Comparison_20d3eb0f.png"
                  alt="JPG vs PNG vs WebP: Which Image Format Is Best? - Visual Comparison Infographic"
                  className="w-full h-auto rounded-xl object-contain mx-auto"
                  loading="lazy"
                />
                <p className="text-[11px] text-slate-500 text-center pt-2 pb-0.5">
                  Visual format breakdown: JPG (photos, smaller files), PNG (lossless, transparent alpha), and WebP (modern web standard with superior compression).
                </p>
              </div>

              {/* TECHNICAL MATRIX */}
              <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 rounded-2xl border border-blue-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-blue-700 uppercase bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                      Technical Comparison Matrix
                    </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    JPG vs PNG vs WebP Feature Breakdown
                  </h3>
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3">Format</th>
                      <th className="py-2.5 px-3">Transparency</th>
                      <th className="py-2.5 px-3">Compression</th>
                      <th className="py-2.5 px-3">Average Size</th>
                      <th className="py-2.5 px-3">Best Used For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        JPEG / JPG
                      </td>
                      <td className="py-3 px-3 text-rose-600 font-medium">
                        No Transparency
                      </td>
                      <td className="py-3 px-3">
                        Lossy
                      </td>
                      <td className="py-3 px-3 font-mono">
                        Small (Photos)
                      </td>
                      <td className="py-3 px-3">
                        Real-world photos &amp; scenic imagery
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        PNG
                      </td>
                      <td className="py-3 px-3 text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Full Alpha
                      </td>
                      <td className="py-3 px-3">
                        Lossless
                      </td>
                      <td className="py-3 px-3 font-mono">
                        Large (4x-8x JPG)
                      </td>
                      <td className="py-3 px-3">
                        Logos, UI icons, sharp diagrams
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-50/50 bg-blue-50/20 font-medium transition-colors">
                      <td className="py-3 px-3 font-bold text-blue-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        WebP ★
                      </td>
                      <td className="py-3 px-3 text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Full Alpha (Lossy &amp; Lossless)
                      </td>
                      <td className="py-3 px-3">
                        Both (Lossy + Lossless)
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                        Smallest (25-35% &lt; JPG)
                      </td>
                      <td className="py-3 px-3 text-blue-900">
                        Modern websites, e-commerce, web apps
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* CONTENT SECTIONS */}
          <div className="space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
            {article.contentSections.map((sec) => (
              <section key={sec.id} id={sec.id} className="space-y-3 scroll-mt-24">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {sec.title}
                </h2>

                {sec.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}

                {sec.highlight && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 my-3 space-y-1">
                    <span className="font-bold text-xs text-blue-900 block">
                      {sec.highlight.title}
                    </span>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {sec.highlight.text}
                    </p>
                  </div>
                )}

                {sec.tips && sec.tips.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 my-3 space-y-1.5">
                    {sec.tips.map((tip, tIdx) => (
                      <p key={tIdx} className="text-xs text-amber-900 flex items-start gap-1.5 leading-relaxed">
                        <span className="font-bold shrink-0">💡</span>
                        <span>{tip}</span>
                      </p>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* INTERACTIVE CALL TO ACTION BOX (Directly connected to tool) */}
          <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 rounded-2xl border border-blue-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Ready to put this guide into practice?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Use our free <strong>{article.relatedTool.label}</strong> tool right now. It runs 100% inside your browser with complete privacy and zero server uploads.
            </p>
            <div>
              <button
                onClick={() => onNavigateToTool(article.relatedTool.toolId)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Open {article.relatedTool.label} Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* FAQS SECTION */}
          {article.faqs && article.faqs.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {article.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                  >
                    <h4 className="font-semibold text-xs text-slate-900">
                      {faq.question}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BACK TO GUIDES BUTTON */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all guides</span>
            </button>
          </div>
        </main>

        {/* SIDEBAR COLUMN (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Explore Our Free Tools Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Explore Our Tools
            </h3>
            <p className="text-[11px] text-slate-500">
              Free, 100% private in-browser utilities:
            </p>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => onNavigateToTool('merge-pdf')}
                className="w-full p-2.5 rounded-lg text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span>Merge PDF with Compression</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigateToTool('image-to-pdf')}
                className="w-full p-2.5 rounded-lg text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span>Image to PDF Converter</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigateToTool('image-compressor')}
                className="w-full p-2.5 rounded-lg text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span>Image Compressor</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigateToTool('word-counter')}
                className="w-full p-2.5 rounded-lg text-left hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span>Word Counter &amp; Utilities</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Related Guides Card */}
          {otherGuides.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Related Guides
              </h3>
              <div className="space-y-3">
                {otherGuides.slice(0, 3).map((item) => (
                  <div
                    key={item.slug}
                    onClick={() => onNavigateToArticle(item.slug)}
                    className="group cursor-pointer space-y-1 block p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {item.readTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Trust Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
            <div className="flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Zero Server Uploads</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Every tool mentioned in our guides executes strictly in your browser RAM using WebAssembly. Your files never touch a remote server.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
