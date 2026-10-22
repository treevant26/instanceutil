import { infographics } from './assets/infographics';

export interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  categorySlug: 'pdf' | 'image' | 'text';
  date: string;
  updated: string;
  readTime: string;
  featuredImage?: {
    src: string;
    alt: string;
    caption?: string;
  };
  relatedTool: {
    label: string;
    href: string;
    toolId: 'merge-pdf' | 'image-to-pdf' | 'image-compressor' | 'word-counter';
  };
  tableOfContents: { id: string; label: string }[];
  contentSections: {
    id: string;
    title: string;
    body: string[];
    tips?: string[];
    highlight?: {
      title: string;
      text: string;
    };
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const GUIDES_LIST: GuideArticle[] = [
  {
    slug: 'how-to-compress-pdf',
    title: 'How to Compress a PDF Without Losing Quality',
    description: 'Learn how to reduce PDF file size and keep your documents readable with practical client-side compression presets.',
    category: 'PDF Guides',
    categorySlug: 'pdf',
    date: 'October 20, 2026',
    updated: 'October 20, 2026',
    readTime: '5 min read',
    featuredImage: {
      src: infographics.howToCompressPdf,
      alt: 'How to Compress a PDF Without Losing Quality - InstanceUtil Guide',
      caption: 'Visual workflow: reduce bloated PDF sizes (e.g. from 12.4 MB to 2.1 MB) without losing visual sharpness or font legibility.'
    },
    relatedTool: {
      label: 'Merge & Compress PDF',
      href: '/merge-pdf',
      toolId: 'merge-pdf'
    },
    tableOfContents: [
      { id: 'why-pdfs-are-large', label: '1. Why PDF Files Become Large' },
      { id: 'lossless-vs-lossy', label: '2. Lossless vs Lossy Compression' },
      { id: 'step-by-step', label: '3. Step-by-Step Compression Guide' },
      { id: 'best-settings', label: '4. Best Settings for Email & Upload Limits' },
      { id: 'privacy-security', label: '5. Client-Side Privacy Advantage' },
      { id: 'faq', label: '6. Frequently Asked Questions' }
    ],
    contentSections: [
      {
        id: 'why-pdfs-are-large',
        title: '1. Why PDF Files Become Unnecessarily Large',
        body: [
          'Large PDF files are a frequent source of frustration when trying to email attachments, submit job applications, or upload legal documentation to government portals with strict file size caps (such as 2MB or 5MB).',
          'In almost 90% of cases, oversized PDFs are not bloated by text or vector line work, but by high-resolution embedded images and scanner bitmaps. Standard desktop scanners and smartphones frequently capture images at 300 to 600 DPI in uncompressed raster format, resulting in a single document taking up 20MB to 50MB of space.',
          'Additionally, documents that have been re-saved through multiple applications accumulate redundant metadata, obsolete embedded font subsets, and uncompressed stream dictionaries.'
        ],
        highlight: {
          title: 'The Real Culprit Behind Bloated PDFs',
          text: 'Text and vector lines consume mere kilobytes. High-resolution scanned photo layers and uncompressed color channels account for over 90% of a PDF\'s byte size.'
        }
      },
      {
        id: 'lossless-vs-lossy',
        title: '2. Lossless vs Lossy Compression: What\'s the Difference?',
        body: [
          'Understanding the difference between compression types allows you to pick the right preset for your specific document needs:',
          '• Lossless Vector Compression: Preserves 100% of the original vector curves, text glyphs, and font streams without re-encoding bitmap layers. Best for architectural blueprints, signed contracts with vector typography, and official documents where file size is already moderate.',
          '• Smart Lossy Compression: Optimizes raster image layers by downscaling excessive DPI (e.g. from 600 DPI down to 150–200 DPI suitable for screens and standard printing) and re-encoding JPEG image streams. For human eyes, text and graphics appear equally sharp, but the total file size drops by 50% to 80%.'
        ]
      },
      {
        id: 'step-by-step',
        title: '3. Step-by-Step: How to Compress a PDF on InstanceUtil',
        body: [
          'InstanceUtil features an integrated, client-side PDF compression engine directly inside the Merge PDF tool. Follow these simple steps:',
          'Step 1: Open the Merge & Compress PDF tool at /merge-pdf and upload your PDF files.',
          'Step 2: On the right-side "Merged File Settings" panel, locate the "PDF File Compression" section.',
          'Step 3: Select your preferred compression preset: choose "Balanced ★" for everyday documents, or "Smallest" if you must satisfy a strict email limit.',
          'Step 4: If you want complete manual control, toggle the quality slider (from 20% to 95%) or select maximum resolution downscaling (such as 1920px Full HD).',
          'Step 5: Click "Merge & Download". The compression executes in your local device RAM and the lightweight PDF is downloaded instantly.'
        ],
        tips: [
          'Tip: For multi-page PDFs, reorder any pages first before hitting merge to produce a single organized document.',
          'Tip: If your PDF is password-protected, remove the restriction first so the compression engine can parse its streams.'
        ]
      },
      {
        id: 'best-settings',
        title: '4. Best Settings for Email & Web Upload Limits',
        body: [
          'Different platforms require different compression balances:',
          '• Email Attachments (Gmail/Outlook 25MB limit): Use the "Balanced ★" preset. It keeps high-definition 1920px resolution while keeping files comfortably under 5MB.',
          '• Job Applications & Government Portals (Strict 2MB limit): Select the "Smallest" preset (60% quality, max 1280px). This provides aggressive reduction while preserving legible text and numbers.',
          '• Printing & High-Resolution Archiving: Choose the "Original" preset (lossless vector merge) or custom 90% quality with original resolution.'
        ]
      },
      {
        id: 'privacy-security',
        title: '5. Client-Side Privacy: Why In-Browser Compression is Safer',
        body: [
          'Most online PDF converters require you to upload your confidential files to their remote cloud servers. This exposes sensitive financial statements, tax records, medical documents, and contracts to potential third-party logging or data breaches.',
          'InstanceUtil is built on a 100% client-side privacy architecture. All PDF rendering, rasterization, and compression run inside your browser memory using WebAssembly and HTML5 canvas. Your files never touch an external server, and all memory is wiped clean the second you close the tab.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Will compressing my PDF make the text blurry?',
        answer: 'No. The compression algorithm specifically targets raster image layers and downscales oversized photo resolutions. Fonts and vector typography remain crisp and readable.'
      },
      {
        question: 'How do I compress multiple PDFs into one small file?',
        answer: 'Upload all your PDF documents to the /merge-pdf tool, arrange them in your preferred sequence, select the "Balanced ★" or "Smallest" preset, and click Merge & Download.'
      },
      {
        question: 'Are there file size or page count limitations?',
        answer: 'Because InstanceUtil operates using your device hardware without remote server bandwidth bottlenecks, there are no artificial file size caps or conversion quotas.'
      }
    ]
  },

  {
    slug: 'jpg-vs-png-vs-webp',
    title: 'JPG vs PNG vs WebP: Which Image Format Is Best?',
    description: 'Comprehensive comparison of JPG, PNG, and WebP formats. Learn which format provides the smallest file size, transparency support, and crispest quality.',
    category: 'Image Guides',
    categorySlug: 'image',
    date: 'October 20, 2026',
    updated: 'October 20, 2026',
    readTime: '6 min read',
    featuredImage: {
      src: infographics.jpgVsPngVsWebp,
      alt: 'JPG vs PNG vs WebP: Which Image Format Is Best? - Visual Comparison Infographic',
      caption: 'Visual comparison: JPG (smaller file size, great for photos), PNG (lossless quality, transparency support), and WebP (smaller file size, high quality, modern web standard).'
    },
    relatedTool: {
      label: 'Image Compressor & Converter',
      href: '/compress-image',
      toolId: 'image-compressor'
    },
    tableOfContents: [
      { id: 'overview', label: '1. Format Overview & Comparison Table' },
      { id: 'when-to-use-jpg', label: '2. When to Use JPEG / JPG' },
      { id: 'when-to-use-png', label: '3. When to Use PNG' },
      { id: 'when-to-use-webp', label: '4. Why WebP is the Modern Champion' },
      { id: 'how-to-optimize', label: '5. How to Compress & Convert on InstanceUtil' },
      { id: 'faq', label: '6. Frequently Asked Questions' }
    ],
    contentSections: [
      {
        id: 'overview',
        title: '1. Format Overview & Quick Comparison Table',
        body: [
          'Choosing the right image format is critical for website performance, email loading speed, and visual appeal. The wrong format can make an image 5 to 10 times larger than necessary, or introduce unsightly artifacts on text and logos.',
          'Here is a quick side-by-side comparison of the three dominant image formats used across the internet today:'
        ],
        highlight: {
          title: 'Quick Format Rule of Thumb',
          text: '• Use JPG for real-world photos without transparency. • Use PNG for graphics, screenshots, and transparent cutouts. • Use WebP as the superior all-round modern web replacement.'
        }
      },
      {
        id: 'when-to-use-jpg',
        title: '2. When to Use JPEG / JPG (Joint Photographic Experts Group)',
        body: [
          'JPEG is the most universally compatible image format in computing history. It uses lossy compression by discarding subtle color variations that human eyes rarely perceive.',
          '• Best Use Cases: Photographs, scenic landscapes, complex color gradients, and social media uploads.',
          '• Key Advantages: 100% universal support across all devices, operating systems, printers, and email clients. Excellent compression ratio on photography.',
          '• Limitations: Does NOT support transparency (alpha channels). Text, sharp line art, and geometric logos often display fuzzy compression artifacts around sharp edges.'
        ]
      },
      {
        id: 'when-to-use-png',
        title: '3. When to Use PNG (Portable Network Graphics)',
        body: [
          'PNG was created to replace GIF with superior lossless compression and full 8-bit / 24-bit alpha transparency.',
          '• Best Use Cases: Logos with transparent backgrounds, website UI icons, illustrations, charts, and software screenshots.',
          '• Key Advantages: Pixel-perfect fidelity with zero loss of detail. Full transparent backgrounds allow graphics to blend over any backdrop.',
          '• Limitations: File sizes can be massive for photographs (often 4x to 8x larger than an equivalent JPG). Not recommended for full-width website hero photography.'
        ]
      },
      {
        id: 'when-to-use-webp',
        title: '4. Why WebP is the Modern Champion for Websites',
        body: [
          'Developed by Google and now supported by 98%+ of global web browsers, WebP was engineered specifically to solve the limitations of JPG and PNG.',
          '• File Size Savings: WebP images are typically 25% to 35% smaller than comparable JPEGs at identical visual fidelity, and up to 26% smaller than PNGs.',
          '• Transparency & Compression Combined: Unlike JPEG, WebP supports full alpha transparency even in lossy mode! You can have a transparent logo that weighs only 15KB instead of 120KB.',
          '• SEO & Core Web Vitals: Google ranks websites with faster loading speeds higher. Switching your website assets to WebP directly boosts your PageSpeed Insights scores.'
        ]
      },
      {
        id: 'how-to-optimize',
        title: '5. How to Compress & Convert Images on InstanceUtil',
        body: [
          'You can optimize all your images without installing desktop software using InstanceUtil:',
          '1. To shrink existing image files: Open /compress-image, upload your JPG, PNG, or WebP, and use the interactive quality slider. Watch the real-time byte counter display your percentage saved.',
          '2. To combine images into a document: Open /image-to-pdf, drop multiple pictures in any format, choose your paper margins, and download an organized, compressed PDF.',
          '3. All operations run 100% in your local browser memory, ensuring complete privacy.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Is WebP supported by all modern browsers?',
        answer: 'Yes. All modern versions of Chrome, Safari (macOS and iOS), Firefox, Edge, and Android browsers fully support WebP images.'
      },
      {
        question: 'Should I convert my PNG logos to WebP?',
        answer: 'Yes. WebP preserves the clean alpha transparency of your PNG logo while slashing file size by up to 60-80%, speeding up your page load times.'
      },
      {
        question: 'Can I convert compressed images back to PDF?',
        answer: 'Yes. You can use the /image-to-pdf tool on InstanceUtil to combine your compressed JPG, PNG, or WebP images into a single document at any time.'
      }
    ]
  },

  {
    slug: 'convert-images-to-pdf',
    title: 'How to Convert Multiple Images into One PDF',
    description: 'Step-by-step tutorial on converting multiple JPG, PNG, and WebP pictures into a clean, organized multi-page PDF document.',
    category: 'PDF Guides',
    categorySlug: 'pdf',
    date: 'October 20, 2026',
    updated: 'October 20, 2026',
    readTime: '4 min read',
    featuredImage: {
      src: infographics.convertImagesToPdf,
      alt: 'How to Convert Multiple Images into One PDF - Visual Infographic',
      caption: 'Visual workflow: combine JPG, PNG, JPEG, and WebP pictures into an organized, high-quality multi-page PDF document.'
    },
    relatedTool: {
      label: 'Image to PDF Converter',
      href: '/image-to-pdf',
      toolId: 'image-to-pdf'
    },
    tableOfContents: [
      { id: 'why-convert', label: '1. Why Combine Images into PDF?' },
      { id: 'step-guide', label: '2. Step-by-Step Conversion Workflow' },
      { id: 'layout-settings', label: '3. Choosing Page Sizes & Margins' },
      { id: 'faq', label: '4. Frequently Asked Questions' }
    ],
    contentSections: [
      {
        id: 'why-convert',
        title: '1. Why Combine Images into a Single PDF Document?',
        body: [
          'Sharing dozens of individual JPG or PNG receipt files, scans, or lecture slides is inconvenient for both senders and recipients. Individual image files easily get separated or viewed out of order.',
          'Converting images into a single multi-page PDF solves this by grouping all pages into a universally recognized document format that opens cleanly on every smartphone, tablet, and computer.'
        ]
      },
      {
        id: 'step-guide',
        title: '2. Step-by-Step Conversion Workflow on InstanceUtil',
        body: [
          '1. Navigate to /image-to-pdf.',
          '2. Drag and drop your images into the dropzone (JPG, PNG, or WebP are all supported).',
          '3. Arrange pages in order using the Move Up and Move Down arrow buttons.',
          '4. Click the rotate button on individual cards if any photo was taken sideways.',
          '5. Select your page format (A4, US Letter, or Fit to Image).',
          '6. Click "Convert & Download PDF". The PDF is generated in milliseconds in browser memory.'
        ]
      },
      {
        id: 'layout-settings',
        title: '3. Choosing the Right Page Sizes & Margins',
        body: [
          '• A4 (210 x 297mm): The global standard for business letters, resumes, and international documents.',
          '• US Letter (8.5 x 11 inches): Standard for North American office printing.',
          '• Fit to Image: Preserves the exact aspect ratio of each original picture with zero white borders.',
          '• Margins: Choose "Compact" for maximum image size, or "Standard" for a clean framed printed look.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Can I mix JPG and PNG files together?',
        answer: 'Yes! You can upload a mixture of JPG, PNG, and WebP files simultaneously into the converter.'
      },
      {
        question: 'Are my images uploaded to the cloud?',
        answer: 'No. The conversion executes entirely in your browser using JavaScript and client-side canvas rendering.'
      }
    ]
  },

  {
    slug: 'word-count-vs-character-count',
    title: 'Word Count vs Character Count: What\'s the Difference?',
    description: 'Understand how word counts, character counts (with and without spaces), and reading times are calculated for essays, tweets, and articles.',
    category: 'Text Guides',
    categorySlug: 'text',
    date: 'October 20, 2026',
    updated: 'October 20, 2026',
    readTime: '4 min read',
    relatedTool: {
      label: 'Word Counter & Text Utilities',
      href: '/word-counter',
      toolId: 'word-counter'
    },
    tableOfContents: [
      { id: 'definitions', label: '1. Words vs Characters Explained' },
      { id: 'platform-limits', label: '2. Character Limits Across Popular Platforms' },
      { id: 'reading-speed', label: '3. How Reading & Speaking Times are Calculated' },
      { id: 'faq', label: '4. Frequently Asked Questions' }
    ],
    contentSections: [
      {
        id: 'definitions',
        title: '1. Words vs Characters Explained',
        body: [
          'While word count measures the number of distinct words separated by spaces or punctuation, character count measures every individual symbol, letter, number, and punctuation mark.',
          '• Characters With Spaces: Counts every character plus every space bar press. Crucial for SMS and social media platforms.',
          '• Characters Without Spaces: Counts only letters, numbers, and symbols. Often required for academic translation, publishing royalties, and essay assignments.'
        ]
      },
      {
        id: 'platform-limits',
        title: '2. Standard Character Limits Across Platforms',
        body: [
          '• X / Twitter: 280 characters for standard accounts.',
          '• Instagram Captions: 2,200 characters (with best engagement under 150 characters).',
          '• LinkedIn Post: 3,000 characters.',
          '• Google Search Title Tag: ~60 characters (580 pixels).',
          '• Google Search Meta Description: ~155–160 characters.'
        ]
      },
      {
        id: 'reading-speed',
        title: '3. How Reading and Speaking Time Are Calculated',
        body: [
          '• Average Reading Speed: 200 words per minute (WPM). This is the standard reading pace for silent adult comprehension.',
          '• Average Speaking Speed: 130 words per minute (WPM). Ideal for pacing keynote speeches, YouTube scripts, and podcast recordings.',
          'InstanceUtil calculates these metrics live in real-time as you type or paste your manuscript at /word-counter.'
        ]
      }
    ],
    faqs: [
      {
        question: 'How do I count words without copying into Word?',
        answer: 'Open /word-counter on InstanceUtil, paste your text, and all statistics (words, characters, sentences, paragraphs, and reading times) update instantly.'
      },
      {
        question: 'Does the tool store my confidential writing?',
        answer: 'No. The word counter runs strictly in browser memory. Nothing is ever sent to a server.'
      }
    ]
  }
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  const clean = slug.toLowerCase().replace(/^\/+|\/+$/g, '');
  return GUIDES_LIST.find((g) => g.slug === clean);
}
