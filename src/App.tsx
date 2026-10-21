import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  FileText,
  Files,
  Image as ImageIcon,
  Minimize2,
  Upload,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle2,
  Shield,
  Sparkles,
  Type,
  Copy,
  Clock,
  Sliders,
  RefreshCw,
  FileCheck,
  X,
  Mail,
  MessageSquare,
  Send,
  Star,
  Check,
  BookOpen
} from 'lucide-react';
import {
  getToolFromPath,
  getPathForTool,
  applyToolSeo,
  applyGuidesHomeSeo,
  applyGuideArticleSeo,
  TOOL_SEO_PAGES
} from './seoData';
import { getGuideBySlug } from './guidesData';
import { ToolSeoSection } from './components/ToolSeoSection';
import { GuidesHomePage } from './components/GuidesHomePage';
import { GuideArticlePage } from './components/GuideArticlePage';

/* =========================================================================
   TYPES
   ========================================================================= */

export type ToolCategory = 'pdf' | 'office';
export type ActiveTool = 'image-to-pdf' | 'merge-pdf' | 'word-counter' | 'image-compressor';

export interface ImageDocPage {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  rotation: number;
  aspectRatio: number;
}

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type PageOrientationOption = 'portrait' | 'landscape';
export type MarginOption = 'none' | 'compact' | 'standard';

export type CompressionPreset = 'original' | 'recommended' | 'high' | 'custom';

export interface PdfSettings {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: MarginOption;
  quality: number;
  docTitle: string;
  compressionPreset: CompressionPreset;
  maxResolution: number;
}

export interface PdfMergeItem {
  id: string;
  name: string;
  size: number;
  file: File;
  pageCount?: number;
}

/* =========================================================================
   CORE CLIENT-SIDE PDF GENERATOR LOGIC (EXIF-NORMALIZED WITH jsPDF)
   ========================================================================= */

async function normalizeImage(
  source: File | Blob | string,
  userRotation: number = 0,
  quality: number = 0.75,
  maxResolution: number = 1920
): Promise<{ dataUrl: string; width: number; height: number }> {
  let blob: Blob;
  if (typeof source === 'string') {
    const res = await fetch(source);
    blob = await res.blob();
  } else {
    blob = source;
  }

  let orientedWidth = 0;
  let orientedHeight = 0;
  let drawSource: ImageBitmap | HTMLImageElement;

  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    orientedWidth = bitmap.width;
    orientedHeight = bitmap.height;
    drawSource = bitmap;
  } catch {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const el = new window.Image();
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el);
      };
      el.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      el.src = url;
    });
    orientedWidth = img.naturalWidth;
    orientedHeight = img.naturalHeight;
    drawSource = img;
  }

  // Downscale image dimensions if maxResolution is specified
  let targetWidth = orientedWidth;
  let targetHeight = orientedHeight;
  if (maxResolution > 0) {
    const maxSide = Math.max(orientedWidth, orientedHeight);
    if (maxSide > maxResolution) {
      const scale = maxResolution / maxSide;
      targetWidth = Math.round(orientedWidth * scale);
      targetHeight = Math.round(orientedHeight * scale);
    }
  }

  const normRot = ((userRotation % 360) + 360) % 360;
  const is90or270 = normRot === 90 || normRot === 270;

  const canvasWidth = is90or270 ? targetHeight : targetWidth;
  const canvasHeight = is90or270 ? targetWidth : targetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (normRot !== 0) {
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((normRot * Math.PI) / 180);
    ctx.drawImage(drawSource, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
  } else {
    ctx.drawImage(drawSource, 0, 0, targetWidth, targetHeight);
  }

  if ('close' in drawSource && typeof (drawSource as ImageBitmap).close === 'function') {
    (drawSource as ImageBitmap).close();
  }

  const safeQuality = Math.max(0.1, Math.min(1.0, quality));
  const cleanDataUrl = canvas.toDataURL('image/jpeg', safeQuality);
  return {
    dataUrl: cleanDataUrl,
    width: canvasWidth,
    height: canvasHeight,
  };
}

async function generatePdfBlob(
  pages: ImageDocPage[],
  settings: PdfSettings
): Promise<{ blob: Blob; url: string; size: number }> {
  if (pages.length === 0) {
    throw new Error('At least one image is required to generate a PDF.');
  }

  const marginMm = settings.margin === 'none' ? 0 : settings.margin === 'compact' ? 5 : 10;

  const processedPages = await Promise.all(
    pages.map((p) =>
      normalizeImage(p.dataUrl, p.rotation, settings.quality, settings.maxResolution)
    )
  );

  const firstPage = processedPages[0];

  let initialOrientation: 'portrait' | 'landscape' =
    settings.orientation === 'landscape' ? 'landscape' : 'portrait';

  let initialFormat: string | [number, number] = 'a4';
  if (settings.pageSize === 'letter') {
    initialFormat = 'letter';
  } else if (settings.pageSize === 'fit') {
    const mmW = (firstPage.width * 25.4) / 72;
    const mmH = (firstPage.height * 25.4) / 72;
    initialOrientation = firstPage.width > firstPage.height ? 'landscape' : 'portrait';
    initialFormat = [mmW, mmH];
  }

  const doc = new jsPDF({
    orientation: initialOrientation,
    unit: 'mm',
    format: initialFormat,
    compress: true,
  });

  doc.setProperties({
    title: (settings.docTitle && settings.docTitle.trim()) || 'pdfdoc',
    subject: 'Created with InstanceUtility Suite',
    creator: 'InstanceUtility All-in-One Dashboard',
  });

  for (let i = 0; i < processedPages.length; i++) {
    const processed = processedPages[i];

    if (i > 0) {
      let pageOri: 'portrait' | 'landscape' =
        settings.orientation === 'landscape' ? 'landscape' : 'portrait';
      let pageFormat: string | [number, number] = 'a4';

      if (settings.pageSize === 'letter') {
        pageFormat = 'letter';
      } else if (settings.pageSize === 'fit') {
        const mmW = (processed.width * 25.4) / 72;
        const mmH = (processed.height * 25.4) / 72;
        pageOri = processed.width > processed.height ? 'landscape' : 'portrait';
        pageFormat = [mmW, mmH];
      }

      doc.addPage(pageFormat, pageOri);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (settings.pageSize === 'fit' && marginMm === 0) {
      doc.addImage(processed.dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } else {
      const usableWidth = Math.max(10, pageWidth - marginMm * 2);
      const usableHeight = Math.max(10, pageHeight - marginMm * 2);

      const imgAspect = processed.width / processed.height;
      const usableAspect = usableWidth / usableHeight;

      let renderW = usableWidth;
      let renderH = usableHeight;

      if (imgAspect > usableAspect) {
        renderW = usableWidth;
        renderH = usableWidth / imgAspect;
      } else {
        renderH = usableHeight;
        renderW = usableHeight * imgAspect;
      }

      const posX = marginMm + (usableWidth - renderW) / 2;
      const posY = marginMm + (usableHeight - renderH) / 2;

      doc.addImage(processed.dataUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    }
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  return { blob: pdfBlob, url: pdfUrl, size: pdfBlob.size };
}

/* =========================================================================
   AD PLACEHOLDER COMPONENT (CLEAN <div> PLACEHOLDERS FOR AD CODES)
   ========================================================================= */

interface AdSlotProps {
  slot: string;
  format: 'leaderboard' | 'rectangle' | 'banner' | 'skyscraper';
  className?: string;
}

const AdPlaceholder: React.FC<AdSlotProps> = ({ slot, format, className = '' }) => {
  const dimensions =
    format === 'leaderboard'
      ? '728 x 90 (Leaderboard)'
      : format === 'rectangle'
      ? '300 x 250 (Medium Rectangle)'
      : format === 'skyscraper'
      ? '160 x 600 (Wide Skyscraper)'
      : '970 x 90 (Super Banner)';

  return (
    <div
      className={`w-full my-6 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-100/70 text-center flex flex-col items-center justify-center transition-colors hover:bg-slate-100 ${className}`}
      data-ad-slot={slot}
    >
      {/* AD CODE HERE */}
      <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
        &lt;!-- AD CODE HERE --&gt;
      </span>
      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
        Slot: {slot} · {dimensions}
      </span>
    </div>
  );
};

/* =========================================================================
   TOOL 1: IMAGE TO PDF CONVERTER WITH COMPRESSION COMPONENT
   ========================================================================= */

const ImageToPdfTool: React.FC = () => {
  const [pages, setPages] = useState<ImageDocPage[]>([]);
  const [settings, setSettings] = useState<PdfSettings>({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'compact',
    quality: 0.75,
    docTitle: 'pdfdoc',
    compressionPreset: 'recommended',
    maxResolution: 1920,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedPdfSize, setGeneratedPdfSize] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalOriginalBytes = pages.reduce((acc, p) => acc + p.size, 0);

  const handlePresetChange = (preset: CompressionPreset) => {
    if (preset === 'recommended') {
      setSettings((s) => ({
        ...s,
        compressionPreset: 'recommended',
        quality: 0.75,
        maxResolution: 1920,
      }));
    } else if (preset === 'high') {
      setSettings((s) => ({
        ...s,
        compressionPreset: 'high',
        quality: 0.5,
        maxResolution: 1280,
      }));
    } else if (preset === 'original') {
      setSettings((s) => ({
        ...s,
        compressionPreset: 'original',
        quality: 0.95,
        maxResolution: 0,
      }));
    } else {
      setSettings((s) => ({ ...s, compressionPreset: 'custom' }));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setGeneratedPdfSize(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    validFiles.forEach(async (file) => {
      try {
        const normalized = await normalizeImage(file, 0);
        const newPage: ImageDocPage = {
          id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          dataUrl: normalized.dataUrl,
          rotation: 0,
          aspectRatio: normalized.width / normalized.height,
        };
        setPages((prev) => [...prev, newPage]);
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    });
  };

  const rotatePage = (id: string) => {
    setGeneratedPdfSize(null);
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextRotation = (p.rotation + 90) % 360;
        return {
          ...p,
          rotation: nextRotation,
          aspectRatio: 1 / p.aspectRatio,
        };
      })
    );
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= pages.length) return;
    const copy = [...pages];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    setPages(copy);
  };

  const removePage = (id: string) => {
    setGeneratedPdfSize(null);
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllPages = () => {
    if (pages.length > 0 && window.confirm('Remove all uploaded pages?')) {
      setPages([]);
      setGeneratedPdfSize(null);
      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl);
        setGeneratedPdfUrl(null);
      }
    }
  };

  const handleGeneratePdf = async (triggerDownload = true) => {
    if (pages.length === 0) {
      setErrorMsg('Add at least one image to compile a PDF.');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl);
      }

      const { url, size } = await generatePdfBlob(pages, settings);
      setGeneratedPdfUrl(url);
      setGeneratedPdfSize(size);

      if (triggerDownload) {
        const link = document.createElement('a');
        link.href = url;
        const safeTitle = (settings.docTitle.trim() || 'pdfdoc').replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `${safeTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Image to PDF Converter with Compression
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Convert JPG, PNG, and WEBP files into PDF documents with custom orientation and page formats.
          </p>
        </div>

        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllPages}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Clear All ({pages.length})
            </button>
            <button
              onClick={() => handleGeneratePdf(true)}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Converting...' : 'Export PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Upload & Thumbnails on left, Document Settings on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Drag & Drop your images here
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WEBP · No file size limits · 100% processed in browser
            </p>
            <span className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
              Browse Files
            </span>
          </div>

          {/* Uploaded Pages Grid */}
          {pages.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 pb-2 border-b border-slate-100">
                <span>Document Pages ({pages.length})</span>
                <span className="text-slate-400">Reorder or rotate individual pages</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pages.map((page, idx) => (
                  <div
                    key={page.id}
                    className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div className="relative aspect-4/3 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${idx + 1}`}
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        Page {idx + 1}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-medium text-slate-800 truncate" title={page.name}>
                        {page.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {(page.size / 1024).toFixed(0)} KB · Rotated {page.rotation}°
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => movePage(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Earlier"
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => movePage(idx, 'down')}
                            disabled={idx === pages.length - 1}
                            title="Move Later"
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => rotatePage(page.id)}
                            title="Rotate 90 degrees"
                            className="p-1 text-slate-500 hover:text-slate-900"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removePage(page.id)}
                          className="text-rose-600 hover:text-rose-700 text-[11px] font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Export Card */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              PDF Document Settings
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document File Name
              </label>
              <input
                type="text"
                value={settings.docTitle}
                onChange={(e) => setSettings({ ...settings, docTitle: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                placeholder="pdfdoc"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Page Format
              </label>
              <select
                value={settings.pageSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pageSize: e.target.value as 'a4' | 'letter' | 'fit',
                  })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="a4">A4 (Standard 210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Orientation
              </label>
              <select
                value={settings.orientation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    orientation: e.target.value as 'portrait' | 'landscape',
                  })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Page Margins
              </label>
              <select
                value={settings.margin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    margin: e.target.value as 'none' | 'compact' | 'standard',
                  })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="compact">Compact (5 mm)</option>
                <option value="standard">Standard (10 mm)</option>
                <option value="none">None (Full Bleed)</option>
              </select>
            </div>

            {/* PDF COMPRESSION & QUALITY CONTROLS */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
                  PDF Compression
                </label>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {Math.round(settings.quality * 100)}% quality
                </span>
              </div>

              {/* Compression Preset Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-center">
                <button
                  type="button"
                  onClick={() => handlePresetChange('high')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    settings.compressionPreset === 'high'
                      ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Smaller file size (Email & web uploads)"
                >
                  Smallest
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('recommended')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    settings.compressionPreset === 'recommended'
                      ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Balanced clarity and file size"
                >
                  Balanced ★
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('original')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    settings.compressionPreset === 'original'
                      ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Original resolution and maximum clarity"
                >
                  Original
                </button>
              </div>

              {/* Custom Quality Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Compression Quality</span>
                  <span className="font-mono text-slate-700">{Math.round(settings.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={Math.round(settings.quality * 100)}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      compressionPreset: 'custom',
                      quality: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full accent-blue-600 cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Smaller File</span>
                  <span>Higher Quality</span>
                </div>
              </div>

              {/* Max Resolution / Scaling Dropdown */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Max Image Resolution
                </label>
                <select
                  value={settings.maxResolution}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      compressionPreset: 'custom',
                      maxResolution: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value={1280}>Web &amp; Email Friendly (Max 1280px · Fast)</option>
                  <option value={1920}>Full HD (Max 1920px · Recommended)</option>
                  <option value={2560}>2K QHD (Max 2560px · High Detail)</option>
                  <option value={0}>Original Resolution (No Downscaling)</option>
                </select>
              </div>

              {/* Total Source Images Size info */}
              {totalOriginalBytes > 0 && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Input Images Total:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

              {/* Generated PDF Output & Compression Savings Box */}
              {generatedPdfSize && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Compiled PDF Size:
                    </span>
                    <span className="font-mono">
                      {(generatedPdfSize / 1024).toFixed(0)} KB ({(generatedPdfSize / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  {totalOriginalBytes > generatedPdfSize && (
                    <div className="text-[11px] text-emerald-700 flex justify-between">
                      <span>Compression Saved:</span>
                      <span className="font-semibold">
                        -{Math.round(((totalOriginalBytes - generatedPdfSize) / totalOriginalBytes) * 100)}% reduction
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleGeneratePdf(true)}
                disabled={pages.length === 0 || isProcessing}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Generating PDF...' : 'Download Compiled PDF'}</span>
              </button>
            </div>
          </div>

          {/* Ad slot inside right sidebar */}
          <AdPlaceholder slot="sidebar-right-1" format="rectangle" />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TOOL 2: MERGE PDF COMPONENT (CLIENT-SIDE WITH COMPRESSION)
   ========================================================================= */

const MergePdfTool: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PdfMergeItem[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedPdfSize, setMergedPdfSize] = useState<number | null>(null);
  const [docTitle, setDocTitle] = useState<string>('merged_document');
  const [compressionPreset, setCompressionPreset] = useState<CompressionPreset>('recommended');
  const [quality, setQuality] = useState<number>(0.75);
  const [maxResolution, setMaxResolution] = useState<number>(1920);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalInputBytes = pdfFiles.reduce((acc, item) => acc + item.size, 0);

  const handlePresetChange = (preset: CompressionPreset) => {
    if (preset === 'recommended') {
      setCompressionPreset('recommended');
      setQuality(0.75);
      setMaxResolution(1920);
    } else if (preset === 'high') {
      setCompressionPreset('high');
      setQuality(0.5);
      setMaxResolution(1280);
    } else if (preset === 'original') {
      setCompressionPreset('original');
      setQuality(0.95);
      setMaxResolution(0);
    } else {
      setCompressionPreset('custom');
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setMergedPdfSize(null);

    const validItems: PdfMergeItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        validItems.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          file,
        });
      }
    }

    if (validItems.length === 0) {
      setErrorMsg('Please select PDF files to merge.');
      return;
    }

    setPdfFiles((prev) => [...prev, ...validItems]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= pdfFiles.length) return;
    const copy = [...pdfFiles];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    setPdfFiles(copy);
    setMergedPdfSize(null);
  };

  const removeItem = (id: string) => {
    setPdfFiles((prev) => prev.filter((item) => item.id !== id));
    setMergedPdfSize(null);
  };

  const mergeViaPdfJs = async (
    targetQuality: number,
    targetMaxRes: number
  ): Promise<{ url: string; size: number }> => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    let masterDoc: jsPDF | null = null;

    for (const item of pdfFiles) {
      const fileBuffer = await item.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(fileBuffer),
        password: '',
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const origViewport = page.getViewport({ scale: 1.0 });

        let renderScale = 2.0;
        if (targetMaxRes > 0) {
          const maxDimension = Math.max(origViewport.width, origViewport.height);
          if (maxDimension > 0) {
            renderScale = Math.min(2.0, targetMaxRes / maxDimension);
            if (renderScale < 0.75) renderScale = 0.75;
          }
        }

        const renderViewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // @ts-expect-error canvasContext accepts CanvasRenderingContext2D
        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
        }).promise;

        const safeQuality = Math.max(0.15, Math.min(0.95, targetQuality));
        const imgData = canvas.toDataURL('image/jpeg', safeQuality);

        const mmW = (origViewport.width * 25.4) / 72;
        const mmH = (origViewport.height * 25.4) / 72;
        const orientation = mmW > mmH ? 'landscape' : 'portrait';

        if (!masterDoc) {
          masterDoc = new jsPDF({
            orientation,
            unit: 'mm',
            format: [mmW, mmH],
            compress: true,
          });
          masterDoc.addImage(imgData, 'JPEG', 0, 0, mmW, mmH, undefined, 'FAST');
        } else {
          masterDoc.addPage([mmW, mmH], orientation);
          masterDoc.addImage(imgData, 'JPEG', 0, 0, mmW, mmH, undefined, 'FAST');
        }
      }
    }

    if (!masterDoc) {
      throw new Error('Unable to extract pages from uploaded documents.');
    }

    const outputBlob = masterDoc.output('blob');
    return {
      url: URL.createObjectURL(outputBlob),
      size: outputBlob.size,
    };
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      setErrorMsg('Please add at least 2 PDF files to merge.');
      return;
    }
    setErrorMsg(null);
    setIsMerging(true);

    try {
      let downloadUrl = '';
      let resultSize = 0;

      // If user selected 'original' (no compression), try fast direct vector merge first
      if (compressionPreset === 'original') {
        try {
          const mergedPdf = await PDFDocument.create();

          for (const item of pdfFiles) {
            const fileBuffer = await item.file.arrayBuffer();
            const loadedPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(loadedPdf, loadedPdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }

          const mergedPdfBytes = await mergedPdf.save();
          const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
          downloadUrl = URL.createObjectURL(blob);
          resultSize = blob.size;
        } catch (pdfLibErr) {
          console.warn('Direct vector merge failed, using fallback engine:', pdfLibErr);
          const res = await mergeViaPdfJs(0.95, 0);
          downloadUrl = res.url;
          resultSize = res.size;
        }
      } else {
        // User enabled compression (balanced, smallest, or custom)
        const res = await mergeViaPdfJs(quality, maxResolution);
        downloadUrl = res.url;
        resultSize = res.size;
      }

      setMergedPdfUrl(downloadUrl);
      setMergedPdfSize(resultSize);

      // Trigger instant download
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeTitle = (docTitle.trim() || 'merged_document').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${safeTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to merge PDF files.';
      if (msg.toLowerCase().includes('password')) {
        setErrorMsg('One of your uploaded PDF files is password-protected. Please unlock or remove the password before merging.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Files className="w-5 h-5 text-blue-600" />
            Merge &amp; Compress PDF Files
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Combine multiple PDF documents into a single file with optional compression to reduce file size.
          </p>
        </div>

        {pdfFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPdfFiles([]);
                setMergedPdfSize(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Clear All ({pdfFiles.length})
            </button>
            <button
              onClick={handleMerge}
              disabled={isMerging || pdfFiles.length < 2}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isMerging ? 'Merging...' : 'Merge & Download'}</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Uploader + PDF Items List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Files className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Upload PDF files to combine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select two or more PDF files · Fast client-side merge &amp; compression
            </p>
            <span className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
              Browse PDF Files
            </span>
          </div>

          {/* List of Uploaded PDFs */}
          {pdfFiles.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-2 border-b border-slate-100">
                <span>Documents to Merge ({pdfFiles.length})</span>
                <span className="text-slate-400">Order from top to bottom</span>
              </div>

              <div className="divide-y divide-slate-100">
                {pdfFiles.map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-medium flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{(item.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === pdfFiles.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Compression Settings Card */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              Merge &amp; Compression Settings
            </h3>

            {/* Document File Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Merged File Name
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                placeholder="merged_document"
              />
            </div>

            {/* PDF Compression Section */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
                  PDF File Compression
                </label>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {compressionPreset === 'original' ? 'Lossless' : `${Math.round(quality * 100)}% quality`}
                </span>
              </div>

              {/* Compression Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-center">
                <button
                  type="button"
                  onClick={() => handlePresetChange('high')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    compressionPreset === 'high'
                      ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Compact size for email & web limits"
                >
                  Smallest
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('recommended')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    compressionPreset === 'recommended'
                      ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Balanced clarity & file size reduction"
                >
                  Balanced ★
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('original')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    compressionPreset === 'original'
                      ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Direct lossless vector merge without recompression"
                >
                  Original
                </button>
              </div>

              {/* Custom Quality Slider if not lossless */}
              {compressionPreset !== 'original' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Compression Quality</span>
                    <span className="font-mono text-slate-700">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    step="5"
                    value={Math.round(quality * 100)}
                    onChange={(e) => {
                      setCompressionPreset('custom');
                      setQuality(Number(e.target.value) / 100);
                    }}
                    className="w-full accent-blue-600 cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Smaller File</span>
                    <span>Higher Quality</span>
                  </div>
                </div>
              )}

              {/* Max Resolution Dropdown if not lossless */}
              {compressionPreset !== 'original' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Max Resolution Downscaling
                  </label>
                  <select
                    value={maxResolution}
                    onChange={(e) => {
                      setCompressionPreset('custom');
                      setMaxResolution(Number(e.target.value));
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value={1280}>Web &amp; Email Friendly (Max 1280px · Fast)</option>
                    <option value={1920}>Full HD (Max 1920px · Recommended)</option>
                    <option value={2560}>2K QHD (Max 2560px · High Detail)</option>
                    <option value={0}>Original Resolution (No Downscaling)</option>
                  </select>
                </div>
              )}

              {/* Input Files Total Size Box */}
              {totalInputBytes > 0 && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Total Input Size:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {(totalInputBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

              {/* Merged Size & Compression Savings Feedback */}
              {mergedPdfSize && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Merged PDF Size:
                    </span>
                    <span className="font-mono">
                      {(mergedPdfSize / 1024).toFixed(0)} KB ({(mergedPdfSize / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  {totalInputBytes > mergedPdfSize && (
                    <div className="text-[11px] text-emerald-700 flex justify-between">
                      <span>Compression Saved:</span>
                      <span className="font-semibold">
                        -{Math.round(((totalInputBytes - mergedPdfSize) / totalInputBytes) * 100)}% reduction
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handleMerge}
                disabled={isMerging || pdfFiles.length < 2}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isMerging ? 'Merging & Compressing...' : 'Merge & Download PDF'}</span>
              </button>
            </div>
          </div>

          <AdPlaceholder slot="sidebar-right-2" format="rectangle" />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TOOL 3: WORD COUNTER & TEXT UTILITY
   ========================================================================= */

const WordCounterTool: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute metrics
  const cleanTrimmed = text.trim();
  const words = cleanTrimmed ? cleanTrimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = cleanTrimmed
    ? (cleanTrimmed.match(/[.!?]+(?:\s|$)/g) || []).length || (cleanTrimmed.length > 0 ? 1 : 0)
    : 0;
  const paragraphs = cleanTrimmed
    ? cleanTrimmed.split(/\n+/).filter((p) => p.trim().length > 0).length
    : 0;

  // Reading time (approx 200 words per minute)
  const readingTimeMinutes = Math.ceil(words / 200);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transformCase = (type: 'upper' | 'lower' | 'title') => {
    if (type === 'upper') setText(text.toUpperCase());
    if (type === 'lower') setText(text.toLowerCase());
    if (type === 'title') {
      setText(
        text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-600" />
            Word Counter & Text Utilities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyze word count, character density, sentence structures, and transform text cases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setText('')}
            disabled={!text}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Clear Text
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-2xs">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Words</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{words}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-2xs">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Characters</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{characters}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-2xs">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">No Spaces</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{charactersNoSpaces}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-2xs">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Sentences</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{sentences}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-2xs">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Paragraphs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{paragraphs}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-2xs">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Reading Time</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">~{readingTimeMinutes}m</p>
        </div>
      </div>

      {/* Editor & Case Transform Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Case Tools:</span>
            <button
              onClick={() => transformCase('upper')}
              disabled={!text}
              className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40"
            >
              UPPERCASE
            </button>
            <button
              onClick={() => transformCase('lower')}
              disabled={!text}
              className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40"
            >
              lowercase
            </button>
            <button
              onClick={() => transformCase('title')}
              disabled={!text}
              className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40"
            >
              Title Case
            </button>
          </div>
          <span className="text-xs text-slate-400">Instant real-time calculation</span>
        </div>

        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your document draft, report, or notes here..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans resize-y"
        />
      </div>
    </div>
  );
};

/* =========================================================================
   TOOL 4: IMAGE COMPRESSOR UTILITY COMPONENT
   ========================================================================= */

const ImageCompressorTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
    setOriginalSize(file.size);
    setCompressedUrl(null);
    setCompressedSize(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCompress = () => {
    if (!selectedFile || !previewUrl) return;
    setIsCompressing(true);

    const img = new window.Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCompressing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
      setCompressedUrl(dataUrl);

      // Estimate byte size from data URL
      const byteString = atob(dataUrl.split(',')[1]);
      setCompressedSize(byteString.length);
      setIsCompressing(false);
    };
  };

  const savingsPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-blue-600" />
            Image Compressor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize JPEG and PNG image files with customizable quality controls to reduce file size.
          </p>
        </div>

        {selectedFile && (
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setCompressedUrl(null);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleSelectFile(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Select an image to compress
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            JPG, PNG, or WEBP · Client-side processing
          </p>
          <span className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
            Choose Image
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
              Compression Settings
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Quality Level</span>
                <span className="font-mono text-blue-600">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Smaller File</span>
                <span>Higher Quality</span>
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCompressing ? 'animate-spin' : ''}`} />
              <span>{isCompressing ? 'Compressing...' : 'Apply Compression'}</span>
            </button>

            {/* Savings Box */}
            {compressedSize > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Original:</span>
                  <span className="font-mono font-medium">{(originalSize / 1024).toFixed(0)} KB</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Compressed:</span>
                  <span className="font-mono font-medium">{(compressedSize / 1024).toFixed(0)} KB</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-emerald-200">
                  <span>Saved:</span>
                  <span>{savingsPercent}%</span>
                </div>

                <a
                  href={compressedUrl || '#'}
                  download={`compressed_${selectedFile.name}`}
                  className="mt-2 w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 block text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
              </div>
            )}
          </div>

          {/* Image Preview Box */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col items-center justify-center min-h-[300px]">
            {previewUrl && (
              <img
                src={compressedUrl || previewUrl}
                alt="Preview"
                className="max-h-[380px] max-w-full object-contain rounded-lg"
              />
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              {compressedUrl ? 'Showing compressed preview' : 'Original image loaded'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   FOOTER MODAL COMPONENT (ABOUT, CONTACT, FEEDBACK, LEGAL)
   ========================================================================= */

export type FooterModalType = 'about' | 'contact' | 'feedback' | 'privacy' | 'terms' | 'cookies' | null;

interface FooterModalProps {
  type: FooterModalType;
  onClose: () => void;
  onSelectType: (type: FooterModalType) => void;
}

const FooterModal: React.FC<FooterModalProps> = ({ type, onClose, onSelectType }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', subject: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(0);
  const [contactError, setContactError] = useState<string | null>(null);

  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('General');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!type) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('treevant26@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    // Anti-bot honeypot check: silently simulate success for automated bots
    if (honeypot) {
      setContactSubmitted(true);
      return;
    }

    if (submitCooldown > 0) {
      setContactError(`Please wait ${submitCooldown}s before submitting another message.`);
      return;
    }

    const trimmedEmail = contactForm.email.trim();
    const trimmedMessage = contactForm.message.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setContactError('Please enter a valid email address.');
      return;
    }

    if (!trimmedMessage) {
      setContactError('Please enter your message.');
      return;
    }

    if (!agreePrivacy) {
      setContactError('Please agree to the Privacy Policy to proceed.');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('https://formsubmit.co/ajax/treevant26@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[InstanceUtil Support] ${contactForm.subject || 'New Contact Inquiry'}`,
          email: trimmedEmail,
          subject: contactForm.subject || 'Support Request',
          message: trimmedMessage,
          _replyto: trimmedEmail,
          _template: 'table'
        })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && (!data || data.success === 'true' || data.success === true || data.message)) {
        setContactSubmitted(true);
        setSubmitCooldown(45);
        const interval = setInterval(() => {
          setSubmitCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(data?.message || 'Failed to dispatch email');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      setContactError(
        'Unable to send automatically. You can retry or click below to send directly via your email client.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {type === 'about' || type === 'contact' || type === 'feedback' ? 'InstanceUtil' : 'Legal & Policies'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {type === 'about' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">About InstanceUtil</h2>
                <p className="text-slate-500 text-xs mt-1">
                  High-speed, 100% private, client-side productivity utilities.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-900 text-xs leading-relaxed space-y-2">
                <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Our Core Commitment: Zero Server Uploads
                </p>
                <p>
                  Most online office and conversion services upload your sensitive documents, PDFs, and images to their private cloud servers.
                  <strong> InstanceUtil is fundamentally different:</strong> every conversion, compression, merge, and word calculation runs entirely inside your browser using client-side JavaScript, Web Workers, and WebAssembly.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 text-sm">What InstanceUtil Offers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <span className="font-semibold text-slate-900 block mb-1">Image to PDF with Compression</span>
                    <span className="text-slate-600">Convert JPG, PNG, and WebP to multi-page PDFs with presets, rotation, and size controls.</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <span className="font-semibold text-slate-900 block mb-1">Merge PDF</span>
                    <span className="text-slate-600">Combine multiple PDF files with optional client-side rasterized compression to shrink file size.</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <span className="font-semibold text-slate-900 block mb-1">Image Compressor</span>
                    <span className="text-slate-600">Reduce image size locally using browser canvas rendering and custom quality targets.</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <span className="font-semibold text-slate-900 block mb-1">Word Counter & Text Utilities</span>
                    <span className="text-slate-600">Analyze words, characters, sentences, paragraphs, reading time, and text casing instantly.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>InstanceUtil © 2026</span>
                <span className="text-emerald-700 font-medium">Free &amp; Open Client-Side Suite</span>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contact Us</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Have a question, suggestion, or partnership inquiry? We are here to help. Review our{' '}
                  <button
                    type="button"
                    onClick={() => onSelectType('privacy')}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Privacy Policy
                  </button>{' '}
                  for details on how we handle user data.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Direct Support Email</span>
                    <span className="text-xs font-semibold text-slate-800">treevant26@gmail.com</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-700"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security & Retention Commitment Banner */}
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block text-emerald-950">Security &amp; 30-Day Retention Guarantee</span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Submissions are encrypted in transit and used exclusively to respond to your inquiry. Data is retained for a maximum of 30 days and never shared with third parties.
                  </p>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-emerald-900 text-sm">Message Delivered to Support!</h3>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    Your inquiry has been successfully dispatched to <strong>treevant26@gmail.com</strong>. We will follow up directly at <strong>{contactForm.email}</strong>.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-emerald-200 rounded-full text-[11px] text-emerald-800">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>Inquiry retained for max 30 days strictly for support resolution</span>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setContactSubmitted(false);
                        setContactForm({ email: '', subject: '', message: '' });
                        setAgreePrivacy(false);
                        setContactError(null);
                      }}
                      className="mt-3 text-xs text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  {/* Anti-spam honeypot (hidden from human users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="contact_website">Do not fill this</label>
                    <input
                      id="contact_website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {contactError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs space-y-1.5">
                      <p>{contactError}</p>
                      <div>
                        <a
                          href={`mailto:treevant26@gmail.com?subject=${encodeURIComponent('[InstanceUtil] ' + (contactForm.subject || 'Support Request'))}&body=${encodeURIComponent(contactForm.message)}`}
                          className="font-semibold text-rose-900 underline hover:text-black cursor-pointer inline-flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Open in your email client instead &rarr;</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      maxLength={100}
                      value={contactForm.email}
                      onChange={(e) => {
                        setContactForm({ ...contactForm, email: e.target.value });
                        if (contactError) setContactError(null);
                      }}
                      placeholder="alex@example.com"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700">Subject</label>
                      <span className="text-[10px] text-slate-400">{contactForm.subject.length}/120</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={contactForm.subject}
                      onChange={(e) => {
                        setContactForm({ ...contactForm, subject: e.target.value });
                        if (contactError) setContactError(null);
                      }}
                      placeholder="e.g. Question regarding PDF Compression"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700">Message</label>
                      <span className="text-[10px] text-slate-400">{contactForm.message.length}/2,000</span>
                    </div>
                    <textarea
                      required
                      rows={4}
                      maxLength={2000}
                      value={contactForm.message}
                      onChange={(e) => {
                        setContactForm({ ...contactForm, message: e.target.value });
                        if (contactError) setContactError(null);
                      }}
                      placeholder="How can we help you today?"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="contact-privacy-consent"
                      type="checkbox"
                      required
                      checked={agreePrivacy}
                      onChange={(e) => {
                        setAgreePrivacy(e.target.checked);
                        if (contactError) setContactError(null);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor="contact-privacy-consent" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                      I have read the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectType('privacy');
                        }}
                        className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                      >
                        Privacy Policy
                      </button>{' '}
                      and understand how my personal data will be handled to respond to my enquiry.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!agreePrivacy || submitCooldown > 0 || isSending}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending to Support...</span>
                      </>
                    ) : submitCooldown > 0 ? (
                      <span>Please wait {submitCooldown}s</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {type === 'feedback' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Send Feedback</h2>
                <p className="text-slate-500 text-xs mt-1">
                  We are constantly improving InstanceUtil. Tell us what tools or improvements you want to see!
                </p>
              </div>

              {feedbackSubmitted ? (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
                  <h3 className="font-bold text-blue-900 text-sm">Thank You for Your Feedback!</h3>
                  <p className="text-xs text-blue-800 max-w-sm mx-auto">
                    Your response helps us prioritize new features and enhancements.
                  </p>
                  <button
                    onClick={() => {
                      setFeedbackSubmitted(false);
                      setFeedbackText('');
                    }}
                    className="mt-3 text-xs text-blue-700 underline cursor-pointer"
                  >
                    Submit another response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">How satisfied are you with InstanceUtil?</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= feedbackRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-500 ml-2 font-medium">
                        {feedbackRating === 5 ? 'Excellent' : feedbackRating === 4 ? 'Very Good' : feedbackRating === 3 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Which tool are you evaluating?</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="General">Entire InstanceUtil Suite (General)</option>
                      <option value="Image to PDF">Image to PDF Converter with Compression</option>
                      <option value="Merge PDF">Merge PDF with Compression</option>
                      <option value="Image Compressor">Image Compressor</option>
                      <option value="Word Counter">Word Counter & Text Utilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Comments or Feature Requests</label>
                    <textarea
                      rows={4}
                      required
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="What did you like? What additional tools or formats would you like us to support?"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Submit Feedback</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Privacy Policy</h2>
                <p className="text-slate-500 text-xs mt-1">Effective Date: October 2026</p>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed text-slate-600">
                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">1. 100% Client-Side In-Memory Execution</h4>
                  <p>
                    InstanceUtil was built from the ground up with local privacy as our foundational principle.
                    When you drop, open, or convert any document, image, or text file on InstanceUtil, the file is loaded solely into your local browser&apos;s memory. No file contents are ever transmitted across the network, stored on servers, or processed remotely.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">2. Immediate Data Clearance</h4>
                  <p>
                    Because files exist purely in volatile browser memory (RAM), closing the tab or refreshing the page immediately purges all loaded files. There is no server database or temporary cloud storage.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">3. Information We Do Not Collect</h4>
                  <p>
                    We do not collect names, phone numbers, file names, file contents, or personal documents. We do not sell or monetize personal user data.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">4. Local Browser Storage</h4>
                  <p>
                    InstanceUtil may utilize browser localStorage solely to remember non-sensitive user interface preferences (such as your preferred tool tab or compression preset).
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">5. Contact Submissions &amp; 30-Day Retention Policy</h4>
                  <p>
                    When you submit an inquiry through our Contact Us form or send an email to <strong>treevant26@gmail.com</strong>, we collect only your email address and message contents solely to respond to your specific inquiry.
                  </p>
                  <p>
                    <strong>Strict Retention Limit:</strong> Inquiry records are retained for a maximum of 30 days to ensure your questions are fully resolved, after which they are permanently purged. We never sell, share, or use support contact information for marketing.
                  </p>
                  <p>
                    <strong>Right to Erasure:</strong> You can request immediate erasure of your communication records at any time by emailing <strong>treevant26@gmail.com</strong>.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">6. Contact Information</h4>
                  <p>
                    If you have questions about this Privacy Policy or wish to request data erasure, contact us at <strong>treevant26@gmail.com</strong>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Terms of Use</h2>
                <p className="text-slate-500 text-xs mt-1">Effective Date: October 2026</p>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed text-slate-600">
                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">1. Agreement to Terms</h4>
                  <p>
                    By accessing or using InstanceUtil, you agree to comply with and be bound by these Terms of Use. If you do not agree, please discontinue using the service.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">2. License &amp; Tool Usage</h4>
                  <p>
                    InstanceUtil grants you a personal, worldwide, royalty-free, non-exclusive license to use the tools for personal, educational, or commercial purposes. No subscription or registration is required.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">3. Intellectual Property of Your Content</h4>
                  <p>
                    You retain 100% ownership and copyright of any images, PDFs, text, or documents you process through InstanceUtil. We assert no rights, claims, or licenses over your files.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">4. Disclaimer of Warranties</h4>
                  <p>
                    The tools are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. While our PDF and image algorithms are designed for reliability, users are encouraged to maintain independent backups of critical files.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">5. Limitation of Liability</h4>
                  <p>
                    In no event shall InstanceUtil or its operators be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the tools.
                  </p>
                </section>
              </div>
            </div>
          )}

          {type === 'cookies' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cookie Policy</h2>
                <p className="text-slate-500 text-xs mt-1">Effective Date: October 2026</p>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed text-slate-600">
                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">1. What Are Cookies</h4>
                  <p>
                    Cookies and web storage technologies (like HTML5 localStorage) are small data files saved on your computer or device by your web browser when visiting websites.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">2. How InstanceUtil Uses Storage</h4>
                  <p>
                    InstanceUtil uses strictly necessary client-side storage to remember tool settings (e.g. compression quality, selected tabs). We do not use persistent cross-site tracking cookies or sell your browsing history to data brokers.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">3. Ad Placements</h4>
                  <p>
                    Where third-party ad networks provide banner placeholders, those networks may set standard operational cookies subject to their respective privacy disclosures.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">4. Managing Your Preferences</h4>
                  <p>
                    You can inspect or delete cookies and localStorage at any time using your browser&apos;s developer tools or settings menu. InstanceUtil remains fully usable even if local storage is cleared.
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectType('privacy')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${type === 'privacy' ? 'font-bold text-blue-600' : 'text-slate-500'}`}
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onSelectType('terms')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${type === 'terms' ? 'font-bold text-blue-600' : 'text-slate-500'}`}
            >
              Terms of Use
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onSelectType('cookies')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${type === 'cookies' ? 'font-bold text-blue-600' : 'text-slate-500'}`}
            >
              Cookie Policy
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   MAIN APP: ALL-IN-ONE OFFICE TOOL DASHBOARD
   ========================================================================= */

function parseRoute(pathname: string): {
  view: 'tool' | 'guides-home' | 'guide-article';
  tool: ActiveTool;
  articleSlug?: string;
} {
  const clean = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (clean === 'guides' || clean === 'blog') {
    return { view: 'guides-home', tool: 'image-to-pdf' };
  }
  if (clean.startsWith('guides/')) {
    const slug = clean.replace(/^guides\//, '').replace(/\/+$/, '');
    return { view: 'guide-article', tool: 'image-to-pdf', articleSlug: slug };
  }
  return { view: 'tool', tool: getToolFromPath(pathname) };
}

export default function App() {
  const initialRoute =
    typeof window !== 'undefined'
      ? parseRoute(window.location.pathname)
      : { view: 'tool' as const, tool: 'image-to-pdf' as ActiveTool };

  const [appView, setAppView] = useState<'tool' | 'guides-home' | 'guide-article'>(initialRoute.view);
  const [articleSlug, setArticleSlug] = useState<string | undefined>(initialRoute.articleSlug);
  const [activeCategory, setActiveCategory] = useState<ToolCategory>(
    TOOL_SEO_PAGES[initialRoute.tool]?.category || 'pdf'
  );
  const [activeTool, setActiveTool] = useState<ActiveTool>(initialRoute.tool);
  const [activeModal, setActiveModal] = useState<FooterModalType>(null);

  const navigateToTool = (tool: ActiveTool, pushHistory = true) => {
    setAppView('tool');
    setArticleSlug(undefined);
    setActiveTool(tool);
    const targetCategory = TOOL_SEO_PAGES[tool]?.category || 'pdf';
    setActiveCategory(targetCategory);
    applyToolSeo(tool);

    if (pushHistory && typeof window !== 'undefined') {
      const newPath = getPathForTool(tool);
      if (window.location.pathname !== newPath) {
        window.history.pushState({ view: 'tool', tool }, '', newPath);
      }
    }
  };

  const navigateToGuidesHome = (pushHistory = true) => {
    setAppView('guides-home');
    setArticleSlug(undefined);
    applyGuidesHomeSeo();

    if (pushHistory && typeof window !== 'undefined') {
      const newPath = '/guides/';
      if (window.location.pathname !== newPath) {
        window.history.pushState({ view: 'guides-home' }, '', newPath);
      }
    }
  };

  const navigateToArticle = (slug: string, pushHistory = true) => {
    const article = getGuideBySlug(slug);
    if (!article) {
      navigateToGuidesHome(pushHistory);
      return;
    }
    setAppView('guide-article');
    setArticleSlug(slug);
    applyGuideArticleSeo(article);

    if (pushHistory && typeof window !== 'undefined') {
      const newPath = `/guides/${slug}/`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({ view: 'guide-article', slug }, '', newPath);
      }
    }
  };

  useEffect(() => {
    const applyCurrentRouteSeo = () => {
      const route = parseRoute(window.location.pathname);
      setAppView(route.view);
      if (route.view === 'guides-home') {
        applyGuidesHomeSeo();
      } else if (route.view === 'guide-article' && route.articleSlug) {
        const article = getGuideBySlug(route.articleSlug);
        if (article) {
          setArticleSlug(route.articleSlug);
          applyGuideArticleSeo(article);
        } else {
          setAppView('guides-home');
          applyGuidesHomeSeo();
        }
      } else {
        setActiveTool(route.tool);
        setActiveCategory(TOOL_SEO_PAGES[route.tool]?.category || 'pdf');
        applyToolSeo(route.tool);
      }
    };

    applyCurrentRouteSeo();

    const handlePopState = () => {
      applyCurrentRouteSeo();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/10 selection:text-blue-700">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo / Title */}
          <div className="flex items-center gap-3">
            <a
              href="/image-to-pdf"
              onClick={(e) => {
                e.preventDefault();
                navigateToTool('image-to-pdf');
              }}
              className="flex items-center gap-3 hover:opacity-95 transition-opacity cursor-pointer select-none"
              aria-label="InstanceUtil"
            >
              <img
                src="/instanceutil_logo.svg"
                alt="instanceutil logo"
                className="h-10 sm:h-11 w-auto object-contain"
              />
              <div className="hidden sm:block border-l border-slate-200 pl-3 py-0.5">
                <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                  Office Utilities &amp; PDF
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  100% Client-Side Suite
                </span>
              </div>
            </a>
          </div>

          {/* Navigation Category Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                navigateToTool('image-to-pdf');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                appView === 'tool' && activeCategory === 'pdf'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Tools</span>
            </button>

            <button
              onClick={() => {
                navigateToTool('word-counter');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                appView === 'tool' && activeCategory === 'office'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Office Utilities</span>
            </button>

            <button
              onClick={() => {
                navigateToGuidesHome();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                appView === 'guides-home' || appView === 'guide-article'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guides &amp; Blog</span>
            </button>
          </nav>

          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Client-Side Privacy</span>
          </div>
        </div>

        {/* Sub-navigation bar */}
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto">
            {appView === 'tool' && activeCategory === 'pdf' && (
              <>
                <button
                  onClick={() => navigateToTool('image-to-pdf')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTool === 'image-to-pdf'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image to PDF</span>
                </button>
                <button
                  onClick={() => navigateToTool('merge-pdf')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTool === 'merge-pdf'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Files className="w-3.5 h-3.5" />
                  <span>Merge PDF</span>
                </button>
              </>
            )}

            {appView === 'tool' && activeCategory === 'office' && (
              <>
                <button
                  onClick={() => navigateToTool('word-counter')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTool === 'word-counter'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Word Counter</span>
                </button>
                <button
                  onClick={() => navigateToTool('image-compressor')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeTool === 'image-compressor'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Image Compressor</span>
                </button>
              </>
            )}

            {(appView === 'guides-home' || appView === 'guide-article') && (
              <>
                <button
                  onClick={() => navigateToGuidesHome()}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    appView === 'guides-home'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>All Guides</span>
                </button>
                <button
                  onClick={() => navigateToArticle('how-to-compress-pdf')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    appView === 'guide-article' && articleSlug === 'how-to-compress-pdf'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Compress PDF Guide</span>
                </button>
                <button
                  onClick={() => navigateToArticle('jpg-vs-png-vs-webp')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    appView === 'guide-article' && articleSlug === 'jpg-vs-png-vs-webp'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>JPG vs PNG vs WebP</span>
                </button>
                <button
                  onClick={() => navigateToArticle('convert-images-to-pdf')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    appView === 'guide-article' && articleSlug === 'convert-images-to-pdf'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Images to PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* LEFT SIDEBAR AD (Visible on desktop/wide screens, sticky so it stays in view while using tools) */}
          <aside className="hidden xl:block shrink-0 w-[160px] sticky top-20">
            <AdPlaceholder
              slot="left-skyscraper"
              format="skyscraper"
              className="h-[600px] my-0 bg-slate-100/80"
            />
          </aside>

          {/* MAIN TOOL WORKSPACE */}
          <div className="flex-1 min-w-0">
            {/* TOP BANNER AD CODE PLACEHOLDER */}
            <AdPlaceholder slot="top-leaderboard" format="leaderboard" />

            {appView === 'guides-home' && (
              <GuidesHomePage
                onNavigateToArticle={(slug) => {
                  navigateToArticle(slug);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToTool={(toolId) => {
                  navigateToTool(toolId as ActiveTool);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {appView === 'guide-article' &&
              (() => {
                const article = getGuideBySlug(articleSlug || '');
                if (!article) {
                  return (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                      <h2 className="text-xl font-bold text-slate-800">Article Not Found</h2>
                      <p className="text-xs text-slate-500">
                        The guide you are looking for does not exist or has been moved.
                      </p>
                      <button
                        onClick={() => navigateToGuidesHome()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Back to All Guides
                      </button>
                    </div>
                  );
                }
                return (
                  <GuideArticlePage
                    article={article}
                    onNavigateHome={() => {
                      navigateToGuidesHome();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onNavigateToArticle={(slug) => {
                      navigateToArticle(slug);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onNavigateToTool={(toolId) => {
                      navigateToTool(toolId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                );
              })()}

            {appView === 'tool' && (
              <>
                {/* ACTIVE TOOL VIEW */}
                {activeTool === 'image-to-pdf' && <ImageToPdfTool />}
                {activeTool === 'merge-pdf' && <MergePdfTool />}
                {activeTool === 'word-counter' && <WordCounterTool />}
                {activeTool === 'image-compressor' && <ImageCompressorTool />}

                {/* DEDICATED TOOL SEO CONTENT & GUIDE SECTION */}
                <ToolSeoSection tool={activeTool} onNavigate={navigateToTool} />
              </>
            )}

            {/* BOTTOM BANNER AD CODE PLACEHOLDER */}
            <AdPlaceholder slot="bottom-leaderboard" format="leaderboard" />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white mt-16 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/instanceutil_logo.svg"
                  alt="InstanceUtil"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fast, 100% private client-side office suite. Convert, merge, and compress your files directly in your browser with zero server uploads.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Client-Side Processing</span>
              </div>
            </div>

            {/* Column 1: Tools */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                Tools
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => {
                      navigateToTool('merge-pdf');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Merge PDF
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigateToTool('image-to-pdf');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Image to PDF
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigateToTool('image-compressor');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Image Compressor
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigateToTool('word-counter');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Word Counter &amp; Text Utilities
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Guides & Articles */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                Guides &amp; Blog
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => {
                      navigateToGuidesHome();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    All Guides &amp; Tutorials
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigateToArticle('how-to-compress-pdf');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    How to Compress PDF
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigateToArticle('jpg-vs-png-vs-webp');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    JPG vs PNG vs WebP Guide
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      navigateToArticle('convert-images-to-pdf');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Images to PDF Guide
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: InstanceUtil */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                InstanceUtil
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => setActiveModal('about')}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('contact')}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('feedback')}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Feedback
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                Legal
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('cookies')}
                    className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                  >
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 InstanceUtil. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>Zero Server Uploads</span>
              <span>·</span>
              <span>Private &amp; Secure</span>
              <span>·</span>
              <span>No Registration Required</span>
            </div>
          </div>
        </div>
      </footer>

      {/* FOOTER MODAL */}
      <FooterModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectType={(newType) => setActiveModal(newType)}
      />
    </div>
  );
}
