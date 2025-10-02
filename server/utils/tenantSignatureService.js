import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

// Lazy initialization of Prisma client
let prisma = null;
const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Create reusable transporter object using SMTP transport (fully environment-based)
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('Missing required SMTP environment variables in tenant signature service.');
  }
  
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates and IP addresses
    },
    connectionTimeout: 30000,   // 30 seconds
    greetingTimeout: 30000,     // 30 seconds
    socketTimeout: 60000        // 60 seconds
  });
};

// Send tenant signature request email
const sendTenantSignatureRequest = async ({
  tenantName,
  tenantEmail,
  submissionId,
  signatureToken,
  unitNumber,
  landlordName,
  tenantType
}) => {
  try {
    const transporter = createTransporter();
    
    // Create signature URL
    const signatureUrl = `${process.env.BASE_URL || 'https://www.spectrum4.ca'}/tenant-signature/${submissionId}/${signatureToken}`;
    
    const emailContent = generateTenantSignatureEmail({
      tenantName,
      unitNumber,
      landlordName,
      signatureUrl,
      tenantType,
      submissionId
    });
    
    const mailOptions = {
      from: `"Spectrum 4 Strata Council" <noreply@spectrum4.ca>`,
      replyTo: `"Spectrum 4 Management" <info@spectrum4.ca>`,
      to: tenantEmail,
      subject: `Form K Signature Required - Unit ${unitNumber} - Spectrum 4 Strata`,
      html: emailContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': '<mailto:info@spectrum4.ca>',
        'X-Mailer': 'Spectrum 4 Strata Forms System',
        'Organization': 'Spectrum 4 Strata Corporation'
      }
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Tenant signature request sent to ${tenantEmail}`, {
      messageId: info.messageId,
      submissionId,
      tenantType
    });
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending tenant signature request:', error);
    throw error;
  }
};

// Generate tenant signature request email HTML
const generateTenantSignatureEmail = ({
  tenantName,
  unitNumber,
  landlordName,
  signatureUrl,
  tenantType,
  submissionId
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Form K Signature Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .signature-button { 
          display: inline-block; 
          background-color: #007bff; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          font-weight: bold;
          margin: 20px 0;
        }
        .signature-button:hover { background-color: #0056b3; }
        .important { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 15px; margin-top: 30px; border-radius: 5px; font-size: 12px; color: #666; }
        .legal-text { font-size: 14px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #007bff;">Spectrum 4 Strata Corporation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Form K - Notice of Tenant's Responsibilities</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Unit ${unitNumber}</p>
        </div>
        
        <div class="content">
          <p>Dear ${tenantName},</p>
          
          <p>This is an official notification from Spectrum 4 Strata Corporation. Your landlord/agent, <strong>${landlordName}</strong>, has submitted Form K (Notice of Tenant's Responsibilities) for Unit ${unitNumber}.</p>
          
          <div class="important">
            <strong>Signature Required:</strong> As required by the Strata Property Act (Section 146), you must electronically sign this legal document to acknowledge your responsibilities as a tenant.
          </div>
          
          <p><strong>To complete your signature:</strong></p>
          <ol>
            <li>Click the secure signature button below</li>
            <li>Review the Form K document details</li>
            <li>Type your full name as your electronic signature</li>
            <li>Confirm your signature to complete the process</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signatureUrl}" class="signature-button">
              Complete Electronic Signature
            </a>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #666; margin-top: 10px;">
            Secure Link - Valid for 7 days
          </p>
          
          <div class="legal-text">
            <h3>Important Information About Form K:</h3>
            <p>Form K is a legal requirement under the Strata Property Act (Section 146). By signing this form, you acknowledge that you understand your responsibilities as a tenant, including:</p>
            <ul>
              <li>Compliance with all current strata bylaws and rules</li>
              <li>Compliance with any future changes to bylaws and rules</li>
              <li>Responsibility for violations by yourself, occupants, or visitors</li>
            </ul>
          </div>
          
          <p><strong>Security Notice:</strong> This signature link is unique to you and expires in 7 days. Please do not share this link with others.</p>
          
          <p>If you have questions about this form or your tenant responsibilities, please contact your landlord/agent or the property management company.</p>
          
          <p>Sincerely,<br/>
          <strong>Spectrum 4 Strata Council</strong><br/>
          <em>Official Strata Corporation Communication</em></p>
        </div>
        
        <div class="footer">
          <p><strong>Submission ID:</strong> ${submissionId}<br/>
          <strong>Property:</strong> Spectrum 4 Strata Corporation<br/>
          <strong>Unit:</strong> ${unitNumber}<br/>
          <strong>Tenant Type:</strong> ${tenantType === 'primary' ? 'Primary Tenant' : 'Secondary Tenant'}</p>
          
          <p style="margin-top: 15px; font-size: 11px;">
            This is an automated message from the Spectrum 4 Strata forms system. 
            Please do not reply to this email. If you need assistance, contact your landlord or property management.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export {
  sendTenantSignatureRequest,
  generateTenantSignatureEmail
};
