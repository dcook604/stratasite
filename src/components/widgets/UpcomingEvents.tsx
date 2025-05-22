
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for upcoming events
const events = [
  {
    id: 1,
    title: 'Council Meeting',
    date: '2025-06-01',
    time: '7:00 PM',
    type: 'meeting'
  },
  {
    id: 2,
    title: 'Building Maintenance',
    date: '2025-06-05',
    time: '9:00 AM - 12:00 PM',
    type: 'maintenance'
  },
  {
    id: 3, 
    title: 'Move-in: Unit 302',
    date: '2025-06-08',
    time: '10:00 AM - 2:00 PM',
    type: 'move'
  }
];

const UpcomingEvents = () => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border-b pb-3 last:border-0 last:pb-0">
              <h3 className="font-medium">{event.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                <span>{event.time}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-2">
          <Link 
            to="/calendar" 
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            View Full Calendar →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
