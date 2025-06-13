import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X } from 'lucide-react';
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

const DynamicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  
  // Admin editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ slug: '', title: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      
      const startTime = performance.now();
      try {
        setLoading(true);
        console.log(`[DynamicPage] Fetching page: ${slug}`);
        
        const response = await fetch(`/api/pages/${slug}`);
        const duration = Math.round(performance.now() - startTime);
        console.log(`[DynamicPage] Response: ${response.status} (${duration}ms)`);
        
        if (response.ok) {
          const pageData = await response.json();
          console.log(`[DynamicPage] Page loaded:`, pageData.title);
          setPage(pageData);
          setEditData({
            slug: pageData.slug,
            title: pageData.title,
            content: pageData.content
          });
          setNotFound(false);
        } else if (response.status === 404) {
          console.warn(`[DynamicPage] Page not found: ${slug}`);
          setNotFound(true);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[DynamicPage] Error fetching page:`, error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset edit data when canceling
      setEditData({
        slug: page.slug,
        title: page.title,
        content: page.content
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!page) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      if (response.ok) {
        const updatedPage = await response.json();
        setPage(updatedPage);
        setIsEditing(false);
        toast({ 
          title: "Success", 
          description: "Page updated successfully!" 
        });
      } else {
        throw new Error('Failed to update page');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update page. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

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

  // Format content - handle both markdown and HTML content
  const formatContent = (content: string) => {
    // If content contains HTML tags, assume it's from the WYSIWYG editor
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
      return content;
    }
    
    // Otherwise, convert markdown-style content to HTML
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mb-4 mt-8">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mb-3 mt-6">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\|(.*)\|$/gm, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        if (cells[0] === '' && cells[cells.length - 1] === '') {
          cells.shift();
          cells.pop();
        }
        return '<tr>' + cells.map((cell: string) => `<td class="border px-4 py-2">${cell}</td>`).join('') + '</tr>';
      })
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');
  };

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

  if (notFound || !page) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        {isEditing ? (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-yellow-800">Editing Mode</h2>
                  <p className="text-yellow-700">You are currently editing this page.</p>
                </div>
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
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="edit-title">Page Title</Label>
                <Input
                  id="edit-title"
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="text-2xl font-bold"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-slug">Page URL Slug</Label>
                <Input
                  id="edit-slug"
                  value={editData.slug}
                  onChange={(e) => setEditData({...editData, slug: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-content">Page Content</Label>
                <div className="border rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={editData.content}
                    onChange={(content) => setEditData({...editData, content})}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: '400px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <PageHeader 
              title={page.title}
              description={`Last updated: ${new Date(page.updatedAt).toLocaleDateString()}`}
            />
            {adminUser && (
              <div className="bg-blue-50 border-b border-blue-200">
                <div className="max-w-4xl mx-auto px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-blue-700 text-sm">
                      🔧 Admin Mode: You can edit this page
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditToggle}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Page
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div 
                className="prose prose-lg max-w-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_p]:mb-4 [&_ul]:ml-6 [&_ol]:ml-6 [&_li]:mb-2 [&_table]:border-collapse [&_td]:border [&_td]:px-4 [&_td]:py-2 [&_th]:border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-50"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(page.content)
                }}
              />
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DynamicPage;