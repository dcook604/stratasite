import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Upload, X, FileVideo } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  reporterName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  reporterEmail: z.string().email({ message: 'Please enter a valid email address' }),
  reporterPhone: z.string().min(7, { message: 'Please enter a valid phone number' }),
  unitNumber: z.string().min(1, { message: 'Unit number is required' }),
  incidentDate: z.string().optional(),
  dateUnknown: z.boolean().default(false),
  incidentTime: z.string().optional(),
  timeUnknown: z.boolean().default(false),
  incidentLocation: z.string().min(3, { message: 'Please describe where the incident occurred' }),
  incidentTitle: z.string().min(3, { message: 'Please provide a brief title' }).max(150, { message: 'Title must be 150 characters or less' }),
  incidentDescription: z.string().min(10, { message: 'Please provide more detail about the incident' }),
  policeAttended: z.boolean().default(false),
  policeCaseNumber: z.string().optional(),
  bylawViolation: z.boolean().default(false),
  commonPropertyDamage: z.boolean().default(false),
  hasEvidence: z.boolean().default(false),
  turnstileToken: z.string().min(1, { message: 'Please complete the verification' }),
}).superRefine((data, ctx) => {
  if (!data.dateUnknown && !data.incidentDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Incident date is required', path: ['incidentDate'] });
  }
  if (!data.timeUnknown && !data.incidentTime) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Incident time is required', path: ['incidentTime'] });
  }
});

type FormData = z.infer<typeof formSchema>;

const IncidentReport: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(Date.now());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; preview: string | null; isImage: boolean }[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporterName: '',
      reporterEmail: '',
      reporterPhone: '',
      unitNumber: '',
      incidentDate: '',
      dateUnknown: false,
      incidentTime: '',
      timeUnknown: false,
      incidentLocation: '',
      incidentTitle: '',
      incidentDescription: '',
      policeAttended: false,
      policeCaseNumber: '',
      bylawViolation: false,
      commonPropertyDamage: false,
      hasEvidence: false,
      turnstileToken: '',
    },
  });

  const hasEvidence = form.watch('hasEvidence');
  const policeAttended = form.watch('policeAttended');
  const dateUnknown = form.watch('dateUnknown');
  const timeUnknown = form.watch('timeUnknown');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > MAX_FILES) {
      toast({
        title: 'Too many files',
        description: `You can upload a maximum of ${MAX_FILES} files.`,
        variant: 'destructive',
      });
      return;
    }

    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    ];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload only images (JPEG, PNG, WebP) or videos (MP4, MOV, AVI, WebM).',
        variant: 'destructive',
      });
      return;
    }

    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: 'Each file must be smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const newPreviews: { name: string; preview: string | null; isImage: boolean }[] = [];
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews(prev => [...prev, { name: file.name, preview: e.target?.result as string, isImage: true }]);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews(prev => [...prev, { name: file.name, preview: null, isImage: false }]);
      }
    });

    // Reset input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all text fields
      formData.append('reporterName', data.reporterName);
      formData.append('reporterEmail', data.reporterEmail);
      formData.append('reporterPhone', data.reporterPhone);
      formData.append('unitNumber', data.unitNumber);
      formData.append('incidentDate', data.dateUnknown ? 'Unknown' : (data.incidentDate || ''));
      formData.append('dateUnknown', String(data.dateUnknown));
      formData.append('incidentTime', data.timeUnknown ? 'Unknown' : (data.incidentTime || ''));
      formData.append('timeUnknown', String(data.timeUnknown));
      formData.append('incidentLocation', data.incidentLocation);
      formData.append('incidentTitle', data.incidentTitle);
      formData.append('incidentDescription', data.incidentDescription);
      formData.append('policeAttended', String(data.policeAttended));
      if (data.policeAttended && data.policeCaseNumber) {
        formData.append('policeCaseNumber', data.policeCaseNumber);
      }
      formData.append('bylawViolation', String(data.bylawViolation));
      formData.append('commonPropertyDamage', String(data.commonPropertyDamage));
      formData.append('hasEvidence', String(data.hasEvidence));
      formData.append('turnstileToken', data.turnstileToken);

      // Append evidence files
      if (data.hasEvidence && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('evidence', file);
        });
      }

      const response = await fetch('/api/incident-report', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit incident report');
      }

      navigate('/form-acknowledgment', {
        state: {
          formType: 'incident-report',
          formName: 'Incident Report',
          submissionId: result.incidentId,
          message: 'Your incident report has been submitted successfully.',
          nextSteps: [
            'You will receive a confirmation email shortly.',
            'The strata council or property manager will review your report.',
            'You may be contacted if additional information is required.',
            'For emergencies, please call 911 immediately.',
          ],
        },
      });
    } catch (error) {
      console.error('Incident report submission error:', error);
      setTurnstileKey(Date.now());
      form.setValue('turnstileToken', '');
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Incident Report"
        description="Report an incident that has occurred on the strata property."
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-semibold">Emergency?</p>
            <p>If this is an emergency, call <strong>911</strong> immediately. This form is for non-emergency incident reporting only.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Incident Report Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Reporter Information */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Reporter Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
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
                          <FormLabel>Unit # <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 305" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reporterEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reporterPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Incident Details */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Incident Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <FormField
                        control={form.control}
                        name="incidentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Incident <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                disabled={dateUnknown}
                                value={dateUnknown ? '' : (field.value || '')}
                                onChange={(e) => {
                                  field.onChange(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateUnknown"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) form.setValue('incidentDate', '');
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer text-muted-foreground">Date unknown</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <FormField
                        control={form.control}
                        name="incidentTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time of Incident <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={timeUnknown}
                                value={timeUnknown ? '' : (field.value || '')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="timeUnknown"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) form.setValue('incidentTime', '');
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer text-muted-foreground">Time unknown</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="incidentLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Where did the incident occur? <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Parkade Level 1, Lobby, Amenity Room..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Brief title describing the incident" maxLength={150} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Description <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide a detailed description of the incident, including any individuals involved, what happened, and any other relevant information..."
                            className="min-h-[160px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                {/* Additional Information */}
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="policeAttended"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">Did the police attend?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {policeAttended && (
                      <FormField
                        control={form.control}
                        name="policeCaseNumber"
                        render={({ field }) => (
                          <FormItem className="ml-6">
                            <FormLabel>Police Case Number <span className="text-muted-foreground font-normal">(if available)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 2024-12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="bylawViolation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">Is this a bylaw violation?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="commonPropertyDamage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">Is there any damage to common property?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasEvidence"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) {
                                  setSelectedFiles([]);
                                  setFilePreviews([]);
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">Do you have any video or picture evidence?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Evidence Upload - only shown when hasEvidence is true */}
                  {hasEvidence && (
                    <div className="space-y-3 rounded-md border border-dashed border-gray-300 p-4 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">
                        Upload Evidence Files <span className="text-gray-500 font-normal">(up to {MAX_FILES} files, 10MB each)</span>
                      </p>
                      <p className="text-xs text-gray-500">Accepted: Images (JPEG, PNG, WebP) and Videos (MP4, MOV, AVI, WebM)</p>

                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-7 w-7 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-400">{selectedFiles.length}/{MAX_FILES} files selected</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                          onChange={handleFileUpload}
                          disabled={selectedFiles.length >= MAX_FILES}
                        />
                      </label>

                      {filePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {filePreviews.map((file, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden border bg-white">
                              {file.isImage && file.preview ? (
                                <img
                                  src={file.preview}
                                  alt={file.name}
                                  className="w-full h-24 object-cover"
                                />
                              ) : (
                                <div className="w-full h-24 flex flex-col items-center justify-center bg-gray-100">
                                  <FileVideo className="h-8 w-8 text-gray-400" />
                                  <span className="text-xs text-gray-500 mt-1 px-2 truncate w-full text-center">{file.name}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove file"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              {file.isImage && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-1 truncate">
                                  {file.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* CAPTCHA */}
                <section className="space-y-2">
                  <FormField
                    control={form.control}
                    name="turnstileToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div>
                            <Turnstile
                              key={turnstileKey}
                              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                              onSuccess={(token) => field.onChange(token)}
                              onError={() => field.onChange('')}
                              onExpire={() => field.onChange('')}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    'Submit Incident Report'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default IncidentReport;
