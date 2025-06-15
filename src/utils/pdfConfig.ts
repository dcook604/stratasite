import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with fallback options
export const configurePDFJS = () => {
  // Try local worker first, then fall back to CDN
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (error) {
    console.warn('Local PDF worker not available, trying CDN fallback');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
};

export { pdfjsLib }; 