import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PawPrint, Upload, X, Camera } from 'lucide-react';
import { TurnstileCaptcha } from '@/components/ui/TurnstileCaptcha';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';

const formSchema = z.object({
  ownerName: z.string().min(2, { message: 'Owner name must be at least 2 characters' }),
  suiteNumber: z.string().min(1, { message: 'Suite number is required' }),
  phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  occupancyType: z.enum(['TENANT', 'OWNER_OCCUPIED'], {
    required_error: 'Please select occupancy type'
  }),
  petName: z.string().min(1, { message: 'Pet name is required' }),
  petAge: z.string().min(1, { message: 'Pet age is required' }),
  petHeight: z.string().min(1, { message: 'Pet height is required' }),
  petColor: z.string().min(1, { message: 'Pet color is required' }),
  petType: z.string().min(1, { message: 'Pet type is required' }),
  petBreed: z.string().min(1, { message: 'Pet breed is required' }),
  petWeight: z.string().min(1, { message: 'Pet weight is required' }),
  distinguishingMarks: z.string().optional(),
  licenseNumber: z.string().optional(),
  photos: z.array(z.instanceof(File)).max(3, { message: 'Maximum 3 photos allowed' }).optional(),
  turnstileToken: z.string().min(1, { message: 'Please complete the verification' })
});

type FormData = z.infer<typeof formSchema>;

const PetRegistration: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [turnstileKey, setTurnstileKey] = useState(Date.now());
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ownerName: '',
      suiteNumber: '',
      phoneNumber: '',
      email: '',
      occupancyType: undefined,
      petName: '',
      petAge: '',
      petHeight: '',
      petColor: '',
      petType: '',
      petBreed: '',
      petWeight: '',
      distinguishingMarks: '',
      licenseNumber: '',
      photos: [],
      turnstileToken: ''
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check total photos limit
    if (selectedPhotos.length + files.length > 3) {
      toast({
        title: "Too many photos",
        description: "You can only upload a maximum of 3 photos.",
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload only JPEG, PNG, or WebP images.",
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes (5MB max)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each photo must be smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => 
      validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
    );

    const newPhotos = [...selectedPhotos, ...validFiles];
    setSelectedPhotos(newPhotos);
    form.setValue('photos', newPhotos);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    
    setSelectedPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photos' && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Add photos
      selectedPhotos.forEach((photo, index) => {
        formData.append('photos', photo);
      });

      const response = await fetch('/api/pet-registration', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit pet registration');
      }

      // Navigate to acknowledgment page with success data
      navigate('/form-acknowledgment', {
        state: {
          formType: 'pet-registration',
          formName: 'Pet Registration',
          submissionId: result.registrationId,
          message: 'Your pet registration has been submitted successfully.',
          nextSteps: [
            'You will receive a confirmation email shortly.',
            'The strata council will review your registration.',
            'You will be contacted if additional information is needed.'
          ]
        }
      });

    } catch (error) {
      console.error('Pet registration error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <PageHeader
        title="Pet Registration"
        description="Register your pet with Spectrum 4 Strata."
      />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Information Notice */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <PawPrint className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-2">
              <p className="font-semibold">Important Information:</p>
              <p>Please fill out one form per pet. Maximum of 2 pets (1 cat, and 1 dog) allowed per unit as per strata bylaws.</p>
              <p>All pet registrations must be approved by strata management before pets can reside in the building.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Pet Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Pet Registration Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Owner/Tenant Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Owner / Tenant Information</h3>
                  
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
                      name="suiteNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suite #</FormLabel>
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
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(604) 123-4567" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="occupancyType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Occupancy Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="TENANT" id="tenant" />
                              <label htmlFor="tenant" className="cursor-pointer">Tenant</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="OWNER_OCCUPIED" id="owner" />
                              <label htmlFor="owner" className="cursor-pointer">Owner Occupied</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pet Registration Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Pet Registration Details (Fill out one form per pet)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="petName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pet Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Pet's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="petAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 3 years" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="petHeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 24 inches" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="petColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Brown and white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="petType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Dog, Cat, Bird" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="petBreed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breed</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Golden Retriever" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="petWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 45 lbs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="distinguishingMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distinguishing Marks (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe any distinguishing marks, scars, or unique features..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photo Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Pet Photos</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                        multiple
                      />
                      <label htmlFor="photo-upload">
                        <Button type="button" variant="outline" asChild>
                          <span className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Upload Photos (Max 3)
                          </span>
                        </Button>
                      </label>
                    </div>

                    {photoPreviews.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {photoPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Pet photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => removePhoto(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Turnstile CAPTCHA */}
                <div className="flex justify-center">
                  <TurnstileCaptcha
                    key={turnstileKey}
                    onSuccess={(token) => form.setValue('turnstileToken', token)}
                    onError={() => form.setValue('turnstileToken', '')}
                    onExpire={() => form.setValue('turnstileToken', '')}
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
                        <PawPrint className="mr-2 h-4 w-4" />
                        Submit Pet Registration
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PetRegistration; 