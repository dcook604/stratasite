
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import UpcomingEvents from '@/components/widgets/UpcomingEvents';
import RecentAnnouncements from '@/components/widgets/RecentAnnouncements';
import { Calendar, Image, Book, Mail, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-primary/5 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Welcome to Spectrum 4 (BCS2611)
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A modern platform for our community Vancouver Community to stay informed, connected, and engaged.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/calendar">View Calendar</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="strata-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Building Calendar</h3>
                <p className="text-gray-600 mb-4">
                  Stay updated on events, maintenance, and community gatherings.
                </p>
                <Button variant="ghost" asChild className="mt-auto">
                  <Link to="/calendar">View Calendar</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Photo Gallery</h3>
                <p className="text-gray-600 mb-4">
                  Browse photos from community events and building improvements.
                </p>
                <Button variant="ghost" asChild className="mt-auto">
                  <Link to="/gallery">Browse Gallery</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center mb-4">
                  <Book className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Building Bylaws</h3>
                <p className="text-gray-600 mb-4">
                  Access our complete library of strata bylaws and regulations.
                </p>
                <Button variant="ghost" asChild className="mt-auto">
                  <Link to="/bylaws">Read Bylaws</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Widgets Section */}
        <section className="strata-section pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <UpcomingEvents />
            </div>
            <div>
              <RecentAnnouncements />
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-primary/10 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Have Questions?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Our strata council is here to help. Reach out with any concerns or suggestions.
            </p>
            <Button asChild size="lg">
              <Link to="/contact">
                <Mail className="h-5 w-5 mr-2" />
                Contact Us
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
