import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import UpcomingEvents from '@/components/widgets/UpcomingEvents';
import RecentAnnouncements from '@/components/widgets/RecentAnnouncements';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Image, Book, Mail, Edit, Save, X, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const Index = () => {
  const [homepageData, setHomepageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Admin editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background',
    'link', 'blockquote', 'code-block'
  ];

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setLoading(true);
        console.log('[Homepage] Fetching homepage content...');
        
        const response = await fetch('/api/pages/homepage');
        
        if (response.ok) {
          const pageData = await response.json();
          console.log('[Homepage] Content loaded:', pageData.title);
          setHomepageData(pageData);
          setEditData({
            title: pageData.title,
            content: pageData.content
          });
        } else {
          console.warn('[Homepage] No homepage content found, using defaults');
          // Use default content if no homepage found
          setHomepageData({
            id: '',
            slug: 'homepage',
            title: 'Welcome to Spectrum 4',
            content: `# Welcome to Spectrum 4

A modern platform for our community Vancouver Community to stay informed, connected, and engaged.

## Building Features
Our building offers state-of-the-art amenities and a vibrant community atmosphere.

## Stay Connected
Use our platform to stay updated on events, announcements, and community activities.`,
            createdAt: '',
            updatedAt: ''
          });
        }
      } catch (error) {
        console.error('[Homepage] Error fetching content:', error);
        toast({ 
          title: "Warning", 
          description: "Could not load custom homepage content. Using defaults.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, [toast]);

  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Session Expired",
        description: location.state.message,
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const handleEditToggle = () => {
    if (isEditing && homepageData) {
      // Reset edit data when canceling
      setEditData({
        title: homepageData.title,
        content: homepageData.content
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!homepageData) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/pages/${homepageData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'homepage',
          title: editData.title,
          content: editData.content
        })
      });
      
      if (response.ok) {
        const updatedPage = await response.json();
        setHomepageData(updatedPage);
        setIsEditing(false);
        toast({ 
          title: "Success", 
          description: "Homepage content updated successfully!" 
        });
      } else {
        throw new Error('Failed to update homepage');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update homepage. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  // Format content - handle both markdown and HTML content
  const formatContent = (content: string) => {
    // If content contains HTML tags, assume it's from the WYSIWYG editor
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
      return content;
    }
    
    // Otherwise, convert markdown-style content to HTML
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl text-gray-600 max-w-3xl mx-auto mb-4">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-gray-700 mb-2">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-xl text-gray-600 max-w-3xl mx-auto mb-4">')
      .replace(/\n/g, '<br/>');
  };

  useEffect(() => {
    // Make announcement links open in new tab
    const announcementsContainer = document.getElementById('announcements-content');
    if (announcementsContainer) {
      const links = announcementsContainer.getElementsByTagName('a');
      for (const link of links) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        if (link instanceof HTMLElement) {
          link.style.color = '#2563eb';
        }
      }
    }
  }, [homepageData?.content]);

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="page-content">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <p className="text-center text-gray-500">Loading...</p>
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
        {adminUser && (
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-blue-700 text-sm">
                  🔧 Admin Mode: You can edit the homepage content
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel Edit' : 'Edit Homepage'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="bg-yellow-50 border-b border-yellow-200 py-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-yellow-800">Editing Homepage Content</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Page Title</Label>
                    <Input
                      id="edit-title"
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      className="text-lg font-medium"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-content">Homepage Content</Label>
                    <div className="border rounded-md">
                      <ReactQuill
                        theme="snow"
                        value={editData.content}
                        onChange={(content) => setEditData({...editData, content})}
                        modules={quillModules}
                        formats={quillFormats}
                        style={{ minHeight: '300px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section - Now Editable */}
            <section className="bg-gradient-to-b from-primary/10 to-primary/5 py-16 md:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  {homepageData && (
                    <div 
                      className="homepage-content"
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(homepageData.content)
                      }}
                    />
                  )}
                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <Button asChild size="lg">
                      <Link to="/calendar">View Calendar</Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link to="/contact">Contact Us</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Building Image Section */}
            <section className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <div className="relative rounded-lg overflow-hidden shadow-xl mx-auto max-w-3xl">
                    <img 
                      src="/building-602.jpg" 
                      alt="Spectrum 4 Building - 602 Citadel Parade, Vancouver"
                      className="w-full h-52 md:h-80 object-cover"
                      onError={(e) => {
                        // Fallback to a placeholder if image doesn't load
                        console.warn('Building image failed to load, showing fallback');
                        e.currentTarget.style.display = 'none';
                        const nextSibling = e.currentTarget.nextElementSibling;
                        if (nextSibling instanceof HTMLElement) {
                          nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    {/* Fallback placeholder (hidden by default) */}
                    <div className="w-full h-52 md:h-80 bg-gradient-to-br from-blue-100 via-gray-100 to-blue-50 items-center justify-center relative hidden">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">Spectrum 4</h3>
                        <p className="text-gray-600 mb-4">602 Citadel Parade</p>
                        <p className="text-sm text-gray-500">Modern Vancouver Living</p>
                      </div>
                    </div>
                    
                    {/* Image overlay with building info */}
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-semibold">Spectrum 4</h3>
                      <p className="text-sm opacity-90">602 Citadel Parade, Vancouver</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Feature Cards */}
            <section className="strata-section">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Building Calendar</h3>
                    <p className="text-gray-600 mb-4">
                      Stay updated on events, maintenance, and community gatherings.
                    </p>
                    <Button variant="ghost" asChild className="mt-auto">
                      <Link to="/calendar">View Calendar</Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Strata Marketplace</h3>
                    <p className="text-gray-600 mb-4">
                      Buy, sell, or trade items with others in the community.
                    </p>
                    <Button variant="ghost" asChild className="mt-auto">
                      <Link to="/marketplace">Visit Marketplace</Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-md">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center mb-4">
                      <Book className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Building Bylaws</h3>
                    <p className="text-gray-600 mb-4">
                      Access our complete library of strata bylaws and regulations.
                    </p>
                    <Button variant="ghost" asChild className="mt-auto">
                      <Link to="/bylaws">Read Bylaws</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Widgets Section */}
            <section className="strata-section pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <UpcomingEvents />
                </div>
                <div>
                  <RecentAnnouncements />
                </div>
              </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-primary/10 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Have Questions?</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                  Our strata council is here to help. Reach out with any concerns or suggestions.
                </p>
                <Button asChild size="lg">
                  <Link to="/contact">
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Us
                  </Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Index;
