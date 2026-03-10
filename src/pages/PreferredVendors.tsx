import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ExternalLink, Phone, Mail, Paintbrush, Wind, Hammer } from 'lucide-react';

const vendors = [
  {
    name: 'Honest John Painting Co.',
    tagline: 'Integrity · Honesty · Kindness',
    description:
      'A commercial and residential painting company with a strong emphasis on communication, quality workmanship, and minimizing disruptions. They follow a structured project lifecycle from estimate through final walkthrough.',
    services: [
      'Interior & exterior painting',
      'Texture ceiling removal',
      'Drywall repair',
      'Carpentry (fences, stairs, fascia)',
      'Pressure washing & gutter cleaning',
      'Wallpaper removal & installation',
      'Custom millwork',
      'Concrete floor epoxy',
    ],
    website: 'https://honestjohnpaintingco.com/',
    icon: Paintbrush,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    category: 'Painting & Finishing',
  },
  {
    name: 'Airlux',
    tagline: 'Heat Pump & Air Conditioning Specialists in BC',
    description:
      'Serving British Columbia since 2004, Airlux manufactures AHRI-certified heat pumps and handles direct installation. They operate across 20+ BC locations and offer rebate assistance through CleanBC, BC Hydro, and FortisBC partnerships.',
    services: [
      'Heat pump installation',
      'Air conditioning systems',
      'Single-zone & multi-zone HVAC',
      'Residential & commercial climate control',
      'Maintenance & technical support',
      'Energy rebate assistance',
    ],
    phone: '604-304-3429',
    email: 'info@airlux.ca',
    website: 'https://airlux.ca/',
    icon: Wind,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800',
    category: 'HVAC & Climate Control',
  },
  {
    name: 'Swift Contracting & Renovations Ltd.',
    tagline: 'Building Dreams into Reality',
    description:
      'A full-service general contractor specializing in comprehensive home transformations. From kitchen and bathroom remodels to decks and home additions, Swift delivers quality craftsmanship and personalized design solutions.',
    services: [
      'Kitchen & bathroom renovations',
      'Basement remodeling',
      'Deck & porch construction',
      'Home additions & room conversions',
      'Attic conversions',
      'Garage construction',
      'Foundation work',
      'General contracting',
    ],
    website: 'https://swiftcontractingandrenovations.com/',
    icon: Hammer,
    color: 'bg-green-600',
    badgeColor: 'bg-green-100 text-green-800',
    category: 'Contracting & Renovations',
  },
];

const PreferredVendors = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <section className="bg-gradient-to-b from-primary/10 to-primary/5 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Preferred Vendors</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trusted service providers recommended by the Spectrum 4 Strata Council. These vendors have been vetted for quality, reliability, and professionalism.
            </p>
          </div>
        </section>

        {/* Vendor Cards */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {vendors.map((vendor) => {
                const Icon = vendor.icon;
                return (
                  <Card key={vendor.name} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4 mb-3">
                        <div className={`h-12 w-12 ${vendor.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <Badge className={`${vendor.badgeColor} border-0 text-xs mb-2`}>
                            {vendor.category}
                          </Badge>
                          <CardTitle className="text-lg leading-snug">{vendor.name}</CardTitle>
                          <p className="text-sm text-gray-500 italic mt-1">{vendor.tagline}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 gap-4">
                      {/* Services */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</h4>
                        <ul className="space-y-1">
                          {vendor.services.map((s) => (
                            <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Contact */}
                      {(vendor.phone || vendor.email) && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</h4>
                          {vendor.phone && (
                            <a
                              href={`tel:${vendor.phone}`}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary"
                            >
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              {vendor.phone}
                            </a>
                          )}
                          {vendor.email && (
                            <a
                              href={`mailto:${vendor.email}`}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary"
                            >
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              {vendor.email}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Website button pinned to bottom */}
                      <div className="mt-auto pt-2">
                        <Button asChild className="w-full" variant="outline">
                          <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Disclaimer */}
            <p className="mt-10 text-center text-sm text-gray-500">
              Spectrum 4 Strata recommends these vendors based on community experience. Residents engage vendors directly and at their own discretion.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PreferredVendors;
