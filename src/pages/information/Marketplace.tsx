import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageIcon, X, CheckCircle, AlertCircle, Upload, Trash2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_CONFIG } from '@/config/recaptcha';
import { uploadImage, validateImage, ImageUploadResult } from '@/utils/imageUpload';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getAuthorId } from '@/utils/authorId';

interface MarketplacePost {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'sell' | 'buy' | 'trade';
  price?: number;
  authorName: string;
  authorEmail: string;
  authorPhone?: string;
  isSold: boolean;
  images?: string[];
  createdAt: string;
  replies: MarketplaceReply[];
  authorId: string;
}

interface MarketplaceReply {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorPhone?: string;
  images?: string[];
  createdAt: string;
}

const Marketplace = () => {
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: '',
    type: 'sell' as 'sell' | 'buy' | 'trade',
    price: '',
    authorName: '',
    authorEmail: '',
    authorPhone: ''
  });
  const [replyForm, setReplyForm] = useState({
    postId: '',
    content: '',
    authorName: '',
    authorEmail: '',
    authorPhone: ''
  });
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [postImages, setPostImages] = useState<string[]>([]);
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [uploadingReply, setUploadingReply] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [replyRecaptchaToken, setReplyRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const replyRecaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();
  const [authorId, setAuthorId] = useState<string>('');

  const categories = [
    'Electronics', 'Furniture', 'Appliances', 'Books & Media', 'Clothing', 
    'Sports & Recreation', 'Tools & Hardware', 'Home Decor', 'Other'
  ];

  useEffect(() => {
    setAuthorId(getAuthorId());
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/marketplace');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => {
    if (!phone) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleImageUpload = async (file: File, isReply: boolean = false) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      toast({ title: "Error", description: validation.error, variant: "destructive" });
      return;
    }

    const setUploading = isReply ? setUploadingReply : setUploadingPost;
    setUploading(true);

    try {
      const result = await uploadImage(file);
      if (result.success && result.imageUrl) {
        const setImages = isReply ? setReplyImages : setPostImages;
        setImages(prev => [...prev, result.imageUrl!]);
        toast({ title: "Success", description: "Image uploaded successfully" });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : 'Failed to upload image', variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number, isReply: boolean = false) => {
    const setImages = isReply ? setReplyImages : setPostImages;
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.description || !newPost.authorName || !newPost.authorEmail) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!validateEmail(newPost.authorEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (!validatePhone(newPost.authorPhone)) {
      toast({ title: "Error", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    if (!recaptchaToken) {
      toast({ title: "Error", description: "Please complete the reCAPTCHA verification", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          price: newPost.price ? parseFloat(newPost.price) : null,
          images: postImages,
          recaptchaToken
        }),
      });

      if (response.ok) {
        const createdPost = await response.json();
        toast({ title: "Success", description: "Your post has been created successfully" });
        setNewPost({ title: '', description: '', category: '', type: 'sell', price: '', authorName: '', authorEmail: '', authorPhone: '' });
        setPostImages([]);
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
        setShowNewPostDialog(false);
        fetchPosts();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to create post. Please try again.', variant: "destructive" });
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyForm.content || !replyForm.authorName || !replyForm.authorEmail) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!validateEmail(replyForm.authorEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (!validatePhone(replyForm.authorPhone)) {
      toast({ title: "Error", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    if (!replyRecaptchaToken) {
      toast({ title: "Error", description: "Please complete the reCAPTCHA verification", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/${replyForm.postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...replyForm,
          images: replyImages,
          recaptchaToken: replyRecaptchaToken
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Your reply has been posted" });
        setReplyForm({ postId: '', content: '', authorName: '', authorEmail: '', authorPhone: '' });
        setReplyImages([]);
        setReplyRecaptchaToken(null);
        replyRecaptchaRef.current?.reset();
        setShowReplyDialog(false);
        fetchPosts();
      } else {
        throw new Error('Failed to post reply');
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to post reply. Please try again.', variant: "destructive" });
    }
  };

  const markAsSold = async (postId: string) => {
    try {
      const response = await fetch(`/api/marketplace/${postId}/sold`, { method: 'PUT' });
      if (response.ok) {
        toast({ title: "Success", description: "Post marked as sold" });
        fetchPosts();
      } else {
        throw new Error('Failed to mark as sold');
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not mark post as sold.", variant: "destructive" });
    }
  };

  const isAuthorOrAdmin = (post: MarketplacePost) => {
    if (adminUser) return true;
    return authorId === post.authorId;
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.type === filter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sell': return 'bg-green-100 text-green-800';
      case 'buy': return 'bg-blue-100 text-blue-800';
      case 'trade': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader title="Strata Marketplace" description="Buy, sell, and trade items with your neighbors" />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter posts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="sell">For Sale</SelectItem>
              <SelectItem value="buy">Looking to Buy</SelectItem>
              <SelectItem value="trade">For Trade</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewPostDialog(true)}>
            <Upload className="mr-2 h-4 w-4" /> Create a New Post
          </Button>
        </div>

        {loading ? (
          <p>Loading posts...</p>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No posts match the current filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className={post.isSold ? 'bg-gray-50' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(post.type)}>{post.type}</Badge>
                      <Badge variant="secondary">{post.category}</Badge>
                    </div>
                  </div>
                  {post.price && post.type === 'sell' && (
                    <p className="text-lg font-semibold text-primary">${post.price.toFixed(2)}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
                  {post.images && post.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {post.images.map((image, index) => (
                        <img key={index} src={image} alt={`${post.title} ${index + 1}`} className="rounded-lg object-cover w-full h-40" />
                      ))}
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <p>Posted by {post.authorName} on {new Date(post.createdAt).toLocaleDateString()}</p>
                      <p className="font-mono text-xs mt-1">Post ID: @OP+{post.authorId.substring(5, 12)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {!post.isSold && isAuthorOrAdmin(post) && (
                        <Button variant="outline" size="sm" onClick={() => markAsSold(post.id)} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Mark as Sold
                        </Button>
                      )}
                      {post.isSold && (
                        <Badge variant="secondary" className="text-green-600 bg-green-100 py-1 px-3 rounded-full">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Sold
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setReplyForm({ ...replyForm, postId: post.id }); setShowReplyDialog(true); }}>
                        Reply ({post.replies.length})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create a New Marketplace Post</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitPost} className="space-y-4">
            {/* Form fields ... */}
          </form>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Reply to Post</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitReply} className="space-y-4">
            {/* Form fields ... */}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;