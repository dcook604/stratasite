import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Shield, 
  CreditCard, 
  Globe, 
  Truck, 
  Recycle, 
  AlertTriangle, 
  Plane, 
  FileText,
  Building2
} from 'lucide-react';

const WelcomePackage = () => {
  const sections = [
    {
      id: "services",
      title: "🛠️ Strata Services",
      icon: <Wrench className="h-5 w-5" />,
      content: "Ascent Real Estate Management provides strata services including financials, maintenance, emergency response and more. Contact your Strata Agent Amra Brajlovic via email at abrajlovic@ascentpm.com or call (604)-293-2446."
    },
    {
      id: "insurance", 
      title: "🛡️ Strata Insurance / Owner Insurance",
      icon: <Shield className="h-5 w-5" />,
      content: "Strata insurance covers common property and original fixtures. Owners must obtain personal insurance to cover contents and any upgrades or improvements."
    },
    {
      id: "fees",
      title: "💳 Strata Fees Schedule", 
      icon: <CreditCard className="h-5 w-5" />,
      content: "Fees are due on the 1st of every month. Use PAD for payments. Ensure your contact information is always up-to-date."
    },
    {
      id: "websites",
      title: "🌐 Strata Websites",
      icon: <Globe className="h-5 w-5" />,
      content: "Access strata documents at ascentpm.com. Visit our building site at spectrum4.ca for bylaws, updates, and contact info."
    },
    {
      id: "move",
      title: "🚚 Move-In Procedures",
      icon: <Truck className="h-5 w-5" />,
      content: "Book the elevator via the Concierge before moving. Elevator fee: $75/hr. $200 damage deposit. No booking = fines. Complete Owner or Form K info prior to booking."
    },
    {
      id: "garbage",
      title: "♻️ Garbage & Recycling",
      icon: <Recycle className="h-5 w-5" />,
      content: "Flatten all cardboard and dispose of it in the designated bins. Limit garbage to 2 bags/week. Double-bag to avoid leaks and spills. Visit our website for recycling tips."
    },
    {
      id: "emergency",
      title: "🚨 Emergency Procedures",
      icon: <AlertTriangle className="h-5 w-5" />,
      content: "Call 911 for all medical/fire emergencies, then notify the Concierge or building manager. Fire crews have elevator access keys. Ambulances do not."
    },
    {
      id: "vacation",
      title: "✈️ Going on Vacation?",
      icon: <Plane className="h-5 w-5" />,
      content: "If away for more than 1 month, leave a key with the Concierge and ensure your unit is checked weekly. Shut off water lines and provide an emergency contact."
    },
    {
      id: "infoform",
      title: "📄 Emergency Info Form",
      icon: <FileText className="h-5 w-5" />,
      content: "Complete and return the form to Ascent Real Estate. This allows contact in emergencies and provides consent for suite access when required."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Welcome to Spectrum 4"
        description="Welcome to your new home in the heart of Vancouver"
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  🌇 Welcome to Spectrum 4
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Welcome to your new home in the heart of Vancouver
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              📇 Table of Contents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  {section.icon}
                  {section.title.replace(/[🛠️🛡️💳🌐🚚♻️🚨✈️📄]/g, '').trim()}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={section.id} id={section.id} className="scroll-mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {section.content.includes('abrajlovic@ascentpm.com') ? (
                    <>
                      Ascent Real Estate Management provides strata services including financials, maintenance, emergency response and more. Contact your Strata Agent Amra Brajlovic via{' '}
                      <a href="mailto:abrajlovic@ascentpm.com" className="text-blue-600 hover:text-blue-800 underline">
                        email
                      </a>{' '}
                      or call (604)-293-2446.
                    </>
                  ) : section.content.includes('ascentpm.com') ? (
                    <>
                      Access strata documents at{' '}
                      <a href="https://www.ascentpm.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                        ascentpm.com
                      </a>
                      . Visit our building site at{' '}
                      <a href="https://www.spectrum4.ca" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                        spectrum4.ca
                      </a>{' '}
                      for bylaws, updates, and contact info.
                    </>
                  ) : (
                    section.content
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <Card className="mt-8 bg-blue-50 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-800">Important Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-blue-800">Strata Agent</p>
                <p className="text-gray-700">Amra Brajlovic - Ascent Real Estate Management</p>
                <p className="text-gray-700">📧 abrajlovic@ascentpm.com</p>
                <p className="text-gray-700">📞 (604)-293-2446</p>
              </div>
              <div>
                <p className="font-semibold text-blue-800">Emergency</p>
                <p className="text-gray-700">🚨 Call 911 for medical/fire emergencies</p>
                <p className="text-gray-700">Then notify Concierge or building manager</p>
              </div>
              <div>
                <p className="font-semibold text-blue-800">Website Resources</p>
                <p className="text-gray-700">
                  🌐 <a href="https://www.spectrum4.ca" className="text-blue-600 hover:text-blue-800 underline">spectrum4.ca</a> - Building information, bylaws, updates
                </p>
                <p className="text-gray-700">
                  🌐 <a href="https://www.ascentpm.com" className="text-blue-600 hover:text-blue-800 underline">ascentpm.com</a> - Strata documents and services
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WelcomePackage; 