
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';

const Fees = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader
          title="Strata Fees & Payments"
          description="Information about strata fees, payment methods, and special assessments"
        />
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-4">Monthly Strata Fees</h2>
          <p className="mb-4">
            Strata fees are due on the 1st of each month and cover building maintenance, 
            insurance, utilities for common areas, and contributions to the contingency reserve fund.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Payment Methods</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Pre-authorized debit (recommended)</li>
            <li>Online banking (use your unit number as reference)</li>
            <li>Cheques (payable to "Strata Corporation XYZ")</li>
            <li>Credit card payments through the resident portal (3% convenience fee applies)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Late Payments</h3>
          <p className="mb-4">
            Payments received after the 5th of the month are subject to a $50 late fee. 
            Outstanding balances may also accrue interest at a rate of 10% per annum.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Special Assessments</h3>
          <p className="mb-4">
            Occasionally, special assessments may be levied for major repairs or improvements 
            that cannot be covered by the contingency reserve fund. Owners will be notified 
            well in advance of any special assessments.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Fee Schedule</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 mt-2">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left">Fee Type</th>
                  <th className="border px-4 py-2 text-right">Amount</th>
                  <th className="border px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2">Move-in Fee</td>
                  <td className="border px-4 py-2 text-right">$200</td>
                  <td className="border px-4 py-2">Non-refundable</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Move-out Fee</td>
                  <td className="border px-4 py-2 text-right">$200</td>
                  <td className="border px-4 py-2">Non-refundable</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Amenity Booking</td>
                  <td className="border px-4 py-2 text-right">$50</td>
                  <td className="border px-4 py-2">Per 4-hour block</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">FOB Replacement</td>
                  <td className="border px-4 py-2 text-right">$75</td>
                  <td className="border px-4 py-2">Per FOB</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-md mt-6">
            <h4 className="font-semibold text-amber-800">Important Notice</h4>
            <p className="text-amber-700">
              If you're experiencing financial difficulties, please contact the strata manager 
              to discuss payment arrangements before your account falls into arrears.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Fees;
