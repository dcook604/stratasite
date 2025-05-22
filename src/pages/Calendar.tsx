
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import CalendarView from '@/components/calendar/CalendarView';

const Calendar = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader 
          title="Building Calendar" 
          description="View and request building events, maintenance schedules, and move-ins/move-outs."
        />
        <div className="strata-section">
          <CalendarView />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Calendar;
