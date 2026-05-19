import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RecentAnnouncements from '@/components/widgets/RecentAnnouncements';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Image, Book, Mail, Edit, Save, X, Loader2, Paintbrush, Wind, Hammer, ArrowRight, AlertTriangle } from 'lucide-react';
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
  const [buildingImageError, setBuildingImageError] = useState(false);
  const editTitleRef = useRef<HTMLInputElement>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setEditData({
        title: homepageData.title,
        content: homepageData.content
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setTimeout(() => editTitleRef.current?.focus(), 50);
    }
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

  const formatContent = (content: string) => {
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
      return content;
    }

    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl text-gray-600 max-w-3xl mx-auto mb-4">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-gray-700 mb-2">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-xl text-gray-600 max-w-3xl mx-auto mb-4">')
      .replace(/\n/g, '<br/>');
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="page-content flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden="true" />
            <p className="text-on-surface-variant text-sm" aria-live="polite">Loading homepage content...</p>
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
        {/* Admin Controls */}
        {adminUser && (
          <div className="bg-surface-container border-b border-outline-variant" role="region" aria-label="Admin controls">
            <div className="max-w-container-max mx-auto px-gutter py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-on-surface-variant">
                  Admin Mode: You can edit the homepage content
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  aria-expanded={isEditing}
                  aria-controls="homepage-edit-form"
                  className="bg-primary-container text-on-primary hover:brightness-110 border-none"
                >
                  <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                  {isEditing ? 'Cancel Edit' : 'Edit Homepage'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Edit Form */}
        {isEditing && (
          <div id="homepage-edit-form" className="bg-surface-container border-b border-outline-variant py-8">
            <div className="max-w-4xl mx-auto px-gutter">
              <div className="bg-surface-container-lowest rounded-xl p-card-padding shadow-sm border border-outline-variant">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-title-lg text-on-surface">Editing Homepage Content</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-primary-container text-on-primary hover:brightness-110"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                      )}
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
                    <Label htmlFor="edit-title" className="text-xs font-semibold text-on-surface">Page Title</Label>
                    <Input
                      id="edit-title"
                      ref={editTitleRef}
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      className="text-lg font-medium border-outline-variant"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-content" className="text-xs font-semibold text-on-surface">Homepage Content</Label>
                    <div className="border border-outline-variant rounded-xl overflow-hidden">
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
        )}

        {/* Public-facing content - only show when NOT editing */}
        {!isEditing && (
          <>
            {/* Hero Section */}
            <section className="relative bg-surface-subtle py-16 md:py-24 overflow-hidden">
              <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 z-10">
                  {homepageData && (
                    <div
                      className="homepage-content"
                      dangerouslySetInnerHTML={{
                        __html: formatContent(homepageData.content)
                      }}
                    />
                  )}
                  <div className="flex flex-wrap gap-4 mt-8">
                    <Link
                      to="/incident-report"
                      className="bg-secondary text-on-secondary px-8 py-4 rounded-xl text-title-lg shadow-md hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      Contact Us
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      to="/bylaws"
                      className="bg-surface border border-outline-variant text-on-surface px-8 py-4 rounded-xl text-title-lg hover:bg-surface-container transition-all inline-flex items-center"
                    >
                      View Bylaws
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-5 relative">
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl relative bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container-highest">
                    {buildingImageError ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-8">
                          <p className="text-headline-md text-on-surface mb-2">Spectrum 4</p>
                          <p className="text-body-lg text-on-surface-variant">602 Citadel Parade</p>
                          <p className="text-body-md text-on-surface-variant mt-1">Modern Vancouver Living</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src="/building-602.jpg"
                        alt="Spectrum 4 Building at 602 Citadel Parade, Vancouver"
                        className="w-full h-full object-cover"
                        onError={() => setBuildingImageError(true)}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-title-lg text-white">Spectrum 4</p>
                      <p className="text-body-md text-white/80">602 Citadel Parade, Vancouver</p>
                    </div>
                  </div>
                  {/* Decorative accents */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-spectrum-blue opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-spectrum-green opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                </div>
              </div>
            </section>

            {/* Quick Access Bento Grid */}
            <section className="py-section-gap max-w-container-max mx-auto px-gutter">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Large — Bylaws Card */}
                <div className="md:col-span-2 md:row-span-2 bg-surface-brand border border-secondary-container/40 p-card-padding rounded-3xl flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="w-12 h-12 bg-secondary-container/20 text-secondary rounded-xl flex items-center justify-center mb-6">
                      <Book className="h-6 w-6" />
                    </div>
                    <h3 className="text-headline-lg mb-4 text-on-surface">Building Bylaws</h3>
                    <p className="text-body-lg text-on-surface-variant">Access our complete library of strata bylaws, rules, and regulations to ensure a harmonious community environment.</p>
                  </div>
                  <Link to="/bylaws" className="mt-8 flex items-center gap-2 text-secondary font-bold hover:underline">
                    Read Bylaws
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>

                {/* Emergency / Support Card */}
                <Link to="/incident-report" className="bg-surface-container-lowest border border-outline-variant p-card-padding rounded-3xl shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 bg-error-container text-on-error-container rounded-lg flex items-center justify-center mb-4">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h4 className="text-title-lg mb-2 text-on-surface">Support</h4>
                  <p className="text-body-md text-on-surface-variant">24/7 assistance for urgent building matters.</p>
                </Link>

                {/* Maintenance / Requests Card */}
                <Link to="/incident-report" className="bg-surface-container-lowest border border-outline-variant p-card-padding rounded-3xl shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 bg-surface-container-highest text-on-surface rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[24px]">handyman</span>
                  </div>
                  <h4 className="text-title-lg mb-2 text-on-surface">Requests</h4>
                  <p className="text-body-md text-on-surface-variant">Submit maintenance or service tickets.</p>
                </Link>

                {/* Latest News Card */}
                <div className="md:col-span-2 bg-primary-container text-on-primary p-card-padding rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="z-10">
                    <span className="bg-spectrum-blue text-white text-xs font-bold px-2 py-1 rounded mb-4 inline-block uppercase tracking-wider">Stay Informed</span>
                    <h3 className="text-headline-md mb-2">Community Updates</h3>
                    <p className="text-body-md text-white/80">Check announcements and notices from the Strata Council.</p>
                  </div>
                  <span className="material-symbols-outlined text-6xl opacity-10 absolute -right-4 -bottom-4">campaign</span>
                </div>
              </div>
            </section>

            {/* Announcements Widget */}
            <section className="py-section-gap max-w-container-max mx-auto px-gutter">
              <RecentAnnouncements />
            </section>

            {/* Preferred Vendors Section */}
            <section className="bg-surface-subtle py-section-gap">
              <div className="max-w-container-max mx-auto px-gutter">
                <div className="text-center mb-12">
                  <h2 className="text-headline-lg mb-4 text-on-surface">Preferred Vendors</h2>
                  <p className="text-body-lg text-on-surface-variant">Trusted service providers vetted and recommended by the Strata Council.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: Paintbrush, color: 'bg-spectrum-blue/10 text-spectrum-blue', name: 'Honest John Painting Co.', summary: 'Interior & exterior painting, drywall repair, and carpentry.' },
                    { icon: Wind, color: 'bg-spectrum-yellow/10 text-spectrum-yellow', name: 'Airlux Heating & Cooling', summary: 'Heat pump and AC specialists serving BC since 2004.' },
                    { icon: Hammer, color: 'bg-spectrum-green/10 text-spectrum-green', name: 'Swift Contracting', summary: 'Full-service renovations, kitchen remodels, and flooring.' },
                  ].map((v) => {
                    const Icon = v.icon;
                    return (
                      <div key={v.name} className="bg-surface border border-outline-variant p-gutter rounded-xl shadow-sm hover:-translate-y-1 transition-all">
                        <div className={`w-12 h-12 ${v.color} rounded-full flex items-center justify-center mb-6`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="text-title-lg mb-2 text-on-surface">{v.name}</h4>
                        <p className="text-body-md text-on-surface-variant mb-4">{v.summary}</p>
                        <div className="flex gap-2">
                          <span className="bg-surface-container-high px-2 py-1 rounded-md text-[10px] font-bold uppercase text-on-surface-variant">Trusted</span>
                          <span className="bg-surface-container-high px-2 py-1 rounded-md text-[10px] font-bold uppercase text-on-surface-variant">Vetted</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-12">
                  <Link
                    to="/preferred-vendors"
                    className="bg-surface border border-outline-variant text-on-surface px-8 py-3 rounded-full text-xs font-semibold hover:bg-surface-container transition-all inline-flex items-center gap-2"
                  >
                    View All Vendors
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-spectrum-blue relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                  <path d="M0 100 L100 0 L100 100 Z" fill="white" />
                </svg>
              </div>
              <div className="max-w-container-max mx-auto px-gutter text-center relative z-10 text-white">
                <h2 className="text-display-lg mb-6">Have Questions?</h2>
                <p className="text-body-lg mb-10 max-w-2xl mx-auto opacity-90">
                  Our strata council is here to help. Reach out with any concerns, suggestions, or service requests. We typically respond within 24 business hours.
                </p>
                <Link
                  to="/incident-report"
                  className="bg-white text-spectrum-blue px-12 py-5 rounded-xl text-title-lg shadow-xl hover:scale-105 transition-all inline-flex items-center gap-3"
                >
                  <Mail className="h-6 w-6" />
                  Contact Council
                </Link>
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
