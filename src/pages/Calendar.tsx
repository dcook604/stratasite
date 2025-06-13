import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, PlusCircle } from 'lucide-react';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_CONFIG } from '@/config/recaptcha';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

const CalendarPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: "Error", description: "Could not load events.", variant: "destructive" });
    }
  };

  const getEventsForSelectedDay = () => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const eventsOnSelectedDay = getEventsForSelectedDay();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Building Calendar"
        description="View and request building events, maintenance schedules, and move-ins/move-outs."
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Building Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShadCalendar
                mode="single"
                selected={date}
                onSelect={(day) => setDate(day || new Date())}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsOnSelectedDay.length > 0 ? (
                <ul className="space-y-4">
                  {eventsOnSelectedDay.map((event) => (
                    <li key={event.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.location && ` - ${event.location}`}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No events scheduled for this day</p>
              )}
              <div className="mt-6">
                <EventRequestDialog selectedDate={date} onSubmitted={fetchEvents} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Event Request Dialog Component
const EventRequestDialog = ({ selectedDate, onSubmitted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    unitNumber: '',
    email: '',
    phone: '',
    isOwner: 'true',
    eventTitle: 'Move Event',
    eventDescription: '',
    time: '09:00',
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, isOwner: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      toast({ title: 'Error', description: 'Please complete the reCAPTCHA.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    const [hours, minutes] = formData.time.split(':');
    const requestedDateTime = new Date(selectedDate);
    requestedDateTime.setHours(parseInt(hours), parseInt(minutes));

    try {
      const response = await fetch('/api/event-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, requestedDateTime: requestedDateTime.toISOString(), recaptchaToken }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Your event request has been submitted for approval.' });
        setIsOpen(false);
        onSubmitted();
        recaptchaRef.current?.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request.');
      }
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Request New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a New Event</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a booking for a move-in, move-out, or other event. Your request will be reviewed by an administrator.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitNumber">Unit Number</Label>
              <Input id="unitNumber" name="unitNumber" value={formData.unitNumber} onChange={handleInputChange} required />
            </div>
             <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
          </div>
          <div>
            <Label>Are you an owner or tenant?</Label>
            <RadioGroup name="isOwner" value={formData.isOwner} onValueChange={handleRadioChange} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="owner" />
                <Label htmlFor="owner">Owner</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="tenant" />
                <Label htmlFor="tenant">Tenant</Label>
              </div>
            </RadioGroup>
          </div>
          <hr />
          <div>
            <Label>Requested Date</Label>
            <Input value={selectedDate.toLocaleDateString()} disabled />
          </div>
          <div>
            <Label htmlFor="time">Requested Time</Label>
            <Input id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} required />
          </div>
           <div>
            <Label htmlFor="eventTitle">Event Title</Label>
            <Input id="eventTitle" name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="eventDescription">Event Description (optional)</Label>
            <Textarea id="eventDescription" name="eventDescription" value={formData.eventDescription} onChange={handleInputChange} placeholder="e.g., Details about your move, elevator booking requirements." />
          </div>
          <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_CONFIG.siteKey} onChange={setRecaptchaToken} />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarPage;
