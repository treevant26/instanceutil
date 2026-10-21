export interface ImageDocPage {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
  aspectRatio: number; // width / height
}

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type PageOrientationOption = 'portrait' | 'landscape';
export type MarginOption = 'none' | 'compact' | 'standard';
export type CompressionPreset = 'original' | 'recommended' | 'high' | 'custom';

export interface PdfSettings {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: MarginOption;
  quality: number; // 0.2 to 1.0
  docTitle: string;
  compressionPreset: CompressionPreset;
  maxResolution: number; // 0 for original, or 1920, 1280, 800
}

export type ActiveTab = 'image-to-pdf' | 'merge-pdf' | 'word-counter' | 'image-compressor';
