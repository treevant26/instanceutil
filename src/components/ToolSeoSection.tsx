import React from 'react';
import {
  Shield,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Layers,
  FileCheck2,
  CheckCircle2,
  Sliders,
  BookOpen
} from 'lucide-react';
import { TOOL_SEO_PAGES, ToolSeoData } from '../seoData';
import { ActiveTool } from '../App';
import { getAssetUrl } from '../utils/assetUrl';

interface ToolSeoSectionProps {
  tool: ActiveTool;
  onNavigate: (tool: ActiveTool) => void;
}

export const ToolSeoSection: React.FC<ToolSeoSectionProps> = ({ tool, onNavigate }) => {
  const data: ToolSeoData = TOOL_SEO_PAGES[tool];
  if (!data) return null;

  const allTools: ActiveTool[] = ['merge-pdf', 'image-to-pdf', 'image-compressor', 'word-counter'];
  const otherTools = allTools.filter((t) => t !== tool);

  return (
    <div className="mt-12 space-y-10 border-t border-slate-200/80 pt-10 text-slate-800">
      {/* 1. HOW IT WORKS (STEP-BY-STEP) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {data.howToTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Follow these simple steps to process your files securely in seconds.
            </p>
          </div>
        </div>

        {/* INFOGRAPHIC ILLUSTRATION BANNER */}
        {(data.infographicImage || tool === 'merge-pdf' || data.id === 'merge-pdf') && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white p-2 sm:p-3 my-2">
            <img
              src={getAssetUrl(data.infographicImage?.src || "/assets/aistudio/How_to_Compress_a_PDF_Without_Losing_Quality_3e6b8023.png")}
              alt={data.infographicImage?.alt || "How to Compress a PDF Without Losing Quality - InstanceUtil Guide Infographic"}
              className="w-full h-auto rounded-xl object-contain mx-auto"
              loading="lazy"
            />
            {data.infographicImage?.caption && (
              <p className="text-[11px] text-slate-500 text-center pt-2 pb-0.5">
                {data.infographicImage.caption}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {data.steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden"
            >
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {idx + 1}
              </div>
              <h3 className="font-semibold text-xs text-slate-900 leading-snug">
                {step.title.replace(/^\d+\.\s*/, '')}
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. SPECIAL COMPRESSION EXPLANATION FOR MERGE PDF (Directly answers user prompt) */}
      {data.compressionExplanation && (
        <section className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-6 rounded-2xl border border-blue-200/70 shadow-2xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold uppercase tracking-wider">
                Built-In Feature
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {data.compressionExplanation.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {data.compressionExplanation.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {data.compressionExplanation.modes.map((mode, idx) => (
              <div
                key={idx}
                className="bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {mode.name}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {mode.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {mode.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. KEY FEATURES & PRIVACY */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Why Use InstanceUtil {data.heading}?
            </h2>
            <p className="text-xs text-slate-500">
              Engineered with modern client-side standards for speed, security, and privacy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {data.features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <h3 className="font-semibold text-xs text-slate-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500">
              Everything you need to know about using {data.heading}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {data.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5"
            >
              <h3 className="font-semibold text-xs text-slate-900 flex items-start gap-2">
                <span className="text-blue-600 font-bold shrink-0">Q:</span>
                <span>{faq.question}</span>
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERNAL CROSS-LINKING (RELATED TOOLS FOR SEO EQUITY) */}
      <section className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Explore Other Free Privacy Tools
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {otherTools.map((otherId) => {
            const item = TOOL_SEO_PAGES[otherId];
            return (
              <button
                key={otherId}
                onClick={() => {
                  onNavigate(otherId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-left flex items-center justify-between group cursor-pointer shadow-2xs hover:border-blue-300"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors block">
                    {item.heading}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.primaryPath}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
