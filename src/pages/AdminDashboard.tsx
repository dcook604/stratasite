
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
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { RequireAdminAuth } from '@/components/hoc/RequireAdminAuth';
import { Plus, Trash2, Edit2, Users, Calendar, FileText, Megaphone } from 'lucide-react';

const AdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [pages, setPages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', startDate: '', endDate: '', location: '' });
  const [newPage, setNewPage] = useState({ slug: '', title: '', content: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [announcementsRes, eventsRes, pagesRes, adminUsersRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/events'),
        fetch('/api/pages'),
        fetch('/api/admin/users')
      ]);

      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (pagesRes.ok) setPages(await pagesRes.json());
      if (adminUsersRes.ok) setAdminUsers(await adminUsersRes.json());
    } catch (error) {
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
              <TabsList className="grid w-full grid-cols-4">
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
                        <Textarea
                          id="page-content"
                          value={newPage.content}
                          onChange={(e) => setNewPage({...newPage, content: e.target.value})}
                          rows={6}
                          required
                        />
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
                            <div>
                              <h3 className="font-semibold">{page.title}</h3>
                              <p className="text-sm text-gray-500">/{page.slug}</p>
                              <p className="text-gray-600 mt-1">{page.content.substring(0, 100)}...</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteItem('pages', page.id)}
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
      </div>
    </RequireAdminAuth>
  );
};

export default AdminDashboard;
