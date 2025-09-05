import { sendDynamicFormEmail } from '../server/utils/dynamicEmailService.js';

// Test data for scooter registration
const testData = {
  registrationId: 'SR-test-123',
  date: '2024-12-05',
  unitNumber: '101',
  numberOfScooters: 1,
  description: 'Test scooter for email service',
  ownerNames: 'Test User',
  email: 'test@example.com',
  phone: '555-1234'
};

async function testEmailService() {
  console.log('🧪 Testing dynamic email service...');
  
  try {
    const result = await sendDynamicFormEmail('scooter-registration', testData);
    
    if (result.success) {
      console.log('✅ Email service test successful!');
      console.log('📧 Email sent to:', result.recipients);
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Email service test failed:', result.error);
    }
  } catch (error) {
    console.error('💥 Email service test error:', error);
  }
}

testEmailService();

