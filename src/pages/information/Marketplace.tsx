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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageIcon, X, CheckCircle, AlertCircle, Upload, Trash2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_CONFIG } from '@/config/recaptcha';
import { uploadImage, validateImage, ImageUploadResult } from '@/utils/imageUpload';

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
}

interface MarketplaceReply {
  id: string;
  content: string;
  authorName: string;
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

  const categories = [
    'Electronics',
    'Furniture',
    'Appliances',
    'Books & Media',
    'Clothing',
    'Sports & Recreation',
    'Tools & Hardware',
    'Home Decor',
    'Other'
  ];

  useEffect(() => {
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleImageUpload = async (file: File, isReply: boolean = false) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    if (isReply) {
      setUploadingReply(true);
    } else {
      setUploadingPost(true);
    }

    try {
      const result: ImageUploadResult = await uploadImage(file);
      
      if (result.success && result.imageUrl) {
        if (isReply) {
          setReplyImages(prev => [...prev, result.imageUrl!]);
        } else {
          setPostImages(prev => [...prev, result.imageUrl!]);
        }
        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: "destructive"
      });
    } finally {
      if (isReply) {
        setUploadingReply(false);
      } else {
        setUploadingPost(false);
      }
    }
  };

  const removeImage = (index: number, isReply: boolean = false) => {
    if (isReply) {
      setReplyImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setPostImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPost.title || !newPost.description || !newPost.authorName || !newPost.authorEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(newPost.authorEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(newPost.authorPhone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    if (!recaptchaToken) {
      toast({
        title: "Error",
        description: "Please complete the reCAPTCHA verification",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPost,
          price: newPost.price ? parseFloat(newPost.price) : null,
          images: postImages,
          recaptchaToken
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your post has been created successfully"
        });
        setNewPost({
          title: '',
          description: '',
          category: '',
          type: 'sell',
          price: '',
          authorName: '',
          authorEmail: '',
          authorPhone: ''
        });
        setPostImages([]);
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
        setShowNewPostDialog(false);
        fetchPosts();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyForm.content || !replyForm.authorName || !replyForm.authorEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(replyForm.authorEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(replyForm.authorPhone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    if (!replyRecaptchaToken) {
      toast({
        title: "Error",
        description: "Please complete the reCAPTCHA verification",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/${replyForm.postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyForm.content,
          authorName: replyForm.authorName,
          authorEmail: replyForm.authorEmail,
          authorPhone: replyForm.authorPhone,
          images: replyImages,
          recaptchaToken: replyRecaptchaToken
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your reply has been posted successfully"
        });
        setReplyForm({
          postId: '',
          content: '',
          authorName: '',
          authorEmail: '',
          authorPhone: ''
        });
        setReplyImages([]);
        setReplyRecaptchaToken(null);
        replyRecaptchaRef.current?.reset();
        setShowReplyDialog(false);
        fetchPosts();
      } else {
        throw new Error('Failed to create reply');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive"
      });
    }
  };

  const markAsSold = async (postId: string) => {
    try {
      const response = await fetch(`/api/marketplace/${postId}/sold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post marked as sold"
        });
        fetchPosts();
      } else {
        throw new Error('Failed to mark as sold');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark post as sold. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'available') return !post.isSold;
    if (filter === 'sold') return post.isSold;
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

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="page-content">
          <PageHeader
            title="Strata Marketplace"
            description="Buy, sell, and trade items with your neighbors"
          />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
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
        <PageHeader
          title="Strata Marketplace"
          description="Buy, sell, and trade items with your neighbors"
        />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="available">Available Items</SelectItem>
                <SelectItem value="sold">Sold Items</SelectItem>
                <SelectItem value="sell">For Sale</SelectItem>
                <SelectItem value="buy">Looking to Buy</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button>Create New Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Post Title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Description"
                      value={newPost.description}
                      onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select value={newPost.type} onValueChange={(value: 'sell' | 'buy' | 'trade') => setNewPost({ ...newPost, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sell">For Sale</SelectItem>
                          <SelectItem value="buy">Looking to Buy</SelectItem>
                          <SelectItem value="trade">Trade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {newPost.type === 'sell' && (
                    <div>
                      <Label htmlFor="price">Price (optional)</Label>
                      <Input
                        id="price"
                        placeholder="Price"
                        type="number"
                        step="0.01"
                        value={newPost.price}
                        onChange={(e) => setNewPost({ ...newPost, price: e.target.value })}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="authorName">Your Name *</Label>
                    <Input
                      id="authorName"
                      placeholder="Your Name"
                      value={newPost.authorName}
                      onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="authorEmail">Your Email *</Label>
                    <Input
                      id="authorEmail"
                      placeholder="Your Email"
                      type="email"
                      value={newPost.authorEmail}
                      onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="authorPhone">Your Phone (optional)</Label>
                    <Input
                      id="authorPhone"
                      placeholder="Your Phone Number"
                      type="tel"
                      value={newPost.authorPhone}
                      onChange={(e) => setNewPost({ ...newPost, authorPhone: e.target.value })}
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label>Images (optional, max 3)</Label>
                    <div className="space-y-2">
                      {postImages.length < 3 && (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, false);
                            }}
                            className="hidden"
                            id="post-image-upload"
                          />
                          <Label htmlFor="post-image-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                              <Upload className="w-4 h-4" />
                              {uploadingPost ? 'Uploading...' : 'Add Image'}
                            </div>
                          </Label>
                        </div>
                      )}
                      
                      {postImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {postImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 w-6 h-6 p-0"
                                onClick={() => removeImage(index, false)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* reCAPTCHA */}
                  <div>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_CONFIG.siteKey}
                      onChange={setRecaptchaToken}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={!recaptchaToken}>
                    Create Post
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No posts found. Be the first to create one!</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className={post.isSold ? 'opacity-75' : ''}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {post.title}
                        {post.isSold && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {post.isSold && (
                          <Badge className="bg-green-100 text-green-800">
                            SOLD
                          </Badge>
                        )}
                        <Badge className={getTypeColor(post.type)}>
                          {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                        </Badge>
                        {post.category && (
                          <Badge variant="outline">{post.category}</Badge>
                        )}
                        {post.price && (
                          <Badge variant="secondary">${post.price}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{post.description}</p>
                    
                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {post.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${post.title} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                            onClick={() => window.open(image, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-sm text-gray-500">
                        <p>Posted by {post.authorName} on {new Date(post.createdAt).toLocaleDateString()}</p>
                        {post.authorPhone && <p>Phone: {post.authorPhone}</p>}
                      </div>
                      <div className="flex gap-2">
                        {!post.isSold && post.type === 'sell' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsSold(post.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Sold
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyForm({ ...replyForm, postId: post.id });
                            setShowReplyDialog(true);
                          }}
                        >
                          Reply ({post.replies?.length || 0})
                        </Button>
                      </div>
                    </div>
                    
                    {/* Replies */}
                    {post.replies && post.replies.length > 0 && (
                      <div className="mt-4">
                        <Separator className="mb-4" />
                        <h4 className="font-semibold mb-3">Replies:</h4>
                        <div className="space-y-3">
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm mb-2">{reply.content}</p>
                              
                              {/* Reply Images */}
                              {reply.images && reply.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-1 mb-2">
                                  {reply.images.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image}
                                      alt={`Reply ${index + 1}`}
                                      className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                      onClick={() => window.open(image, '_blank')}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500">
                                <p>{reply.authorName} - {new Date(reply.createdAt).toLocaleDateString()}</p>
                                {reply.authorPhone && <p>Phone: {reply.authorPhone}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Reply Dialog */}
          <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a Reply</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div>
                  <Label htmlFor="replyContent">Your Reply *</Label>
                  <Textarea
                    id="replyContent"
                    placeholder="Your reply..."
                    value={replyForm.content}
                    onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="replyName">Your Name *</Label>
                  <Input
                    id="replyName"
                    placeholder="Your Name"
                    value={replyForm.authorName}
                    onChange={(e) => setReplyForm({ ...replyForm, authorName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="replyEmail">Your Email *</Label>
                  <Input
                    id="replyEmail"
                    placeholder="Your Email"
                    type="email"
                    value={replyForm.authorEmail}
                    onChange={(e) => setReplyForm({ ...replyForm, authorEmail: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="replyPhone">Your Phone (optional)</Label>
                  <Input
                    id="replyPhone"
                    placeholder="Your Phone Number"
                    type="tel"
                    value={replyForm.authorPhone}
                    onChange={(e) => setReplyForm({ ...replyForm, authorPhone: e.target.value })}
                  />
                </div>
                
                {/* Reply Image Upload */}
                <div>
                  <Label>Images (optional, max 2)</Label>
                  <div className="space-y-2">
                    {replyImages.length < 2 && (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, true);
                          }}
                          className="hidden"
                          id="reply-image-upload"
                        />
                        <Label htmlFor="reply-image-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                            <Upload className="w-4 h-4" />
                            {uploadingReply ? 'Uploading...' : 'Add Image'}
                          </div>
                        </Label>
                      </div>
                    )}
                    
                    {replyImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {replyImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Reply upload ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 w-6 h-6 p-0"
                              onClick={() => removeImage(index, true)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* reCAPTCHA */}
                <div>
                  <ReCAPTCHA
                    ref={replyRecaptchaRef}
                    sitekey={RECAPTCHA_CONFIG.siteKey}
                    onChange={setReplyRecaptchaToken}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={!replyRecaptchaToken}>
                  Post Reply
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Marketplace;