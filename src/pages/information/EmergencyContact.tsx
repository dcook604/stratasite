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
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, AlertTriangle, Loader2 } from 'lucide-react';

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
  const navigate = useNavigate();
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
        const result = await response.json();
        
        // Navigate to acknowledgment page with success data
        navigate('/acknowledgment', {
          state: {
            type: 'emergency-contact',
            title: 'Emergency Contact Information Submitted!',
            description: 'Your emergency contact information has been submitted successfully and saved to our database.',
            registrationId: result.id || result.contactId,
            nextSteps: [
              'Your emergency contact information is now on file.',
              'This information will be used in case of emergencies.',
              'Please update this information if your contacts change.'
            ]
          }
        });
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Unit Information</h3>
                  
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
                </div>

                {/* Owner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Owner Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="registeredOwnerNames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registered Owner Name(s)</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name(s) of registered owner(s)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="ownerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Email (Optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="owner@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phoneHome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phoneBusiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
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
                          <FormLabel>Other Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
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
                        <FormLabel>Specify Other Phone Type (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Mobile, Fax, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Non-Resident Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Non-Resident Information (If Applicable)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nonResidentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Non-Resident Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="nonResidentPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Non-Resident Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
                  
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name of emergency contact" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="emergencyContactAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="emergencyContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="emergency@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Access Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Access Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="allowManagementAccess"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Does emergency contact have spare key or access code?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="YES" id="access-yes" />
                              <label htmlFor="access-yes" className="cursor-pointer">Yes</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="NO" id="access-no" />
                              <label htmlFor="access-no" className="cursor-pointer">No</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conciergeKeyProvided"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Have you provided spare key/access code to concierge?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="YES" id="concierge-yes" />
                              <label htmlFor="concierge-yes" className="cursor-pointer">Yes</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="NO" id="concierge-no" />
                              <label htmlFor="concierge-no" className="cursor-pointer">No</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="dateProvidedToConcierge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Provided to Concierge (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="securityCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Access code if applicable" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                        <Phone className="mr-2 h-4 w-4" />
                        Submit Emergency Contact Information
                      </>
                    )}
                  </Button>
                </div>
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