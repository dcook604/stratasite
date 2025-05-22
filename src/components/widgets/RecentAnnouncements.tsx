
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

// Mock data for announcements
const announcements = [
  {
    id: 1,
    title: 'Annual General Meeting',
    content: 'The AGM will be held on June 15th at 7:00 PM in the common room. All owners are encouraged to attend.',
    date: '2025-05-20'
  },
  {
    id: 2,
    title: 'Water Shutdown Notice',
    content: 'Water will be shut off on June 3rd from 10:00 AM to 2:00 PM for scheduled maintenance.',
    date: '2025-05-18'
  },
  {
    id: 3,
    title: 'New Recycling Guidelines',
    content: 'Please review the updated recycling guidelines. New bins have been placed in the garbage room.',
    date: '2025-05-15'
  }
];

const RecentAnnouncements = () => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{announcement.title}</h3>
                <span className="text-xs text-gray-500">
                  {formatDate(announcement.date)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {announcement.content}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecentAnnouncements;
