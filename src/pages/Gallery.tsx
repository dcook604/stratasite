import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Trash2, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

const GalleryPage = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      toast({ title: 'Error', description: 'Failed to load gallery images.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const openImageViewer = (image: GalleryImage) => {
    setCurrentImage(image);
    setViewerOpen(true);
  };

  const closeImageViewer = () => {
    setViewerOpen(false);
    setCurrentImage(null);
  };

  const handleDelete = async (imageId: string) => {
    if (!adminUser) return;
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/gallery/${imageId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Image deleted successfully.' });
        fetchImages(); // Refresh the gallery
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({ title: 'Error', description: 'Failed to delete image.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Photo Gallery"
        description="A collection of photos from our community and building."
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {adminUser && (
          <div className="text-right mb-4">
            <UploadDialog onUploadSuccess={fetchImages} />
          </div>
        )}
        {loading ? (
          <div className="text-center">Loading images...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group relative">
                <img
                  src={image.url}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-64 object-cover rounded-lg cursor-pointer transition-transform transform hover:scale-105"
                  onClick={() => openImageViewer(image)}
                />
                {adminUser && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Image Viewer Lightbox */}
      <Dialog open={isViewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl p-0">
          <img src={currentImage?.url} alt={currentImage?.title || ''} className="w-full h-auto rounded-lg" />
          <DialogHeader className="p-6">
            {currentImage?.title && <DialogTitle>{currentImage.title}</DialogTitle>}
            {currentImage?.description && <DialogDescription>{currentImage.description}</DialogDescription>}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Separate component for the upload dialog to manage its own state
const UploadDialog = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'Error', description: 'Please select an image to upload.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Image uploaded successfully.' });
        onUploadSuccess();
        setIsOpen(false);
        // Reset form
        setFile(null);
        setTitle('');
        setDescription('');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Photo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a New Photo</DialogTitle>
          <DialogDescription>Select an image and provide an optional title and description.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="image-file">Image File</Label>
            <Input id="image-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryPage;
