import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { RequireAdminAuth } from '@/components/hoc/RequireAdminAuth';
import { Plus, Trash2, Edit2, Users, Calendar, FileText, Megaphone, ShoppingCart, Save, X, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cleanupMarketplaceData, getCleanupPreview, formatCleanupStats, CleanupOptions } from '@/utils/databaseCleanup';

const AdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [pages, setPages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [marketplacePosts, setMarketplacePosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', startDate: '', endDate: '', location: '' });
  const [newPage, setNewPage] = useState({ slug: '', title: '', content: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  
  // Edit states
  const [editingPage, setEditingPage] = useState(null);
  const [editPageData, setEditPageData] = useState({ slug: '', title: '', content: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Cleanup state
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    deleteOlderThanDays: 90,
    deleteSoldItems: false,
    deleteInactivePosts: true,
    deleteOrphanedImages: true,
    dryRun: false
  });
  const [cleanupPreview, setCleanupPreview] = useState(null);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('AdminDashboard: Starting data fetch...');
      
      const [
        announcementsRes, 
        eventsRes, 
        pagesRes, 
        marketplaceRes, 
        adminUsersRes
      ] = await Promise.all([
        fetch('/api/announcements').catch(err => err),
        fetch('/api/events').catch(err => err),
        fetch('/api/pages').catch(err => err),
        fetch('/api/marketplace').catch(err => err),
        fetch('/api/admin/users').catch(err => err)
      ]);

      console.log('AdminDashboard: API responses received');

      // Handle announcements
      if (announcementsRes instanceof Response && announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        console.log('AdminDashboard: Announcements loaded:', announcementsData.length);
        setAnnouncements(announcementsData);
      } else {
        console.error('AdminDashboard: Failed to load announcements', announcementsRes);
        setAnnouncements([]);
      }
      
      // Handle events
      if (eventsRes instanceof Response && eventsRes.ok) {
        const eventsData = await eventsRes.json();
        console.log('AdminDashboard: Events loaded:', eventsData.length);
        setEvents(eventsData);
      } else {
        console.error('AdminDashboard: Failed to load events:', eventsRes);
        setEvents([]);
      }
      
      // Handle pages
      if (pagesRes instanceof Response && pagesRes.ok) {
        const pagesData = await pagesRes.json();
        console.log('AdminDashboard: Pages loaded:', pagesData.length);
        setPages(pagesData);
      } else {
        console.error('AdminDashboard: Failed to load pages:', pagesRes);
        setPages([]);
      }
      
      // Handle marketplace
      if (marketplaceRes instanceof Response && marketplaceRes.ok) {
        const marketplaceData = await marketplaceRes.json();
        console.log('AdminDashboard: Marketplace posts loaded:', marketplaceData.length);
        setMarketplacePosts(marketplaceData);
      } else {
        console.error('AdminDashboard: Failed to load marketplace posts:', marketplaceRes);
        setMarketplacePosts([]);
      }
      
      // Handle admin users
      if (adminUsersRes instanceof Response && adminUsersRes.ok) {
        const adminUsersData = await adminUsersRes.json();
        console.log('AdminDashboard: Admin users loaded:', adminUsersData.length);
        setAdminUsers(adminUsersData);
      } else {
        console.error('AdminDashboard: Failed to load admin users:', adminUsersRes);
        setAdminUsers([]);
      }
    } catch (error) {
      console.error('AdminDashboard: Error fetching data:', error);
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Announcement created" });
        setNewAnnouncement({ title: '', content: '' });
        fetchData();
      } else {
        throw new Error('Failed to create announcement');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Event created" });
        setNewEvent({ title: '', description: '', startDate: '', endDate: '', location: '' });
        fetchData();
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createPage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Page created" });
        setNewPage({ slug: '', title: '', content: '' });
        fetchData();
      } else {
        throw new Error('Failed to create page');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Admin user created" });
        setNewAdmin({ email: '', password: '' });
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteItem = async (type, id) => {
    try {
      const response = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Success", description: "Item deleted" });
        fetchData();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (page) => {
    setEditingPage(page);
    setEditPageData({
      slug: page.slug,
      title: page.title,
      content: page.content
    });
    setEditDialogOpen(true);
  };

  const updatePage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/pages/${editingPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPageData)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Page updated" });
        setEditDialogOpen(false);
        setEditingPage(null);
        fetchData();
      } else {
        throw new Error('Failed to update page');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Cleanup functions
  const handleCleanupPreview = async () => {
    try {
      setCleanupInProgress(true);
      const preview = await getCleanupPreview(cleanupOptions);
      setCleanupPreview(preview);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cleanup preview",
        variant: "destructive"
      });
    } finally {
      setCleanupInProgress(false);
    }
  };

  const handleCleanupExecute = async () => {
    try {
      setCleanupInProgress(true);
      const result = await cleanupMarketplaceData({ ...cleanupOptions, dryRun: false });
      
      toast({
        title: "Cleanup Complete",
        description: formatCleanupStats(result)
      });
      
      // Refresh marketplace data
      fetchData();
      setCleanupPreview(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute cleanup",
        variant: "destructive"
      });
    } finally {
      setCleanupInProgress(false);
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

  return (
    <RequireAdminAuth>
      <div className="page-container">
        <Navbar />
        <div className="page-content">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <Button variant="outline" onClick={handleLogout}>Log Out</Button>
            </div>
            
            <Alert className="mb-6">
              <AlertDescription>
                Welcome back, {adminUser?.email}! Use the tabs below to manage your website content.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="announcements" className="space-y-6">
              {/* 
                This TabsList is styled to be a flex container that wraps on small screens,
                and transitions to a 6-column grid on medium screens and larger.
              */}
              <TabsList className="h-auto flex-wrap justify-start md:grid md:grid-cols-6 md:h-10">
                <TabsTrigger value="announcements" className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Pages
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Marketplace
                </TabsTrigger>
                <TabsTrigger value="cleanup" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Cleanup
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Admin Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="announcements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create New Announcement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createAnnouncement} className="space-y-4">
                      <div>
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input
                          id="announcement-title"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="announcement-content">Content</Label>
                        <Textarea
                          id="announcement-content"
                          value={newAnnouncement.content}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit">Create Announcement</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {announcements.length === 0 ? (
                      <p className="text-gray-500">No announcements yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <div key={announcement.id} className="flex justify-between items-start p-4 border rounded">
                            <div>
                              <h3 className="font-semibold">{announcement.title}</h3>
                              <p className="text-gray-600 mt-1">{announcement.content}</p>
                              <p className="text-sm text-gray-400 mt-2">
                                {new Date(announcement.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteItem('announcements', announcement.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create New Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createEvent} className="space-y-4">
                      <div>
                        <Label htmlFor="event-title">Title</Label>
                        <Input
                          id="event-title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-description">Description</Label>
                        <Textarea
                          id="event-description"
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="event-start">Start Date</Label>
                          <Input
                            id="event-start"
                            type="datetime-local"
                            value={newEvent.startDate}
                            onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="event-end">End Date (Optional)</Label>
                          <Input
                            id="event-end"
                            type="datetime-local"
                            value={newEvent.endDate}
                            onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="event-location">Location</Label>
                        <Input
                          id="event-location"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        />
                      </div>
                      <Button type="submit">Create Event</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <p className="text-gray-500">No events yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="flex justify-between items-start p-4 border rounded">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              {event.description && <p className="text-gray-600 mt-1">{event.description}</p>}
                              <p className="text-sm text-gray-500 mt-2">
                                {new Date(event.startDate).toLocaleString()}
                                {event.location && ` • ${event.location}`}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteItem('events', event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create New Page
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createPage} className="space-y-4">
                      <div>
                        <Label htmlFor="page-slug">URL Slug</Label>
                        <Input
                          id="page-slug"
                          value={newPage.slug}
                          onChange={(e) => setNewPage({...newPage, slug: e.target.value})}
                          placeholder="page-url-slug"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="page-title">Title</Label>
                        <Input
                          id="page-title"
                          value={newPage.title}
                          onChange={(e) => setNewPage({...newPage, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="page-content">Content</Label>
                        <div className="border rounded-md">
                          <ReactQuill
                            theme="snow"
                            value={newPage.content}
                            onChange={(content) => setNewPage({...newPage, content})}
                            modules={quillModules}
                            formats={quillFormats}
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                      </div>
                      <Button type="submit">Create Page</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pages.length === 0 ? (
                      <p className="text-gray-500">No pages yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {pages.map((page) => (
                          <div key={page.id} className="flex justify-between items-start p-4 border rounded">
                            <div className="flex-1">
                              <h3 className="font-semibold">{page.title}</h3>
                              <p className="text-sm text-gray-500">/{page.slug}</p>
                              <p className="text-gray-600 mt-1">
                                {page.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(page)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem('pages', page.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="marketplace" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketplace Management</CardTitle>
                    <CardDescription>Manage user-posted marketplace items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {marketplacePosts.length === 0 ? (
                      <p className="text-gray-500">No marketplace posts yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {marketplacePosts.map((post) => (
                          <div key={post.id} className="p-4 border rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{post.title}</h3>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    post.type === 'sell' ? 'bg-green-100 text-green-800' :
                                    post.type === 'buy' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                                  </span>
                                  {post.category && (
                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                      {post.category}
                                    </span>
                                  )}
                                  {post.price && (
                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                      ${post.price}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-2">{post.description}</p>
                                <div className="text-sm text-gray-500">
                                  <p>Posted by: {post.authorName} ({post.authorEmail})</p>
                                  <p>Date: {new Date(post.createdAt).toLocaleDateString()}</p>
                                  {post.replies && post.replies.length > 0 && (
                                    <p>Replies: {post.replies.length}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem('marketplace', post.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {post.replies && post.replies.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                <h4 className="font-medium text-sm mb-2">Replies:</h4>
                                {post.replies.map((reply) => (
                                  <div key={reply.id} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                                    <p>{reply.content}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {reply.authorName} - {new Date(reply.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cleanup" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cleanup Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCleanupPreview} className="space-y-4">
                      <div>
                        <Label htmlFor="delete-older-than-days">Delete items older than (days)</Label>
                        <Input
                          id="delete-older-than-days"
                          type="number"
                          value={cleanupOptions.deleteOlderThanDays}
                          onChange={(e) => setCleanupOptions({...cleanupOptions, deleteOlderThanDays: Number(e.target.value)})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delete-sold-items">Delete sold items</Label>
                        <Checkbox
                          id="delete-sold-items"
                          checked={cleanupOptions.deleteSoldItems}
                          onCheckedChange={(value) => setCleanupOptions({...cleanupOptions, deleteSoldItems: !!value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delete-inactive-posts">Delete inactive posts</Label>
                        <Checkbox
                          id="delete-inactive-posts"
                          checked={cleanupOptions.deleteInactivePosts}
                          onCheckedChange={(value) => setCleanupOptions({...cleanupOptions, deleteInactivePosts: !!value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delete-orphaned-images">Delete orphaned images</Label>
                        <Checkbox
                          id="delete-orphaned-images"
                          checked={cleanupOptions.deleteOrphanedImages}
                          onCheckedChange={(value) => setCleanupOptions({...cleanupOptions, deleteOrphanedImages: !!value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dry-run">Dry Run</Label>
                        <Checkbox
                          id="dry-run"
                          checked={cleanupOptions.dryRun}
                          onCheckedChange={(value) => setCleanupOptions({...cleanupOptions, dryRun: !!value})}
                        />
                      </div>
                      <Button type="submit">Preview Cleanup</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cleanup Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cleanupPreview && (
                      <div className="space-y-4">
                        <p>Items to be deleted: {cleanupPreview.itemsToDelete}</p>
                        <p>Items to be kept: {cleanupPreview.itemsToKeep}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Execute Cleanup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleCleanupExecute}>Execute Cleanup</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Administrator
                    </CardTitle>
                    <CardDescription>
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createAdmin} className="space-y-4">
                      <div>
                        <Label htmlFor="admin-email">Email</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-password">Password</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                          required
                        />
                      </div>
                      <Button type="submit">Create Administrator</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Current Administrators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminUsers.length === 0 ? (
                      <p className="text-gray-500">No administrators found.</p>
                    ) : (
                      <div className="space-y-4">
                        {adminUsers.map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-4 border rounded">
                            <div>
                              <p className="font-semibold">{user.email}</p>
                              <p className="text-sm text-gray-500">
                                Created: {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {adminUsers.length > 1 && user.id !== adminUser?.id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem('admin/users', user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <Footer />
        
        {/* Edit Page Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Page</DialogTitle>
              <DialogDescription>
                Edit the page content using the rich text editor below.
              </DialogDescription>
            </DialogHeader>
            
            {editingPage && (
              <form onSubmit={updatePage} className="space-y-4">
                <div>
                  <Label htmlFor="edit-page-slug">URL Slug</Label>
                  <Input
                    id="edit-page-slug"
                    value={editPageData.slug}
                    onChange={(e) => setEditPageData({...editPageData, slug: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-page-title">Title</Label>
                  <Input
                    id="edit-page-title"
                    value={editPageData.title}
                    onChange={(e) => setEditPageData({...editPageData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-page-content">Content</Label>
                  <div className="border rounded-md">
                    <ReactQuill
                      theme="snow"
                      value={editPageData.content}
                      onChange={(content) => setEditPageData({...editPageData, content})}
                      modules={quillModules}
                      formats={quillFormats}
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RequireAdminAuth>
  );
};

export default AdminDashboard;
