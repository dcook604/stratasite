import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, AlertCircle, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadPDFDocumentWithFallback, isMobile, isIOS, isAndroid, configurePDFJS } from '@/utils/pdfConfig';

// Configure PDF.js for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const Bylaws: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    // Initialize PDF.js configuration for mobile devices
    const initializePDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const mobile = isMobile();
        const ios = isIOS();
        const android = isAndroid();
        
        console.log('Initializing PDF viewer...', {
          mobile,
          ios,
          android,
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth,
          devicePixelRatio: window.devicePixelRatio
        });
        
        // Configure PDF.js with our mobile-optimized settings
        configurePDFJS();
        
        // Test PDF loading to ensure it works with our configuration
        const pdfUrl = '/documents/bylaws_2025.pdf';
        try {
          await loadPDFDocumentWithFallback(pdfUrl);
          console.log('PDF pre-loading successful');
        } catch (preloadError) {
          console.warn('PDF pre-loading failed, but continuing with react-pdf:', preloadError);
          // Don't fail here - let react-pdf try its own loading
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('PDF initialization failed:', error);
        
        if (error instanceof Error) {
          if (isMobile()) {
            if (isIOS()) {
              setError(`iOS PDF loading failed: ${error.message}`);
            } else if (isAndroid()) {
              setError(`Android PDF loading failed: ${error.message}`);
            } else {
              setError(`Mobile PDF loading failed: ${error.message}`);
            }
          } else {
            setError(`PDF loading failed: ${error.message}`);
          }
        } else {
          setError('An unexpected error occurred while loading the PDF.');
        }
        setLoading(false);
      }
    };

    initializePDF();
  }, []);

  // Adjust scale based on device type and screen size
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      const pixelRatio = window.devicePixelRatio || 1;
      
      if (isMobile()) {
        if (width < 375) {
          setScale(0.5); // Very small mobile screens (iPhone SE)
        } else if (width < 480) {
          setScale(0.6); // Small mobile screens
        } else if (width < 768) {
          setScale(0.7); // Larger mobile screens
        } else {
          setScale(0.8); // Tablets
        }
      } else {
        if (width < 1200) {
          setScale(0.9); // Small desktop screens
        } else {
          setScale(1.0); // Large desktop screens
        }
      }
      
      console.log('Scale updated:', { width, pixelRatio, mobile: isMobile(), scale });
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF document load error:', error);
    
    // Mobile-specific error messages
    if (isMobile()) {
      if (isIOS()) {
        setError('Failed to load PDF on iOS device. Try refreshing the page or using Safari browser.');
      } else if (isAndroid()) {
        setError('Failed to load PDF on Android device. Try refreshing the page or using Chrome browser.');
      } else {
        setError('Failed to load PDF on mobile device. Please try refreshing the page.');
      }
    } else {
      setError('Failed to load the bylaws PDF. Please try again later.');
    }
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.3));
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = '/documents/bylaws_2025.pdf';
    link.download = 'Spectrum_4_Bylaws_2025.pdf';
    link.click();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <PageHeader 
            title="Bylaws" 
            description="Spectrum 4 Strata Bylaws"
          />
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-center">
              {isMobile() ? (
                <>
                  <Smartphone className="inline w-4 h-4 mr-2" />
                  Loading PDF for mobile device...
                </>
              ) : (
                'Loading PDF...'
              )}
            </p>
            {isMobile() && (
              <div className="text-sm text-gray-500 text-center max-w-md space-y-1">
                <p>Mobile devices may take longer to load PDFs.</p>
                <p>Please be patient while we optimize the viewing experience.</p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <PageHeader 
            title="Bylaws" 
            description="Spectrum 4 Strata Bylaws"
          />
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <div>{error}</div>
              {isMobile() && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Mobile troubleshooting tips:</p>
                  <ul className="text-xs space-y-1 list-disc list-inside ml-4">
                    <li>Try refreshing the page</li>
                    <li>Ensure you have a stable internet connection</li>
                    {isIOS() && <li>Use Safari browser for best compatibility</li>}
                    {isAndroid() && <li>Use Chrome browser for best compatibility</li>}
                    <li>Clear your browser cache and cookies</li>
                    <li>Try downloading the PDF directly using the button below</li>
                  </ul>
                </div>
              )}
              <div className="pt-2">
                <Button onClick={downloadPDF} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Bylaws" 
          description="Spectrum 4 Strata Bylaws"
        />
        
        {isMobile() && (
          <Alert className="mb-6">
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <strong>Mobile View:</strong> PDF is optimized for mobile viewing. 
              Use pinch-to-zoom for better readability. You can also download the PDF for offline viewing.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* PDF Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 space-y-4 lg:space-y-0">
            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
                {!isMobile() && "Previous"}
              </Button>
              <span className="text-sm font-medium px-2 whitespace-nowrap">
                Page {pageNumber} of {numPages}
              </span>
              <Button 
                onClick={goToNextPage} 
                disabled={pageNumber >= numPages}
                variant="outline"
                size="sm"
              >
                {!isMobile() && "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Zoom Controls (Desktop only) */}
            {!isMobile() && (
              <div className="flex items-center space-x-2">
                <Button onClick={zoomOut} variant="outline" size="sm">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm px-2 min-w-16 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button onClick={zoomIn} variant="outline" size="sm">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Download Button */}
            <Button onClick={downloadPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* PDF Viewer */}
          <div className="flex justify-center">
            <div className="border border-gray-200 shadow-sm rounded">
              <Document
                file="/documents/bylaws_2025.pdf"
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-96 bg-gray-50 rounded">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600">Loading page...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96 bg-red-50 rounded">
                    <div className="text-center text-red-600">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>Failed to load PDF</p>
                    </div>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={!isMobile()} // Disable text layer on mobile for better performance
                  renderAnnotationLayer={!isMobile()} // Disable annotation layer on mobile for better performance
                  loading={
                    <div 
                      className="flex items-center justify-center bg-gray-50 rounded" 
                      style={{ 
                        width: isMobile() ? `${Math.min(window.innerWidth - 80, 600)}px` : '800px', 
                        height: isMobile() ? `${Math.min(window.innerHeight - 300, 800)}px` : '1000px' 
                      }}
                    >
                      <div className="text-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 text-sm">Rendering page...</p>
                      </div>
                    </div>
                  }
                  error={
                    <div 
                      className="flex items-center justify-center bg-red-50 rounded" 
                      style={{ 
                        width: isMobile() ? `${Math.min(window.innerWidth - 80, 600)}px` : '800px', 
                        height: isMobile() ? `${Math.min(window.innerHeight - 300, 800)}px` : '1000px' 
                      }}
                    >
                      <div className="text-center text-red-600">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm">Failed to render page</p>
                      </div>
                    </div>
                  }
                />
              </Document>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          {isMobile() && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={goToPrevPage} 
                  disabled={pageNumber <= 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm font-medium px-3">
                  {pageNumber} / {numPages}
                </span>
                <Button 
                  onClick={goToNextPage} 
                  disabled={pageNumber >= numPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Mobile Zoom Instructions */}
          {isMobile() && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                📱 Use pinch-to-zoom gesture to zoom in/out on mobile devices
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Bylaws;
