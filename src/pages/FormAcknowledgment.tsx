import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';

interface FormSubmissionData {
  formType: string;
  formName: string;
  submissionId?: string;
  message?: string;
  nextSteps?: string[];
}

const FormAcknowledgment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get form data from navigation state or URL params
  const formData = location.state as FormSubmissionData || {
    formType: 'general',
    formName: 'Form Submission',
    message: 'Your submission has been received successfully.',
    nextSteps: [
      'You will receive a confirmation email shortly.',
      'Our team will review your submission and contact you if needed.',
      'Please keep your submission reference for your records.'
    ]
  };

  const getFormIcon = (formType: string) => {
    switch (formType) {
      case 'scooter-registration':
        return '🛴';
      case 'pet-registration':
        return '🐕';
      case 'emergency-contact':
        return '📞';
      case 'ac-inquiry':
        return '❄️';
      case 'contact':
        return '💬';
      case 'event-request':
        return '📅';
      default:
        return '✅';
    }
  };

  const getFormSpecificMessage = (formType: string) => {
    switch (formType) {
      case 'scooter-registration':
        return {
          title: 'E-Scooter Registration Submitted Successfully!',
          message: 'Your e-scooter registration has been submitted and is being processed.',
          nextSteps: [
            'You will receive a confirmation email with your registration details.',
            'Management will review your registration and contact you regarding key pickup.',
            'Please ensure you have the $50 refundable key deposit ready.',
            'Keep this confirmation for your records.'
          ]
        };
      case 'pet-registration':
        return {
          title: 'Pet Registration Submitted Successfully!',
          message: 'Your pet registration has been submitted and is being processed.',
          nextSteps: [
            'You will receive a confirmation email with your registration details.',
            'Management will review your registration and contact you if needed.',
            'Please ensure your pet meets all strata requirements.',
            'Keep this confirmation for your records.'
          ]
        };
      case 'emergency-contact':
        return {
          title: 'Emergency Contact Information Submitted Successfully!',
          message: 'Your emergency contact information has been updated in our records.',
          nextSteps: [
            'Your information has been securely stored in our database.',
            'This information will only be used in emergency situations.',
            'Please notify management immediately if any information changes.',
            'Keep this confirmation for your records.'
          ]
        };
      case 'ac-inquiry':
        return {
          title: 'AC Installation Inquiry Submitted Successfully!',
          message: 'Your air conditioning installation inquiry has been submitted.',
          nextSteps: [
            'You will receive a confirmation email with your inquiry details.',
            'Management will review your inquiry and contact you regarding next steps.',
            'Please ensure you have all required documentation ready.',
            'Keep this confirmation for your records.'
          ]
        };
      case 'contact':
        return {
          title: 'Message Sent Successfully!',
          message: 'Thank you for contacting us. Your message has been received.',
          nextSteps: [
            'You will receive a confirmation email shortly.',
            'Our team will review your message and respond within 2 business days.',
            'Keep this confirmation for your records.'
          ]
        };
      case 'event-request':
        return {
          title: 'Event Request Submitted Successfully!',
          message: 'Your event request has been submitted and is being reviewed.',
          nextSteps: [
            'You will receive a confirmation email with your request details.',
            'Management will review your request and contact you regarding approval.',
            'Please keep this confirmation for your records.'
          ]
        };
      default:
        return {
          title: formData.formName + ' Submitted Successfully!',
          message: formData.message || 'Your submission has been received successfully.',
          nextSteps: formData.nextSteps || [
            'You will receive a confirmation email shortly.',
            'Our team will review your submission and contact you if needed.',
            'Please keep your submission reference for your records.'
          ]
        };
    }
  };

  const specificInfo = getFormSpecificMessage(formData.formType);

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <PageHeader
          title="Submission Confirmed"
          description="Your form has been submitted successfully"
        />
        <div className="form-page-container max-w-4xl">
        {/* Success Card */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl text-green-800 mb-2">
              {specificInfo.title}
            </CardTitle>
            <p className="text-green-700 text-lg">
              {specificInfo.message}
            </p>
          </CardHeader>
        </Card>

        {/* Form Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getFormIcon(formData.formType)}</span>
              Submission Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Form Type</label>
                <p className="text-lg font-semibold">{formData.formName}</p>
              </div>
              {formData.submissionId && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference ID</label>
                  <p className="text-lg font-mono font-semibold">{formData.submissionId}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Submission Date</label>
                <p className="text-lg">{new Date().toLocaleDateString('en-CA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg text-green-600 font-semibold">Submitted Successfully</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {specificInfo.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{step}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Form
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default FormAcknowledgment;

