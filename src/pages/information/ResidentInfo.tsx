import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TurnstileCaptcha } from '@/components/ui/TurnstileCaptcha';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] as const;
// Letters D, F, I, O, Q, U never appear in Canadian postal codes
const POSTAL_CODE = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

const formSchema = z.object({
  unitNumber: z.string().trim().min(1, 'Unit number is required').max(20, 'Unit number is too long')
    .regex(/^[A-Za-z0-9\-/ ]+$/, 'Use letters, numbers, spaces, "-" or "/" only'),
  streetAddress: z.string().trim().min(1, 'Street address is required').max(120),
  city: z.string().trim().min(1, 'City is required').max(60),
  province: z.enum(PROVINCES, { required_error: 'Province is required' }),
  postalCode: z.string().trim().min(1, 'Postal code is required')
    .regex(POSTAL_CODE, 'Enter a valid Canadian postal code, e.g. V6B 1A1'),
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address').max(254),
  isTownhouse: z.enum(['yes', 'no'], { required_error: 'Please select yes or no' }),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must accept to submit this form' }) }),
});

type Values = z.infer<typeof formSchema>;

const ResidentInfo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { unitNumber: '', streetAddress: '', city: '', province: 'BC', postalCode: '', firstName: '', lastName: '', email: '', isTownhouse: undefined, consent: undefined },
  });

  const onSubmit = async (data: Values) => {
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
          consent: data.consent,
          streetAddress: data.streetAddress,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode.toUpperCase().replace(/[ -]/g, '').replace(/^(.{3})(.{3})$/, '$1 $2'),
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

                  <FormField control={form.control} name="streetAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl><Input className={inputClass} placeholder="e.g. 602 Citadel Parade" autoComplete="address-line1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input className={inputClass} autoComplete="address-level2" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="province" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal code</FormLabel>
                        <FormControl>
                          <Input className={`${inputClass} uppercase`} placeholder="V6B 1A1" autoComplete="postal-code" autoCapitalize="characters" maxLength={7} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

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

                  <FormField control={form.control} name="consent" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3 rounded-md border p-4 bg-muted/50">
                        <FormControl>
                          <Checkbox
                            id="consent"
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                            className="mt-1 h-5 w-5"
                          />
                        </FormControl>
                        <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
                          I consent to Strata Corporation BCS2611 (Spectrum 4, 602 Citadel Parade) collecting
                          and using the personal information I have provided above for the purpose of
                          registering me for the Amazon Hub Locker system recently installed at Spectrum 4.
                          I understand this information will be used for that purpose only.
                        </Label>
                      </div>
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
