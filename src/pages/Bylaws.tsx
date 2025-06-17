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
import { isMobile, isIOS, isAndroid } from '@/utils/pdfConfig';

// Configure PDF.js worker using CDN for reliability
// This ensures the worker loads correctly in all environments
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Bylaws: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [useIframe, setUseIframe] = useState<boolean>(false);

  // Debug logging and URL setup
  useEffect(() => {
    console.log('Bylaws component mounted');
    console.log('PDF.js version:', pdfjs.version);
    console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
    
    // Set PDF URL
    const url = `${window.location.origin}/documents/bylaws_2025.pdf`;
    console.log('PDF URL:', url);
    setPdfUrl(url);
    
    // Test if PDF is accessible
    fetch(url)
      .then(response => {
        console.log('PDF fetch response:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`PDF fetch failed: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        console.log('PDF blob size:', blob.size, 'bytes');
        setLoading(false); // PDF is accessible, stop loading
        
        // If using iframe mode, we need to set a default number of pages
        // since we can't get it programmatically from iframe
        if (useIframe && numPages === 0) {
          setNumPages(33); // Default based on known PDF
        }
      })
      .catch(err => {
        console.error('PDF fetch error:', err);
        setError('Unable to access PDF file');
        setLoading(false);
      });
      
    // Auto-switch to iframe after 5 seconds if still loading
    const timeoutId = setTimeout(() => {
      if (loading && !error && !useIframe) {
        console.log('PDF loading timeout - switching to iframe mode');
        setUseIframe(true);
        setLoading(false);
        if (numPages === 0) {
          setNumPages(33);
        }
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle page count when switching to iframe mode
  useEffect(() => {
    if (useIframe && numPages === 0) {
      console.log('Setting default page count for iframe mode');
      setNumPages(33); // Known page count for this PDF
    }
  }, [useIframe, numPages]);

  // This useEffect is now only for responsive scaling, not for initialization
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      
      if (isMobile()) {
        if (width < 375) {
          setScale(0.5); // Very small mobile screens
        } else if (width < 480) {
          setScale(0.6); // Small mobile screens
        } else if (width < 768) {
          setScale(0.7); // Larger mobile screens (portrait tablets)
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
      console.log('Scale updated:', { width, mobile: isMobile(), scale });
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
    console.log('onDocumentLoadSuccess called with numPages:', numPages);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('onDocumentLoadError called:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Auto-switch to iframe mode on error
    console.log('Switching to iframe fallback mode');
    setUseIframe(true);
    setLoading(false);
    setError(null); // Clear error since we're switching to iframe
    
    // Set default page count for iframe if we don't have it
    if (numPages === 0) {
      setNumPages(33);
    }
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
            <div className="flex items-center space-x-2">
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              {/* Toggle View Mode Button */}
              <Button 
                onClick={() => setUseIframe(!useIframe)} 
                variant="outline" 
                size="sm"
                title={useIframe ? "Switch to advanced viewer" : "Switch to simple viewer"}
              >
                {useIframe ? "Advanced View" : "Simple View"}
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex justify-center">
            <div className="border border-gray-200 shadow-sm rounded">
              {/* Render either PDF or iframe fallback */}
              {useIframe ? (
                <div className="w-full">
                  <iframe
                    src={`${pdfUrl}#page=${pageNumber}`}
                    className="w-full rounded"
                    style={{ 
                      height: isMobile() ? '500px' : '800px',
                      border: 'none'
                    }}
                    title="Bylaws PDF Viewer"
                    allowFullScreen
                    key={pageNumber} // Force re-render when page changes
                  />
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Using simple PDF viewer. Use your browser's zoom controls to adjust size.
                  </div>
                </div>
              ) : (
                pdfUrl ? (
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    onSourceError={(error) => {
                      console.error('onSourceError called:', error);
                      onDocumentLoadError(error as Error);
                    }}
                    options={{
                      cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                      cMapPacked: true,
                      withCredentials: false,
                    }}
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
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-50 rounded">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600">Initializing PDF viewer...</p>
                    </div>
                  </div>
                )
              )}
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
