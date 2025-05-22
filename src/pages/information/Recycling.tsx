
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { PageHeader } from '@/components/shared/PageHeader';

const Recycling = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader
          title="Recycling Information"
          description="Learn about the recycling program in our building"
        />
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Recycling Guidelines</h2>
          <p className="mb-4">
            Our building follows the city's comprehensive recycling program. Please sort your recyclables 
            into the appropriate bins located in the recycling room on each floor.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Accepted Materials</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Paper (newspapers, magazines, office paper, cardboard)</li>
            <li>Plastics (containers marked with recycling symbols #1-7)</li>
            <li>Glass bottles and jars (rinsed and with lids removed)</li>
            <li>Metal cans and aluminum (rinsed)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Not Accepted</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Plastic bags (return these to grocery stores)</li>
            <li>Styrofoam</li>
            <li>Food-contaminated items</li>
            <li>Electronics (see special disposal instructions)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Recycling Schedule</h3>
          <p className="mb-4">
            Recycling is collected every Tuesday and Friday morning. Please have your recycling in the 
            designated area by 8:00 PM the night before collection.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md mt-6">
            <h4 className="font-semibold text-blue-800">Reminder</h4>
            <p className="text-blue-700">
              Rinse all containers and remove plastic caps before recycling. Flatten cardboard boxes to save space.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Recycling;
