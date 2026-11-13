import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TurnstileCaptcha } from '@/components/ui/TurnstileCaptcha';
import { AddressAutocomplete, type VerifiedAddress } from '@/components/ui/AddressAutocomplete';

const formSchema = z.object({
  unitNumber: z.string().trim().min(1, 'Unit number is required').max(20, 'Unit number is too long')
    .regex(/^[A-Za-z0-9\-/ ]+$/, 'Use letters, numbers, spaces, "-" or "/" only'),
  address: z.string().trim().min(1, 'Address is required'),
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address').max(254),
  isTownhouse: z.enum(['yes', 'no'], { required_error: 'Please select yes or no' }),
});

type Values = z.infer<typeof formSchema>;

const ResidentInfo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [canadaPostKey, setCanadaPostKey] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState<VerifiedAddress | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { unitNumber: '', address: '', firstName: '', lastName: '', email: '', isTownhouse: undefined },
  });

  React.useEffect(() => {
    fetch('/api/config/public')
      .then((r) => r.json())
      .then((d) => setCanadaPostKey(d.canadaPostKey || ''))
      .catch(() => setCanadaPostKey(''));
  }, []);

  const onSubmit = async (data: Values) => {
    if (!verified) {
      form.setError('address', { message: 'Please select your address from the suggestions' });
      return;
    }
    if (!turnstileToken) {
      toast({ title: 'Error', description: 'Please complete the CAPTCHA verification', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/resident-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitNumber: data.unitNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          isTownhouse: data.isTownhouse === 'yes',
          ...verified,
          turnstileToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to submit');

      navigate('/form-acknowledgment', {
        state: {
          formType: 'resident-info',
          formName: 'Resident Information',
          submissionId: result.submissionId,
          message: 'Thank you. Your information has been submitted successfully.',
          nextSteps: ['Your information is now on file with the strata.'],
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 16px+ inputs stop iOS Safari from zooming on focus
  const inputClass = 'h-12 text-base';

  return (
    <div className="page-container">
      <Navbar />
      <div id="main-content" className="page-content" tabIndex={-1}>
        <PageHeader title="Resident Information" description="Spectrum 4 – Strata Corporation BCS2611" />
        <div className="form-page-container max-w-xl">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl><Input className={inputClass} autoComplete="given-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl><Input className={inputClass} autoComplete="family-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input className={inputClass} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="unitNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit #</FormLabel>
                      <FormControl><Input className={inputClass} placeholder="e.g. 101" autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="address" render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        {canadaPostKey === null ? (
                          <Input className={inputClass} disabled placeholder="Loading…" />
                        ) : canadaPostKey === '' ? (
                          <p role="alert" className="text-sm text-destructive">
                            Address lookup is not configured. Please contact the strata office.
                          </p>
                        ) : (
                          <AddressAutocomplete
                            apiKey={canadaPostKey}
                            value={field.value}
                            onChange={field.onChange}
                            onVerified={(a) => { setVerified(a); if (a) form.clearErrors('address'); }}
                            verified={!!verified}
                            invalid={!!fieldState.error}
                          />
                        )}
                      </FormControl>
                      {verified && (
                        <p className="text-sm text-muted-foreground">{verified.city}, {verified.province} {verified.postalCode}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="isTownhouse" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Are you a townhouse?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-3">
                          {(['yes', 'no'] as const).map((v) => (
                            <Label
                              key={v}
                              htmlFor={`townhouse-${v}`}
                              className="flex items-center gap-3 rounded-md border p-4 min-h-12 cursor-pointer text-base capitalize has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted"
                            >
                              <RadioGroupItem id={`townhouse-${v}`} value={v} />
                              {v}
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-center">
                    <TurnstileCaptcha
                      onSuccess={setTurnstileToken}
                      onError={() => setTurnstileToken(null)}
                      onExpire={() => setTurnstileToken(null)}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : 'Submit'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResidentInfo;
