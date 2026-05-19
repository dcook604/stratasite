import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ExternalLink, Phone, Mail, Paintbrush, Wind, Hammer, Search, ArrowRight } from 'lucide-react';

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
    color: 'bg-spectrum-blue/10 text-spectrum-blue',
    category: 'Painting & Finishing',
    phone: null,
    email: null,
    recommended: true,
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
    color: 'bg-spectrum-yellow/10 text-spectrum-yellow',
    category: 'HVAC & Climate Control',
    recommended: true,
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
    color: 'bg-spectrum-green/10 text-spectrum-green',
    category: 'Contracting & Renovations',
    phone: null,
    email: null,
    recommended: true,
  },
];

const PreferredVendors = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <section className="bg-surface-subtle py-16 md:py-20">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="max-w-3xl">
              <h1 className="text-headline-lg text-on-surface mb-4">Vendor Directory</h1>
              <p className="text-body-lg text-on-surface-variant">
                A curated directory of trusted vendors recommended by the Strata Council. These professionals have been vetted for quality, reliability, and familiarity with Spectrum 4's building systems.
              </p>
            </div>
          </div>
        </section>

        {/* Vendor Cards */}
        <section className="py-section-gap">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {vendors.map((vendor) => {
                const Icon = vendor.icon;
                return (
                  <div key={vendor.name} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-[0_4px_12px_rgba(17,24,39,0.04)] hover:shadow-lg transition-all group flex flex-col">
                    {/* Header with badge */}
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-lg ${vendor.color} flex items-center justify-center`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      {vendor.recommended && (
                        <span className="bg-spectrum-green/15 text-spectrum-green px-3 py-1 rounded-full text-label-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Strata Recommended
                        </span>
                      )}
                    </div>

                    {/* Name & Category */}
                    <h3 className="text-title-lg text-on-surface mb-1">{vendor.name}</h3>
                    <p className="text-label-md text-spectrum-blue mb-4">{vendor.category}</p>
                    <p className="text-body-md text-on-surface-variant mb-6">{vendor.description}</p>

                    {/* Services */}
                    <div className="mb-6">
                      <h4 className="text-label-md uppercase tracking-wider text-on-surface-variant mb-3">Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {vendor.services.slice(0, 4).map((s) => (
                          <span key={s} className="bg-surface-container-high px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase text-on-surface-variant">
                            {s.length > 20 ? s.substring(0, 18) + '...' : s}
                          </span>
                        ))}
                        {vendor.services.length > 4 && (
                          <span className="text-[11px] text-on-surface-variant flex items-center">+{vendor.services.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    {(vendor.phone || vendor.email) && (
                      <div className="space-y-2 mb-6">
                        {vendor.phone && (
                          <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">phone</span>
                            {vendor.phone}
                          </a>
                        )}
                        {vendor.email && (
                          <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">mail</span>
                            {vendor.email}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Website button */}
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-full border border-primary-container text-primary-container text-label-md py-3 rounded-xl text-center group-hover:bg-primary-container group-hover:text-on-primary transition-all flex items-center justify-center gap-2"
                    >
                      Visit Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                );
              })}

              {/* Featured CTA Card */}
              <div className="bg-primary-container text-on-primary rounded-xl p-card-padding flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <span className="material-symbols-outlined text-[160px]">handyman</span>
                </div>
                <h3 className="text-headline-md mb-4 relative z-10">Need a Quote?</h3>
                <p className="text-body-lg mb-8 relative z-10 opacity-90">
                  Don't see what you're looking for? Contact the Strata Council for specific recommendations for your project.
                </p>
                <a
                  href="mailto:Council@spectrum4.ca"
                  className="bg-on-primary text-primary-container text-label-md py-3 px-6 rounded-xl w-max relative z-10 hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Request Recommendation
                </a>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-12 text-center text-body-md text-on-surface-variant">
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
