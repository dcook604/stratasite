import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with comprehensive fallback options
export const configurePDFJS = () => {
  try {
    // Primary: Try local worker file
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    console.log('PDF.js configured with local worker');
  } catch (error) {
    console.warn('Local PDF worker not available, trying alternative approaches');
    
    try {
      // Fallback 1: Try the non-minified version
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
      console.log('PDF.js configured with local unminified worker');
    } catch (fallbackError) {
      console.warn('Local unminified worker failed, using CDN fallback');
      
      // Fallback 2: CDN worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      console.log(`PDF.js configured with CDN worker (version ${pdfjsLib.version})`);
    }
  }
  
  // Validate worker configuration
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    console.error('Failed to configure PDF.js worker');
    throw new Error('PDF.js worker configuration failed');
  }
  
  console.log('PDF.js worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
};

export { pdfjsLib }; 