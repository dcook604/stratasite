import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FileText, AlertTriangle, Loader2, UserCheck, CheckCircle, XCircle } from 'lucide-react';

const signatureSchema = z.object({
  signatureName: z.string().min(2, { message: 'Please type your full name' }),
  signatureDate: z.string().min(1, { message: 'Signature date is required' }),
  acknowledgment: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge understanding of tenant responsibilities'
  })
});

type SignatureValues = z.infer<typeof signatureSchema>;

const TenantSignature = () => {
  const { submissionId, token } = useParams<{ submissionId: string; token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadySigned, setIsAlreadySigned] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const form = useForm<SignatureValues>({
    resolver: zodResolver(signatureSchema),
    defaultValues: {
      signatureName: '',
      signatureDate: new Date().toLocaleDateString(),
      acknowledgment: false,
    }
  });

  // Load form data and validate token
  useEffect(() => {
    const loadFormData = async () => {
      if (!submissionId || !token) {
        setError('Invalid signature link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/tenant-signature/${submissionId}/${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 410) {
            setIsAlreadySigned(true);
          } else if (response.status === 404) {
            setIsExpired(true);
          } else {
            setError(data.error || 'Failed to load signature form');
          }
          setIsLoading(false);
          return;
        }

        setFormData(data.submission);
        setTenantInfo(data.tenantInfo);
        
        // Pre-fill signature name if available
        if (data.tenantInfo.name) {
          form.setValue('signatureName', data.tenantInfo.name);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Failed to load signature form');
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [submissionId, token, form]);

  const onSubmit = async (data: SignatureValues) => {
    if (!submissionId || !token) {
      toast({
        title: "Error",
        description: "Invalid signature parameters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tenant-signature/${submissionId}/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit signature');
      }

      toast({
        title: "Signature Submitted Successfully",
        description: "Your signature has been recorded. Thank you for completing Form K.",
      });

      // Redirect to home page with correct domain
      window.location.href = 'https://www.spectrum4.ca/';

    } catch (error) {
      console.error('Signature submission error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "There was an error submitting your signature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading signature form...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                Error Loading Signature Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={() => navigate('/')} variant="outline">
                  Return to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isAlreadySigned) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Already Signed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This Form K has already been signed. Thank you for completing your tenant responsibilities acknowledgment.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={() => navigate('/')} variant="outline">
                  Return to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <XCircle className="h-6 w-6" />
                Signature Link Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This signature link has expired or is no longer valid. Please contact your landlord or property management to request a new signature link.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={() => navigate('/')} variant="outline">
                  Return to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PageHeader 
        title="Tenant Signature - Form K"
        description="Notice of Tenant's Responsibilities - Electronic Signature Required"
        icon={<FileText className="h-8 w-8" />}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        
        {/* Form Information Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Form K Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Property:</strong> {formData?.address}
              </div>
              <div>
                <strong>Unit Number:</strong> {formData?.unitNumber}
              </div>
              <div>
                <strong>Strata Plan:</strong> {formData?.strataPlan}
              </div>
              <div>
                <strong>Landlord/Agent:</strong> {formData?.landlordName}
              </div>
              <div>
                <strong>Tenancy Commencing:</strong> {formData?.tenancyCommencingDay} day of {formData?.tenancyCommencingDate}, {formData?.tenancyCommencingYear}
              </div>
              <div>
                <strong>Tenant Name:</strong> {tenantInfo?.name}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Legal Notice */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Important Notice to Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold mb-3">By signing this form, you acknowledge understanding of the following:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Under the <em>Strata Property Act</em>, a tenant in a strata corporation <strong>must</strong> comply with the bylaws and rules of the strata corporation that are in force from time to time.</li>
                <li>The current bylaws and rules may be changed by the strata corporation, and if they are changed, the tenant <strong>must</strong> comply with the changed bylaws and rules.</li>
                <li>If a tenant or occupant of the strata lot, or a person visiting the tenant or admitted by the tenant for any reason, contravenes a bylaw or rule, the tenant is responsible and may be subject to penalties, including fines, denial of access to recreational facilities, and if the strata corporation incurs costs for remedying a contravention, payment of those costs.</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Electronic Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    By typing your name below, you are providing your legal electronic signature to acknowledge your understanding and acceptance of the tenant responsibilities outlined above.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="signatureName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type Your Full Name as Signature *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full legal name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will serve as your electronic signature
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="signatureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature Date</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="acknowledgment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          I acknowledge that I have read and understand my responsibilities as a tenant under the Strata Property Act, as outlined in this Form K. I understand that by typing my name above, I am providing my legal electronic signature.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-center pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Signature...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Submit Electronic Signature
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-600 mt-6">
          <p>This signature will complete your Form K requirements.</p>
          <p>Once submitted, you and the landlord will receive confirmation.</p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TenantSignature;
