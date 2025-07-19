import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
import { Phone, Shield, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  unitNumber: z.string().min(1, { message: 'Unit number is required' }),
  strataLotNumber: z.string().min(1, { message: 'Strata lot number is required' }),
  registeredOwnerNames: z.string().min(2, { message: 'Registered owner name(s) must be at least 2 characters' }),
  ownerEmail: z.string().email({ message: 'Please enter a valid email address' }).optional().or(z.literal('')),
  phoneHome: z.string().optional(),
  phoneBusiness: z.string().optional(),
  phoneOther: z.string().optional(),
  phoneOtherSpecify: z.string().optional(),
  nonResidentAddress: z.string().optional(),
  nonResidentPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactAddress: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactEmail: z.string().email({ message: 'Please enter a valid email address' }).optional().or(z.literal('')),
  allowManagementAccess: z.enum(['YES', 'NO'], {
    required_error: 'Please select whether emergency contact has spare key or code'
  }),
  conciergeKeyProvided: z.enum(['YES', 'NO'], {
    required_error: 'Please select whether you have provided spare key/access code to concierge'
  }),
  dateProvidedToConcierge: z.string().optional(),
  securityCode: z.string().optional()
});

type EmergencyContactValues = z.infer<typeof formSchema>;

const EmergencyContact = () => {
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<EmergencyContactValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitNumber: '',
      strataLotNumber: '',
      registeredOwnerNames: '',
      ownerEmail: '',
      phoneHome: '',
      phoneBusiness: '',
      phoneOther: '',
      phoneOtherSpecify: '',
      nonResidentAddress: '',
      nonResidentPhone: '',
      emergencyContactName: '',
      emergencyContactAddress: '',
      emergencyContactPhone: '',
      emergencyContactEmail: '',
      allowManagementAccess: undefined,
      conciergeKeyProvided: undefined,
      dateProvidedToConcierge: '',
      securityCode: ''
    }
  });

  const onSubmit = async (data: EmergencyContactValues) => {
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
      const response = await fetch('/api/emergency-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken
        }),
      });

      if (response.ok) {
        toast({
          title: "Emergency Contact Information Submitted",
          description: "Your emergency contact information has been submitted successfully. The management team will update their records accordingly.",
        });
        form.reset();
        setTurnstileToken(null);
      } else {
        throw new Error('Failed to submit emergency contact information');
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: 'Failed to submit emergency contact information. Please try again.', 
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
        title="Emergency Contact Information"
        description="Provide your emergency contact information for our records"
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Phone className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Emergency Information Form
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Strata Corporation BCS2611 - SPECTRUM 4
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Confidentiality Notice */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-semibold">Confidentiality Notice:</p>
              <p>The following information is confidential and for the purpose of contacting you or your relatives in the event of an emergency. This information is held in the strictest of confidence and will not be released to anyone without your permission.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Emergency Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Unit and Strata Lot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  
                  <FormField
                    control={form.control}
                    name="strataLotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strata Lot #</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Registered Owner Names */}
                <FormField
                  control={form.control}
                  name="registeredOwnerNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registered Owner(s) full name(s)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the full names of all registered owners"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Owner Email Address */}
                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="owner@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Email address for primary contact with owner(s)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Numbers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Telephone Numbers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneHome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home (h)</FormLabel>
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
                      name="phoneBusiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business (b)</FormLabel>
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
                      name="phoneOther"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="phoneOtherSpecify"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other (please specify)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Mobile, Work, etc." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Non-resident Owner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Non-resident Owner Information</h3>
                  <p className="text-sm text-gray-600">Complete this section if unit is rented or you are an absentee Landlord</p>
                  
                  <FormField
                    control={form.control}
                    name="nonResidentAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Non-resident owner address and phone number</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full address and phone number"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name, Address and Telephone number of a local contact in the event of an emergency in your suite</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full name, complete address, and phone number"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergencyContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="emergency.contact@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Email address for emergency contact person
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Emergency Contact Key Access */}
                <FormField
                  control={form.control}
                  name="allowManagementAccess"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Does your emergency contact have your units spare key, or code for access:
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-8"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="YES" id="emergency_yes" />
                            <Label htmlFor="emergency_yes" className="text-lg font-medium">YES</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NO" id="emergency_no" />
                            <Label htmlFor="emergency_no" className="text-lg font-medium">NO</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Concierge Key Access */}
                <FormField
                  control={form.control}
                  name="conciergeKeyProvided"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">
                        Have you provided a spare key/access code for your unit to concierge for emergency access:
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-8"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="YES" id="concierge_yes" />
                            <Label htmlFor="concierge_yes" className="text-lg font-medium">YES</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NO" id="concierge_no" />
                            <Label htmlFor="concierge_no" className="text-lg font-medium">NO</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Provided to Concierge */}
                <FormField
                  control={form.control}
                  name="dateProvidedToConcierge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Provided to Concierge</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the date when you provided the spare key/access code to the concierge (if applicable)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Security Code */}
                <FormField
                  control={form.control}
                  name="securityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access code for security system (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter security code if applicable" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This information will be kept strictly confidential and used only in emergency situations
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
                  {isSubmitting ? 'Submitting...' : 'Submit Emergency Contact Information'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
              <div>
                <p className="text-lg font-semibold text-yellow-800 mb-2">
                  Important Notice
                </p>
                <p className="text-yellow-700">
                  Please ensure all information is accurate and up-to-date. This information will be used only in emergency situations and will be kept strictly confidential. Notify the management company immediately if any of this information changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EmergencyContact; 