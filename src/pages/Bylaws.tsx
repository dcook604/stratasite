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
import { Book, Search, FileText, ChevronRight, Home, Users, Car, Shield, Trash2, Building, Gavel } from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';

interface BylawSection {
  id: string;
  title: string;
  content: string;
  subsections: BylawSubsection[];
  part: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<BylawSection | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Parse XML content and extract bylaw sections
  const parseXMLContent = (xmlContent: string) => {
    const parser = new XMLParser({
      ignoreAttributes: false,
      textNodeName: '#text',
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: false,
      arrayMode: false
    });

    try {
      const result = parser.parse(xmlContent);
      const sections: BylawSection[] = [];
      
      // Extract text content from the parsed XML
      const extractTextContent = (node: any): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return node.toString();
        if (node && typeof node === 'object') {
          if (node['#text']) return node['#text'];
          if (Array.isArray(node)) {
            return node.map(extractTextContent).join(' ');
          }
          return Object.values(node).map(extractTextContent).join(' ');
        }
        return '';
      };

      // Parse the office:body content
      const body = result['office:document-content']?.['office:body']?.['office:text'];
      if (body && body['text:p']) {
        const paragraphs = Array.isArray(body['text:p']) ? body['text:p'] : [body['text:p']];
        
        let currentSection: BylawSection | null = null;
        let currentSubsection: BylawSubsection | null = null;
        
        paragraphs.forEach((p: any, index: number) => {
          const text = extractTextContent(p).trim();
          
          if (!text) return;
          
          // Detect section headers (PART X)
          if (text.match(/^PART\s+\d+/i)) {
            if (currentSection) {
              sections.push(currentSection);
            }
            
            const partMatch = text.match(/^PART\s+(\d+)\s*-\s*(.+)/i);
            if (partMatch) {
              currentSection = {
                id: `part-${partMatch[1]}`,
                title: partMatch[2].trim(),
                content: '',
                subsections: [],
                part: `Part ${partMatch[1]}`,
                icon: getIconForSection(partMatch[2])
              };
              currentSubsection = null;
            }
          }
          // Detect section headers (Section X)
          else if (text.match(/^Section\s+\d+/i)) {
            const sectionMatch = text.match(/^Section\s+(\d+)\s*-\s*(.+)/i);
            if (sectionMatch && currentSection) {
              if (currentSubsection) {
                currentSection.subsections.push(currentSubsection);
              }
              
              currentSubsection = {
                id: `section-${sectionMatch[1]}`,
                title: sectionMatch[2].trim(),
                content: '',
                items: []
              };
            }
          }
          // Regular content
          else if (text.length > 10) {
            if (currentSubsection) {
              if (text.match(/^\d+\.\d+/)) {
                currentSubsection.items.push(text);
              } else {
                currentSubsection.content += (currentSubsection.content ? ' ' : '') + text;
              }
            } else if (currentSection) {
              currentSection.content += (currentSection.content ? ' ' : '') + text;
            }
          }
        });
        
        // Add the last section
        if (currentSection) {
          if (currentSubsection) {
            currentSection.subsections.push(currentSubsection);
          }
          sections.push(currentSection);
        }
      }
      
      return sections;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return [];
    }
  };

  const getIconForSection = (title: string): React.ReactNode => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('owner') || lowerTitle.includes('tenant') || lowerTitle.includes('duties')) {
      return <Users className="h-5 w-5" />;
    } else if (lowerTitle.includes('parking')) {
      return <Car className="h-5 w-5" />;
    } else if (lowerTitle.includes('council')) {
      return <Gavel className="h-5 w-5" />;
    } else if (lowerTitle.includes('security')) {
      return <Shield className="h-5 w-5" />;
    } else if (lowerTitle.includes('garbage') || lowerTitle.includes('recycling')) {
      return <Trash2 className="h-5 w-5" />;
    } else if (lowerTitle.includes('appearance') || lowerTitle.includes('strata lot')) {
      return <Building className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    const fetchBylaws = async () => {
      try {
        const response = await fetch('/bylaws.xml');
        const xmlContent = await response.text();
        const parsedSections = parseXMLContent(xmlContent);
        setBylaws(parsedSections);
      } catch (error) {
        console.error('Error fetching bylaws:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBylaws();
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
    { id: 'duties', name: 'Duties & Responsibilities', icon: <Users className="h-4 w-4" /> },
    { id: 'council', name: 'Council', icon: <Gavel className="h-4 w-4" /> },
    { id: 'enforcement', name: 'Enforcement', icon: <Shield className="h-4 w-4" /> },
    { id: 'meetings', name: 'Meetings', icon: <Building className="h-4 w-4" /> },
    { id: 'other', name: 'Other', icon: <FileText className="h-4 w-4" /> }
  ];

  const getCategoryBylaws = (categoryId: string) => {
    switch (categoryId) {
      case 'duties':
        return filteredBylaws.filter(b => b.title.toLowerCase().includes('duties') || b.title.toLowerCase().includes('owner') || b.title.toLowerCase().includes('tenant'));
      case 'council':
        return filteredBylaws.filter(b => b.title.toLowerCase().includes('council'));
      case 'enforcement':
        return filteredBylaws.filter(b => b.title.toLowerCase().includes('enforcement') || b.title.toLowerCase().includes('bylaw'));
      case 'meetings':
        return filteredBylaws.filter(b => b.title.toLowerCase().includes('meeting'));
      case 'other':
        return filteredBylaws.filter(b => 
          !b.title.toLowerCase().includes('duties') && 
          !b.title.toLowerCase().includes('council') && 
          !b.title.toLowerCase().includes('enforcement') && 
          !b.title.toLowerCase().includes('meeting')
        );
      default:
        return filteredBylaws;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <PageHeader
          title="Building Bylaws"
          description="Interactive access to all strata bylaws, rules, and regulations."
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Building Bylaws"
        description="Interactive access to all strata bylaws, rules, and regulations for Spectrum IV (BCS2611)."
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bylaws, sections, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              {activeTab === 'overview' ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        Strata Plan BCS2611 - "Spectrum IV"
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Located at 602 Citadel Parade, Vancouver, BC. These bylaws govern the operation and management of our strata corporation.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bylaws.map(bylaw => (
                          <Card key={bylaw.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  {bylaw.icon}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm mb-1">{bylaw.title}</h3>
                                  <Badge variant="outline" className="text-xs">{bylaw.part}</Badge>
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {bylaw.content.substring(0, 100)}...
                                  </p>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-primary">
                                        View Details <ChevronRight className="h-3 w-3 ml-1" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh]">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          {bylaw.icon}
                                          {bylaw.part}: {bylaw.title}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <ScrollArea className="h-[60vh] pr-4">
                                        <div className="space-y-4">
                                          {bylaw.content && (
                                            <div>
                                              <h4 className="font-medium mb-2">Overview</h4>
                                              <p className="text-gray-700 text-sm leading-relaxed">{bylaw.content}</p>
                                            </div>
                                          )}
                                          {bylaw.subsections.length > 0 && (
                                            <Accordion type="single" collapsible className="w-full">
                                              {bylaw.subsections.map(subsection => (
                                                <AccordionItem key={subsection.id} value={subsection.id}>
                                                  <AccordionTrigger className="text-left">
                                                    {subsection.title}
                                                  </AccordionTrigger>
                                                  <AccordionContent>
                                                    {subsection.content && (
                                                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                                        {subsection.content}
                                                      </p>
                                                    )}
                                                    {subsection.items.length > 0 && (
                                                      <ul className="space-y-2">
                                                        {subsection.items.map((item, idx) => (
                                                          <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-gray-200">
                                                            {item}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    )}
                                                  </AccordionContent>
                                                </AccordionItem>
                                              ))}
                                            </Accordion>
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {getCategoryBylaws(category.id).map(bylaw => (
                    <Card key={bylaw.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {bylaw.icon}
                          {bylaw.title}
                        </CardTitle>
                        <Badge variant="outline">{bylaw.part}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {bylaw.content.substring(0, 200)}...
                        </p>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Sections ({bylaw.subsections.length})</h4>
                          <div className="space-y-1">
                            {bylaw.subsections.slice(0, 3).map(subsection => (
                              <div key={subsection.id} className="text-xs text-gray-600 flex items-center gap-2">
                                <ChevronRight className="h-3 w-3" />
                                {subsection.title}
                              </div>
                            ))}
                            {bylaw.subsections.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{bylaw.subsections.length - 3} more sections
                              </div>
                            )}
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full mt-4">
                              View Full Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {bylaw.icon}
                                {bylaw.part}: {bylaw.title}
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[60vh] pr-4">
                              <div className="space-y-4">
                                {bylaw.content && (
                                  <div>
                                    <h4 className="font-medium mb-2">Overview</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">{bylaw.content}</p>
                                  </div>
                                )}
                                {bylaw.subsections.length > 0 && (
                                  <Accordion type="single" collapsible className="w-full">
                                    {bylaw.subsections.map(subsection => (
                                      <AccordionItem key={subsection.id} value={subsection.id}>
                                        <AccordionTrigger className="text-left">
                                          {subsection.title}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                          {subsection.content && (
                                            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                              {subsection.content}
                                            </p>
                                          )}
                                          {subsection.items.length > 0 && (
                                            <ul className="space-y-2">
                                              {subsection.items.map((item, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-gray-200">
                                                  {item}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                  {getCategoryBylaws(category.id).length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Book className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-lg">No bylaws found</h3>
                      <p className="text-gray-600 mt-1">
                        {searchTerm ? 'Try adjusting your search terms' : 'No bylaws in this category'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Bylaws;
