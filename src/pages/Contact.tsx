
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import ContactForm from '@/components/shared/ContactForm';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, User } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    { 
      icon: <Mail className="h-5 w-5" />,
      title: 'Email',
      value: 'info@stratacouncil.com',
      description: 'For general inquiries'
    },
    { 
      icon: <Phone className="h-5 w-5" />,
      title: 'Phone',
      value: '(555) 123-4567',
      description: 'Mon-Fri, 9am-5pm'
    },
    { 
      icon: <User className="h-5 w-5" />,
      title: 'Building Manager',
      value: 'John Smith',
      description: 'On-site weekdays'
    }
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader 
          title="Contact Us" 
          description="Get in touch with the strata council or building management."
        />
        
        <div className="strata-section">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                  <div className="space-y-6">
                    {contactInfo.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="p-2 bg-primary/10 rounded-lg mr-4">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-gray-900 font-medium mt-1">{item.value}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-medium mb-2">Emergency Contact</h3>
                    <p className="text-gray-600 text-sm">
                      For after-hours emergencies (water leaks, fire, etc.), please call our 24/7 emergency line at <span className="font-semibold">(555) 987-6543</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
