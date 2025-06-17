import * as pdfjsLib from 'pdfjs-dist';

// Mobile browser detection utilities
const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

const isIOSSafari = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
  return isIOS && isSafari;
};

// Configure PDF.js worker with comprehensive fallback options for mobile
export const configurePDFJS = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('PDF.js being configured in non-browser environment');
      return;
    }

    // Get the current origin for absolute URLs
    const origin = window.location.origin;
    const mobile = isMobile();
    const ios = isIOS();
    const android = isAndroid();
    
    console.log('Configuring PDF.js...', {
      origin,
      pdfjsVersion: pdfjsLib.version,
      userAgent: navigator.userAgent,
      mobile,
      ios,
      android
    });

    // Mobile browsers often have issues with ES modules and workers
    // Use different strategies based on device type
    if (ios) {
      // iOS Safari has strict worker restrictions
      console.log('iOS detected - using iOS-optimized worker configuration');
      
      // Try CDN first for iOS as local workers often fail
      const iosWorkerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = iosWorkerUrl;
      console.log('PDF.js configured with CDN worker for iOS:', iosWorkerUrl);
      
    } else if (android) {
      // Android Chrome usually handles local workers better
      console.log('Android detected - using Android-optimized worker configuration');
      
      const androidWorkerUrl = `${origin}/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = androidWorkerUrl;
      console.log('PDF.js configured with local worker for Android:', androidWorkerUrl);
      
    } else if (mobile) {
      // Other mobile browsers - use CDN for safety
      console.log('Mobile device detected - using mobile-optimized worker configuration');
      
      const mobileWorkerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = mobileWorkerUrl;
      console.log('PDF.js configured with CDN worker for mobile:', mobileWorkerUrl);
      
    } else {
      // Desktop browsers - use local worker
      const desktopWorkerUrl = `${origin}/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = desktopWorkerUrl;
      console.log('PDF.js configured with local worker for desktop:', desktopWorkerUrl);
    }
    
  } catch (error) {
    console.error('Failed to configure PDF.js worker:', error);
    
    // Emergency fallback to CDN for all devices
    try {
      const emergencyWorkerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = emergencyWorkerUrl;
      console.log('PDF.js configured with emergency CDN worker:', emergencyWorkerUrl);
    } catch (emergencyError) {
      console.error('All PDF.js worker configuration attempts failed:', emergencyError);
      throw new Error('PDF.js worker configuration failed completely');
    }
  }
  
  // Additional PDF.js configuration for mobile compatibility
  try {
    // Configure for mobile environment
    if (typeof window !== 'undefined') {
      // Prevent PDF.js from creating multiple workers on mobile
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
    }
    
    console.log('PDF.js mobile configuration applied');
  } catch (configError) {
    console.warn('PDF.js mobile configuration failed:', configError);
  }
  
  // Validate final configuration
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    console.error('PDF.js worker source is not set after configuration');
    throw new Error('PDF.js worker configuration validation failed');
  }
  
  console.log('PDF.js worker configuration completed:', pdfjsLib.GlobalWorkerOptions.workerSrc);
};

// Enhanced PDF loading function with mobile-specific error handling
export const loadPDFDocument = async (url: string, options: any = {}) => {
  try {
    console.log('Loading PDF document:', url, 'Mobile:', isMobile());
    
    // Ensure PDF.js is configured
    configurePDFJS();
    
    // Mobile-optimized loading options
    const baseOptions = {
      url,
      // Mobile browsers often have stricter CORS policies
      httpHeaders: {
        'Cache-Control': 'no-cache',
      },
      // Longer timeout for mobile connections
      timeout: isMobile() ? 60000 : 30000,
      // Disable eval for mobile security
      isEvalSupported: !isMobile(),
      // Reduce memory usage on mobile
      maxImageSize: isMobile() ? 1024 * 1024 * 10 : 1024 * 1024 * 50, // 10MB on mobile, 50MB on desktop
      ...options
    };
    
    // iOS-specific optimizations
    if (isIOS()) {
      baseOptions.verbosity = 0; // Reduce logging on iOS
      baseOptions.cMapPacked = true; // Use packed CMaps for better performance
    }
    
    const loadingTask = pdfjsLib.getDocument(baseOptions);
    
    // Add progress tracking with mobile-friendly logging
    loadingTask.onProgress = (progress: any) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        if (percent % 20 === 0) { // Log every 20% on mobile to reduce noise
          console.log(`PDF loading progress: ${percent}% (${Math.round(progress.loaded/1024)}KB/${Math.round(progress.total/1024)}KB)`);
        }
      }
    };
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    return pdf;
  } catch (error) {
    console.error('PDF loading failed:', error);
    
    // Mobile-specific error handling
    if (error instanceof Error) {
      if (error.message.includes('AbortError') || error.message.includes('timeout')) {
        throw new Error(isMobile() ? 
          'PDF loading timed out. Please check your mobile data connection and try again.' :
          'PDF loading timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('InvalidPDFException')) {
        throw new Error('The PDF file appears to be corrupted or invalid.');
      } else if (error.message.includes('MissingPDFException')) {
        throw new Error('The PDF file could not be found. Please contact support.');
      } else if (error.message.includes('UnexpectedResponseException')) {
        throw new Error('Server error while loading PDF. Please try again later.');
      } else if (error.message.includes('worker')) {
        if (isMobile()) {
          throw new Error('PDF worker failed to load on mobile device. Please refresh the page and try again. If the problem persists, try using a different browser.');
        } else {
          throw new Error('PDF worker failed to load. Please refresh the page and try again.');
        }
      } else if (isIOS() && error.message.includes('SecurityError')) {
        throw new Error('iOS security restrictions prevented PDF loading. Please try refreshing the page or using Safari.');
      } else if (isAndroid() && error.message.includes('NetworkError')) {
        throw new Error('Network error on Android device. Please check your connection and try again.');
      }
    }
    
    // Re-throw with original error for debugging
    throw error;
  }
};

// Mobile-specific fallback loading with multiple worker strategies
export const loadPDFDocumentWithFallback = async (url: string, options: any = {}) => {
  const strategies = [];
  
  if (isIOS()) {
    // iOS strategies in order of preference
    strategies.push(
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        return loadPDFDocument(url, options);
      },
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.mjs`;
        return loadPDFDocument(url, options);
      }
    );
  } else if (isAndroid()) {
    // Android strategies
    strategies.push(
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
        return loadPDFDocument(url, options);
      },
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        return loadPDFDocument(url, options);
      }
    );
  } else {
    // Desktop strategies
    strategies.push(
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
        return loadPDFDocument(url, options);
      },
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        return loadPDFDocument(url, options);
      }
    );
  }
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Attempting PDF loading strategy ${i + 1}/${strategies.length}`);
      return await strategies[i]();
    } catch (error) {
      console.warn(`PDF loading strategy ${i + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Wait a bit before trying next strategy on mobile
      if (isMobile() && i < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // If all strategies failed, throw the last error
  throw lastError || new Error('All PDF loading strategies failed');
};

export { pdfjsLib, isMobile, isIOS, isAndroid, isIOSSafari }; 