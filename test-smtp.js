import nodemailer from 'nodemailer';

// Test SMTP configuration
const testSMTP = async () => {
  console.log('Testing SMTP configuration...');
  console.log('Environment variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'not set');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'not set');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'not set');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***set***' : 'not set');

  // Use environment variables only
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('Missing required SMTP environment variables for test');
  }
  
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: smtpUser,
      pass: smtpPass
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
      from: `"Spectrum 4 Test" <${smtpUser}@spectrum4.ca>`,
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
          <li>Host: ${smtpHost}</li>
          <li>Port: ${smtpPort}</li>
          <li>User: ${smtpUser}</li>
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