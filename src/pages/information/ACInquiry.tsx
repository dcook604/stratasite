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
import { Snowflake, User, Phone, Mail, Settings, Clock, MessageSquare, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  ownerName: z.string().min(2, { message: 'Owner name must be at least 2 characters' }),
  ownerUnit: z.string().min(1, { message: 'Unit number is required' }),
  ownerPhone: z.string().min(10, { message: 'Please enter a valid phone number' }).refine((val) => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, { message: 'Please enter a valid phone number' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  isMultiZone: z.boolean().default(false),
  bestContactMethod: z.enum(['EMAIL', 'TELEPHONE'], {
    required_error: 'Please select your preferred contact method'
  }),
  installationTiming: z.string().min(5, { message: 'Please provide installation timing details' }),
  notes: z.string().optional(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'You must consent to receiving information from Airlux'
  })
});

type ACInquiryValues = z.infer<typeof formSchema>;

const ACInquiry = () => {
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<ACInquiryValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: '',
      ownerUnit: '',
      ownerPhone: '',
      email: '',
      isMultiZone: false,
      bestContactMethod: undefined,
      installationTiming: '',
      notes: '',
      consentGiven: false
    }
  });

  const onSubmit = async (data: ACInquiryValues) => {
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
      const response = await fetch('/api/ac-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken
        }),
      });

      if (response.ok) {
        toast({
          title: "Inquiry submitted",
          description: "Your AC inquiry has been submitted successfully. You will be contacted soon regarding your installation.",
        });
        form.reset();
        setTurnstileToken(null);
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: 'Failed to submit inquiry. Please try again.', 
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
        title="AC Inquiry"
        description="Request information about air conditioning installation from Airlux"
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Snowflake className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Air Conditioning Inquiry Form
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Get expert advice on AC installation options for your unit
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Airlux Branding & Approved Vendor Notice */}
        <Card className="mb-8 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-50">
          <CardHeader>
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center gap-3">
                <Snowflake className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">AIRLUX</h2>
                  <p className="text-sm text-blue-700 font-medium">Professional HVAC Solutions</p>
                </div>
                <Snowflake className="h-8 w-8 text-blue-600" />
              </div>
              
              <Alert className="border-amber-300 bg-amber-50">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  <div className="text-center space-y-2">
                    <p className="font-bold">EXCLUSIVE APPROVED VENDOR</p>
                    <p>Airlux is the <strong>ONLY approved vendor</strong> for AC and Heat Pump installation at Spectrum 4.</p>
                    <p className="text-sm">No other vendors are authorized for HVAC installations in this building.</p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <a 
                  href="https://airlux.ca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  🌐 Visit airlux.ca
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Professional installation • Expert consultation • Quality guaranteed
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Important Notice */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Snowflake className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-semibold">Professional AC Installation Services</p>
              <p>Get expert advice on air conditioning and heat pump solutions designed specifically for your Spectrum 4 unit. Our team will assess your space and recommend the most efficient cooling and heating options.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* AC Inquiry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Inquiry Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Owner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Owner Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ownerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 101" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Phone Number</FormLabel>
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
                </div>

                {/* Installation Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Installation Details
                  </h3>

                  <FormField
                    control={form.control}
                    name="isMultiZone"
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
                            Multi-Zone Installation (Check if you need multiple zones/rooms cooled)
                          </FormLabel>
                          <FormDescription>
                            Single-zone installations cool one main area, while multi-zone systems can cool multiple rooms independently
                          </FormDescription>
                          <FormMessage />
                        </div>
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

                  <FormField
                    control={form.control}
                    name="installationTiming"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Installation Timing
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Summer 2025, As soon as possible, Fall 2025, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          When would you like the installation to take place?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Additional Notes (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific requirements, questions, or additional information about your AC installation needs..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Please include any specific requirements or questions about your installation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Consent */}
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
                          I consent to receiving information from Airlux related to installation details (Required)
                        </FormLabel>
                        <FormDescription>
                          By checking this box, you agree to receive installation information, quotes, and follow-up communications from Airlux regarding your AC inquiry
                        </FormDescription>
                        <FormMessage />
                      </div>
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
                  {isSubmitting ? 'Submitting...' : 'Submit AC Inquiry'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Snowflake className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-blue-900">AIRLUX</h3>
              <Snowflake className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-blue-800 mb-2">
              Your Exclusive Spectrum 4 HVAC Partner
            </p>
            <p className="text-blue-700 mb-3">
              Get expert consultation and professional installation from the only approved vendor for AC and Heat Pump systems at Spectrum 4.
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-blue-600">
              <span>✓ Building-Approved Vendor</span>
              <span>✓ Expert Installation</span>
              <span>✓ Quality Guaranteed</span>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ACInquiry; 