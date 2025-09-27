import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { FileText, AlertTriangle, Loader2, UserCheck } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const formSchema = z.object({
  // Property Information
  strataPlan: z.string().min(1, { message: 'Strata plan is required' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters' }),
  unitNumber: z.string().min(1, { message: 'Unit number is required' }),
  strataLotNumber: z.string().min(1, { message: 'Strata lot number is required' }),
  lockerNumber: z.string().optional(),
  parkingStallNumbers: z.string().optional(),
  
  // Tenant 1 Information (Required)
  tenant1Name: z.string().min(2, { message: 'Tenant name must be at least 2 characters' }),
  tenant1HomePhone: z.string().optional(),
  tenant1OfficePhone: z.string().optional(),
  tenant1CellPhone: z.string().optional(),
  tenant1Email: z.string().email({ message: 'Please enter a valid email address' }).optional().or(z.literal('')),
  
  // Tenant 2 Information (Optional)
  tenant2Name: z.string().optional(),
  tenant2HomePhone: z.string().optional(),
  tenant2OfficePhone: z.string().optional(),
  tenant2CellPhone: z.string().optional(),
  tenant2Email: z.string().email({ message: 'Please enter a valid email address' }).optional().or(z.literal('')),
  
  // Tenancy Information
  tenancyCommencingDay: z.string().min(1, { message: 'Day is required' }),
  tenancyCommencingDate: z.string().min(1, { message: 'Month is required' }),
  tenancyCommencingYear: z.string().min(4, { message: 'Year must be 4 digits' }),
  
  // Landlord/Agent Information
  landlordName: z.string().min(2, { message: 'Landlord/agent name must be at least 2 characters' }),
  landlordAddress: z.string().min(5, { message: 'Landlord/agent address must be at least 5 characters' }),
  
  // Owner Information
  ownerMailingAddress: z.string().min(5, { message: 'Owner mailing address must be at least 5 characters' }),
  ownerHomePhone: z.string().optional(),
  ownerWorkPhone: z.string().optional(),
  ownerFax: z.string().optional(),
  ownerCellular: z.string().optional(),
  ownerEmail: z.string().email({ message: 'Please enter a valid email address' }).optional().or(z.literal('')),
  
  // Form metadata
  submissionDate: z.string().min(1, { message: 'Date is required' }),
});

type FormKValues = z.infer<typeof formSchema>;

const FormK = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Signature canvas refs
  const landlordSigRef = useRef<SignatureCanvas>(null);
  const tenant1SigRef = useRef<SignatureCanvas>(null);
  const tenant2SigRef = useRef<SignatureCanvas>(null);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  const form = useForm<FormKValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      strataPlan: '',
      address: '',
      unitNumber: '',
      strataLotNumber: '',
      lockerNumber: '',
      parkingStallNumbers: '',
      tenant1Name: '',
      tenant1HomePhone: '',
      tenant1OfficePhone: '',
      tenant1CellPhone: '',
      tenant1Email: '',
      tenant2Name: '',
      tenant2HomePhone: '',
      tenant2OfficePhone: '',
      tenant2CellPhone: '',
      tenant2Email: '',
      tenancyCommencingDay: '',
      tenancyCommencingDate: '',
      tenancyCommencingYear: '',
      landlordName: '',
      landlordAddress: '',
      ownerMailingAddress: '',
      ownerHomePhone: '',
      ownerWorkPhone: '',
      ownerFax: '',
      ownerCellular: '',
      ownerEmail: '',
      submissionDate: new Date().toLocaleDateString(),
    }
  });

  const clearSignature = useCallback((canvasRef: React.RefObject<SignatureCanvas>) => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  }, []);

  const onSubmit = async (data: FormKValues) => {
    if (!captchaToken) {
      toast({
        title: "Verification Required",
        description: "Please complete the security verification.",
        variant: "destructive",
      });
      return;
    }

    // Check if required signatures are present
    const landlordSignature = landlordSigRef.current?.toDataURL();
    const tenant1Signature = tenant1SigRef.current?.toDataURL();
    
    if (!landlordSignature || landlordSigRef.current?.isEmpty()) {
      toast({
        title: "Landlord/Agent Signature Required",
        description: "Please provide the landlord/agent signature.",
        variant: "destructive",
      });
      return;
    }

    if (!tenant1Signature || tenant1SigRef.current?.isEmpty()) {
      toast({
        title: "Tenant Signature Required",
        description: "Please provide at least one tenant signature.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        ...data,
        landlordSignature,
        tenant1Signature,
        tenant2Signature: tenant2SigRef.current?.isEmpty() ? null : tenant2SigRef.current?.toDataURL(),
        captchaToken,
      };

      const response = await fetch('/api/form-k-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      toast({
        title: "Form K Submitted Successfully",
        description: "Your Notice of Tenant's Responsibilities has been submitted and will be processed.",
      });

      // Clear form and signatures
      form.reset();
      clearSignature(landlordSigRef);
      clearSignature(tenant1SigRef);
      clearSignature(tenant2SigRef);
      setCaptchaToken(null);

      // Navigate to a confirmation page or home
      navigate('/');

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PageHeader 
        title="Form K - Notice of Tenant's Responsibilities"
        description="Strata Property Act Form K (Section 146)"
        icon={<FileText className="h-8 w-8" />}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Important Notice */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important Notice to Tenants:</strong> Under the Strata Property Act, tenants must comply with bylaws and rules of the strata corporation that are in force from time to time.
              </AlertDescription>
            </Alert>

            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="strataPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strata Plan</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LMS123" {...field} />
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
                          <Input placeholder="e.g., 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Property address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="strataLotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strata Lot #</FormLabel>
                        <FormControl>
                          <Input placeholder="Lot number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lockerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Locker # (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Locker number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="parkingStallNumbers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parking Stall(s) # (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Parking stall numbers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tenant 1 Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Primary Tenant</h3>
                  <FormField
                    control={form.control}
                    name="tenant1Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of tenant</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tenant1HomePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Home phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tenant1OfficePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Office phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tenant1CellPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cell Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Cell phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tenant1Email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Tenant 2 Information (Optional) */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Second Tenant (Optional)</h3>
                  <FormField
                    control={form.control}
                    name="tenant2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of tenant</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tenant2HomePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Home phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tenant2OfficePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Office phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tenant2CellPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cell Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Cell phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tenant2Email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenancy Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tenancy Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Tenancy commencing this:</p>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="tenancyCommencingDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 15th" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tenancyCommencingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., January" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tenancyCommencingYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notices */}
            <Card>
              <CardHeader>
                <CardTitle>Important Notice to Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Under the <em>Strata Property Act</em>, a tenant in a strata corporation <strong>must</strong> comply with the bylaws and rules of the strata corporation that are in force from time to time (current bylaws and rules attached).</li>
                      <li>The current bylaws and rules may be changed by the strata corporation, and if they are changed, the tenant <strong>must</strong> comply with the changed bylaws and rules.</li>
                      <li>If a tenant or occupant of the strata lot, or a person visiting the tenant or admitted by the tenant for any reason, contravenes a bylaw or rule, the tenant is responsible and may be subject to penalties, including fines, denial of access to recreational facilities, and if the strata corporation incurs costs for remedying a contravention, payment of those costs.</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Landlord/Agent Information */}
            <Card>
              <CardHeader>
                <CardTitle>Landlord/Agent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="landlordName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name & Address of landlord, or agent of landlord</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="landlordAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="ownerMailingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner's Mailing Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Complete mailing address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerHomePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Home phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerWorkPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Work phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerFax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fax</FormLabel>
                        <FormControl>
                          <Input placeholder="Fax number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerCellular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cellular</FormLabel>
                        <FormControl>
                          <Input placeholder="Cell phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Signatures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Electronic Signatures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please sign in the boxes below using your mouse, finger, or stylus. All signatures are required.
                  </AlertDescription>
                </Alert>

                {/* Landlord/Agent Signature */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Signature of Landlord, or Agent of Landlord *</label>
                  <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                    <SignatureCanvas
                      ref={landlordSigRef}
                      canvasProps={{
                        width: 400,
                        height: 150,
                        className: 'signature-canvas w-full',
                        style: { border: '1px solid #e5e7eb', borderRadius: '4px' }
                      }}
                      backgroundColor="rgb(255,255,255)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearSignature(landlordSigRef)}
                  >
                    Clear Signature
                  </Button>
                </div>

                {/* Tenant 1 Signature */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Signature of Tenant *</label>
                  <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                    <SignatureCanvas
                      ref={tenant1SigRef}
                      canvasProps={{
                        width: 400,
                        height: 150,
                        className: 'signature-canvas w-full',
                        style: { border: '1px solid #e5e7eb', borderRadius: '4px' }
                      }}
                      backgroundColor="rgb(255,255,255)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearSignature(tenant1SigRef)}
                  >
                    Clear Signature
                  </Button>
                </div>

                {/* Tenant 2 Signature (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Signature of Second Tenant (if applicable)</label>
                  <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                    <SignatureCanvas
                      ref={tenant2SigRef}
                      canvasProps={{
                        width: 400,
                        height: 150,
                        className: 'signature-canvas w-full',
                        style: { border: '1px solid #e5e7eb', borderRadius: '4px' }
                      }}
                      backgroundColor="rgb(255,255,255)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearSignature(tenant2SigRef)}
                  >
                    Clear Signature
                  </Button>
                </div>

                {/* Submission Date */}
                <FormField
                  control={form.control}
                  name="submissionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dated this</FormLabel>
                      <FormControl>
                        <Input placeholder="Date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Date of form completion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Security Verification */}
            <Card>
              <CardHeader>
                <CardTitle>Security Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Form K...
                  </>
                ) : (
                  'Submit Form K'
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Please remit original to:</p>
              <p className="font-semibold">ASCENT REAL ESTATE MANAGEMENT CORPORATION</p>
              <p>2176 WILLINGDON AVENUE</p>
              <p>BURNABY, BC V5C 5Z9</p>
              <p>FAX: (604) 431-1818</p>
            </div>
          </form>
        </Form>
      </div>

      <Footer />
    </div>
  );
};

export default FormK;
