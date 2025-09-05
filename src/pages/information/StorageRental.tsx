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
import { useNavigate } from 'react-router-dom';
import { Package, User, Phone, Mail, MessageSquare, CheckCircle, DollarSign, Lock, Calendar, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const navigate = useNavigate();
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
        const result = await response.json();
        
        // Navigate to acknowledgment page with success data
        navigate('/form-acknowledgment', {
          state: {
            formType: 'storage-rental',
            formName: 'Storage Locker Interest',
            submissionId: result.id || result.interestId,
            message: 'Your storage locker interest has been submitted successfully and saved to our database.',
            nextSteps: [
              'You will be contacted regarding availability.',
              'We will notify you when storage lockers become available.',
              'Priority is given based on submission date and unit requirements.'
            ]
          }
        });
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
                  <h4 className="font-semibold text-blue-800 mb-2">🔒 Locker Specifications (Approximately)</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li><strong>Dimensions:</strong> 35" (3') x 50" (4.2')</li>
                    <li><strong>Height:</strong> 6' to 8' (varies by location)</li>
                    <li><strong>Total Available:</strong> 16-18 secure lockers</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Rental Fees
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li><strong>Monthly Rental:</strong> $120/month</li>
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
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                  
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                </div>

                {/* Contact Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Contact Preferences</h3>
                  
                  <FormField
                    control={form.control}
                    name="bestContactMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Preferred Contact Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="EMAIL" id="email-contact" />
                              <label htmlFor="email-contact" className="cursor-pointer">Email</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="TELEPHONE" id="phone-contact" />
                              <label htmlFor="phone-contact" className="cursor-pointer">Telephone</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific requirements or questions about storage locker rental..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Consent and Interest */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Consent and Interest</h3>
                  
                  <FormField
                    control={form.control}
                    name="interestedInInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I am interested in obtaining more information about storage locker rental
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-500">
                            By checking this box, you indicate your interest in storage locker rental services
                          </FormDescription>
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
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I consent to receiving information from Spectrum 4 BCS2611 regarding storage locker rental
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-500">
                            By checking this box, you agree to be contacted regarding storage locker availability and rental details
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Turnstile CAPTCHA */}
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={setTurnstileToken}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Submit Interest
                      </>
                    )}
                  </Button>
                </div>
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
              16-18 Storage Lockers Available
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