import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Search, FileText, ChevronRight, Home, Users, Car, Shield, Trash2, Building, Gavel, Download, AlertCircle } from 'lucide-react';
import { configurePDFJS, pdfjsLib } from '@/utils/pdfConfig';

interface BylawSection {
  id: string;
  title: string;
  content: string;
  subsections: BylawSubsection[];
  part: string;
  partNumber: number;
  icon: React.ReactNode;
}

interface BylawSubsection {
  id: string;
  title: string;
  content: string;
  items: string[];
}

const Bylaws = () => {
  const [bylaws, setBylaws] = useState<BylawSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<BylawSection | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [pdfText, setPdfText] = useState<string>('');

  const getIconForSection = (title: string): React.ReactNode => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('interpretation') || lowerTitle.includes('effect')) {
      return <FileText className="h-5 w-5" />;
    } else if (lowerTitle.includes('owner') || lowerTitle.includes('tenant') || lowerTitle.includes('duties')) {
      return <Users className="h-5 w-5" />;
    } else if (lowerTitle.includes('powers') || lowerTitle.includes('strata corporation')) {
      return <Building className="h-5 w-5" />;
    } else if (lowerTitle.includes('council')) {
      return <Gavel className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };

  const extractTextFromPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Configure PDF.js
      configurePDFJS();

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument('/documents/bylaws_2025.pdf');
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from all pages, preserving line breaks
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let lastY = -1;
        let pageText = '';
        
        // Sort items by vertical position to ensure correct order
        const items = [...textContent.items].sort((a: any, b: any) => {
          const aY = a.transform[5];
          const bY = b.transform[5];
          const aX = a.transform[4];
          const bX = b.transform[4];
          
          if (aY > bY) return -1; // Higher y => higher on page
          if (aY < bY) return 1;
          if (aX < bX) return -1; // Lower x => earlier on line
          if (aX > bX) return 1;
          return 0;
        });

        for (const item of items) {
            const y = item.transform[5];

            // Add a newline if the Y position has changed significantly
            if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                pageText += '\n';
            }
            
            pageText += item.str + ' ';
            lastY = y;
        }

        fullText += pageText + '\n\n'; // Add space between pages
      }
      
      setPdfText(fullText);
      
      // Parse the text into structured sections
      const parsedSections = parseTextIntoSections(fullText);
      setBylaws(parsedSections);
      
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load the bylaws PDF. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const parseTextIntoSections = (text: string): BylawSection[] => {
    const sections: BylawSection[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    let currentSection: BylawSection | null = null;
    let currentSubsection: BylawSubsection | null = null;
    let currentContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Detect PART headers (e.g., "PART 1 - INTERPRETATION AND EFFECT")
      const partMatch = line.match(/^PART\s+(\d+)\s*-\s*(.+)$/i);
      if (partMatch) {
        // Save previous section
        if (currentSection) {
          if (currentSubsection) {
            currentSection.subsections.push(currentSubsection);
          }
          if (currentContent.trim()) {
            currentSection.content = currentContent.trim();
          }
          sections.push(currentSection);
        }
        
        // Create new section
        const partNumber = parseInt(partMatch[1]);
        const partTitle = partMatch[2].trim();
        
        currentSection = {
          id: `part-${partNumber}`,
          title: partTitle,
          content: '',
          subsections: [],
          part: `Part ${partNumber}`,
          partNumber: partNumber,
          icon: getIconForSection(partTitle)
        };
        currentSubsection = null;
        currentContent = '';
        continue;
      }
      
      // Detect Section headers (e.g., "Section 1 - Force and Effect")
      const sectionMatch = line.match(/^Section\s+(\d+)\s*-\s*(.+)$/i);
      if (sectionMatch && currentSection) {
        // Save previous subsection
        if (currentSubsection) {
          if (currentContent.trim()) {
            currentSubsection.content = currentContent.trim();
          }
          currentSection.subsections.push(currentSubsection);
        }
        
        // Create new subsection
        const sectionNumber = parseInt(sectionMatch[1]);
        const sectionTitle = sectionMatch[2].trim();
        
        currentSubsection = {
          id: `section-${sectionNumber}`,
          title: sectionTitle,
          content: '',
          items: []
        };
        currentContent = '';
        continue;
      }
      
      // Regular content
      if (currentSubsection || currentSection) {
        // Check if it's a numbered item (e.g., "1.1", "2.3", etc.)
        if (line.match(/^\d+\.\d+/) && currentSubsection) {
          currentSubsection.items.push(line);
        } else {
          currentContent += (currentContent ? ' ' : '') + line;
        }
      }
    }
    
    // Save the last section
    if (currentSection) {
      if (currentSubsection) {
        if (currentContent.trim()) {
          currentSubsection.content = currentContent.trim();
        }
        currentSection.subsections.push(currentSubsection);
      } else if (currentContent.trim()) {
        currentSection.content = currentContent.trim();
      }
      sections.push(currentSection);
    }
    
    return sections;
  };

  useEffect(() => {
    extractTextFromPDF();
  }, []);

  const filteredBylaws = bylaws.filter(bylaw => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bylaw.title.toLowerCase().includes(searchLower) ||
      bylaw.content.toLowerCase().includes(searchLower) ||
      bylaw.subsections.some(sub => 
        sub.title.toLowerCase().includes(searchLower) ||
        sub.content.toLowerCase().includes(searchLower) ||
        sub.items.some(item => item.toLowerCase().includes(searchLower))
      )
    );
  });

  const categories = [
    { id: 'overview', name: 'Overview', icon: <Home className="h-4 w-4" /> },
    { id: 'interpretation', name: 'Interpretation & Effect', icon: <FileText className="h-4 w-4" /> },
    { id: 'duties', name: 'Duties & Responsibilities', icon: <Users className="h-4 w-4" /> },
    { id: 'powers', name: 'Powers & Corporation', icon: <Building className="h-4 w-4" /> },
    { id: 'council', name: 'Council', icon: <Gavel className="h-4 w-4" /> }
  ];

  const getCategoryBylaws = (categoryId: string) => {
    switch (categoryId) {
      case 'interpretation':
        return filteredBylaws.filter(b => b.partNumber === 1);
      case 'duties':
        return filteredBylaws.filter(b => b.partNumber === 2);
      case 'powers':
        return filteredBylaws.filter(b => b.partNumber === 3);
      case 'council':
        return filteredBylaws.filter(b => b.partNumber === 4);
      default:
        return filteredBylaws;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <PageHeader title="Strata Bylaws" description="Official bylaws governing Spectrum 4 Strata Corporation" />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bylaws...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <PageHeader title="Strata Bylaws" description="Official bylaws governing Spectrum 4 Strata Corporation" />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Bylaws</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader title="Strata Bylaws" description="Official bylaws governing Spectrum 4 Strata Corporation" />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Header with Search and Download */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bylaws..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button asChild variant="outline">
            <a href="/documents/bylaws_2025.pdf" target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              {category.id === 'overview' ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        About These Bylaws
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">
                        These are the official bylaws for Spectrum 4 Strata Corporation, updated for 2025. 
                        The bylaws are organized into parts covering different aspects of strata governance and operations.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Total Parts</h3>
                          <p className="text-2xl font-bold text-primary">{bylaws.length}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Total Sections</h3>
                          <p className="text-2xl font-bold text-primary">
                            {bylaws.reduce((sum, part) => sum + part.subsections.length, 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bylaws.map((bylaw) => (
                      <Card key={bylaw.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            {bylaw.icon}
                            <div>
                              <div className="text-sm text-gray-500">{bylaw.part}</div>
                              <div className="text-lg">{bylaw.title}</div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm mb-3">
                            {bylaw.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">
                              {bylaw.subsections.length} sections
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSection(bylaw)}>
                              View Details <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getCategoryBylaws(category.id).length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No bylaws found for this category.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    getCategoryBylaws(category.id).map((bylaw) => (
                      <Card key={bylaw.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {bylaw.icon}
                              <div>
                                <div className="text-sm text-gray-500">{bylaw.part}</div>
                                <div>{bylaw.title}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSection(bylaw)}>
                              View Full <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {bylaw.content && (
                            <p className="text-gray-700 mb-4">{bylaw.content}</p>
                          )}
                          {bylaw.subsections.length > 0 && (
                            <Accordion type="single" collapsible className="w-full">
                              {bylaw.subsections.map((subsection) => (
                                <AccordionItem key={subsection.id} value={subsection.id}>
                                  <AccordionTrigger className="text-left">
                                    {subsection.title}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    {subsection.content && (
                                      <p className="text-gray-700 mb-3">{subsection.content}</p>
                                    )}
                                    {subsection.items.length > 0 && (
                                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                        {subsection.items.map((item, index) => (
                                          <li key={index}>{item}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Section Detail Dialog */}
        <Dialog open={!!selectedSection} onOpenChange={() => setSelectedSection(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedSection?.icon}
                <div>
                  <div className="text-sm text-gray-500">{selectedSection?.part}</div>
                  <div>{selectedSection?.title}</div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {selectedSection?.content && (
                  <p className="text-gray-700">{selectedSection.content}</p>
                )}
                {selectedSection?.subsections.map((subsection) => (
                  <div key={subsection.id} className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">{subsection.title}</h3>
                    {subsection.content && (
                      <p className="text-gray-700 mb-2">{subsection.content}</p>
                    )}
                    {subsection.items.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {subsection.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
};

export default Bylaws;
