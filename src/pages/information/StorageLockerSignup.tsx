import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Turnstile } from '@marsidev/react-turnstile';
import { useNavigate } from 'react-router-dom';
import {
  Package, User, Phone, Mail, Lock, Loader2, CheckCircle2,
  MapPin, DollarSign, Ruler, AlertCircle, Star,
} from 'lucide-react';

interface StorageLocker {
  id: string;
  lockerNumber: string;
  location: string;
  dimensions: string;
  monthlyRent: number;
  notes: string | null;
  status: 'AVAILABLE' | 'ASSIGNED';
}

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter your full address'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  telephone: z.string().min(10, 'Please enter a valid phone number').refine(
    (val) => /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')),
    'Please enter a valid phone number'
  ),
  email: z.string().email('Please enter a valid email address'),
  onWaitingList: z.boolean(),
  prepayYear: z.boolean(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'You must consent to be contacted by strata',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const RENTAL_TERMS = [
  '$50 non-refundable admin fee',
  '$50 refundable key fee',
  '$300 refundable damage deposit payable upon signing',
  'Rent due on the 1st of every month by EFT',
  'Must sign Strata Rental Contract',
  '10% discount for 12 months prepaid rent',
];

const StorageLockerSignup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockers, setLockers] = useState<StorageLocker[]>([]);
  const [lockersLoading, setLockersLoading] = useState(true);
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<{ onWaitlist: boolean; checked: boolean }>({
    onWaitlist: false,
    checked: false,
  });
  const [waitlistCheckTimer, setWaitlistCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      address: '',
      unitNumber: '',
      telephone: '',
      email: '',
      onWaitingList: false,
      prepayYear: false,
      consentGiven: false,
    },
  });

  useEffect(() => {
    fetch('/api/storage-lockers')
      .then((r) => r.json())
      .then((data) => setLockers(data))
      .catch(() => toast({ title: 'Error', description: 'Could not load locker availability', variant: 'destructive' }))
      .finally(() => setLockersLoading(false));
  }, []);

  const checkWaitlist = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      const r = await fetch(`/api/storage-waitlist-check?email=${encodeURIComponent(email)}`);
      const data = await r.json();
      setWaitlistStatus({ onWaitlist: data.onWaitlist, checked: true });
    } catch {
      // silently ignore
    }
  };

  const handleEmailChange = (email: string) => {
    if (waitlistCheckTimer) clearTimeout(waitlistCheckTimer);
    setWaitlistStatus({ onWaitlist: false, checked: false });
    const timer = setTimeout(() => checkWaitlist(email), 600);
    setWaitlistCheckTimer(timer);
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedLockerId) {
      toast({ title: 'No locker selected', description: 'Please select a locker before submitting', variant: 'destructive' });
      return;
    }
    if (!turnstileToken) {
      toast({ title: 'Error', description: 'Please complete the CAPTCHA verification', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/storage-locker-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lockerId: selectedLockerId, turnstileToken }),
      });

      if (response.ok) {
        const result = await response.json();
        const locker = lockers.find((l) => l.id === selectedLockerId);
        navigate('/form-acknowledgment', {
          state: {
            formType: 'storage-locker-application',
            formName: 'Storage Locker Application',
            submissionId: result.applicationId,
            message: `Your application for Locker #${locker?.lockerNumber} has been submitted. Strata will review and contact you shortly.`,
            nextSteps: [
              'Your application is now under review by strata management.',
              'You will be contacted at the email/phone provided once a decision is made.',
              'If approved, you will be required to sign a Strata Rental Contract and pay the required fees.',
            ],
          },
        });
      } else {
        const err = await response.json();
        toast({ title: 'Submission failed', description: err.error || 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit application. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const p1Lockers = lockers.filter((l) => l.location.includes('P1'));
  const citadelLockers = lockers.filter((l) => l.location.includes('Citadel'));
  const selectedLocker = lockers.find((l) => l.id === selectedLockerId);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Storage Locker Signup"
        description="Select and apply for an available storage locker at Spectrum 4"
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">

        {/* Rental Terms */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <DollarSign className="h-5 w-5" />
              Rental Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {RENTAL_TERMS.map((term) => (
                <div key={term} className="flex items-start gap-2 text-sm text-blue-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  <span>{term}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Contact: Concierge at spectrumconcierge@rservice.ca · Ascent Property Management at bcs2611@ascentpm.com
            </p>
          </CardContent>
        </Card>

        {/* Locker Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Select a Locker
            </CardTitle>
            <p className="text-sm text-gray-500">
              Green = available · Grey = already assigned. Click a locker to select it.
            </p>
          </CardHeader>
          <CardContent>
            {lockersLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading locker availability…
              </div>
            ) : (
              <div className="space-y-6">
                <LockerGroup
                  title="P1 – Locker Room 27A"
                  lockers={p1Lockers}
                  selectedId={selectedLockerId}
                  onSelect={setSelectedLockerId}
                />
                <LockerGroup
                  title="Locker Room #7 – Citadel Townhouse Hallway"
                  lockers={citadelLockers}
                  selectedId={selectedLockerId}
                  onSelect={setSelectedLockerId}
                />
              </div>
            )}

            {!selectedLockerId && !lockersLoading && (
              <p className="text-sm text-amber-600 mt-4 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Please select a locker above before completing the form.
              </p>
            )}

            {selectedLocker && (
              <Alert className="mt-4 border-green-300 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Selected: Locker #{selectedLocker.lockerNumber}</strong> — {selectedLocker.location} · {selectedLocker.dimensions} · ${selectedLocker.monthlyRent}/month
                  {selectedLocker.notes && <span className="text-xs ml-1">({selectedLocker.notes})</span>}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="First name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input placeholder="Last name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Address
                    </FormLabel>
                    <FormControl><Input placeholder="Your full address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="unitNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Number</FormLabel>
                    <FormControl><Input placeholder="e.g. 101" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="telephone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Phone className="inline h-4 w-4 mr-1" />
                        Telephone
                      </FormLabel>
                      <FormControl><Input type="tel" placeholder="(604) 123-4567" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleEmailChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {waitlistStatus.checked && (
                        <div className={`flex items-center gap-1.5 text-xs mt-1 ${waitlistStatus.onWaitlist ? 'text-green-700' : 'text-gray-500'}`}>
                          {waitlistStatus.onWaitlist ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              <span>You were previously on the storage rental waiting list.</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Not found on the previous waiting list.</span>
                            </>
                          )}
                        </div>
                      )}
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="onWaitingList" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50 border-gray-200">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        I have previously signed up to be on the storage locker waiting list
                      </FormLabel>
                      <FormDescription className="text-xs text-gray-500">
                        Check this if you submitted an interest form for storage rental before this signup page was available.
                      </FormDescription>
                    </div>
                  </FormItem>
                )} />

                <FormField control={form.control} name="prepayYear" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50 border-green-200">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        I am interested in prepaying 12 months to receive the 10% discount
                      </FormLabel>
                      <FormDescription className="text-xs text-gray-500">
                        Prepaying 12 months upfront qualifies you for a 10% discount on the monthly rate. Strata will include payment details when they contact you.
                      </FormDescription>
                    </div>
                  </FormItem>
                )} />

                <FormField control={form.control} name="consentGiven" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-amber-50 border-amber-200">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        I consent to be contacted by Spectrum 4 Strata BCS2611 regarding my locker application
                      </FormLabel>
                      <FormDescription className="text-xs text-gray-500">
                        By checking this box you agree that strata management may contact you by email or telephone regarding your application and any rental arrangements.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />

                <div className="flex justify-center">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={setTurnstileToken}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                  />
                </div>

                <div className="flex justify-center">
                  <Button type="submit" disabled={isSubmitting || !selectedLockerId} className="w-full md:w-auto px-8">
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                    ) : (
                      <><Package className="mr-2 h-4 w-4" />Submit Application</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

interface LockerGroupProps {
  title: string;
  lockers: StorageLocker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const LockerGroup = ({ title, lockers, selectedId, onSelect }: LockerGroupProps) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
      <MapPin className="h-4 w-4 text-gray-500" />
      {title}
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {lockers.map((locker) => {
        const isAssigned = locker.status === 'ASSIGNED';
        const isSelected = selectedId === locker.id;
        return (
          <button
            key={locker.id}
            type="button"
            disabled={isAssigned}
            onClick={() => !isAssigned && onSelect(locker.id)}
            className={`
              relative rounded-lg border-2 p-3 text-left transition-all
              ${isAssigned
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                : isSelected
                  ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-md ring-2 ring-purple-300'
                  : 'border-green-300 bg-green-50 text-gray-800 hover:border-green-500 hover:bg-green-100 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">#{locker.lockerNumber}</span>
              {isSelected && <CheckCircle2 className="h-4 w-4 text-purple-600" />}
              {isAssigned && <Lock className="h-3.5 w-3.5 text-gray-400" />}
            </div>
            <div className="flex items-center gap-1 text-xs mb-1">
              <Ruler className="h-3 w-3 flex-shrink-0" />
              <span className="leading-tight">{locker.dimensions}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold">
              <DollarSign className="h-3 w-3" />
              <span>${locker.monthlyRent}/mo</span>
            </div>
            {locker.notes && (
              <div className="text-xs text-amber-600 mt-1 leading-tight">{locker.notes}</div>
            )}
            <div className={`text-xs mt-1 font-medium ${isAssigned ? 'text-gray-400' : 'text-green-600'}`}>
              {isAssigned ? 'Assigned' : 'Available'}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default StorageLockerSignup;
