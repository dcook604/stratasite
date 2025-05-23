
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Renovations = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader
          title="Renovation Guidelines"
          description="Information about renovation procedures, permits, and regulations"
        />
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Renovation Process</h2>
          <p className="mb-4">
            All renovation projects in the building must be approved by the Strata Council before 
            work begins. This ensures that renovations comply with building codes, bylaws, and don't 
            negatively impact common property or other units.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Application Process</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Submit a detailed renovation proposal to the Property Manager</li>
            <li>Include contractor information, insurance certificates, and work permits</li>
            <li>Submit detailed plans and specifications</li>
            <li>Wait for written approval (typically 2-3 weeks)</li>
            <li>Schedule pre and post-renovation inspections</li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Hours of Work</h3>
          <p className="mb-4">
            Renovation work is permitted only during the following hours:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Monday to Friday: 8:00 AM to 5:00 PM</li>
            <li>Saturday: 10:00 AM to 4:00 PM</li>
            <li>Sunday and Statutory Holidays: No work permitted</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Common Regulations</h3>
          
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>Flooring</AccordionTrigger>
              <AccordionContent>
                <p>All hard flooring installations (tile, hardwood, laminate) must include appropriate 
                sound-dampening underlayment with an STC rating of at least 55. Carpet with underpad is 
                recommended in bedrooms and living areas that share walls with neighboring units.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>Plumbing</AccordionTrigger>
              <AccordionContent>
                <p>All plumbing work must be performed by a licensed plumber. Any changes to the 
                plumbing stack require special approval. Water shut-offs affecting multiple units 
                must be scheduled with at least 48 hours notice to affected residents.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Electrical</AccordionTrigger>
              <AccordionContent>
                <p>All electrical work must be done by a licensed electrician. Permits from the city 
                electrical inspector are required for any modifications to electrical systems. No 
                alterations to common area electrical systems are permitted.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Structural Changes</AccordionTrigger>
              <AccordionContent>
                <p>No modifications to load-bearing walls are permitted without engineering approval 
                and special permission from the Strata Council. Any structural changes require 
                professional engineering drawings and city permits.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Renovation Deposit</h3>
          <p className="mb-4">
            A refundable deposit of $1,000 is required before starting any major renovation. This deposit 
            will be returned after the project is completed and a final inspection confirms no damage to 
            common areas occurred during the renovation.
          </p>
          
          <div className="bg-red-50 p-4 rounded-md mt-6">
            <h4 className="font-semibold text-red-800">Important Warning</h4>
            <p className="text-red-700">
              Owners who proceed with renovations without proper approval may be subject to fines 
              and may be required to reverse unauthorized modifications at their own expense.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Renovations;
