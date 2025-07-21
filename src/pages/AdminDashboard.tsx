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
import { Plus, Trash2, Edit2, Users, Calendar, FileText, Megaphone, ShoppingCart, Save, X, Database, AlertTriangle, CheckCircle, Zap, PawPrint, Download, ClipboardList } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cleanupMarketplaceData, getCleanupPreview, formatCleanupStats, CleanupOptions } from '@/utils/databaseCleanup';
import ChangePasswordDialog from '@/components/shared/ChangePasswordDialog';
import { exportFormData } from '@/utils/csvExport';

const AdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [pages, setPages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [marketplacePosts, setMarketplacePosts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventRequests, setEventRequests] = useState([]);
  const [scooterRegistrations, setScooterRegistrations] = useState([]);
  const [petRegistrations, setPetRegistrations] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [acInquiries, setACInquiries] = useState([]);
  const [storageRentals, setStorageRentals] = useState([]);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', startDate: '', endDate: '', location: '' });
  const [newPage, setNewPage] = useState({ slug: '', title: '', content: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  const [newDocument, setNewDocument] = useState({ title: '', description: '', file: null });
  
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
        adminUsersRes,
        eventRequestsRes,
        documentsRes,
        scooterRegistrationsRes,
        petRegistrationsRes,
        emergencyContactsRes,
        acInquiriesRes,
        storageRentalsRes
      ] = await Promise.all([
        fetch('/api/announcements').catch(err => err),
        fetch('/api/events').catch(err => err),
        fetch('/api/pages').catch(err => err),
        fetch('/api/marketplace').catch(err => err),
        fetch('/api/admin/users').catch(err => err),
        fetch('/api/event-requests').catch(err => err),
        fetch('/api/documents').catch(err => err),
        fetch('/api/scooter-registrations').catch(err => err),
        fetch('/api/pet-registrations').catch(err => err),
        fetch('/api/emergency-contacts').catch(err => err),
        fetch('/api/ac-inquiries').catch(err => err),
        fetch('/api/storage-rentals').catch(err => err)
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
      
      // Handle event requests
      if (eventRequestsRes instanceof Response && eventRequestsRes.ok) {
        const eventRequestsData = await eventRequestsRes.json();
        console.log('AdminDashboard: Event requests loaded:', eventRequestsData.length);
        setEventRequests(eventRequestsData);
      } else {
        console.error('AdminDashboard: Failed to load event requests:', eventRequestsRes);
        setEventRequests([]);
      }
      
      // Handle documents
      if (documentsRes instanceof Response && documentsRes.ok) {
        const documentsData = await documentsRes.json();
        console.log('AdminDashboard: Documents loaded:', documentsData.length);
        setDocuments(documentsData);
      } else {
        console.error('AdminDashboard: Failed to load documents:', documentsRes);
        setDocuments([]);
      }
      
      // Handle scooter registrations
      if (scooterRegistrationsRes instanceof Response && scooterRegistrationsRes.ok) {
        const scooterRegistrationsData = await scooterRegistrationsRes.json();
        console.log('AdminDashboard: Scooter registrations loaded:', scooterRegistrationsData.length);
        setScooterRegistrations(scooterRegistrationsData);
      } else {
        console.error('AdminDashboard: Failed to load scooter registrations:', scooterRegistrationsRes);
        setScooterRegistrations([]);
      }
      
      // Handle pet registrations
      if (petRegistrationsRes instanceof Response && petRegistrationsRes.ok) {
        const petRegistrationsData = await petRegistrationsRes.json();
        console.log('AdminDashboard: Pet registrations loaded:', petRegistrationsData.length);
        setPetRegistrations(petRegistrationsData);
      } else {
        console.error('AdminDashboard: Failed to load pet registrations:', petRegistrationsRes);
        setPetRegistrations([]);
      }
      
      // Handle emergency contacts
      if (emergencyContactsRes instanceof Response && emergencyContactsRes.ok) {
        const emergencyContactsData = await emergencyContactsRes.json();
        console.log('AdminDashboard: Emergency contacts loaded:', emergencyContactsData.length);
        setEmergencyContacts(emergencyContactsData);
      } else {
        console.error('AdminDashboard: Failed to load emergency contacts:', emergencyContactsRes);
        setEmergencyContacts([]);
      }
      
      // Handle AC inquiries
      if (acInquiriesRes instanceof Response && acInquiriesRes.ok) {
        const acInquiriesData = await acInquiriesRes.json();
        console.log('AdminDashboard: AC inquiries loaded:', acInquiriesData.length);
        setACInquiries(acInquiriesData);
      } else {
        console.error('AdminDashboard: Failed to load AC inquiries:', acInquiriesRes);
        setACInquiries([]);
      }
      
      // Handle storage rentals
      if (storageRentalsRes instanceof Response && storageRentalsRes.ok) {
        const storageRentalsData = await storageRentalsRes.json();
        console.log('AdminDashboard: Storage rentals loaded:', storageRentalsData.length);
        setStorageRentals(storageRentalsData);
      } else {
        console.error('AdminDashboard: Failed to load storage rentals:', storageRentalsRes);
        setStorageRentals([]);
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

  const createDocument = async (e) => {
    e.preventDefault();
    try {
      if (!newDocument.file) {
        toast({ title: "Error", description: "Please select a file", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      formData.append('title', newDocument.title);
      formData.append('description', newDocument.description);
      formData.append('document', newDocument.file);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Document uploaded successfully" });
        setNewDocument({ title: '', description: '', file: null });
        // Reset file input
        const fileInput = document.getElementById('document-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
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

  const onPasswordChanged = () => {
    // For enhanced security, you might want to force a re-login.
    // For now, we just give a notification.
    toast({
      title: 'Password Changed',
      description: 'The user password has been updated. If you changed your own password, you may need to log in again on other devices.',
    });
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

  const handleRequestStatusChange = async (requestId, status) => {
    try {
      const response = await fetch(`/api/event-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        toast({ title: "Success", description: `Event request has been ${status.toLowerCase()}.` });
        fetchData(); // Refresh all data
      } else {
        throw new Error('Failed to update request status');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateScooterRegistration = async (id, updates) => {
    try {
      const response = await fetch(`/api/scooter-registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        toast({ title: "Success", description: "Scooter registration updated successfully." });
        fetchData(); // Refresh all data
      } else {
        throw new Error('Failed to update scooter registration');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteScooterRegistration = async (id) => {
    if (!confirm('Are you sure you want to delete this scooter registration?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/scooter-registrations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast({ title: "Success", description: "Scooter registration deleted successfully." });
        fetchData(); // Refresh all data
      } else {
        throw new Error('Failed to delete scooter registration');
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
              {/* 
                Responsive tabs layout:
                - Mobile/Tablet: Horizontal scrollable for better UX
                - Medium screens: 5-column grid
                - Large screens: 5-column grid with better spacing
                - Extra large: 10-column grid for optimal layout
              */}
              <TabsList className="h-auto flex-nowrap overflow-x-auto md:grid md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10 md:overflow-visible md:flex-wrap md:gap-2">
                <TabsTrigger value="announcements" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <Megaphone className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Announcements</span>
                  <span className="sm:hidden">Announce</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Events</span>
                  <span className="sm:hidden">Events</span>
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Pages</span>
                  <span className="sm:hidden">Pages</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Documents</span>
                  <span className="sm:hidden">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Marketplace</span>
                  <span className="sm:hidden">Market</span>
                </TabsTrigger>
                <TabsTrigger value="event-requests" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Event Requests</span>
                  <span className="sm:hidden">Requests</span>
                </TabsTrigger>
                <TabsTrigger value="scooter-registrations" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <Zap className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Scooter Registrations</span>
                  <span className="sm:hidden">Scooters</span>
                </TabsTrigger>
                <TabsTrigger value="pet-registrations" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <PawPrint className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Pet Registrations</span>
                  <span className="sm:hidden">Pets</span>
                </TabsTrigger>
                <TabsTrigger value="forms" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <ClipboardList className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Forms</span>
                  <span className="sm:hidden">Forms</span>
                </TabsTrigger>
                <TabsTrigger value="cleanup" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <Database className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Cleanup</span>
                  <span className="sm:hidden">Cleanup</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Admin Users</span>
                  <span className="sm:hidden">Users</span>
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

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Upload New Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createDocument} className="space-y-4">
                      <div>
                        <Label htmlFor="document-title">Document Title</Label>
                        <Input
                          id="document-title"
                          value={newDocument.title}
                          onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="document-description">Description (Optional)</Label>
                        <Textarea
                          id="document-description"
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                          rows={3}
                          placeholder="Brief description of the document..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="document-file">Document File (PDF, DOC, DOCX)</Label>
                        <Input
                          id="document-file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setNewDocument({...newDocument, file: e.target.files[0]})}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Maximum file size: 10MB. Supported formats: PDF, DOC, DOCX
                        </p>
                      </div>
                      <Button type="submit">Upload Document</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <p className="text-gray-500">No documents uploaded yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {documents.map((document) => (
                          <div key={document.id} className="flex justify-between items-start p-4 border rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{document.title}</h3>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  document.fileType === 'pdf' ? 'bg-red-100 text-red-800' :
                                  document.fileType === 'doc' || document.fileType === 'docx' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {document.fileType.toUpperCase()}
                                </span>
                              </div>
                              {document.description && (
                                <p className="text-gray-600 mb-2">{document.description}</p>
                              )}
                              <div className="text-sm text-gray-500">
                                <p>File: {document.fileName}</p>
                                <p>Size: {(document.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                <p>Uploaded: {new Date(document.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem('documents', document.id)}
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

              <TabsContent value="event-requests" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Event Requests</CardTitle>
                    <CardDescription>
                      Review and approve or reject event requests from residents. Approving a request will automatically add it to the public calendar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {eventRequests.filter(req => req.status === 'PENDING').length === 0 ? (
                      <p className="text-gray-500">No pending event requests.</p>
                    ) : (
                      <div className="space-y-4">
                        {eventRequests.filter(req => req.status === 'PENDING').map((req) => (
                          <div key={req.id} className="p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg">{req.eventTitle}</h3>
                            <p className="text-gray-600 mt-1">{req.eventDescription}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                              <div>
                                <Label className="font-medium">Requested By</Label>
                                <p>{req.firstName} {req.lastName} (Unit: {req.unitNumber})</p>
                              </div>
                              <div>
                                <Label className="font-medium">Contact</Label>
                                <p>{req.email} / {req.phone}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Status</Label>
                                <p>{req.isOwner ? 'Owner' : 'Tenant'}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Requested Date & Time</Label>
                                <p>{new Date(req.requestedDateTime).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" onClick={() => handleRequestStatusChange(req.id, 'APPROVED')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRequestStatusChange(req.id, 'REJECTED')}>
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scooter-registrations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>E-Scooter Registration Management</CardTitle>
                    <CardDescription>
                      Manage e-scooter registrations, track key deposits, and update statuses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scooterRegistrations.length === 0 ? (
                      <p className="text-gray-500">No scooter registrations yet.</p>
                    ) : (
                      <div className="space-y-6">
                        {scooterRegistrations.map((registration) => (
                          <div key={registration.id} className="p-6 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">Registration #{registration.registrationId}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                                    registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    registration.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    registration.status === 'KEY_ISSUED' ? 'bg-blue-100 text-blue-800' :
                                    registration.status === 'DEPOSIT_PAID' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {registration.status.replace('_', ' ')}
                                  </span>
                                  {registration.emailSent ? (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                      Email Sent
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                      Email Failed
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                Submitted: {new Date(registration.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <Label className="font-medium text-sm">Unit & Owner</Label>
                                <p className="text-sm">Unit {registration.unitNumber}</p>
                                <p className="text-sm">{registration.ownerNames}</p>
                              </div>
                              <div>
                                <Label className="font-medium text-sm">Contact Info</Label>
                                <p className="text-sm">{registration.email}</p>
                                <p className="text-sm">{registration.phone || 'No phone provided'}</p>
                              </div>
                              <div>
                                <Label className="font-medium text-sm">E-Scooter Details</Label>
                                <p className="text-sm">{registration.numberOfScooters} scooter(s)</p>
                                <p className="text-sm">Date: {registration.registrationDate}</p>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <Label className="font-medium text-sm">Description</Label>
                              <p className="text-sm text-gray-700 mt-1">{registration.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div>
                                <Label htmlFor={`status-${registration.id}`} className="text-sm font-medium">Status</Label>
                                <select
                                  id={`status-${registration.id}`}
                                  className="w-full mt-1 p-2 border rounded text-sm"
                                  value={registration.status}
                                  onChange={(e) => updateScooterRegistration(registration.id, { status: e.target.value })}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="APPROVED">Approved</option>
                                  <option value="REJECTED">Rejected</option>
                                  <option value="KEY_ISSUED">Key Issued</option>
                                  <option value="DEPOSIT_PAID">Deposit Paid</option>
                                </select>
                              </div>
                              <div>
                                <Label htmlFor={`key-${registration.id}`} className="text-sm font-medium">Key Number</Label>
                                <Input
                                  id={`key-${registration.id}`}
                                  className="mt-1 text-sm"
                                  value={registration.keyNumber || ''}
                                  onChange={(e) => updateScooterRegistration(registration.id, { keyNumber: e.target.value })}
                                  placeholder="e.g. K-001"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`deposit-${registration.id}`} className="text-sm font-medium">Deposit Amount</Label>
                                <Input
                                  id={`deposit-${registration.id}`}
                                  type="number"
                                  step="0.01"
                                  className="mt-1 text-sm"
                                  value={registration.depositAmount || 50}
                                  onChange={(e) => updateScooterRegistration(registration.id, { depositAmount: e.target.value })}
                                />
                              </div>
                              <div className="flex items-center space-x-2 mt-6">
                                <Checkbox
                                  id={`deposit-paid-${registration.id}`}
                                  checked={registration.depositPaid}
                                  onCheckedChange={(checked) => updateScooterRegistration(registration.id, { depositPaid: checked })}
                                />
                                <Label htmlFor={`deposit-paid-${registration.id}`} className="text-sm">Deposit Paid</Label>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <Label htmlFor={`notes-${registration.id}`} className="text-sm font-medium">Admin Notes</Label>
                              <Textarea
                                id={`notes-${registration.id}`}
                                className="mt-1 text-sm"
                                rows={2}
                                value={registration.notes || ''}
                                onChange={(e) => updateScooterRegistration(registration.id, { notes: e.target.value })}
                                placeholder="Add any admin notes here..."
                              />
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t">
                              <div className="text-sm text-gray-500">
                                Last updated: {new Date(registration.updatedAt).toLocaleString()}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteScooterRegistration(registration.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pet-registrations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pet Registration Management</CardTitle>
                    <CardDescription>
                      Manage pet registrations and update approval statuses. Maximum 2 pets allowed per unit.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {petRegistrations.length === 0 ? (
                      <p className="text-gray-500">No pet registrations yet.</p>
                    ) : (
                      <div className="space-y-6">
                        {petRegistrations.map((registration) => (
                          <div key={registration.id} className="p-6 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">Registration #{registration.registrationId}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                                    registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    registration.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {registration.status}
                                  </span>
                                  {registration.emailSent ? (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                      Email Sent
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                      Email Failed
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                Submitted: {new Date(registration.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium text-sm">Owner Information</h4>
                                <p className="text-sm"><strong>Name:</strong> {registration.ownerName}</p>
                                <p className="text-sm"><strong>Suite:</strong> {registration.suiteNumber}</p>
                                <p className="text-sm"><strong>Email:</strong> {registration.email}</p>
                                <p className="text-sm"><strong>Phone:</strong> {registration.phoneNumber}</p>
                                <p className="text-sm"><strong>Type:</strong> {registration.occupancyType === 'TENANT' ? 'Tenant' : 'Owner Occupied'}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-sm">Pet Details</h4>
                                <p className="text-sm"><strong>Name:</strong> {registration.petName}</p>
                                <p className="text-sm"><strong>Type:</strong> {registration.petType}</p>
                                <p className="text-sm"><strong>Breed:</strong> {registration.petBreed}</p>
                                <p className="text-sm"><strong>Age:</strong> {registration.petAge}</p>
                                <p className="text-sm"><strong>Weight:</strong> {registration.petWeight}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-sm">Physical Description</h4>
                                <p className="text-sm"><strong>Color:</strong> {registration.petColor}</p>
                                <p className="text-sm"><strong>Height:</strong> {registration.petHeight}</p>
                                {registration.distinguishingMarks && (
                                  <p className="text-sm"><strong>Marks:</strong> {registration.distinguishingMarks}</p>
                                )}
                                {registration.licenseNumber && (
                                  <p className="text-sm"><strong>License #:</strong> {registration.licenseNumber}</p>
                                )}
                              </div>
                            </div>

                            {/* Pet Photos */}
                            {registration.photos && registration.photos.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-sm mb-2">Pet Photos ({registration.photos.length})</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {registration.photos.map((photo, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={`/uploads/${photo}`}
                                        alt={`${registration.petName} photo ${index + 1}`}
                                        className="w-full h-32 object-cover rounded border"
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder-pet.jpg';
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Notes */}
                            {registration.notes && (
                              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                                <h4 className="font-medium text-sm text-blue-800 mb-1">Admin Notes:</h4>
                                <p className="text-sm text-blue-700">{registration.notes}</p>
                              </div>
                            )}

                            {/* Status Update Controls */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t">
                              <select
                                value={registration.status}
                                onChange={async (e) => {
                                  try {
                                    const response = await fetch(`/api/pet-registrations/${registration.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: e.target.value })
                                    });
                                    
                                    if (!response.ok) throw new Error('Failed to update status');
                                    
                                    toast({
                                      title: "Status Updated",
                                      description: `Pet registration status changed to ${e.target.value}`,
                                    });
                                    
                                    fetchData(); // Refresh data
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to update status",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="px-3 py-1 text-sm border rounded"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                              </select>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const notes = prompt('Add admin notes (optional):', registration.notes || '');
                                  if (notes !== null) {
                                    try {
                                      const response = await fetch(`/api/pet-registrations/${registration.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                          status: registration.status,
                                          notes: notes || null 
                                        })
                                      });
                                      
                                      if (!response.ok) throw new Error('Failed to update notes');
                                      
                                      toast({
                                        title: "Notes Updated",
                                        description: "Admin notes have been updated",
                                      });
                                      
                                      fetchData();
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to update notes",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Add Notes
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete the pet registration for ${registration.petName}? This action cannot be undone.`)) {
                                    try {
                                      const response = await fetch(`/api/pet-registrations/${registration.id}`, {
                                        method: 'DELETE'
                                      });
                                      
                                      if (!response.ok) throw new Error('Failed to delete registration');
                                      
                                      toast({
                                        title: "Registration Deleted",
                                        description: `Pet registration for ${registration.petName} has been deleted`,
                                      });
                                      
                                      fetchData();
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to delete registration",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Forms Management</CardTitle>
                    <CardDescription>
                      View and export form submissions. All form data is stored in the database and can be exported as CSV.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Emergency Contacts */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Emergency Contacts</CardTitle>
                          <CardDescription>{emergencyContacts.length} submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => exportFormData(emergencyContacts, 'emergency-contact')}
                            className="w-full"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                        </CardContent>
                      </Card>

                      {/* AC Inquiries */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">AC Inquiries</CardTitle>
                          <CardDescription>{acInquiries.length} submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => exportFormData(acInquiries, 'ac-inquiry')}
                            className="w-full"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Storage Rentals */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Storage Rentals</CardTitle>
                          <CardDescription>{storageRentals.length} submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => exportFormData(storageRentals, 'storage-rental')}
                            className="w-full"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Pet Registrations */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Pet Registrations</CardTitle>
                          <CardDescription>{petRegistrations.length} submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => exportFormData(petRegistrations, 'pet-registration')}
                            className="w-full"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Details Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Emergency Contacts Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Emergency Contacts</CardTitle>
                      <CardDescription>Recent emergency contact submissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {emergencyContacts.length === 0 ? (
                        <p className="text-gray-500">No emergency contact submissions yet.</p>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {emergencyContacts.slice(0, 5).map((contact) => (
                            <div key={contact.id} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">Contact #{contact.contactId}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(contact.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm"><strong>Unit:</strong> {contact.unitNumber}</p>
                              <p className="text-sm"><strong>Owner:</strong> {contact.registeredOwnerNames}</p>
                              {contact.emergencyContactName && (
                                <p className="text-sm"><strong>Emergency Contact:</strong> {contact.emergencyContactName}</p>
                              )}
                            </div>
                          ))}
                          {emergencyContacts.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              Showing 5 of {emergencyContacts.length} submissions
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AC Inquiries Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>AC Inquiries</CardTitle>
                      <CardDescription>Recent AC installation inquiries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {acInquiries.length === 0 ? (
                        <p className="text-gray-500">No AC inquiries yet.</p>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {acInquiries.slice(0, 5).map((inquiry) => (
                            <div key={inquiry.id} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">Inquiry #{inquiry.inquiryId}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(inquiry.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm"><strong>Owner:</strong> {inquiry.ownerName}</p>
                              <p className="text-sm"><strong>Unit:</strong> {inquiry.ownerUnit}</p>
                              <p className="text-sm"><strong>Type:</strong> {inquiry.isMultiZone ? 'Multi-Zone' : 'Single-Zone'}</p>
                              <p className="text-sm"><strong>Contact:</strong> {inquiry.bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone'}</p>
                            </div>
                          ))}
                          {acInquiries.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              Showing 5 of {acInquiries.length} inquiries
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Storage Rentals Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Storage Rentals</CardTitle>
                      <CardDescription>Recent storage rental interests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {storageRentals.length === 0 ? (
                        <p className="text-gray-500">No storage rental interests yet.</p>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {storageRentals.slice(0, 5).map((rental) => (
                            <div key={rental.id} className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">Rental #{rental.rentalId}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(rental.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm"><strong>Name:</strong> {rental.firstName} {rental.lastName}</p>
                              <p className="text-sm"><strong>Unit:</strong> {rental.unitNumber}</p>
                              <p className="text-sm"><strong>Contact:</strong> {rental.bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone'}</p>
                              <p className="text-sm"><strong>Interested:</strong> {rental.interestedInInfo ? 'Yes' : 'No'}</p>
                            </div>
                          ))}
                          {storageRentals.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              Showing 5 of {storageRentals.length} interests
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
                            <div className="flex items-center gap-2">
                              <ChangePasswordDialog adminUserId={user.id} onPasswordChanged={onPasswordChanged} />
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
