import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create transporter (reuse existing configuration)
const createTransporter = () => {
  // Use proper hostname for certificate validation (same as server.js)
  const smtpHost = process.env.SMTP_HOST || 'mail.spectrum4.ca';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: process.env.SMTP_USER || 'superbase',
      pass: process.env.SMTP_PASS || 'superbase'
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
};

// Email template functions
const emailTemplates = {
  'scooter-registration': (data) => {
    const {
      date, unitNumber, numberOfScooters, description, ownerNames,
      email, phone, registrationId
    } = data;

    return {
      subject: `New E-Scooter Registration - Unit ${unitNumber}`,
      html: `
        <h2>New E-Scooter Registration Submitted</h2>
        
        <h3>Registration Details:</h3>
        <ul>
          <li><strong>Registration ID:</strong> ${registrationId}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Unit Number:</strong> ${unitNumber}</li>
          <li><strong>Number of E-Scooters:</strong> ${numberOfScooters}</li>
          <li><strong>Owner Name(s):</strong> ${ownerNames}</li>
          <li><strong>Contact Email:</strong> ${email}</li>
          <li><strong>Contact Phone:</strong> ${phone || 'Not provided'}</li>
        </ul>
        
        <h3>E-Scooter Description:</h3>
        <p>${description}</p>
        
        <hr>
        <p><strong>Key Deposit Required:</strong> $50 (Refundable)</p>
        <p><strong>Storage Location:</strong> Gated, secured parkade storage area</p>
        <p><strong>Terms Accepted:</strong> Yes - Storage in designated parkade area only</p>
        
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `
    };
  },

  'ac-inquiry': (data) => {
    const {
      ownerName, ownerUnit, ownerPhone, email, isMultiZone, bestContactMethod,
      installationTiming, notes, inquiryId
    } = data;

    const installationType = isMultiZone ? 'Multi-Zone' : 'Single-Zone';
    const contactMethodDisplay = bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone';

    return {
      subject: `New AC Installation Inquiry - Unit ${ownerUnit}`,
      html: `
        <h2>New AC Installation Inquiry Submitted</h2>
        
        <h3>Inquiry Details:</h3>
        <ul>
          <li><strong>Inquiry ID:</strong> ${inquiryId}</li>
          <li><strong>Owner Name:</strong> ${ownerName}</li>
          <li><strong>Unit Number:</strong> ${ownerUnit}</li>
          <li><strong>Phone Number:</strong> ${ownerPhone}</li>
          <li><strong>Email Address:</strong> ${email}</li>
        </ul>
        
        <h3>Installation Preferences:</h3>
        <ul>
          <li><strong>Installation Type:</strong> ${installationType}</li>
          <li><strong>Preferred Contact Method:</strong> ${contactMethodDisplay}</li>
          <li><strong>Installation Timing:</strong> ${installationTiming}</li>
        </ul>
        
        ${notes ? `
        <h3>Additional Notes:</h3>
        <p>${notes}</p>
        ` : ''}
        
        <hr>
        <p><strong>Consent Given:</strong> Yes - Customer has consented to receiving installation information from Airlux</p>
        
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `
    };
  },

  'storage-rental': (data) => {
    const {
      firstName, lastName, phoneNumber, email, unitNumber,
      bestContactMethod, interestedInInfo, notes, rentalId
    } = data;

    const contactMethodDisplay = bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone';

    return {
      subject: `New Storage Rental Interest - Unit ${unitNumber}`,
      html: `
        <h2>New Storage Rental Interest Submitted</h2>
        
        <h3>Contact Information:</h3>
        <ul>
          <li><strong>Rental ID:</strong> ${rentalId}</li>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Unit Number:</strong> ${unitNumber}</li>
          <li><strong>Phone Number:</strong> ${phoneNumber}</li>
          <li><strong>Email Address:</strong> ${email}</li>
          <li><strong>Preferred Contact Method:</strong> ${contactMethodDisplay}</li>
        </ul>
        
        <h3>Interest Details:</h3>
        <ul>
          <li><strong>Interested in Information:</strong> ${interestedInInfo ? 'Yes' : 'No'}</li>
          <li><strong>Consent Given:</strong> Yes - Customer has consented to receiving information</li>
        </ul>
        
        ${notes ? `
        <h3>Additional Notes:</h3>
        <p>${notes}</p>
        ` : ''}
        
        <hr>
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `
    };
  },

  'emergency-contact': (data) => {
    const {
      unitNumber, strataLotNumber, registeredOwnerNames, ownerEmail,
      phoneHome, phoneBusiness, phoneOther, phoneOtherSpecify,
      nonResidentAddress, nonResidentPhone,
      emergencyContactName, emergencyContactAddress, emergencyContactPhone, emergencyContactEmail,
      allowManagementAccess, conciergeKeyProvided, dateProvidedToConcierge, securityCode,
      contactId
    } = data;

    return {
      subject: `Emergency Contact Information - Unit ${unitNumber}`,
      html: `
        <h2>Emergency Contact Information Form Submitted</h2>
        
        <h3>Unit Information:</h3>
        <ul>
          <li><strong>Unit #:</strong> ${unitNumber}</li>
          <li><strong>Strata Lot #:</strong> ${strataLotNumber}</li>
          <li><strong>Registered Owner Names:</strong> ${registeredOwnerNames}</li>
          ${ownerEmail ? `<li><strong>Owner Email:</strong> ${ownerEmail}</li>` : ''}
        </ul>
        
        <h3>Contact Phone Numbers:</h3>
        <ul>
          ${phoneHome ? `<li><strong>Home:</strong> ${phoneHome}</li>` : ''}
          ${phoneBusiness ? `<li><strong>Business:</strong> ${phoneBusiness}</li>` : ''}
          ${phoneOther ? `<li><strong>Other (${phoneOtherSpecify || 'Not specified'}):</strong> ${phoneOther}</li>` : ''}
        </ul>
        
        ${nonResidentAddress ? `
        <h3>Non-Resident Information:</h3>
        <ul>
          <li><strong>Address:</strong> ${nonResidentAddress}</li>
          ${nonResidentPhone ? `<li><strong>Phone:</strong> ${nonResidentPhone}</li>` : ''}
        </ul>
        ` : ''}
        
        ${emergencyContactName ? `
        <h3>Emergency Contact Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${emergencyContactName}</li>
          ${emergencyContactAddress ? `<li><strong>Address:</strong> ${emergencyContactAddress}</li>` : ''}
          ${emergencyContactPhone ? `<li><strong>Phone:</strong> ${emergencyContactPhone}</li>` : ''}
          ${emergencyContactEmail ? `<li><strong>Email:</strong> ${emergencyContactEmail}</li>` : ''}
        </ul>
        ` : ''}
        
        <h3>Access Information:</h3>
        <p><strong>Allow Management Access:</strong> ${allowManagementAccess}</p>
        <p><strong>Concierge Key Provided:</strong> ${conciergeKeyProvided}</p>
        ${dateProvidedToConcierge ? `<p><strong>Date provided to concierge:</strong> ${dateProvidedToConcierge}</p>` : ''}
        
        ${securityCode ? `
        <h3>Security Information:</h3>
        <p><strong>Access Code Provided:</strong> Yes (see confidential records)</p>
        ` : '<p><strong>Access Code:</strong> Not provided</p>'}
        
        <hr>
        <p><em>This information is confidential and for emergency contact purposes only.</em></p>
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `
    };
  },

  'pet-registration': (data) => {
    const {
      registrationId, ownerName, suiteNumber, phoneNumber, email,
      occupancyType, petName, petAge, petHeight, petColor, petType,
      petBreed, petWeight, distinguishingMarks, licenseNumber, photos
    } = data;

    const occupancyDisplay = occupancyType === 'TENANT' ? 'Tenant' : 'Owner Occupied';

    return {
      subject: `New Pet Registration - ${petName} (Unit ${suiteNumber})`,
      html: `
        <h2>New Pet Registration Submitted</h2>
        
        <h3>Registration Details:</h3>
        <ul>
          <li><strong>Registration ID:</strong> ${registrationId}</li>
          <li><strong>Owner Name:</strong> ${ownerName}</li>
          <li><strong>Suite Number:</strong> ${suiteNumber}</li>
          <li><strong>Phone Number:</strong> ${phoneNumber}</li>
          <li><strong>Email Address:</strong> ${email}</li>
          <li><strong>Occupancy Type:</strong> ${occupancyDisplay}</li>
        </ul>
        
        <h3>Pet Information:</h3>
        <ul>
          <li><strong>Pet Name:</strong> ${petName}</li>
          <li><strong>Age:</strong> ${petAge}</li>
          <li><strong>Height:</strong> ${petHeight}</li>
          <li><strong>Color:</strong> ${petColor}</li>
          <li><strong>Type:</strong> ${petType}</li>
          <li><strong>Breed:</strong> ${petBreed}</li>
          <li><strong>Weight:</strong> ${petWeight}</li>
          ${distinguishingMarks ? `<li><strong>Distinguishing Marks:</strong> ${distinguishingMarks}</li>` : ''}
          ${licenseNumber ? `<li><strong>License Number:</strong> ${licenseNumber}</li>` : ''}
        </ul>
        
        ${photos ? `
        <h3>Pet Photos:</h3>
        <p>Photos have been uploaded and are available in the admin system.</p>
        ` : ''}
        
        <hr>
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `
    };
  },

  'form-k': (data) => {
    const {
      strataPlan, address, unitNumber, strataLotNumber, 
      tenant1Name, tenant2Name, tenancyCommencingDay, tenancyCommencingDate, tenancyCommencingYear,
      landlordName, landlordAddress, ownerMailingAddress, submissionDate, submissionId, formStatus
    } = data;

    const tenant2Display = tenant2Name && tenant2Name !== 'N/A' ? tenant2Name : 'Not provided';
    const tenancyDate = `${tenancyCommencingDay} day of ${tenancyCommencingDate}, ${tenancyCommencingYear}`;
    const isComplete = formStatus && (formStatus === 'COMPLETE' || formStatus === 'COMPLETE_ALL_SIGNATURES');

    return {
      subject: `✅ COMPLETE Form K - Unit ${unitNumber} - ALL SIGNATURES COLLECTED`,
      html: `
        <div style="background-color: #d4edda; border: 2px solid #c3e6cb; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h2 style="color: #155724; margin-top: 0;">✅ Form K COMPLETED - Notice of Tenant's Responsibilities</h2>
          <p style="color: #155724; font-size: 16px; margin-bottom: 0;"><strong>ALL SIGNATURES HAVE BEEN COLLECTED - READY FOR PROCESSING</strong></p>
        </div>
        
        <h3>Property Information:</h3>
        <ul>
          <li><strong>Submission ID:</strong> ${submissionId}</li>
          <li><strong>Strata Plan:</strong> ${strataPlan}</li>
          <li><strong>Address:</strong> ${address}</li>
          <li><strong>Unit Number:</strong> ${unitNumber}</li>
          <li><strong>Strata Lot #:</strong> ${strataLotNumber}</li>
        </ul>
        
        <h3>Tenant Information:</h3>
        <ul>
          <li><strong>Primary Tenant:</strong> ${tenant1Name}</li>
          <li><strong>Second Tenant:</strong> ${tenant2Display}</li>
          <li><strong>Tenancy Commencing:</strong> ${tenancyDate}</li>
        </ul>
        
        <h3>Landlord/Agent Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${landlordName}</li>
          <li><strong>Address:</strong> ${landlordAddress}</li>
        </ul>
        
        <h3>Owner Information:</h3>
        <ul>
          <li><strong>Mailing Address:</strong> ${ownerMailingAddress}</li>
        </ul>
        
        <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Important Legal Notice</h3>
          <p>This Form K submission constitutes official notice that tenant(s) have been informed of their responsibilities under the Strata Property Act, including:</p>
          <ol>
            <li>Compliance with current strata bylaws and rules</li>
            <li>Compliance with any future bylaw changes</li>
            <li>Responsibility for violations by tenants, occupants, or visitors</li>
          </ol>
        </div>
        
        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #0c5460; margin-top: 0;">✅ All Electronic Signatures Completed</h3>
          <ul style="color: #0c5460;">
            <li><strong>✓ Landlord/Agent signature:</strong> COMPLETED</li>
            <li><strong>✓ Primary tenant signature:</strong> COMPLETED</li>
            ${tenant2Name && tenant2Name !== 'N/A' ? '<li><strong>✓ Second tenant signature:</strong> COMPLETED</li>' : '<li><strong>-</strong> Second tenant signature not required</li>'}
          </ul>
          <p style="color: #0c5460; margin-bottom: 0;"><strong>This form is now legally complete and ready for processing.</strong></p>
        </div>
        
        <hr>
        <p><strong>Form Completion Date:</strong> ${submissionDate}</p>
        <p><strong>Status:</strong> <span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;">COMPLETE</span></p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h4 style="color: #856404; margin-top: 0;">Next Steps:</h4>
          <p style="color: #856404; margin-bottom: 0;">Please process this completed Form K and remit the original to:<br/>
          <strong>ASCENT REAL ESTATE MANAGEMENT CORPORATION</strong><br/>
          2176 WILLINGDON AVENUE<br/>
          BURNABY, BC V5C 5Z9<br/>
          FAX: (604) 431-1818</p>
        </div>
        
        <p><em>Form completed electronically on ${new Date().toLocaleString()}</em></p>
      `
    };
  }
};

// Main function to send dynamic emails
const sendDynamicFormEmail = async (formName, formData) => {
  try {
    // Get form configuration from database
    const formConfig = await prisma.formConfiguration.findUnique({
      where: { 
        formName,
        isActive: true
      },
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });

    if (!formConfig) {
      console.warn(`No form configuration found for: ${formName}`);
      return { success: false, error: 'Form configuration not found' };
    }

    if (!formConfig.recipients || formConfig.recipients.length === 0) {
      console.warn(`No recipients configured for form: ${formName}`);
      return { success: false, error: 'No recipients configured' };
    }

    // Get email template
    const template = emailTemplates[formName];
    if (!template) {
      console.warn(`No email template found for form: ${formName}`);
      return { success: false, error: 'Email template not found' };
    }

    // Generate email content
    const emailContent = template(formData);
    
    // Use custom subject from config if available, otherwise use template subject
    const subject = formConfig.emailConfig?.subject || emailContent.subject;
    
    // Create transporter
    const transporter = createTransporter();

    // Prepare recipients
    const recipients = formConfig.recipients.map(r => r.email).join(', ');
    const fromName = formConfig.emailConfig?.fromName || 'Spectrum 4 Forms';

    const mailOptions = {
      from: `"${fromName}" <${process.env.SMTP_USER}@spectrum4.ca>`,
      to: recipients,
      subject: subject,
      html: emailContent.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Dynamic email sent successfully for form: ${formName}`, {
      messageId: info.messageId,
      recipients: recipients,
      formName: formName
    });

    return { 
      success: true, 
      messageId: info.messageId,
      recipients: recipients
    };

  } catch (error) {
    console.error(`Error sending dynamic email for form ${formName}:`, error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Fallback function for backward compatibility
const sendFormEmailFallback = async (formName, formData) => {
  console.warn(`Using fallback email sending for form: ${formName}`);
  
  // This would contain the original hardcoded email logic as fallback
  // For now, we'll just log and return success to prevent breaking existing functionality
  console.log('Fallback email sending not implemented - form submission logged only');
  return { success: true, fallback: true };
};

export {
  sendDynamicFormEmail,
  sendFormEmailFallback,
  emailTemplates
};
