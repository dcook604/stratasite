import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ChevronLeft, ChevronRight, Download, AlertCircle, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isMobile, isIOS, isAndroid } from '@/utils/pdfConfig';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Bylaws: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [useIframe, setUseIframe] = useState<boolean>(false);

  useEffect(() => {
    console.log('Bylaws component mounted');
    console.log('PDF.js version:', pdfjs.version);
    console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);

    const url = `${window.location.origin}/documents/bylaws_2025.pdf`;
    console.log('PDF URL:', url);
    setPdfUrl(url);

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
        setLoading(false);
        if (useIframe && numPages === 0) {
          setNumPages(33);
        }
      })
      .catch(err => {
        console.error('PDF fetch error:', err);
        setError('Unable to access PDF file');
        setLoading(false);
      });

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

  useEffect(() => {
    if (useIframe && numPages === 0) {
      console.log('Setting default page count for iframe mode');
      setNumPages(33);
    }
  }, [useIframe, numPages]);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;

      if (isMobile()) {
        if (width < 375) {
          setScale(0.5);
        } else if (width < 480) {
          setScale(0.6);
        } else if (width < 768) {
          setScale(0.7);
        } else {
          setScale(0.8);
        }
      } else {
        if (width < 1200) {
          setScale(0.9);
        } else {
          setScale(1.0);
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

    console.log('Switching to iframe fallback mode');
    setUseIframe(true);
    setLoading(false);
    setError(null);

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

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <section className="bg-surface-subtle py-12 md:py-16">
          <div className="max-w-container-max mx-auto px-gutter">
            <h1 className="text-headline-lg text-on-surface mb-2">Strata Bylaws</h1>
            <p className="text-body-lg text-on-surface-variant">Spectrum 4 consolidated bylaws and building rules.</p>
          </div>
        </section>

        <div className="form-page-container">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <div className="w-10 h-10 border-4 border-outline-variant border-t-secondary rounded-full animate-spin"></div>
              <p className="text-sm text-on-surface-variant">
                {isMobile() ? (
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Loading PDF for mobile device...
                  </span>
                ) : (
                  'Loading PDF...'
                )}
              </p>
              {isMobile() && (
                <div className="text-sm text-on-surface-variant text-center max-w-md space-y-1">
                  <p>Mobile devices may take longer to load PDFs.</p>
                  <p>Please be patient while we optimize the viewing experience.</p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert className="max-w-2xl mx-auto border border-spectrum-red/20">
              <AlertCircle className="h-4 w-4 text-spectrum-red" />
              <AlertDescription className="space-y-4">
                <div className="text-on-surface">{error}</div>
                {isMobile() && (
                  <div className="space-y-2">
                    <p className="text-label-md text-on-surface">Mobile troubleshooting tips:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside ml-4 text-on-surface-variant">
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
                  <Button onClick={downloadPDF} variant="outline" size="sm" className="border-outline-variant">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* PDF Viewer */}
          {!loading && !error && (
            <div>
              {isMobile() && (
                <Alert className="mb-6 border border-spectrum-blue/20 bg-surface-brand">
                  <Smartphone className="h-4 w-4 text-spectrum-blue" />
                  <AlertDescription className="text-on-surface-variant">
                    <strong className="text-on-surface">Mobile View:</strong> PDF is optimized for mobile viewing.
                    Use pinch-to-zoom for better readability. You can also download the PDF for offline viewing.
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-card-padding">
                {/* PDF Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 lg:gap-0">
                  {/* Navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={goToPrevPage}
                      disabled={pageNumber <= 1}
                      variant="outline"
                      size="sm"
                      className="border-outline-variant"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {!isMobile() && <span className="ml-1">Previous</span>}
                    </Button>
                    <span className="text-body-md text-on-surface-variant px-3 whitespace-nowrap">
                      Page {pageNumber} of {numPages}
                    </span>
                    <Button
                      onClick={goToNextPage}
                      disabled={pageNumber >= numPages}
                      variant="outline"
                      size="sm"
                      className="border-outline-variant"
                    >
                      {!isMobile() && <span className="mr-1">Next</span>}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Zoom Controls (Desktop only) */}
                  <div className="flex items-center gap-2">
                    {!isMobile() && (
                      <>
                        <Button onClick={zoomOut} variant="outline" size="sm" className="border-outline-variant">
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-body-md text-on-surface-variant px-2 min-w-16 text-center">
                          {Math.round(scale * 100)}%
                        </span>
                        <Button onClick={zoomIn} variant="outline" size="sm" className="border-outline-variant">
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    <div className="w-px h-6 bg-outline-variant mx-1"></div>

                    <Button onClick={downloadPDF} variant="outline" size="sm" className="border-outline-variant">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>

                    <Button
                      onClick={() => setUseIframe(!useIframe)}
                      variant="outline"
                      size="sm"
                      className="border-outline-variant"
                      title={useIframe ? "Switch to advanced viewer" : "Switch to simple viewer"}
                    >
                      {useIframe ? "Advanced View" : "Simple View"}
                    </Button>
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex justify-center">
                  <div className="border border-outline-variant rounded-xl overflow-hidden">
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
                          key={pageNumber}
                        />
                        <div className="py-3 text-center text-body-md text-on-surface-variant bg-surface-subtle border-t border-outline-variant">
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
                            <div className="flex items-center justify-center min-h-[400px] bg-surface-subtle rounded">
                              <div className="text-center space-y-2">
                                <div className="w-8 h-8 border-4 border-outline-variant border-t-secondary rounded-full animate-spin mx-auto"></div>
                                <p className="text-on-surface-variant text-sm">Loading page...</p>
                              </div>
                            </div>
                          }
                          error={
                            <div className="flex items-center justify-center min-h-[400px] bg-error-container rounded">
                              <div className="text-center text-on-error-container">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Failed to load PDF</p>
                              </div>
                            </div>
                          }
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={!isMobile()}
                            renderAnnotationLayer={!isMobile()}
                            loading={
                              <div
                                className="flex items-center justify-center bg-surface-subtle rounded"
                                style={{
                                  width: isMobile() ? `${Math.min(window.innerWidth - 80, 600)}px` : '800px',
                                  height: isMobile() ? `${Math.min(window.innerHeight - 300, 800)}px` : '1000px'
                                }}
                              >
                                <div className="text-center space-y-2">
                                  <div className="w-6 h-6 border-4 border-outline-variant border-t-secondary rounded-full animate-spin mx-auto"></div>
                                  <p className="text-on-surface-variant text-sm text-sm">Rendering page...</p>
                                </div>
                              </div>
                            }
                            error={
                              <div
                                className="flex items-center justify-center bg-error-container rounded"
                                style={{
                                  width: isMobile() ? `${Math.min(window.innerWidth - 80, 600)}px` : '800px',
                                  height: isMobile() ? `${Math.min(window.innerHeight - 300, 800)}px` : '1000px'
                                }}
                              >
                                <div className="text-center text-on-error-container">
                                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-sm text-sm">Failed to render page</p>
                                </div>
                              </div>
                            }
                          />
                        </Document>
                      ) : (
                        <div className="flex items-center justify-center min-h-[400px] bg-surface-subtle rounded">
                          <div className="text-center space-y-2">
                            <div className="w-8 h-8 border-4 border-outline-variant border-t-secondary rounded-full animate-spin mx-auto"></div>
                            <p className="text-on-surface-variant text-sm">Initializing PDF viewer...</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Mobile Bottom Navigation */}
                {isMobile() && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        variant="outline"
                        size="sm"
                        className="border-outline-variant"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-body-md text-on-surface-variant px-3">
                        {pageNumber} / {numPages}
                      </span>
                      <Button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        variant="outline"
                        size="sm"
                        className="border-outline-variant"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mobile Zoom Instructions */}
                {isMobile() && (
                  <div className="mt-4 text-center">
                    <p className="text-body-md text-on-surface-variant">
                      Use pinch-to-zoom gesture to adjust the view on mobile devices
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Bylaws;
