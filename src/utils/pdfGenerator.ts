import { jsPDF } from 'jspdf';
import { ImageDocPage, PdfSettings } from '../types';

/**
 * Normalizes an image from File, Blob, or Data URL.
 * Automatically resolves and strips camera EXIF rotation tags so that
 * the resulting pixels physically match the visual orientation, preventing
 * unexpected rotation when converted to PDF.
 * Applies userRotation (0, 90, 180, 270) ONLY if user explicitly rotated it.
 */
export async function normalizeImage(
  source: File | Blob | string,
  userRotation: number = 0
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

  // 1. Decode with EXIF orientation resolved using createImageBitmap
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    orientedWidth = bitmap.width;
    orientedHeight = bitmap.height;
    drawSource = bitmap;
  } catch {
    // Fallback if browser doesn't support imageOrientation option in createImageBitmap
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const el = new Image();
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

  // 2. Only rotate if user explicitly requested rotation (90, 180, 270)
  const normRot = ((userRotation % 360) + 360) % 360;
  const is90or270 = normRot === 90 || normRot === 270;

  const canvasWidth = is90or270 ? orientedHeight : orientedWidth;
  const canvasHeight = is90or270 ? orientedWidth : orientedHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }

  if (normRot !== 0) {
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((normRot * Math.PI) / 180);
    ctx.drawImage(drawSource, -orientedWidth / 2, -orientedHeight / 2);
  } else {
    ctx.drawImage(drawSource, 0, 0);
  }

  if ('close' in drawSource && typeof (drawSource as ImageBitmap).close === 'function') {
    (drawSource as ImageBitmap).close();
  }

  // Export clean JPEG with NO EXIF orientation tag, preserving pixel fidelity
  const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  return {
    dataUrl: cleanDataUrl,
    width: canvasWidth,
    height: canvasHeight,
  };
}

export async function generatePdfBlob(
  pages: ImageDocPage[],
  settings: PdfSettings
): Promise<{ blob: Blob; url: string }> {
  if (pages.length === 0) {
    throw new Error('At least one image is required to generate a PDF.');
  }

  const marginMm = settings.margin === 'none' ? 0 : settings.margin === 'compact' ? 5 : 10;

  // Process and normalize all pages to ensure true visual orientation
  const processedPages = await Promise.all(
    pages.map((p) => normalizeImage(p.dataUrl, p.rotation))
  );

  const firstPage = processedPages[0];

  // Configure first page
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
    subject: 'Exported from PulseDoc Mobile Support Site',
    creator: 'PulseDoc Suite',
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
      // Exact full-bleed match to image dimensions
      doc.addImage(processed.dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } else {
      const usableWidth = Math.max(10, pageWidth - marginMm * 2);
      const usableHeight = Math.max(10, pageHeight - marginMm * 2);

      const imgAspect = processed.width / processed.height;
      const usableAspect = usableWidth / usableHeight;

      let renderW = usableWidth;
      let renderH = usableHeight;

      if (imgAspect > usableAspect) {
        // Image is wider than available rectangle
        renderW = usableWidth;
        renderH = usableWidth / imgAspect;
      } else {
        // Image is taller than available rectangle
        renderH = usableHeight;
        renderW = usableHeight * imgAspect;
      }

      // Center within usable region
      const posX = marginMm + (usableWidth - renderW) / 2;
      const posY = marginMm + (usableHeight - renderH) / 2;

      doc.addImage(processed.dataUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    }
  }

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  return { blob: pdfBlob, url: pdfUrl };
}
