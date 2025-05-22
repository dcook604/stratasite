
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const Gallery = () => {
  // Mock data for gallery albums
  const albums = [
    {
      id: 1,
      title: 'Building Renovation',
      description: 'Photos from our recent lobby renovation project.',
      coverImage: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625',
      imageCount: 12
    },
    {
      id: 2,
      title: 'Summer BBQ 2024',
      description: 'Community gathering in our garden area.',
      coverImage: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
      imageCount: 24
    },
    {
      id: 3,
      title: 'New Gym Equipment',
      description: 'Photos of our updated fitness center.',
      coverImage: 'https://images.unsplash.com/photo-1551038247-3d9af20df552',
      imageCount: 8
    },
    {
      id: 4,
      title: 'Holiday Party',
      description: 'December 2024 community celebration.',
      coverImage: 'https://images.unsplash.com/photo-1493397212122-2b85dda8106b',
      imageCount: 16
    }
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader 
          title="Photo Gallery" 
          description="Browse photos from building events, renovations, and community gatherings."
        />
        <div className="strata-section">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Card key={album.id} className="overflow-hidden">
                <div className="aspect-[4/3] relative">
                  <img 
                    src={album.coverImage} 
                    alt={album.title} 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {album.imageCount} photos
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{album.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{album.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-600">More albums coming soon...</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Gallery;
