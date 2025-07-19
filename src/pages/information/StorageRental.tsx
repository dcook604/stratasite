import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Turnstile } from '@marsidev/react-turnstile';
import { Package, User, Phone, Mail, MessageSquare, CheckCircle, DollarSign, Lock, Calendar } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  phoneNumber: z.string().min(10, { message: 'Please enter a valid phone number' }).refine((val) => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, { message: 'Please enter a valid phone number' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  unitNumber: z.string().min(1, { message: 'Unit number is required' }),
  bestContactMethod: z.enum(['EMAIL', 'TELEPHONE'], {
    required_error: 'Please select your preferred contact method'
  }),
  interestedInInfo: z.boolean().refine((val) => val === true, {
    message: 'You must indicate interest to obtain more information'
  }),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'You must consent to receiving information from Spectrum 4 BCS2611'
  }),
  notes: z.string().optional()
});

type StorageRentalValues = z.infer<typeof formSchema>;

const StorageRental = () => {
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<StorageRentalValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      unitNumber: '',
      bestContactMethod: undefined,
      interestedInInfo: false,
      consentGiven: false,
      notes: ''
    }
  });

  const onSubmit = async (data: StorageRentalValues) => {
    if (!turnstileToken) {
      toast({ 
        title: "Error", 
        description: "Please complete the CAPTCHA verification", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/storage-rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken
        }),
      });

      if (response.ok) {
        toast({
          title: "Interest submitted",
          description: "Your storage locker interest has been submitted successfully. You will be contacted regarding availability.",
        });
        form.reset();
        setTurnstileToken(null);
      } else {
        throw new Error('Failed to submit interest');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: 'Failed to submit interest. Please try again.', 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Storage Rental"
        description="Express your interest in secure storage locker rental at Spectrum 4"
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Storage Locker Rental Interest
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Register your interest in our limited secure storage lockers
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Storage Details */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lock className="h-5 w-5" />
              Secure Storage Locker Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">🔒 Locker Specifications</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li><strong>Dimensions:</strong> 69" (5.75') x 90" (7.5')</li>
                    <li><strong>Height:</strong> 6' to 8' (varies by location)</li>
                    <li><strong>Total Available:</strong> 10 secure lockers</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Rental Fees
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li><strong>Monthly Rental:</strong> $200/month</li>
                    <li><strong>Admin Fee:</strong> $50 (one-time, non-refundable)</li>
                    <li><strong>Payment Method:</strong> Monthly electronic debit</li>
                    <li><strong>Damage Deposit:</strong> Refundable (amount TBD)</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <Alert className="border-purple-200 bg-purple-50">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <div className="space-y-2">
                      <p className="font-semibold">Timeline & Availability</p>
                      <p className="text-sm">We are currently assessing resident interest for these limited storage lockers.</p>
                      <p className="text-sm"><strong>Target Completion:</strong> 2025</p>
                      <p className="text-sm"><strong>Limited to:</strong> Spectrum 4 residents only</p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interest Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Express Your Interest
            </CardTitle>
            <p className="text-gray-600">
              Please fill in the following form to assess demand and have your name on the list for these limited storage locker rentals.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telephone Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="(604) 123-4567" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your.email@example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="unitNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 101" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bestContactMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Best Contact Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your preferred contact method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EMAIL">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Email
                                </div>
                              </SelectItem>
                              <SelectItem value="TELEPHONE">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  Telephone
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Interest and Consent */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Interest & Consent
                  </h3>

                  <FormField
                    control={form.control}
                    name="interestedInInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            <Package className="h-4 w-4 inline mr-1" />
                            I am interested in obtaining more information about the storage lockers that will become available for rent
                          </FormLabel>
                          <FormDescription>
                            Check this box to express your interest in renting a storage locker at Spectrum 4
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consentGiven"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            I consent to receive information from Spectrum 4 BCS2611 related to the Storage Locker rental program (Required)
                          </FormLabel>
                          <FormDescription>
                            By checking this box, you agree to receive information about storage locker availability, pricing, and rental procedures
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Notes or Comments (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific requirements, questions, or additional information about your storage needs..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Please include any specific requirements or questions about storage locker rental
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CAPTCHA */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Security Verification</label>
                  <Turnstile 
                    onSuccess={setTurnstileToken} 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full sm:w-auto" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Interest'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Package className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-purple-900">Limited Availability</h3>
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-lg font-semibold text-purple-800 mb-2">
              Only 10 Storage Lockers Available
            </p>
            <p className="text-purple-700 mb-3">
              Submit your interest early to secure your spot on the waiting list for these premium storage lockers.
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-purple-600">
              <span>✓ Secure & Monitored</span>
              <span>✓ Convenient Access</span>
              <span>✓ Resident Exclusive</span>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default StorageRental; 