
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log('[UpcomingEvents] Fetching events...');
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          console.log('[UpcomingEvents] All events:', data);
          
          // Filter to only show future events and limit to 3
          const now = new Date();
          const futureEvents = data
            .filter((event: any) => {
              const eventDate = new Date(event.startDate);
              const isFuture = eventDate > now;
              console.log(`[UpcomingEvents] Event "${event.title}" - Date: ${eventDate}, Is Future: ${isFuture}`);
              return isFuture;
            })
            .slice(0, 3);
          
          console.log('[UpcomingEvents] Future events:', futureEvents);
          setEvents(futureEvents);
        } else {
          console.error('[UpcomingEvents] Failed to fetch events:', response.status);
        }
      } catch (error) {
        console.error('[UpcomingEvents] Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString: string, endDateString?: string) => {
    const startTime = new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    if (endDateString) {
      const endTime = new Date(endDateString).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
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
        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500">No upcoming events.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event: any) => (
              <li key={event.id} className="border-b pb-3 last:border-0 last:pb-0">
                <h3 className="font-medium">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                )}
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{formatTime(event.startDate, event.endDate)}</span>
                </div>
                {event.location && (
                  <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                )}
              </li>
            ))}
          </ul>
        )}
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
