
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, File } from 'lucide-react';

const Bylaws = () => {
  // Mock data for bylaws categories and documents
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'pets', name: 'Pets & Animals' },
    { id: 'noise', name: 'Noise & Nuisance' },
    { id: 'common-areas', name: 'Common Areas' },
    { id: 'parking', name: 'Parking' }
  ];

  const bylaws = [
    { 
      id: 1, 
      title: 'General Bylaws & Rules', 
      description: 'Complete strata bylaws and rules document.',
      category: 'general',
      dateUpdated: '2024-03-15',
      fileType: 'pdf'
    },
    { 
      id: 2, 
      title: 'Pet Policy', 
      description: 'Guidelines for pet owners in the building.',
      category: 'pets',
      dateUpdated: '2024-02-10',
      fileType: 'pdf'
    },
    { 
      id: 3, 
      title: 'Noise Restrictions', 
      description: 'Hours and guidelines for noise limitations.',
      category: 'noise',
      dateUpdated: '2023-11-22',
      fileType: 'pdf'
    },
    { 
      id: 4, 
      title: 'Common Area Usage', 
      description: 'Rules for using shared spaces in the building.',
      category: 'common-areas',
      dateUpdated: '2024-01-05',
      fileType: 'pdf'
    },
    { 
      id: 5, 
      title: 'Parking Regulations', 
      description: 'Visitor and resident parking policies.',
      category: 'parking',
      dateUpdated: '2023-12-18',
      fileType: 'pdf'
    },
    { 
      id: 6, 
      title: 'Bylaw Enforcement', 
      description: 'Process for bylaw violation complaints and fines.',
      category: 'general',
      dateUpdated: '2023-10-30',
      fileType: 'pdf'
    }
  ];

  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');

  const filteredBylaws = bylaws.filter(bylaw => {
    const matchesSearch = bylaw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bylaw.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || bylaw.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader 
          title="Building Bylaws" 
          description="Access and search all strata bylaws, rules, and regulations."
        />
        <div className="strata-section">
          <div className="mb-8 max-w-md mx-auto">
            <Input
              placeholder="Search bylaws..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-8 flex flex-wrap justify-center">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {filteredBylaws.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBylaws.map(bylaw => (
                    <Card key={bylaw.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start">
                          <div className="p-3 bg-primary/10 rounded-lg mr-4">
                            <File className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{bylaw.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {bylaw.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-2">
                              <span>Updated: {new Date(bylaw.dateUpdated).toLocaleDateString()}</span>
                              <span className="mx-2">•</span>
                              <span className="uppercase">{bylaw.fileType}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Book className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-lg">No bylaws found</h3>
                  <p className="text-gray-600 mt-1">
                    Try adjusting your search or category filter
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Bylaws;
