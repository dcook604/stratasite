import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';

interface AcknowledgmentData {
  type: 'pet-registration' | 'scooter-registration' | 'ac-inquiry' | 'storage-rental' | 'emergency-contact' | 'contact';
  title: string;
  description: string;
  registrationId?: string;
  nextSteps?: string[];
}

const Acknowledgment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get acknowledgment data from location state or URL params
  const acknowledgmentData = location.state as AcknowledgmentData;
  
  // Default data if no state is provided
  const defaultData: AcknowledgmentData = {
    type: 'contact',
    title: 'Thank You!',
    description: 'Your submission has been received successfully.',
    nextSteps: ['You will receive a confirmation email shortly.', 'We will review your submission and get back to you if needed.']
  };
  
  const data = acknowledgmentData || defaultData;
  
  const getTypeSpecificContent = (type: string) => {
    switch (type) {
      case 'pet-registration':
        return {
          icon: '🐕',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'scooter-registration':
        return {
          icon: '🛴',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'ac-inquiry':
        return {
          icon: '❄️',
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50',
          borderColor: 'border-cyan-200'
        };
      case 'storage-rental':
        return {
          icon: '📦',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'emergency-contact':
        return {
          icon: '🚨',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: '📧',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };
  
  const typeContent = getTypeSpecificContent(data.type);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
        <Card className={`${typeContent.bgColor} ${typeContent.borderColor} border-2`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${typeContent.bgColor} border-2 ${typeContent.borderColor}`}>
                <CheckCircle className={`h-16 w-16 ${typeContent.color}`} />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {data.title}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              {data.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {data.registrationId && (
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-900 mb-2">Reference Number</h3>
                <p className="font-mono text-lg text-gray-700">{data.registrationId}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Please keep this reference number for your records.
                </p>
              </div>
            )}
            
            {data.nextSteps && data.nextSteps.length > 0 && (
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
                <ul className="space-y-2">
                  {data.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Email Confirmation</h3>
              </div>
              <p className="text-gray-700">
                You should receive a confirmation email shortly. If you don't see it in your inbox, 
                please check your spam folder.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => navigate('/')} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
              <Button 
                onClick={() => navigate(-1)} 
                variant="outline" 
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Acknowledgment;

