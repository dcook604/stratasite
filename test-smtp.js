import nodemailer from 'nodemailer';

// Test SMTP configuration
const testSMTP = async () => {
  console.log('Testing SMTP configuration...');
  console.log('Environment variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'not set');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'not set');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'not set');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***set***' : 'not set');

  // Use proper hostname for certificate validation
  const smtpHost = process.env.SMTP_HOST || 'mail.spectrum4.ca';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: process.env.SMTP_USER || 'superbase',
      pass: process.env.SMTP_PASS || 'n2hm13i'
    },
    tls: {
      // Only reject unauthorized if using a proper hostname
      rejectUnauthorized: smtpHost !== '10.0.0.1' && smtpHost !== 'localhost',
      // Allow connecting to mail.spectrum4.ca from different IPs
      servername: smtpHost === 'mail.spectrum4.ca' ? 'mail.spectrum4.ca' : undefined
    },
    // Connection timeout and retry settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,    // 30 seconds
    socketTimeout: 60000       // 60 seconds
  });

  try {
    // Verify connection
    console.log('\nVerifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection successful');

    // Send test email
    console.log('\nSending test email...');
    const mailOptions = {
      from: `"Spectrum 4 Test" <${process.env.SMTP_USER || 'superbase'}@spectrum4.ca>`,
      to: 'dcook@spectrum4.ca',
      subject: 'SMTP Test - Emergency Contact and Pet Registration Forms',
      html: `
        <h2>SMTP Configuration Test</h2>
        <p>This is a test email to verify that the SMTP configuration is working correctly for:</p>
        <ul>
          <li>Emergency Contact Form</li>
          <li>Pet Registration Form</li>
        </ul>
        <p><strong>SMTP Settings:</strong></p>
        <ul>
          <li>Host: ${process.env.SMTP_HOST || '10.0.0.1'}</li>
          <li>Port: ${process.env.SMTP_PORT || '587'}</li>
          <li>User: ${process.env.SMTP_USER || 'superbase'}</li>
        </ul>
        <p><em>Test sent on ${new Date().toLocaleString()}</em></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Test email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

  } catch (error) {
    console.error('✗ SMTP test failed:', error);
    console.error('Error details:', error.message);
  }
};

testSMTP(); 