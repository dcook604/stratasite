import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarIcon, Zap, AlertTriangle, DollarSign, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  date: z.string().min(1, { message: 'Date is required' }),
  unitNumber: z.string().min(1, { message: 'Unit number is required' }),
  numberOfScooters: z.string().min(1, { message: 'Number of e-scooters is required' }).refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num > 0 && num <= 10;
  }, { message: 'Must be a valid number between 1 and 10' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  ownerNames: z.string().min(2, { message: 'Owner name(s) must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, { message: 'Please enter a valid phone number' }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

type ScooterRegistrationValues = z.infer<typeof formSchema>;

const ScooterRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<ScooterRegistrationValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      unitNumber: '',
      numberOfScooters: '',
      description: '',
      ownerNames: '',
      email: '',
      phone: '',
      acceptTerms: false
    }
  });

  const onSubmit = async (data: ScooterRegistrationValues) => {
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
      const response = await fetch('/api/scooter-registration', {
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
            formType: 'scooter-registration',
            formName: 'E-Scooter Registration',
            submissionId: result.registrationId,
            message: 'Your e-scooter registration has been submitted successfully.',
            nextSteps: [
              'You will receive a confirmation email shortly.',
              'The strata council will review your registration.',
              'You will be contacted regarding key assignment and deposit payment.'
            ]
          }
        });
      } else {
        throw new Error('Failed to submit registration');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: 'Failed to submit registration. Please try again.', 
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
        title="E-Scooter Registration"
        description="Register your e-scooter for secure storage in our parkade facility"
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  E-Scooter Registration Form
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Register your e-scooter to access secure parkade storage
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Important Notice */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p className="font-semibold">Important Notice:</p>
              <p>All E-Scooters must be stored in the gated, secured, parkade storage area.</p>
              <p className="font-semibold text-red-700">As of September 1, 2025, E-Scooters will no longer be allowed inside the building.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Key Deposit Info */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg text-green-800">
                $50 (Refundable) Key Deposit Required
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Registration Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit #</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="numberOfScooters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of E-Scooters</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          placeholder="e.g. 1" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 10 e-scooters per registration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Make, Model, Features)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Xiaomi Mi Pro 2, black, 25 km/h max speed, LED display..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Please include make, model, color, and any distinguishing features
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name(s) of Owner(s)</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name(s) of the owner(s)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email Address</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone Number (Optional)</FormLabel>
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
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Terms and Conditions</h3>
                  
                  <FormField
                    control={form.control}
                    name="acceptTerms"
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
                            I accept the terms and conditions for e-scooter registration
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-500">
                            By checking this box, you agree to comply with all strata bylaws regarding e-scooter storage and usage.
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
                        <Zap className="mr-2 h-4 w-4" />
                        Submit Registration
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold text-blue-800 mb-2">
              Register your E-Scooter today!
            </p>
            <p className="text-blue-700">
              Secure storage with power outlets at no cost to residents.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ScooterRegistration; 