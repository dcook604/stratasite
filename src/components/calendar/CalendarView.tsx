
import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Mock data for calendar events
const events = [
  { id: 1, title: 'Council Meeting', date: new Date('2025-06-01'), type: 'meeting', approved: true },
  { id: 2, title: 'Building Maintenance', date: new Date('2025-06-05'), type: 'maintenance', approved: true },
  { id: 3, title: 'Move-in: Unit 302', date: new Date('2025-06-08'), type: 'move', approved: true },
  { id: 4, title: 'Roof Inspection', date: new Date('2025-06-12'), type: 'maintenance', approved: true },
  { id: 5, title: 'Move-out: Unit 105', date: new Date('2025-06-15'), type: 'move', approved: false },
  { id: 6, title: 'Gardening Committee', date: new Date('2025-06-20'), type: 'meeting', approved: true },
];

interface Event {
  id: number;
  title: string;
  date: Date;
  type: 'meeting' | 'maintenance' | 'move' | 'other';
  approved: boolean;
}

const CalendarView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  const getDayEvents = (day: Date | undefined) => {
    if (!day) return [];
    return events.filter(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setSelectedDayEvents(getDayEvents(selectedDate));
  };

  const handleRequestEvent = () => {
    toast({
      title: "Event Request",
      description: "The event request feature will be available soon.",
    });
  };

  // Function to determine if a day has events
  const isDayWithEvent = (day: Date) => {
    return events.some(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  // Custom day rendering
  const renderDay = (day: Date) => {
    const hasEvent = isDayWithEvent(day);
    return (
      <div className={`relative ${hasEvent ? 'font-medium' : ''}`}>
        {day.getDate()}
        {hasEvent && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
        )}
      </div>
    );
  };

  const formatEventTime = (event: Event) => {
    return event.date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Badge variant="secondary">Meeting</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Maintenance</Badge>;
      case 'move':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Move</Badge>;
      default:
        return <Badge>Other</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
              Building Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border shadow-sm"
              components={{
                Day: ({ date }) => renderDay(date)
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="w-full h-full">
          <CardHeader className="pb-3 flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">
              {date && date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{event.title}</h3>
                      {getEventTypeBadge(event.type)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Time: {formatEventTime(event)}
                    </p>
                    {!event.approved && (
                      <p className="text-xs text-amber-600 mt-1 italic">
                        Pending approval
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No events scheduled for this day</p>
              </div>
            )}
            <div className="mt-6">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleRequestEvent}
              >
                Request New Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
