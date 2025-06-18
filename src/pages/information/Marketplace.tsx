import React, { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { uploadImage, validateImage } from '@/utils/imageUpload';
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
  const [activePost, setActivePost] = useState<MarketplacePost | null>(null);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [postImages, setPostImages] = useState<string[]>([]);
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [uploadingReply, setUploadingReply] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();
  const [authorId, setAuthorId] = useState<string>('');

  const categories = [
    'Free Donations', 'Services', 'Volunteer', 'Electronics', 'Furniture', 'Appliances', 'Books & Media', 'Clothing', 
    'Sports & Recreation', 'Tools & Hardware', 'Home Decor', 'Other'
  ];

  useEffect(() => {
    setAuthorId(getAuthorId());
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
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

  const handleNewPostOpen = () => {
    setNewPost({ title: '', description: '', category: '', type: 'sell', price: '', authorName: '', authorEmail: '', authorPhone: '' });
    setPostImages([]);
    setTurnstileToken(null);
    setShowNewPostDialog(true);
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
    if (!turnstileToken) {
      toast({ title: "Error", description: "Please complete the CAPTCHA verification", variant: "destructive" });
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
          turnstileToken
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Your post has been created successfully" });
        setShowNewPostDialog(false);
        fetchPosts();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to create post. Please try again.', variant: "destructive" });
    }
  };

  const handleReplyOpen = (post: MarketplacePost) => {
    setActivePost(post);
    setReplyForm({ postId: post.id, content: '', authorName: '', authorEmail: '', authorPhone: '' });
    setReplyImages([]);
    setTurnstileToken(null);
    setShowReplyDialog(true);
    setShowDetailsDialog(false);
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
    if (!turnstileToken) {
      toast({ title: "Error", description: "Please complete the CAPTCHA verification", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/${replyForm.postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...replyForm,
          images: replyImages,
          turnstileToken: turnstileToken
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Your reply has been posted" });
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
      const response = await fetch(`/api/marketplace/${postId}/sold`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Post marked as sold" });
        fetchPosts();
        setShowDetailsDialog(false);
      } else {
        throw new Error('Failed to mark as sold');
      }
    } catch (error) {
      toast({ title: "Error", description: 'You do not have permission to perform this action.', variant: "destructive" });
    }
  };
  
  const isAuthorOrAdmin = (post: MarketplacePost) => {
    return adminUser || post.authorId === authorId;
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sell': return 'bg-blue-100 text-blue-800';
      case 'buy': return 'bg-green-100 text-green-800';
      case 'trade': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPosts = posts.filter(post => filter === 'all' || post.type === filter);

  const handleDetailsOpen = (post: MarketplacePost) => {
    setActivePost(post);
    setShowDetailsDialog(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader title="Marketplace" description="Buy, sell, or trade items with your neighbors." />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'sell' ? 'default' : 'outline'} onClick={() => setFilter('sell')}>For Sale</Button>
            <Button variant={filter === 'buy' ? 'default' : 'outline'} onClick={() => setFilter('buy')}>Wanted</Button>
            <Button variant={filter === 'trade' ? 'default' : 'outline'} onClick={() => setFilter('trade')}>Trade</Button>
          </div>
          <Button onClick={handleNewPostOpen}>Create New Post</Button>
        </div>

        {loading ? <p>Loading marketplace...</p> : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(post => (
              <Card key={post.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className={getTypeColor(post.type)}>{post.type}</Badge>
                      <CardTitle className="mt-2">{post.title}</CardTitle>
                    </div>
                    {post.isSold && <Badge variant="destructive">SOLD</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  {post.images && post.images.length > 0 && <img src={post.images[0]} alt={post.title} className="w-full h-48 object-cover rounded-md mb-4" />}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.description}</p>
                  {post.price && post.type === 'sell' && <p className="font-bold text-lg mb-2">${post.price.toFixed(2)}</p>}
                  <p className="text-xs text-gray-500">Posted by {post.authorName} on {new Date(post.createdAt).toLocaleDateString()}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button variant="outline" className="w-full" onClick={() => handleDetailsOpen(post)}>View Details & Replies</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create a New Post</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitPost} className="space-y-4 mt-4">
            <Input placeholder="Title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} required />
            <Textarea placeholder="Description" value={newPost.description} onChange={(e) => setNewPost({ ...newPost, description: e.target.value })} required />
            <Select onValueChange={(value) => setNewPost({ ...newPost, type: value as any })} defaultValue={newPost.type}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sell">For Sale</SelectItem>
                <SelectItem value="buy">Wanted</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
              </SelectContent>
            </Select>
            {newPost.type === 'sell' && <Input type="number" placeholder="Price (e.g., 20.00)" value={newPost.price} onChange={(e) => setNewPost({ ...newPost, price: e.target.value })} />}
            <Select onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
            <Input placeholder="Your Name" value={newPost.authorName} onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })} required />
            <Input type="email" placeholder="Your Email" value={newPost.authorEmail} onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })} required />
            <Input placeholder="Phone (Optional)" value={newPost.authorPhone} onChange={(e) => setNewPost({ ...newPost, authorPhone: e.target.value })} />
            <div className="space-y-2">
                <Label>Images (up to 3)</Label>
                <div className="flex items-center gap-2">
                    <Input id="post-image-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} className="hidden" disabled={postImages.length >= 3 || uploadingPost} />
                    <Label htmlFor="post-image-upload" className={`cursor-pointer ${postImages.length >= 3 || uploadingPost ? 'opacity-50' : ''}`}><Button type="button" asChild={true} variant="outline" disabled={postImages.length >= 3 || uploadingPost}><span className='flex items-center'><Upload className="mr-2 h-4 w-4" />{uploadingPost ? 'Uploading...' : 'Upload'}</span></Button></Label>
                </div>
                <div className="flex gap-2 mt-2">
                    {postImages.map((img, i) => <div key={i} className="relative"><img src={img} alt="upload preview" className="h-20 w-20 object-cover rounded"/><Button type="button" variant="destructive" size="icon" className="absolute top-0 right-0 h-5 w-5" onClick={() => removeImage(i)}><X className="h-3 w-3"/></Button></div>)}
                </div>
            </div>
            <Turnstile onSuccess={setTurnstileToken} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} />
            <Button type="submit" className="w-full">Submit Post</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      {activePost && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{activePost.title}</DialogTitle></DialogHeader>
            {activePost.images && activePost.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {activePost.images.map((img, i) => <img key={i} src={img} alt={`${activePost.title} image ${i+1}`} className="w-full h-auto object-cover rounded" />)}
                </div>
            )}
            <p className="mt-4">{activePost.description}</p>
            <Separator className="my-4" />
            <h3 className="font-bold mb-2">Replies ({activePost.replies.length})</h3>
            <div className="space-y-4">
              {activePost.replies.map(reply => (
                <div key={reply.id} className="border-t pt-4">
                   {reply.images && reply.images.length > 0 && <img src={reply.images[0]} alt="reply image" className="w-full h-32 object-cover rounded-md mb-2" />}
                  <p>{reply.content}</p>
                  <p className="text-xs text-gray-500 mt-2">From: {reply.authorName} on {new Date(reply.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
              {activePost.replies.length === 0 && <p className="text-sm text-gray-500">No replies yet.</p>}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <Button onClick={() => handleReplyOpen(activePost)}>Reply to this Post</Button>
              {isAuthorOrAdmin(activePost) && !activePost.isSold && <Button variant="secondary" onClick={() => markAsSold(activePost.id)}>Mark as Sold</Button>}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Dialog */}
      {activePost && (
          <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Reply to: {activePost.title}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitReply} className="space-y-4 mt-4">
                  <Textarea placeholder="Your reply" value={replyForm.content} onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })} required />
                  <Input placeholder="Your Name" value={replyForm.authorName} onChange={(e) => setReplyForm({ ...replyForm, authorName: e.target.value })} required />
                  <Input type="email" placeholder="Your Email" value={replyForm.authorEmail} onChange={(e) => setReplyForm({ ...replyForm, authorEmail: e.target.value })} required />
                  <Input placeholder="Phone (Optional)" value={replyForm.authorPhone} onChange={(e) => setReplyForm({ ...replyForm, authorPhone: e.target.value })} />
                  <div className="space-y-2">
                      <Label>Images (up to 2)</Label>
                      <div className="flex items-center gap-2">
                          <Input id="reply-image-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], true)} className="hidden" disabled={replyImages.length >= 2 || uploadingReply} />
                          <Label htmlFor="reply-image-upload" className={`cursor-pointer ${replyImages.length >= 2 || uploadingReply ? 'opacity-50' : ''}`}><Button asChild={true} type="button" variant="outline" disabled={replyImages.length >= 2 || uploadingReply}><span className='flex items-center'><Upload className="mr-2 h-4 w-4" />{uploadingReply ? 'Uploading...' : 'Upload'}</span></Button></Label>
                      </div>
                      <div className="flex gap-2 mt-2">
                          {replyImages.map((img, i) => <div key={i} className="relative"><img src={img} alt="upload preview" className="h-20 w-20 object-cover rounded"/><Button type="button" variant="destructive" size="icon" className="absolute top-0 right-0 h-5 w-5" onClick={() => removeImage(i, true)}><X className="h-3 w-3"/></Button></div>)}
                      </div>
                  </div>
                  <Turnstile onSuccess={setTurnstileToken} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} />
                  <Button type="submit" className="w-full">Submit Reply</Button>
                </form>
            </DialogContent>
          </Dialog>
      )}
    </div>
  );
};

export default Marketplace;