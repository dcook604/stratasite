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

interface MarketplacePost {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'sell' | 'buy' | 'trade';
  price?: number;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  replies: MarketplaceReply[];
}

interface MarketplaceReply {
  id: string;
  content: string;
  authorName: string;
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
    authorEmail: ''
  });
  const [replyForm, setReplyForm] = useState({
    postId: '',
    content: '',
    authorName: '',
    authorEmail: ''
  });
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
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

    try {
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPost,
          price: newPost.price ? parseFloat(newPost.price) : null
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
          authorEmail: ''
        });
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

    try {
      const response = await fetch(`/api/marketplace/${replyForm.postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyForm.content,
          authorName: replyForm.authorName,
          authorEmail: replyForm.authorEmail
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
          authorEmail: ''
        });
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
                <SelectItem value="sell">For Sale</SelectItem>
                <SelectItem value="buy">Looking to Buy</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button>Create New Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <Input
                    placeholder="Post Title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={newPost.description}
                    onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                    required
                  />
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
                  {newPost.type === 'sell' && (
                    <Input
                      placeholder="Price (optional)"
                      type="number"
                      step="0.01"
                      value={newPost.price}
                      onChange={(e) => setNewPost({ ...newPost, price: e.target.value })}
                    />
                  )}
                  <Input
                    placeholder="Your Name"
                    value={newPost.authorName}
                    onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Your Email"
                    type="email"
                    value={newPost.authorEmail}
                    onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })}
                    required
                  />
                  <Button type="submit" className="w-full">Create Post</Button>
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
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex gap-2">
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-sm text-gray-500">
                        Posted by {post.authorName} on {new Date(post.createdAt).toLocaleDateString()}
                      </div>
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
                    
                    {/* Replies */}
                    {post.replies && post.replies.length > 0 && (
                      <div className="mt-4">
                        <Separator className="mb-4" />
                        <h4 className="font-semibold mb-3">Replies:</h4>
                        <div className="space-y-3">
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm">{reply.content}</p>
                              <div className="text-xs text-gray-500 mt-2">
                                {reply.authorName} - {new Date(reply.createdAt).toLocaleDateString()}
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Post a Reply</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <Textarea
                  placeholder="Your reply..."
                  value={replyForm.content}
                  onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                  required
                />
                <Input
                  placeholder="Your Name"
                  value={replyForm.authorName}
                  onChange={(e) => setReplyForm({ ...replyForm, authorName: e.target.value })}
                  required
                />
                <Input
                  placeholder="Your Email"
                  type="email"
                  value={replyForm.authorEmail}
                  onChange={(e) => setReplyForm({ ...replyForm, authorEmail: e.target.value })}
                  required
                />
                <Button type="submit" className="w-full">Post Reply</Button>
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