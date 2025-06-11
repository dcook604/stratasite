import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const DynamicPage = () => {
  const params = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      // Extract slug from URL path
      const currentPath = window.location.pathname;
      let slug = '';
      
      if (currentPath.startsWith('/information/')) {
        // Legacy information routes - extract the page name
        slug = currentPath.replace('/information/', '');
      } else {
        // Direct routes - remove leading slash
        slug = currentPath.replace('/', '');
      }

      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/pages/${slug}`);
        
        if (response.ok) {
          const pageData = await response.json();
          setPage(pageData);
        } else if (response.status === 404) {
          setNotFound(true);
        } else {
          throw new Error('Failed to fetch page');
        }
      } catch (error) {
        console.error('Error fetching page:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [params]);

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
        <PageHeader 
          title={page.title}
          description={`Last updated: ${new Date(page.updatedAt).toLocaleDateString()}`}
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div 
            className="prose prose-lg max-w-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_p]:mb-4 [&_ul]:ml-6 [&_ol]:ml-6 [&_li]:mb-2 [&_table]:border-collapse [&_td]:border [&_td]:px-4 [&_td]:py-2 [&_th]:border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-50"
            dangerouslySetInnerHTML={{ 
              __html: formatContent(page.content)
            }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DynamicPage;