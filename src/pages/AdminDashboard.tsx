import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { RequireAdminAuth } from '@/components/hoc/RequireAdminAuth';
import { Plus, Trash2, Edit2, Users, FileText, Megaphone, ShoppingCart, Save, X, Database, AlertTriangle, CheckCircle, Zap, PawPrint, Download, ClipboardList, Settings, ShieldAlert, Package, Lock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cleanupMarketplaceData, getCleanupPreview, formatCleanupStats, CleanupOptions } from '@/utils/databaseCleanup';
import ChangePasswordDialog from '@/components/shared/ChangePasswordDialog';
import { exportFormData } from '@/utils/csvExport';
import { exportFormDataAsExcel } from '@/utils/excelExport';
import FormManagement from '@/components/admin/FormManagement';
import IncidentManagement from '@/components/admin/IncidentManagement';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const sectionTitles: Record<string, string> = {
  announcements: 'Announcements',
  pages: 'Pages',
  documents: 'Documents',
  'incident-reports': 'Incident Reports',
  'scooter-registrations': 'Scooter Registrations',
  'pet-registrations': 'Pet Registrations',
  'storage-lockers': 'Storage Locker Applications',
  'form-submissions': 'Form Submissions',
  marketplace: 'Marketplace',
  'form-management': 'Form Email Config',
  'form-k-cleanup': 'Form K Management',
  users: 'Admin Users',
  cleanup: 'DB Cleanup',
};

const AdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = React.useState('announcements');

  const [announcements, setAnnouncements] = useState([]);
  const [pages, setPages] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [marketplacePosts, setMarketplacePosts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scooterRegistrations, setScooterRegistrations] = useState([]);
  const [petRegistrations, setPetRegistrations] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [acInquiries, setACInquiries] = useState([]);
  const [storageRentals, setStorageRentals] = useState([]);
  const [storageLockerApplications, setStorageLockerApplications] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);

  // Form K cleanup states
  const [formKStats, setFormKStats] = useState(null);
  const [expiredFormKs, setExpiredFormKs] = useState([]);
  const [formKCleanupLoading, setFormKCleanupLoading] = useState(false);
  const [formKSubmissions, setFormKSubmissions] = useState([]);
  const [formKSubmissionsLoading, setFormKSubmissionsLoading] = useState(false);

  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newPage, setNewPage] = useState({ slug: '', title: '', content: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  const [newDocument, setNewDocument] = useState({ title: '', description: '', file: null });

  // Edit states
  const [editingPage, setEditingPage] = useState(null);
  const [editPageData, setEditPageData] = useState({ slug: '', title: '', content: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Scooter registration edit states
  const [scooterEdits, setScooterEdits] = useState({});
  const [savingScooter, setSavingScooter] = useState({});

  // Confirm-delete dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const confirmAction = (message: string, onConfirm: () => void) => {
    setDeleteConfirm({ open: true, message, onConfirm });
  };

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
        pagesRes,
        marketplaceRes,
        adminUsersRes,
        documentsRes,
        scooterRegistrationsRes,
        petRegistrationsRes,
        emergencyContactsRes,
        acInquiriesRes,
        storageRentalsRes,
        incidentReportsRes,
        storageLockerApplicationsRes
      ] = await Promise.all([
        fetch('/api/announcements').catch(err => err),
        fetch('/api/pages').catch(err => err),
        fetch('/api/marketplace').catch(err => err),
        fetch('/api/admin/users').catch(err => err),
        fetch('/api/documents').catch(err => err),
        fetch('/api/scooter-registrations').catch(err => err),
        fetch('/api/pet-registrations').catch(err => err),
        fetch('/api/emergency-contacts').catch(err => err),
        fetch('/api/ac-inquiries').catch(err => err),
        fetch('/api/storage-rentals').catch(err => err),
        fetch('/api/incident-reports').catch(err => err),
        fetch('/api/storage-locker-applications').catch(err => err)
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

      // Handle incident reports
      if (incidentReportsRes instanceof Response && incidentReportsRes.ok) {
        const incidentReportsData = await incidentReportsRes.json();
        console.log('AdminDashboard: Incident reports loaded:', incidentReportsData.length);
        setIncidentReports(incidentReportsData);
      } else {
        console.error('AdminDashboard: Failed to load incident reports:', incidentReportsRes);
        setIncidentReports([]);
      }

      // Handle storage locker applications
      if (storageLockerApplicationsRes instanceof Response && storageLockerApplicationsRes.ok) {
        const data = await storageLockerApplicationsRes.json();
        setStorageLockerApplications(data);
      } else {
        setStorageLockerApplications([]);
      }
    } catch (error) {
      console.error('AdminDashboard: Error fetching data:', error);
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Form K Cleanup Functions
  const fetchFormKStats = async () => {
    try {
      const response = await fetch('/api/admin/form-k/statistics');
      const data = await response.json();
      if (data.success) {
        setFormKStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching Form K statistics:', error);
    }
  };

  const fetchExpiredFormKs = async () => {
    try {
      const response = await fetch('/api/admin/form-k/expired');
      const data = await response.json();
      if (data.success) {
        setExpiredFormKs(data.expiredSubmissions);
      }
    } catch (error) {
      console.error('Error fetching expired Form K submissions:', error);
    }
  };

  const performFormKCleanup = async (dryRun = false) => {
    setFormKCleanupLoading(true);
    try {
      const response = await fetch('/api/admin/form-k/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      });

      const data = await response.json();

      if (data.success) {
        const message = dryRun
          ? `Dry run completed. Would purge ${data.expiredSubmissions.length} expired submissions.`
          : `Successfully purged ${data.purgedCount} expired Form K submissions.`;

        toast({
          title: "Form K Cleanup",
          description: message,
        });

        // Refresh data
        await fetchFormKStats();
        await fetchExpiredFormKs();
      } else {
        throw new Error(data.error || 'Cleanup failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setFormKCleanupLoading(false);
    }
  };

  const fetchFormKSubmissions = async () => {
    setFormKSubmissionsLoading(true);
    try {
      const response = await fetch('/api/form-k-submissions');
      if (response.ok) {
        const data = await response.json();
        setFormKSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching Form K submissions:', error);
    } finally {
      setFormKSubmissionsLoading(false);
    }
  };

  // Fetch Form K submissions when section becomes active
  useEffect(() => {
    if (activeSection === 'form-k-cleanup') {
      fetchFormKStats();
      fetchExpiredFormKs();
      fetchFormKSubmissions();
    }
  }, [activeSection]);

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

  // Helper function to get current scooter edit data
  const getScooterEditData = (registration) => {
    return scooterEdits[registration.id] || {
      status: registration.status,
      keyNumber: registration.keyNumber || '',
      depositAmount: registration.depositAmount || 50,
      depositPaid: registration.depositPaid,
      notes: registration.notes || ''
    };
  };

  // Helper function to update local scooter edit state
  const updateScooterEdit = (id, field, value) => {
    setScooterEdits(prev => ({
      ...prev,
      [id]: {
        ...getScooterEditData(scooterRegistrations.find(r => r.id === id)),
        [field]: value
      }
    }));
  };

  // Helper function to check if scooter has unsaved changes
  const hasScooterChanges = (registration) => {
    const edits = scooterEdits[registration.id];
    if (!edits) return false;

    return (
      edits.status !== registration.status ||
      edits.keyNumber !== (registration.keyNumber || '') ||
      edits.depositAmount !== registration.depositAmount ||
      edits.depositPaid !== registration.depositPaid ||
      edits.notes !== (registration.notes || '')
    );
  };

  // Submit scooter registration updates
  const updateScooterRegistration = async (id) => {
    const edits = scooterEdits[id];
    if (!edits) return;

    setSavingScooter(prev => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`/api/scooter-registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits)
      });

      if (response.ok) {
        toast({ title: "Success", description: "Scooter registration updated successfully." });
        // Clear the edit state for this registration
        setScooterEdits(prev => {
          const newEdits = { ...prev };
          delete newEdits[id];
          return newEdits;
        });
        fetchData(); // Refresh all data
      } else {
        throw new Error('Failed to update scooter registration');
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingScooter(prev => ({ ...prev, [id]: false }));
    }
  };

  // Cancel scooter registration edits
  const cancelScooterEdit = (id) => {
    setScooterEdits(prev => {
      const newEdits = { ...prev };
      delete newEdits[id];
      return newEdits;
    });
  };

  const deleteScooterRegistration = (id) => {
    confirmAction('Are you sure you want to delete this scooter registration? This action cannot be undone.', async () => {
      try {
        const response = await fetch(`/api/scooter-registrations/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          toast({ title: "Success", description: "Scooter registration deleted successfully." });
          fetchData();
        } else {
          throw new Error('Failed to delete scooter registration');
        }
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <RequireAdminAuth>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <SidebarProvider>
          <div className="flex flex-1 w-full">
            {/* Sidebar */}
            <Sidebar collapsible="offcanvas" className="border-r">
              <SidebarContent>
                {/* Content Management group */}
                <SidebarGroup>
                  <SidebarGroupLabel>Content Management</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'announcements'} onClick={() => setActiveSection('announcements')}>
                          <Megaphone className="w-4 h-4" />
                          <span>Announcements</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'pages'} onClick={() => setActiveSection('pages')}>
                          <FileText className="w-4 h-4" />
                          <span>Pages</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'documents'} onClick={() => setActiveSection('documents')}>
                          <FileText className="w-4 h-4" />
                          <span>Documents</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Submissions group */}
                <SidebarGroup>
                  <SidebarGroupLabel>Submissions</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'incident-reports'} onClick={() => setActiveSection('incident-reports')}>
                          <ShieldAlert className="w-4 h-4" />
                          <span>Incident Reports</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'scooter-registrations'} onClick={() => setActiveSection('scooter-registrations')}>
                          <Zap className="w-4 h-4" />
                          <span>Scooter Registrations</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'pet-registrations'} onClick={() => setActiveSection('pet-registrations')}>
                          <PawPrint className="w-4 h-4" />
                          <span>Pet Registrations</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'storage-lockers'} onClick={() => setActiveSection('storage-lockers')}>
                          <Package className="w-4 h-4" />
                          <span>Storage Lockers</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'form-submissions'} onClick={() => setActiveSection('form-submissions')}>
                          <ClipboardList className="w-4 h-4" />
                          <span>Form Submissions</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Marketplace group */}
                <SidebarGroup>
                  <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'marketplace'} onClick={() => setActiveSection('marketplace')}>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Marketplace</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Settings group */}
                <SidebarGroup>
                  <SidebarGroupLabel>Settings</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'form-management'} onClick={() => setActiveSection('form-management')}>
                          <Settings className="w-4 h-4" />
                          <span>Form Email Config</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'form-k-cleanup'} onClick={() => setActiveSection('form-k-cleanup')}>
                          <Database className="w-4 h-4" />
                          <span>Form K Management</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'users'} onClick={() => setActiveSection('users')}>
                          <Users className="w-4 h-4" />
                          <span>Admin Users</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive={activeSection === 'cleanup'} onClick={() => setActiveSection('cleanup')}>
                          <Trash2 className="w-4 h-4" />
                          <span>DB Cleanup</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>

            {/* Main content */}
            <SidebarInset className="flex-1 overflow-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-2xl font-bold">{sectionTitles[activeSection]}</h1>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>Log Out</Button>
                </div>

                <Alert className="mb-6">
                  <AlertDescription>Welcome back, {adminUser?.email}!</AlertDescription>
                </Alert>

                {activeSection === 'announcements' && (
                  <div className="space-y-6">
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
                  </div>
                )}

                {activeSection === 'pages' && (
                  <div className="space-y-6">
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
                  </div>
                )}

                {activeSection === 'documents' && (
                  <div className="space-y-6">
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
                  </div>
                )}

                {activeSection === 'incident-reports' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldAlert className="h-5 w-5 text-orange-500" />
                          Incident Reports
                        </CardTitle>
                        <CardDescription>
                          Track and manage incident reports through to resolution.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <IncidentManagement
                          initialReports={incidentReports}
                          onReportsChange={setIncidentReports}
                          onDeleteConfirm={confirmAction}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === 'scooter-registrations' && (
                  <div className="space-y-6">
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
                            {scooterRegistrations.map((registration) => {
                              const editData = getScooterEditData(registration);
                              const hasChanges = hasScooterChanges(registration);
                              const isSaving = savingScooter[registration.id];

                              return (
                                <div key={registration.id} className="p-6 border rounded-lg bg-gray-50">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <h3 className="font-semibold text-lg">Registration #{registration.registrationId}</h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                                          editData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                          editData.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                          editData.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                          editData.status === 'KEY_ISSUED' ? 'bg-blue-100 text-blue-800' :
                                          editData.status === 'DEPOSIT_PAID' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {editData.status.replace('_', ' ')}
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
                                        {hasChanges && (
                                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                            Unsaved Changes
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
                                        value={editData.status}
                                        onChange={(e) => updateScooterEdit(registration.id, 'status', e.target.value)}
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
                                        value={editData.keyNumber}
                                        onChange={(e) => updateScooterEdit(registration.id, 'keyNumber', e.target.value)}
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
                                        value={editData.depositAmount}
                                        onChange={(e) => updateScooterEdit(registration.id, 'depositAmount', e.target.value)}
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2 mt-6">
                                      <Checkbox
                                        id={`deposit-paid-${registration.id}`}
                                        checked={editData.depositPaid}
                                        onCheckedChange={(checked) => updateScooterEdit(registration.id, 'depositPaid', checked)}
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
                                      value={editData.notes}
                                      onChange={(e) => updateScooterEdit(registration.id, 'notes', e.target.value)}
                                      placeholder="Add any admin notes here..."
                                    />
                                  </div>

                                  <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="text-sm text-gray-500">
                                      Last updated: {new Date(registration.updatedAt).toLocaleString()}
                                    </div>
                                    <div className="flex gap-2">
                                      {hasChanges && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => cancelScooterEdit(registration.id)}
                                            disabled={isSaving}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => updateScooterRegistration(registration.id)}
                                            disabled={isSaving}
                                          >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                          </Button>
                                        </>
                                      )}
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
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === 'pet-registrations' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Pet Registration Management</CardTitle>
                            <CardDescription>
                              Manage pet registrations and update approval statuses. Maximum 2 pets allowed per unit.
                            </CardDescription>
                          </div>
                          {petRegistrations.length > 0 && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportFormData(petRegistrations, 'pet-registration')}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Export CSV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportFormDataAsExcel(petRegistrations, 'pet-registration')}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Export Excel
                              </Button>
                            </div>
                          )}
                        </div>
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
                                    onClick={() => {
                                      confirmAction(
                                        `Are you sure you want to delete the pet registration for ${registration.petName}? This action cannot be undone.`,
                                        async () => {
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
                                      );
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
                  </div>
                )}

                {activeSection === 'storage-lockers' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-purple-600" />
                              Storage Locker Applications
                            </CardTitle>
                            <CardDescription>
                              Review and approve/reject locker applications. Approved lockers are immediately marked as assigned and no longer selectable by residents.
                            </CardDescription>
                          </div>
                          {storageLockerApplications.length > 0 && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => exportFormData(storageLockerApplications, 'storage-locker-application')} className="flex items-center gap-2">
                                <Download className="h-4 w-4" />Export CSV
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => exportFormDataAsExcel(storageLockerApplications, 'storage-locker-application')} className="flex items-center gap-2">
                                <Download className="h-4 w-4" />Export Excel
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {storageLockerApplications.length === 0 ? (
                          <p className="text-gray-500">No storage locker applications yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {storageLockerApplications.map((app: any) => (
                              <div key={app.id} className="p-5 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold">Application #{app.applicationId}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                                        app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {app.status}
                                      </span>
                                      {app.emailSent ? (
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Email Sent</span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Email Failed</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Applicant</h4>
                                    <p className="text-sm"><strong>Name:</strong> {app.firstName} {app.lastName}</p>
                                    <p className="text-sm"><strong>Unit:</strong> {app.unitNumber}</p>
                                    <p className="text-sm"><strong>Address:</strong> {app.address}</p>
                                    <p className="text-sm"><strong>Phone:</strong> {app.telephone}</p>
                                    <p className="text-sm"><strong>Email:</strong> {app.email}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Selected Locker</h4>
                                    {app.locker ? (
                                      <>
                                        <p className="text-sm"><strong>Locker #:</strong> {app.locker.lockerNumber}</p>
                                        <p className="text-sm"><strong>Location:</strong> {app.locker.location}</p>
                                        <p className="text-sm"><strong>Dimensions:</strong> {app.locker.dimensions}</p>
                                        <p className="text-sm"><strong>Rent:</strong> ${app.locker.monthlyRent}/month</p>
                                        <p className="text-sm">
                                          <strong>Locker Status:</strong>{' '}
                                          <span className={app.locker.status === 'ASSIGNED' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                            {app.locker.status}
                                          </span>
                                        </p>
                                        {app.locker.notes && <p className="text-xs text-amber-600">{app.locker.notes}</p>}
                                      </>
                                    ) : <p className="text-sm text-gray-400">Locker data unavailable</p>}
                                  </div>
                                </div>

                                {app.adminNotes && (
                                  <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                                    <h4 className="font-medium text-sm text-blue-800 mb-1">Admin Notes:</h4>
                                    <p className="text-sm text-blue-700">{app.adminNotes}</p>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-3 pt-3 border-t">
                                  <select
                                    value={app.status}
                                    onChange={async (e) => {
                                      try {
                                        const r = await fetch(`/api/storage-locker-applications/${app.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: e.target.value })
                                        });
                                        if (!r.ok) throw new Error('Failed');
                                        toast({ title: 'Status Updated', description: `Application ${e.target.value.toLowerCase()}` });
                                        fetchData();
                                      } catch {
                                        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
                                      }
                                    }}
                                    className="px-3 py-1 text-sm border rounded"
                                  >
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                  </select>

                                  <Button variant="outline" size="sm" onClick={async () => {
                                    const notes = prompt('Admin notes (optional):', app.adminNotes || '');
                                    if (notes !== null) {
                                      try {
                                        await fetch(`/api/storage-locker-applications/${app.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ adminNotes: notes || null })
                                        });
                                        toast({ title: 'Notes Saved' });
                                        fetchData();
                                      } catch {
                                        toast({ title: 'Error', description: 'Failed to save notes', variant: 'destructive' });
                                      }
                                    }
                                  }}>
                                    <Edit2 className="h-3 w-3 mr-1" />Add Notes
                                  </Button>

                                  <Button variant="destructive" size="sm" onClick={() => confirmAction(
                                    `Delete application ${app.applicationId}? This cannot be undone.`,
                                    async () => {
                                      try {
                                        await fetch(`/api/storage-locker-applications/${app.id}`, { method: 'DELETE' });
                                        toast({ title: 'Deleted', description: 'Application removed' });
                                        fetchData();
                                      } catch {
                                        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
                                      }
                                    }
                                  )}>
                                    <Trash2 className="h-3 w-3 mr-1" />Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === 'form-submissions' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Forms Management</CardTitle>
                        <CardDescription>
                          View and export form submissions. All form data is stored in the database and can be exported as CSV.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                          {/* Emergency Contacts */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Emergency Contacts</CardTitle>
                              <CardDescription>{emergencyContacts.length} submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Button
                                  onClick={() => exportFormData(emergencyContacts, 'emergency-contact')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </Button>
                                <Button
                                  onClick={() => exportFormDataAsExcel(emergencyContacts, 'emergency-contact')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export Excel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {/* AC Inquiries */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">AC Inquiries</CardTitle>
                              <CardDescription>{acInquiries.length} submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Button
                                  onClick={() => exportFormData(acInquiries, 'ac-inquiry')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </Button>
                                <Button
                                  onClick={() => exportFormDataAsExcel(acInquiries, 'ac-inquiry')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export Excel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Storage Rentals */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Storage Rentals</CardTitle>
                              <CardDescription>{storageRentals.length} submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Button
                                  onClick={() => exportFormData(storageRentals, 'storage-rental')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </Button>
                                <Button
                                  onClick={() => exportFormDataAsExcel(storageRentals, 'storage-rental')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export Excel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Pet Registrations */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Pet Registrations</CardTitle>
                              <CardDescription>{petRegistrations.length} submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Button
                                  onClick={() => exportFormData(petRegistrations, 'pet-registration')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </Button>
                                <Button
                                  onClick={() => exportFormDataAsExcel(petRegistrations, 'pet-registration')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export Excel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Scooter Registrations */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Scooter Registrations</CardTitle>
                              <CardDescription>{scooterRegistrations.length} submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Button
                                  onClick={() => exportFormData(scooterRegistrations, 'scooter-registration')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export CSV
                                </Button>
                                <Button
                                  onClick={() => exportFormDataAsExcel(scooterRegistrations, 'scooter-registration')}
                                  className="w-full"
                                  variant="outline"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Export Excel
                                </Button>
                              </div>
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

                      {/* Scooter Registrations Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Scooter Registrations</CardTitle>
                          <CardDescription>Recent scooter registration submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {scooterRegistrations.length === 0 ? (
                            <p className="text-gray-500">No scooter registrations yet.</p>
                          ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {scooterRegistrations.slice(0, 5).map((registration) => (
                                <div key={registration.id} className="p-4 border rounded-lg bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold">Registration #{registration.registrationId}</h4>
                                    <span className="text-sm text-gray-500">
                                      {new Date(registration.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm"><strong>Unit:</strong> {registration.unitNumber}</p>
                                  <p className="text-sm"><strong>Owners:</strong> {registration.ownerNames}</p>
                                  <p className="text-sm"><strong>Scooters:</strong> {registration.numberOfScooters}</p>
                                  <p className="text-sm"><strong>Status:</strong> {registration.status}</p>
                                  <p className="text-sm"><strong>Deposit:</strong> {registration.depositPaid ? 'Paid' : 'Pending'}</p>
                                </div>
                              ))}
                              {scooterRegistrations.length > 5 && (
                                <p className="text-sm text-gray-500 text-center">
                                  Showing 5 of {scooterRegistrations.length} registrations
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeSection === 'marketplace' && (
                  <div className="space-y-6">
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
                  </div>
                )}

                {activeSection === 'form-management' && (
                  <div className="space-y-6">
                    <FormManagement />
                  </div>
                )}

                {activeSection === 'form-k-cleanup' && (
                  <div className="space-y-6">
                    {/* Submissions List */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Form K Submissions
                        </CardTitle>
                        <CardDescription>
                          All Form K submissions ({formKSubmissions.length} total)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-end mb-4">
                          <Button
                            onClick={fetchFormKSubmissions}
                            variant="outline"
                            size="sm"
                            disabled={formKSubmissionsLoading}
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Refresh
                          </Button>
                        </div>

                        {formKSubmissionsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : formKSubmissions.length === 0 ? (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              No Form K submissions found. Submissions will appear here once residents complete the Form K.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="pb-2 font-medium">Unit</th>
                                  <th className="pb-2 font-medium">Strata Plan</th>
                                  <th className="pb-2 font-medium">Tenant</th>
                                  <th className="pb-2 font-medium">Landlord</th>
                                  <th className="pb-2 font-medium">Method</th>
                                  <th className="pb-2 font-medium">Status</th>
                                  <th className="pb-2 font-medium">Email Sent</th>
                                  <th className="pb-2 font-medium">Submitted</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formKSubmissions.map((sub) => {
                                  const isComplete = sub.landlordSignatureCompleted &&
                                    sub.tenant1SignatureCompleted &&
                                    (!sub.tenant2Name || sub.tenant2SignatureCompleted);
                                  return (
                                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                                      <td className="py-2 pr-4 font-medium">{sub.unitNumber}</td>
                                      <td className="py-2 pr-4">{sub.strataPlan}</td>
                                      <td className="py-2 pr-4">
                                        {sub.tenant1Name}
                                        {sub.tenant2Name ? ` & ${sub.tenant2Name}` : ''}
                                      </td>
                                      <td className="py-2 pr-4">{sub.landlordName}</td>
                                      <td className="py-2 pr-4">
                                        <span className={`px-2 py-0.5 text-xs rounded ${
                                          sub.tenantSigningMethod === 'present'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                        }`}>
                                          {sub.tenantSigningMethod === 'present' ? 'In-Person' : 'Email'}
                                        </span>
                                      </td>
                                      <td className="py-2 pr-4">
                                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                                          isComplete
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {isComplete ? 'Complete' : 'Pending'}
                                        </span>
                                      </td>
                                      <td className="py-2 pr-4">
                                        {sub.emailSent ? (
                                          <span className="text-green-600 text-xs flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Sent
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 text-xs">No</span>
                                        )}
                                      </td>
                                      <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Form K Data Retention & Cleanup
                        </CardTitle>
                        <CardDescription>
                          Manage Form K submissions with automatic 6-month expiration and data purging for compliance.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Statistics Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                                  <p className="text-2xl font-bold">{formKStats?.total || 0}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-500" />
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Active (&lt; 6 months)</p>
                                  <p className="text-2xl font-bold text-green-600">{formKStats?.active || 0}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Expired (&gt; 6 months)</p>
                                  <p className="text-2xl font-bold text-red-600">{formKStats?.expired || 0}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Actions Section */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            onClick={() => { fetchFormKStats(); fetchFormKSubmissions(); }}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Database className="h-4 w-4" />
                            Refresh Statistics
                          </Button>

                          <Button
                            onClick={() => performFormKCleanup(true)}
                            variant="outline"
                            disabled={formKCleanupLoading}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Preview Cleanup (Dry Run)
                          </Button>

                          <Button
                            onClick={() => performFormKCleanup(false)}
                            variant="destructive"
                            disabled={formKCleanupLoading || (formKStats?.expired || 0) === 0}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            {formKCleanupLoading ? 'Cleaning...' : 'Purge Expired Data'}
                          </Button>
                        </div>

                        {/* Information Section */}
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Data Retention Policy:</strong> Form K submissions are automatically expired after 6 months
                            ({formKStats?.expirationMonths || 6} months) from creation date.
                            Expired submissions can be safely purged to comply with data retention requirements.
                            {formKStats?.expirationCutoffDate && (
                              <><br />Current cutoff date: <strong>{new Date(formKStats.expirationCutoffDate).toLocaleDateString()}</strong></>
                            )}
                          </AlertDescription>
                        </Alert>

                        {/* Expired Submissions List */}
                        {expiredFormKs.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Expired Form K Submissions ({expiredFormKs.length})</CardTitle>
                              <CardDescription>
                                These submissions are older than 6 months and can be purged.
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {expiredFormKs.map((submission) => {
                                  const age = Math.floor((new Date() - new Date(submission.createdAt)) / (1000 * 60 * 60 * 24));
                                  return (
                                    <div key={submission.id} className="flex items-center justify-between p-2 border rounded">
                                      <div>
                                        <p className="font-medium">Unit {submission.unitNumber}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {submission.tenant1Name}
                                          {submission.tenant2Name && ` & ${submission.tenant2Name}`}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium">{age} days old</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(submission.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === 'users' && (
                  <div className="space-y-6">
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
                  </div>
                )}

                {activeSection === 'cleanup' && (
                  <div className="space-y-6">
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
                  </div>
                )}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
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

        {/* Confirm-delete dialog */}
        <Dialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>{deleteConfirm.message}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteConfirm((prev) => ({ ...prev, open: false }));
                  deleteConfirm.onConfirm();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAdminAuth>
  );
};

export default AdminDashboard;
