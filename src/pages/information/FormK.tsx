import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { TurnstileCaptcha } from '@/components/ui/TurnstileCaptcha';
import { FileText, AlertTriangle, Loader2, UserCheck, Mail, Clock } from 'lucide-react';

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
  
  // Signature Information (Typed Signatures)
  landlordSignatureName: z.string().min(2, { message: 'Landlord/agent signature name is required' }),
  landlordSignatureDate: z.string().min(1, { message: 'Signature date is required' }),
  
  // Tenant Signing Options
  tenantSigningMethod: z.enum(['present', 'email'], { 
    required_error: 'Please select how tenants will sign' 
  }),
  
  // If tenants are present
  tenant1SignatureName: z.string().optional(),
  tenant1SignatureDate: z.string().optional(),
  tenant2SignatureName: z.string().optional(),
  tenant2SignatureDate: z.string().optional(),
  
  // Form metadata
  submissionDate: z.string().min(1, { message: 'Date is required' }),
});

type FormKValues = z.infer<typeof formSchema>;

const FormK = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [tenantSigningMethod, setTenantSigningMethod] = React.useState<'present' | 'email'>('present');

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
      landlordSignatureName: '',
      landlordSignatureDate: new Date().toLocaleDateString(),
      tenantSigningMethod: 'present',
      tenant1SignatureName: '',
      tenant1SignatureDate: '',
      tenant2SignatureName: '',
      tenant2SignatureDate: '',
      submissionDate: new Date().toLocaleDateString(),
    }
  });

  // Watch tenant signing method to conditionally validate signatures
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'tenantSigningMethod') {
        setTenantSigningMethod(value.tenantSigningMethod as 'present' | 'email');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-populate tenant signature dates when "present" method is selected
  React.useEffect(() => {
    if (tenantSigningMethod === 'present') {
      const today = new Date().toLocaleDateString();
      if (!form.getValues('tenant1SignatureDate')) {
        form.setValue('tenant1SignatureDate', today);
      }
      if (!form.getValues('tenant2SignatureDate')) {
        form.setValue('tenant2SignatureDate', today);
      }
    }
  }, [tenantSigningMethod, form]);

  const onSubmit = async (data: FormKValues) => {
    if (!captchaToken) {
      toast({
        title: "Verification Required",
        description: "Please complete the security verification.",
        variant: "destructive",
      });
      return;
    }

    // Validate landlord signature
    if (!data.landlordSignatureName.trim()) {
      toast({
        title: "Landlord/Agent Signature Required",
        description: "Please provide the landlord/agent signature name.",
        variant: "destructive",
      });
      return;
    }

    // Validate tenant signatures based on method
    if (data.tenantSigningMethod === 'present') {
      if (!data.tenant1SignatureName?.trim()) {
        toast({
          title: "Tenant Signature Required",
          description: "Please provide at least one tenant signature name.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For email method, validate tenant email addresses
      if (!data.tenant1Email?.trim()) {
        toast({
          title: "Tenant Email Required",
          description: "Please provide tenant email address for signature request.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formData = {
        ...data,
        captchaToken,
        // Include signature status for tracking
        requiresTenantSignatures: data.tenantSigningMethod === 'email',
        landlordSignatureCompleted: true,
        tenant1SignatureCompleted: data.tenantSigningMethod === 'present',
        tenant2SignatureCompleted: data.tenantSigningMethod === 'present' && !!data.tenant2SignatureName?.trim(),
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

      const successMessage = data.tenantSigningMethod === 'email' 
        ? "Form K submitted successfully! Signature request emails will be sent to the tenants."
        : "Form K submitted successfully! All signatures have been collected.";
      
      toast({
        title: "Form K Submitted Successfully",
        description: successMessage,
      });

      // Clear form
      form.reset();
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* Tenant Signing Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Tenant Signing Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Choose how tenants will provide their signatures. If tenants are not present, you can send them signature requests via email.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="tenantSigningMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>How will tenants sign this form?</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={field.value === 'present'} 
                              onCheckedChange={() => field.onChange('present')}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Tenants are present now
                              </label>
                              <p className="text-xs text-muted-foreground">
                                Tenants will type their names as signatures right now
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={field.value === 'email'} 
                              onCheckedChange={() => field.onChange('email')}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                <Mail className="h-4 w-4 inline mr-1" />
                                Send signature requests via email
                              </label>
                              <p className="text-xs text-muted-foreground">
                                Tenants will receive secure links to sign separately
                              </p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Landlord/Agent Signature */}
            <Card>
              <CardHeader>
                <CardTitle>Landlord/Agent Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="landlordSignatureName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Type your full name as signature" {...field} />
                        </FormControl>
                        <FormDescription>
                          By typing your name, you are electronically signing this document
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="landlordSignatureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature Date</FormLabel>
                        <FormControl>
                          <Input placeholder="Date of signature" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tenant Signatures - Conditional based on method */}
            {tenantSigningMethod === 'present' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Signatures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <UserCheck className="h-4 w-4" />
                    <AlertDescription>
                      Tenants should type their full names in the fields below to provide their electronic signatures.
                    </AlertDescription>
                  </Alert>

                  {/* Tenant 1 Signature */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Primary Tenant Signature</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tenant1SignatureName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Signature Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Type your full name as signature" {...field} />
                            </FormControl>
                            <FormDescription>
                              By typing your name, you are electronically signing this document
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tenant1SignatureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Signature Date</FormLabel>
                            <FormControl>
                              <Input placeholder="Date of signature" {...field} value={field.value || new Date().toLocaleDateString()} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Tenant 2 Signature (Optional) */}
                  {form.watch('tenant2Name') && (
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="text-lg font-semibold">Second Tenant Signature (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tenant2SignatureName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Signature Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Type your full name as signature" {...field} />
                              </FormControl>
                              <FormDescription>
                                By typing your name, you are electronically signing this document
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="tenant2SignatureDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Signature Date</FormLabel>
                              <FormControl>
                                <Input placeholder="Date of signature" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Email Method Information */}
            {tenantSigningMethod === 'email' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Tenant Email Signature Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Email Signature Process:</strong> After you submit this form, secure signature request emails will be automatically sent to the tenant(s). They will receive unique links to sign the form electronically. You will be notified once all signatures are collected.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">What happens next:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Form is submitted with landlord/agent signature</li>
                      <li>Secure signature links are emailed to tenants</li>
                      <li>Tenants click links to sign electronically</li>
                      <li>You receive notification when all signatures are complete</li>
                      <li>Completed form is sent to property management</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Submission Date */}
            <Card>
              <CardHeader>
                <CardTitle>Form Completion</CardTitle>
              </CardHeader>
              <CardContent>
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
                <TurnstileCaptcha
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

          </form>
        </Form>
      </div>

      <Footer />
    </div>
  );
};

export default FormK;
