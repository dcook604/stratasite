import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Shield,
  FileText,
  Wrench,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Mail,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const faqs = [
  {
    question: 'How do I book the move-in elevator?',
    answer: 'Move-ins must be booked at least 72 hours in advance through the resident portal. A $200 refundable deposit is required to secure the padded elevator and loading bay access.',
  },
  {
    question: 'Where is my mailbox key?',
    answer: 'Mailbox keys are provided by the previous owner/tenant. If lost, you must contact Canada Post to arrange a lock re-keying at your own expense.',
  },
  {
    question: 'Guest parking registration?',
    answer: 'Register guest license plates via the "Concierge" tab. Each unit is allocated 48 hours of guest parking per week. Vehicles not registered will be towed.',
  },
  {
    question: 'Garbage and Recycling?',
    answer: 'Waste rooms are located on the P1 level near the north entrance. Please flatten all cardboard boxes and use the designated bins for organics.',
  },
];

const HelpCenter = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* Emergency Info Banner */}
        <section className="mb-section-gap">
          <div className="bg-error-container border-l-8 border-spectrum-red p-card-padding rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-spectrum-red p-3 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-headline-md text-on-error-container">Immediate Emergency?</h2>
                <p className="text-body-md text-on-error-container opacity-90">Flooding, elevator entrapment, or security breach.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <a
                href="tel:6045550199"
                className="bg-spectrum-red text-white px-8 py-3 rounded-xl text-title-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              >
                <Phone className="h-5 w-5" />
                604-555-0199
              </a>
              <div className="text-center md:text-left">
                <p className="text-label-md text-on-error-container">24/7 Strata Dispatch</p>
                <p className="text-xs text-on-error-container opacity-70">Case ID: SP4-SEC-911</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Left Column: Support Resources */}
          <section className="md:col-span-7 lg:col-span-8">
            <Card className="border-outline-variant shadow-sm">
              <CardContent className="p-card-padding">
                <header className="mb-8">
                  <h1 className="text-headline-lg text-primary mb-2">Resident Support Center</h1>
                  <p className="text-body-lg text-on-surface-variant">
                    Access support resources, submit maintenance requests, or find answers to common questions.
                  </p>
                </header>

                <div className="space-y-6">
                  {/* Quick Action Cards */}
                  <Link to="/incident-report" className="block group">
                    <div className="flex items-center gap-4 p-4 bg-surface-subtle rounded-xl border border-outline-variant hover:border-spectrum-blue hover:shadow-sm transition-all">
                      <div className="p-3 bg-spectrum-blue/10 rounded-lg">
                        <Wrench className="h-6 w-6 text-spectrum-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-title-lg text-primary group-hover:text-spectrum-blue transition-colors">Submit Maintenance Request</h3>
                        <p className="text-body-md text-on-surface-variant">Report a leak, electrical issue, or general maintenance concern.</p>
                      </div>
                    </div>
                  </Link>

                  <Link to="/emergency-contact" className="block group">
                    <div className="flex items-center gap-4 p-4 bg-surface-subtle rounded-xl border border-outline-variant hover:border-spectrum-red hover:shadow-sm transition-all">
                      <div className="p-3 bg-spectrum-red/10 rounded-lg">
                        <FileText className="h-6 w-6 text-spectrum-red" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-title-lg text-primary group-hover:text-spectrum-red transition-colors">Update Emergency Contact</h3>
                        <p className="text-body-md text-on-surface-variant">Keep your emergency contact information current with the strata.</p>
                      </div>
                    </div>
                  </Link>

                  <Link to="/incident-status" className="block group">
                    <div className="flex items-center gap-4 p-4 bg-surface-subtle rounded-xl border border-outline-variant hover:border-spectrum-yellow hover:shadow-sm transition-all">
                      <div className="p-3 bg-spectrum-yellow/10 rounded-lg">
                        <HelpCircle className="h-6 w-6 text-spectrum-yellow" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-title-lg text-primary group-hover:text-spectrum-yellow transition-colors">Check Report Status</h3>
                        <p className="text-body-md text-on-surface-variant">Track the status of your previously submitted incident report.</p>
                      </div>
                    </div>
                  </Link>

                  {/* Urgent Notice */}
                  <div className="flex items-start gap-3 p-4 bg-surface-brand rounded-xl border border-spectrum-blue/20">
                    <AlertTriangle className="h-5 w-5 text-spectrum-yellow mt-0.5" />
                    <div>
                      <p className="text-body-md text-on-surface font-semibold">Need immediate assistance?</p>
                      <p className="text-body-md text-on-surface-variant">
                        For urgent issues requiring same-day attention, call Strata Dispatch at <strong>604-555-0199</strong>.
                        For non-urgent inquiries, please use the online form above and expect a response within 24 business hours.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Right Column: FAQs & Quick Links */}
          <aside className="md:col-span-5 lg:col-span-4 space-y-gutter">
            {/* FAQ Section */}
            <Card className="border-outline-variant shadow-sm">
              <CardContent className="p-card-padding">
                <h3 className="text-title-lg text-primary mb-6 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-spectrum-blue" />
                  Common Questions
                </h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <details key={index} className="group border-b border-outline-variant pb-4 last:border-b-0 last:pb-0">
                      <summary className="flex justify-between items-center cursor-pointer list-none">
                        <span className="text-body-lg text-primary font-semibold pr-4">{faq.question}</span>
                        <ChevronDown className="h-5 w-5 text-on-surface-variant group-open:rotate-180 transition-transform shrink-0" />
                      </summary>
                      <div className="pt-3 text-body-md text-on-surface-variant">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
                <Link
                  to="/documents"
                  className="mt-8 block text-center py-3 border border-outline text-secondary rounded-xl text-label-md hover:bg-surface-container-low transition-colors"
                >
                  View Full Help Center
                </Link>
              </CardContent>
            </Card>

            {/* Concierge Status Card */}
            <div className="bg-primary text-on-primary p-card-padding rounded-xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-title-lg mb-2">Concierge Status</h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 bg-spectrum-green rounded-full"></span>
                  <span className="text-label-md uppercase tracking-wider">Online Now</span>
                </div>
                <p className="text-body-md opacity-80 mb-6">
                  Staff are currently on-site and processing requests at the Level 1 lobby desk.
                </p>
                <Button
                  variant="secondary"
                  className="w-full bg-on-primary text-primary hover:bg-on-primary/90"
                  onClick={() => window.location.href = 'mailto:council@spectrum4.ca'}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Email Concierge
                </Button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <MessageSquare className="h-36 w-36" />
              </div>
            </div>

            {/* Contact Options */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href="mailto:council@spectrum4.ca"
                className="bg-surface-container p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-outline-variant hover:bg-surface-container-high transition-colors"
              >
                <Mail className="h-6 w-6 text-spectrum-blue" />
                <span className="text-label-md text-primary">Email Us</span>
              </a>
              <div className="bg-surface-container p-4 rounded-xl flex flex-col items-center text-center gap-2 border border-outline-variant">
                <Clock className="h-6 w-6 text-spectrum-yellow" />
                <span className="text-label-md text-primary">Office Hours</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;
