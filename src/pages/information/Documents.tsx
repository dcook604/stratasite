import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, FileIcon, ArrowRight, Search, History } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: `Downloaded ${doc.title}`
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return 'bg-spectrum-red/10 text-spectrum-red';
      case 'doc':
      case 'docx':
        return 'bg-spectrum-blue/10 text-spectrum-blue';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="page-content">
          <div className="bg-surface-subtle py-12 md:py-16">
            <div className="max-w-container-max mx-auto px-gutter">
              <h1 className="text-headline-lg text-on-surface">Documents</h1>
              <p className="mt-3 text-body-lg text-on-surface-variant">Download important building documents, forms, and resources.</p>
            </div>
          </div>
          <div className="form-page-container text-center">
            <p className="text-on-surface-variant text-sm">Loading documents...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <section className="bg-surface-subtle py-12 md:py-16">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-headline-lg text-on-surface mb-2">Document Library</h1>
                <p className="text-body-lg text-on-surface-variant">Access official strata documents, forms, and resources.</p>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg border border-outline-variant">
                <History className="h-4 w-4 text-spectrum-blue" />
                <span className="text-label-md text-on-surface-variant">
                  {documents.length > 0
                    ? `Last updated: ${new Date(Math.max(...documents.map(d => new Date(d.createdAt).getTime()))).toLocaleDateString()}`
                    : 'No documents yet'}
                </span>
              </div>
            </div>

            {/* Search */}
            {documents.length > 0 && (
              <div className="mt-8 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-spectrum-blue focus:outline-none text-sm"
                />
              </div>
            )}
          </div>
        </section>

        {/* Document Grid */}
        <section className="py-section-gap">
          <div className="max-w-container-max mx-auto px-gutter">
            {filteredDocuments.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding text-center max-w-lg mx-auto">
                <FileText className="h-16 w-16 mx-auto text-on-surface-variant opacity-40 mb-4" />
                <h3 className="text-title-lg text-on-surface mb-2">
                  {searchQuery ? 'No matching documents' : 'No Documents Available'}
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'There are no documents uploaded yet. Check back later.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-6 text-secondary text-xs font-semibold hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding hover:shadow-md transition-all group flex flex-col">
                    {/* File type icon + badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${getFileTypeColor(doc.fileType)}`}>
                        {getFileIcon(doc.fileType)}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${getFileTypeColor(doc.fileType)}`}>
                        {doc.fileType}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-title-lg text-on-surface mb-2">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">{doc.description}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-body-md text-on-surface-variant mb-6 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">database</span>
                        {formatFileSize(doc.fileSize)}
                      </div>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="w-full bg-primary-container text-on-primary py-3 rounded-xl text-xs font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Documents;
