
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';

const Organics = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader
          title="Organics Collection"
          description="Information about our building's organic waste program"
        />
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Organic Waste Collection</h2>
          <p className="mb-4">
            Our building participates in the city's organic waste collection program to reduce landfill 
            waste and create valuable compost. Green bins are located in designated areas on each floor.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Accepted Materials</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Food scraps (fruits, vegetables, meat, bones, dairy)</li>
            <li>Coffee grounds and filters</li>
            <li>Tea bags</li>
            <li>Eggshells</li>
            <li>Paper towels and napkins (unsoiled)</li>
            <li>Yard waste (in small amounts)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Not Accepted</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Plastic bags (even if labeled biodegradable)</li>
            <li>Styrofoam containers</li>
            <li>Glass or metal</li>
            <li>Pet waste</li>
            <li>Diapers</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Collection Schedule</h3>
          <p className="mb-4">
            Organic waste is collected every Monday, Wednesday, and Friday. Please ensure all organic waste 
            is properly bagged in compostable bags before placing in the green bins.
          </p>
          
          <div className="bg-green-50 p-4 rounded-md mt-6">
            <h4 className="font-semibold text-green-800">Tip</h4>
            <p className="text-green-700">
              You can line your kitchen compost bin with newspaper or purchase compostable bags to make 
              disposal cleaner and more convenient.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Organics;
