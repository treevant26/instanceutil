import { ActiveTool, ToolCategory } from './App';

export interface SeoStep {
  title: string;
  description: string;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface ToolSeoData {
  id: ActiveTool;
  category: ToolCategory;
  primaryPath: string;
  alternatePaths?: string[];
  pageTitle: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  howToTitle: string;
  steps: SeoStep[];
  features: { title: string; description: string }[];
  faqs: SeoFaq[];
  compressionExplanation?: {
    title: string;
    description: string;
    modes: { name: string; tag: string; detail: string }[];
  };
  infographicImage?: {
    src: string;
    alt: string;
    caption?: string;
  };
}

export const TOOL_SEO_PAGES: Record<ActiveTool, ToolSeoData> = {
  'merge-pdf': {
    id: 'merge-pdf',
    category: 'pdf',
    primaryPath: '/merge-pdf',
    pageTitle: 'Merge PDF Online with Compression – Combine PDFs Free – InstanceUtil',
    metaDescription: 'Combine multiple PDF files into one document with built-in client-side rasterized compression. 100% private in-browser tool with zero server uploads.',
    heading: 'Merge PDF Files Online with Compression',
    subheading: 'Combine multiple PDF files in any order and shrink final document size locally inside your browser.',
    howToTitle: 'How to Merge and Add Compression to Your PDF Files',
    infographicImage: {
      src: '/assets/aistudio/How_to_Compress_a_PDF_Without_Losing_Quality_3e6b8023.png',
      alt: 'How to Compress a PDF Without Losing Quality – InstanceUtil Infographic',
      caption: 'Visual workflow: optimize embedded images, compress PDF streams, and shrink bloated documents without losing clarity.'
    },
    compressionExplanation: {
      title: 'How to Add Compression When Merging PDFs',
      description: 'Standard PDF mergers only stitch raw pages together, often leaving you with an oversized file that fails email or upload size limits. InstanceUtil gives you client-side compression presets right inside the merge workspace:',
      modes: [
        {
          name: 'Balanced Compression (★ Recommended)',
          tag: '75% Quality · 1920px Full HD',
          detail: 'Optimizes embedded images, raster layers, and downscales bloated scans to 1920px while maintaining crisp, readable typography. Cuts file sizes typically by 50% to 80%.'
        },
        {
          name: 'Smallest File Size',
          tag: '60% Quality · 1280px Fast Web',
          detail: 'Applies aggressive compression and limits maximum resolution to 1280px. Ideal for strict government portals, email attachments (under 2MB or 5MB), and fast web sharing.'
        },
        {
          name: 'Original (Lossless Vector Merge)',
          tag: '100% Quality · No Recompression',
          detail: 'Stitches PDF vector structures, shapes, and font streams directly without touching embedded images. Best for legal records and architectural vector blueprints.'
        },
        {
          name: 'Custom Controls',
          tag: '20% to 95% Slider · Selectable Resolution',
          detail: 'Gives you complete manual control over JPEG quality target and resolution downscaling (1280px, 1920px, 2560px, or original).'
        }
      ]
    },
    steps: [
      {
        title: '1. Select or Drop Your PDF Files',
        description: 'Drag and drop your PDF documents into the upload area or click to select files from your computer or phone. There is no file limit.'
      },
      {
        title: '2. Reorder Files & Set Document Title',
        description: 'Use the Move Up and Move Down arrow buttons to arrange pages in your preferred order. Enter your desired merged filename.'
      },
      {
        title: '3. Select Your PDF Compression Level',
        description: 'Under "Merged File Settings", pick "Balanced ★" for general use, "Smallest" for email/upload limits, or "Original" for direct lossless merging.'
      },
      {
        title: '4. Merge and Download Instantly',
        description: 'Click "Merge & Download". Your browser immediately combines and compresses the files locally and triggers an instant download.'
      }
    ],
    features: [
      {
        title: '100% Client-Side Privacy',
        description: 'Your PDFs never leave your device. All merging and raster compression run inside browser memory using WebAssembly and canvas.'
      },
      {
        title: 'Built-In File Shrinking',
        description: 'Eliminates the need to find a separate compressor tool after merging. Compress and combine in a single pass.'
      },
      {
        title: 'Drag, Reorder & Remove',
        description: 'Easily rearrange files into any sequence before assembling the final unified document.'
      },
      {
        title: 'No Registration or Limits',
        description: 'Completely free to use without daily conversion quotas, watermarks, or account registration requirements.'
      }
    ],
    faqs: [
      {
        question: 'How do I add compression when merging PDFs?',
        answer: 'Upload your PDFs, then look at the "Merged File Settings" panel on the right side. Under "PDF File Compression", choose Balanced (recommended) or Smallest. The tool will automatically compress image layers and optimize resolution while combining the files.'
      },
      {
        question: 'Are my confidential documents uploaded to a cloud server?',
        answer: 'No. Unlike traditional conversion sites, InstanceUtil runs 100% client-side inside your browser. No files, text, or pages are uploaded to external servers.'
      },
      {
        question: 'Can I combine password-protected PDFs?',
        answer: 'PDFs with master security restrictions must be unlocked before merging. The tool will alert you if a file is encrypted so you can remove the protection first.'
      },
      {
        question: 'How much file size reduction can I expect?',
        answer: 'For scanned documents or PDFs containing photographs, the Balanced preset typically shrinks the total combined size by 50% to 80%. For pure text vector documents, Original mode retains sharp vector text at zero loss.'
      }
    ]
  },

  'image-to-pdf': {
    id: 'image-to-pdf',
    category: 'pdf',
    primaryPath: '/image-to-pdf',
    alternatePaths: ['/'],
    pageTitle: 'Image to PDF Converter with Compression – JPG, PNG to PDF – InstanceUtil',
    metaDescription: 'Convert JPG, PNG, and WebP images to multi-page PDF documents with custom compression presets, margins, and paper sizes. 100% private, client-side.',
    heading: 'Image to PDF Converter with Compression',
    subheading: 'Convert photos, receipts, screenshots, and scans into professional multi-page PDF documents with built-in compression.',
    howToTitle: 'How to Convert Images to Compressed PDF Documents',
    steps: [
      {
        title: '1. Upload Images',
        description: 'Upload multiple JPG, PNG, or WebP images by dragging them into the upload dropzone or clicking to browse.'
      },
      {
        title: '2. Reorder & Rotate Pages',
        description: 'Arrange images in your desired sequence. Use the rotate button on individual thumbnail cards to correct portrait or landscape orientation.'
      },
      {
        title: '3. Customize Layout & Compression',
        description: 'Choose paper format (A4, US Letter, or Fit to Image), orientation, margin spacing, and compression preset (Recommended, High, or Original).'
      },
      {
        title: '4. Generate & Download PDF',
        description: 'Click "Convert & Download PDF". The PDF is generated directly in your browser memory and downloaded without server delay.'
      }
    ],
    features: [
      {
        title: 'All Standard Image Formats',
        description: 'Seamlessly convert JPG, JPEG, PNG, and WebP pictures into clean, multi-page PDF files.'
      },
      {
        title: 'Multi-Page Layout Controls',
        description: 'Select between standard A4, US Letter, or match exact image aspect ratios with customizable margins.'
      },
      {
        title: 'Instant In-Browser Compression',
        description: 'Control image quality and resolution to keep PDF file sizes small enough for email attachments and web upload limits.'
      },
      {
        title: 'Per-Page Rotation',
        description: 'Rotate individual pages 90°, 180°, or 270° clockwise with real-time thumbnail previews.'
      }
    ],
    faqs: [
      {
        question: 'How do I convert images into a single multi-page PDF?',
        answer: 'Upload all your images at once, reorder them as needed, select your page size (such as A4), and click "Convert & Download PDF". All images will be merged into a single multi-page PDF file.'
      },
      {
        question: 'How does image compression work in the converter?',
        answer: 'Under "Layout & Compression Settings", choose the Recommended preset (75% quality, 1920px max resolution) or High compression (60% quality, 1280px max resolution). Your browser compresses the images before generating the PDF.'
      },
      {
        question: 'Will my images be uploaded to any server?',
        answer: 'No. All image processing and PDF compilation take place 100% in your local browser memory. No data is sent over the internet.'
      },
      {
        question: 'Can I reorder images before creating the PDF?',
        answer: 'Yes. Use the up and down arrow buttons on each image card in the workspace to arrange the pages in any order.'
      }
    ]
  },

  'image-compressor': {
    id: 'image-compressor',
    category: 'office',
    primaryPath: '/compress-image',
    alternatePaths: ['/image-compressor'],
    pageTitle: 'Image Compressor Online – Compress JPG, PNG & WebP Free – InstanceUtil',
    metaDescription: 'Compress images directly in your browser with custom quality and resolution controls. Shrink file sizes up to 90% while keeping high visual clarity.',
    heading: 'Image Compressor Online',
    subheading: 'Reduce image file size directly in your browser with custom quality targets and resolution downscaling.',
    howToTitle: 'How to Compress Images Locally in Your Browser',
    infographicImage: {
      src: '/assets/aistudio/JPG_vs_PNG_vs_WebP_Comparison_20d3eb0f.png',
      alt: 'JPG vs PNG vs WebP: Which Image Format Is Best? – InstanceUtil Infographic',
      caption: 'Visual format comparison: JPG for photography, PNG for transparent graphics & logos, and WebP for optimal modern web performance.'
    },
    steps: [
      {
        title: '1. Select Your Image',
        description: 'Upload any JPG, PNG, or WebP photo or graphic by dragging it into the dropzone or browsing from your computer or phone.'
      },
      {
        title: '2. Adjust Quality & Scale',
        description: 'Use the quality slider (5% to 100%) or pick a preset (Recommended, High, Low) and choose an optional maximum width limit.'
      },
      {
        title: '3. Preview Live Size Savings',
        description: 'Review the before and after file size comparison and percentage reduction calculated instantly in real time.'
      },
      {
        title: '4. Download Optimized Image',
        description: 'Click "Download Compressed Image" to save the lightweight, web-optimized image file to your device.'
      }
    ],
    features: [
      {
        title: 'Up to 90% Size Reduction',
        description: 'Smart browser canvas re-encoding strips metadata and optimizes compression tables for drastic file size savings.'
      },
      {
        title: 'Real-Time Live Size Calculation',
        description: 'See the exact resulting byte size and percentage saved immediately as you adjust the quality slider.'
      },
      {
        title: 'Custom Dimension Downscaling',
        description: 'Optional max width limits (e.g., 1280px or 1920px) to prevent massive camera sensor images from taking up space.'
      },
      {
        title: 'Complete Device Privacy',
        description: 'Your personal photos and graphic assets are compressed strictly in your local device RAM with zero cloud uploads.'
      }
    ],
    faqs: [
      {
        question: 'How does client-side image compression work?',
        answer: 'The tool draws your image onto an HTML5 off-screen canvas element and re-encodes it into an optimized JPEG/WebP buffer at your chosen quality factor, without sending anything across a network.'
      },
      {
        question: 'What image formats can I compress?',
        answer: 'You can upload JPG, JPEG, PNG, and WebP files. Output compression is generated in universally compatible optimized format.'
      },
      {
        question: 'Will compression noticeably degrade photo quality?',
        answer: 'At the Recommended setting (75% quality), visual differences are virtually indistinguishable to the human eye, while file size is typically reduced by 60% to 80%.'
      },
      {
        question: 'Is there a limit on image file size?',
        answer: 'Because processing happens directly on your device hardware, you can compress high-resolution photos without arbitrary server upload limits.'
      }
    ]
  },

  'word-counter': {
    id: 'word-counter',
    category: 'office',
    primaryPath: '/word-counter',
    pageTitle: 'Word Counter & Text Utilities – Character Count & Reading Time – InstanceUtil',
    metaDescription: 'Free online word counter, character counter, sentence counter, paragraph counter, and reading time estimator with case conversion tools.',
    heading: 'Word Counter & Text Utilities',
    subheading: 'Real-time text analytics, word and character counters, reading time estimators, and one-click text case transformations.',
    howToTitle: 'How to Analyze and Transform Your Text',
    steps: [
      {
        title: '1. Paste or Type Text',
        description: 'Enter or paste your article, essay, social media caption, or manuscript into the text editor.'
      },
      {
        title: '2. Review Live Statistics',
        description: 'Instantly view words, characters (with and without spaces), sentences, paragraphs, and estimated reading and speaking times.'
      },
      {
        title: '3. Transform Text Casing',
        description: 'Use the text formatting buttons to convert to UPPERCASE, lowercase, Title Case, Sentence case, or clean extra whitespace.'
      },
      {
        title: '4. Copy Clean Text',
        description: 'Click "Copy Text" to instantly copy the transformed content back to your clipboard with one click.'
      }
    ],
    features: [
      {
        title: 'Real-Time Live Counter',
        description: 'Metrics update instantaneously with every keystroke with zero lag or delay.'
      },
      {
        title: 'Reading & Speaking Time Estimates',
        description: 'Calculates reading duration (based on 200 WPM) and speaking presentation duration (130 WPM).'
      },
      {
        title: 'One-Click Case Converters',
        description: 'Instantly convert text to UPPERCASE, lowercase, Title Case, Sentence case, or remove duplicate spaces.'
      },
      {
        title: 'Confidential & Secure',
        description: 'Your notes and draft manuscripts remain strictly in local browser memory and are never saved or indexed.'
      }
    ],
    faqs: [
      {
        question: 'How is reading time calculated?',
        answer: 'Reading time is calculated based on the scientific standard average adult reading speed of 200 words per minute (WPM). Speaking time is based on 130 WPM.'
      },
      {
        question: 'Does the character counter include spaces?',
        answer: 'Yes. The statistics dashboard displays both "Characters (With Spaces)" and "Characters (No Spaces)" simultaneously for character-limited platforms like X/Twitter, LinkedIn, or academic submissions.'
      },
      {
        question: 'Is my written text uploaded or saved on a server?',
        answer: 'Never. The word counter is 100% client-side. Your text is evaluated in JavaScript and never leaves your browser window.'
      },
      {
        question: 'Can I convert text into Title Case or Sentence case?',
        answer: 'Yes. Simply click the "Title Case" or "Sentence case" utility buttons below the editor to format headlines and paragraphs automatically.'
      }
    ]
  }
};

/**
 * Resolves active tool from current browser pathname
 */
export function getToolFromPath(pathname: string): ActiveTool {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  
  if (cleanPath === '/merge-pdf') return 'merge-pdf';
  if (cleanPath === '/compress-image' || cleanPath === '/image-compressor') return 'image-compressor';
  if (cleanPath === '/word-counter') return 'word-counter';
  if (cleanPath === '/image-to-pdf' || cleanPath === '/') return 'image-to-pdf';

  return 'image-to-pdf';
}

/**
 * Resolves canonical path from tool ID
 */
export function getPathForTool(tool: ActiveTool): string {
  return TOOL_SEO_PAGES[tool].primaryPath;
}

/**
 * Updates head meta tags, OpenGraph, Twitter cards, and Schema.org JSON-LD
 */
export function applyToolSeo(tool: ActiveTool) {
  const data = TOOL_SEO_PAGES[tool];
  if (!data) return;

  // 1. Update Title
  document.title = data.pageTitle;

  // 2. Helper to set or create meta tag
  const setMeta = (attribute: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${attribute}="${attrVal}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Helper to set or create link tag
  const setLink = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  const canonicalUrl = `${window.location.origin}${data.primaryPath}`;

  // Standard Meta
  setMeta('name', 'description', data.metaDescription);
  setLink('canonical', canonicalUrl);

  // OpenGraph Tags
  setMeta('property', 'og:title', data.pageTitle);
  setMeta('property', 'og:description', data.metaDescription);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', 'InstanceUtil');

  // Twitter Tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', data.pageTitle);
  setMeta('name', 'twitter:description', data.metaDescription);

  // Schema.org WebApplication JSON-LD
  const schemaId = 'instanceutil-seo-schema';
  let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = schemaId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: data.heading,
    url: canonicalUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    description: data.metaDescription,
    browserRequirements: 'Requires JavaScript. Runs on Chrome, Safari, Firefox, Edge.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    featureList: data.features.map((f) => f.title)
  };

  scriptEl.textContent = JSON.stringify(structuredData, null, 2);
}

/**
 * Updates head meta tags for the Guides homepage (/guides/)
 */
export function applyGuidesHomeSeo() {
  const title = 'Guides & Tutorials: PDF, Image & Text Tips | InstanceUtil';
  const desc = 'Practical guides for compressing PDFs, converting images, and working with text using InstanceUtil. Free, fast, and 100% client-side.';
  const canonicalUrl = `${window.location.origin}/guides/`;

  document.title = title;
  const setMeta = (attribute: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${attribute}="${attrVal}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  setMeta('name', 'description', desc);
  setLink('canonical', canonicalUrl);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', 'InstanceUtil');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);

  const schemaId = 'instanceutil-seo-schema';
  let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = schemaId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'InstanceUtil Guides & Tutorials',
    description: desc,
    url: canonicalUrl
  }, null, 2);
}

/**
 * Updates head meta tags for an individual article (/guides/[slug]/)
 */
export function applyGuideArticleSeo(article: { title: string; description: string; slug: string }) {
  const title = `${article.title} | InstanceUtil`;
  const desc = article.description;
  const canonicalUrl = `${window.location.origin}/guides/${article.slug}/`;

  document.title = title;
  const setMeta = (attribute: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${attribute}="${attrVal}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  setMeta('name', 'description', desc);
  setLink('canonical', canonicalUrl);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', 'article');
  setMeta('property', 'og:site_name', 'InstanceUtil');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);

  const schemaId = 'instanceutil-seo-schema';
  let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = schemaId;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: desc,
    url: canonicalUrl,
    datePublished: '2026-10-20',
    dateModified: '2026-10-20',
    publisher: {
      '@type': 'Organization',
      name: 'InstanceUtil',
      url: window.location.origin
    }
  }, null, 2);
}

