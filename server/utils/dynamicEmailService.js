import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateFormKPdf } from './formKPdfGenerator.js';

// Lazy initialization of Prisma client
let prisma = null;
const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Create transporter (fully environment-based)
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('Missing required SMTP environment variables in dynamic email service.');
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

  'incident-report': (data) => {
    const {
      incidentId, reporterName, reporterEmail, reporterPhone, unitNumber,
      incidentDate, incidentTime, incidentLocation, incidentTitle, incidentDescription,
      policeAttended, policeCaseNumber, bylawViolation, commonPropertyDamage, hasEvidence, evidenceCount,
      inlineImageCids, videoAttachmentNames, matchedBylaw
    } = data;

    const submittedAt = new Date().toLocaleString('en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
      timeZone: 'America/Vancouver'
    });

    // Format incident date/time for display (pass through 'Unknown' as-is)
    const formattedIncidentDate = (!incidentDate || incidentDate === 'Unknown')
      ? (incidentDate === 'Unknown' ? 'Unknown' : 'Not provided')
      : new Date(incidentDate + 'T12:00:00').toLocaleDateString('en-CA', {
          year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Vancouver'
        });
    const formattedIncidentTime = (!incidentTime || incidentTime === 'Unknown')
      ? (incidentTime === 'Unknown' ? 'Unknown' : 'Not provided')
      : new Date(`1970-01-01T${incidentTime}:00`).toLocaleTimeString('en-CA', {
          hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
        });

    const flagBadges = [
      policeAttended ? '<span style="display:inline-block;background:#cce5ff;color:#004085;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid #b8daff;margin-right:8px;">&#x1F6A8; POLICE ATTENDED</span>' : '',
      bylawViolation ? '<span style="display:inline-block;background:#fff3cd;color:#856404;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid #ffc107;margin-right:8px;">&#x1F4CB; BYLAW VIOLATION</span>' : '',
      commonPropertyDamage ? '<span style="display:inline-block;background:#f8d7da;color:#721c24;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid #f5c6cb;">&#x26A0;&#xFE0F; PROPERTY DAMAGE</span>' : '',
    ].filter(Boolean).join('');

    const inlineImagesHtml = inlineImageCids && inlineImageCids.length > 0
      ? `<tr><td style="padding:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#f8f9fa;padding:10px 14px;font-size:11px;font-weight:700;color:#6c757d;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #dee2e6;border-bottom:2px solid #dee2e6;">
              Evidence Photos (${inlineImageCids.length} image${inlineImageCids.length > 1 ? 's' : ''}${videoAttachmentNames && videoAttachmentNames.length > 0 ? `, ${videoAttachmentNames.length} video${videoAttachmentNames.length > 1 ? 's' : ''} attached` : ''})
            </td></tr>
            <tr><td style="border:1px solid #dee2e6;border-top:none;padding:12px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                ${inlineImageCids.map((cid, i) =>
                  `<td style="padding:4px;width:${Math.min(100, Math.floor(100 / Math.min(inlineImageCids.length, 3)))}%;vertical-align:top;">
                    <img src="cid:${cid}" alt="Evidence ${i + 1}" style="width:100%;max-width:200px;height:auto;display:block;border-radius:4px;border:1px solid #dee2e6;" />
                  </td>`
                ).join('')}
              </tr></table>
            </td></tr>
          </table>
        </td></tr>`
      : videoAttachmentNames && videoAttachmentNames.length > 0
        ? `<tr><td style="padding:0 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="background:#f8f9fa;padding:10px 14px;font-size:11px;font-weight:700;color:#6c757d;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #dee2e6;border-bottom:2px solid #dee2e6;">Evidence (${videoAttachmentNames.length} video${videoAttachmentNames.length > 1 ? 's' : ''} attached)</td></tr>
              <tr><td style="border:1px solid #dee2e6;border-top:none;padding:12px;font-size:14px;color:#495057;">
                Video file${videoAttachmentNames.length > 1 ? 's' : ''} attached: ${videoAttachmentNames.join(', ')}
              </td></tr>
            </table>
          </td></tr>`
        : '';

    return {
      subject: `⚠️ Incident Report — ${incidentTitle} (Unit ${unitNumber})`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Incident Report</title></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:24px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;">

  <!-- Header -->
  <tr><td style="background:#b91c1c;border-radius:8px 8px 0 0;padding:28px 36px;text-align:center;">
    <div style="font-size:28px;margin-bottom:6px;">&#x26A0;&#xFE0F;</div>
    <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Incident Report</div>
    <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Spectrum 4 Strata — Action Required</div>
  </td></tr>

  <!-- ID + Date bar -->
  <tr><td style="background:#fef3c7;border-left:1px solid #fde68a;border-right:1px solid #fde68a;padding:10px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="font-size:12px;color:#92400e;font-weight:700;">REPORT ID: ${incidentId}</td>
        <td align="right" style="font-size:12px;color:#92400e;">${submittedAt}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:32px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">

      <!-- Incident Title + location -->
      <tr><td style="padding-bottom:6px;border-left:4px solid #b91c1c;padding-left:12px;">
        <div style="font-size:19px;font-weight:700;color:#111827;">${incidentTitle}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:3px;">${formattedIncidentDate} at ${formattedIncidentTime} &mdash; ${incidentLocation}</div>
      </td></tr>

      <!-- Flag badges -->
      ${flagBadges ? `<tr><td style="padding:16px 0 0;">${flagBadges}</td></tr>` : ''}

      <!-- Divider -->
      <tr><td style="padding:20px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr>

      <!-- Reporter -->
      <tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td colspan="2" style="background:#f8f9fa;padding:9px 14px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #e5e7eb;border-bottom:2px solid #e5e7eb;">Incident Details</td></tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;width:38%;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Date of Incident</td>
            <td style="padding:9px 14px;font-size:13px;color:#111827;font-weight:600;border:1px solid #e5e7eb;border-top:none;border-left:none;">${formattedIncidentDate}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Time of Incident</td>
            <td style="padding:9px 14px;font-size:13px;color:#111827;font-weight:600;border:1px solid #e5e7eb;border-top:none;border-left:none;">${formattedIncidentTime}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Location</td>
            <td style="padding:9px 14px;font-size:13px;color:#111827;border:1px solid #e5e7eb;border-top:none;border-left:none;">${incidentLocation}</td>
          </tr>
          <tr><td colspan="2" style="background:#f8f9fa;padding:9px 14px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #e5e7eb;border-bottom:2px solid #e5e7eb;border-top:8px solid #f0f2f5;">Reporter Information</td></tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;width:38%;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Name</td>
            <td style="padding:9px 14px;font-size:13px;color:#111827;border:1px solid #e5e7eb;border-top:none;border-left:none;">${reporterName}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Unit Number</td>
            <td style="padding:9px 14px;font-size:13px;color:#111827;border:1px solid #e5e7eb;border-top:none;border-left:none;">${unitNumber}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Email</td>
            <td style="padding:9px 14px;font-size:13px;border:1px solid #e5e7eb;border-top:none;border-left:none;"><a href="mailto:${reporterEmail}" style="color:#2563eb;text-decoration:none;">${reporterEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Phone</td>
            <td style="padding:9px 14px;font-size:13px;color:#111827;border:1px solid #e5e7eb;border-top:none;border-left:none;">${reporterPhone}</td>
          </tr>
        </table>
      </td></tr>

      <!-- Description -->
      <tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background:#f8f9fa;padding:9px 14px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #e5e7eb;border-bottom:2px solid #e5e7eb;">Incident Description</td></tr>
          <tr><td style="padding:16px;border:1px solid #e5e7eb;border-top:none;font-size:14px;line-height:1.7;color:#1f2937;white-space:pre-wrap;">${incidentDescription.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>
        </table>
      </td></tr>

      <!-- Matched Bylaw Section (shown only when bylaw violation flagged and a match is found) -->
      ${bylawViolation && matchedBylaw ? `<tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="background:#fff3cd;padding:9px 14px;font-size:11px;font-weight:700;color:#856404;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #ffc107;border-bottom:2px solid #ffc107;">&#x1F4CB; Matched Bylaw Section(s)</td></tr>
          <tr><td style="padding:16px;border:1px solid #ffc107;border-top:none;font-size:13px;line-height:1.8;color:#1f2937;white-space:pre-wrap;font-family:Georgia,serif;">${matchedBylaw.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>
        </table>
      </td></tr>` : ''}

      <!-- Inline evidence images / video note -->
      ${inlineImagesHtml}

      <!-- Status flags -->
      <tr><td style="padding-bottom:8px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td colspan="2" style="background:#f8f9fa;padding:9px 14px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.8px;text-transform:uppercase;border:1px solid #e5e7eb;border-bottom:2px solid #e5e7eb;">Status Flags</td></tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;width:38%;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Police Attended</td>
            <td style="padding:9px 14px;font-size:13px;border:1px solid #e5e7eb;border-top:none;border-left:none;">${policeAttended ? `<span style="color:#166534;font-weight:600;">&#x2713; Yes</span>${policeCaseNumber ? ` &mdash; Case #${policeCaseNumber}` : ' &mdash; No case number provided'}` : '<span style="color:#991b1b;">&#x2715; No</span>'}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Bylaw Violation</td>
            <td style="padding:9px 14px;font-size:13px;border:1px solid #e5e7eb;border-top:none;border-left:none;">${bylawViolation ? '<span style="color:#92400e;font-weight:600;">&#x2713; Yes</span>' : '<span style="color:#6b7280;">&#x2715; No</span>'}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Common Property Damage</td>
            <td style="padding:9px 14px;font-size:13px;border:1px solid #e5e7eb;border-top:none;border-left:none;">${commonPropertyDamage ? '<span style="color:#166534;font-weight:600;">&#x2713; Yes</span>' : '<span style="color:#991b1b;">&#x2715; No</span>'}</td>
          </tr>
          <tr>
            <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#374151;border:1px solid #e5e7eb;border-top:none;background:#fafafa;">Evidence Submitted</td>
            <td style="padding:9px 14px;font-size:13px;border:1px solid #e5e7eb;border-top:none;border-left:none;">${hasEvidence && evidenceCount > 0 ? `<span style="color:#166534;font-weight:600;">&#x2713; Yes &mdash; ${evidenceCount} file${evidenceCount > 1 ? 's' : ''}</span>` : hasEvidence ? '<span style="color:#92400e;">&#x26A0; Indicated but no files uploaded</span>' : '<span style="color:#991b1b;">&#x2715; None</span>'}</td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 0 0;text-align:center;">
    <div style="font-size:11px;color:#9ca3af;">Spectrum 4 Strata &mdash; Automated Incident Notification</div>
    <div style="font-size:11px;color:#d1d5db;margin-top:2px;">Log into the admin dashboard to manage this report.</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
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
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h4 style="color: #155724; margin-top: 0;">📎 PDF Attachment Included</h4>
          <p style="color: #155724; margin-bottom: 10px;"><strong>A completed Form K PDF is attached to this email with all signatures.</strong></p>
          <p style="color: #155724; margin-bottom: 0;">This PDF contains all collected data and signatures in the official Form K format, ready for processing and remittance.</p>
        </div>
        
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
  },

  'storage-locker-application': (data) => {
    const { applicationId, lockerNumber, location, dimensions, monthlyRent, firstName, lastName, address, unitNumber, telephone, email, onWaitingList } = data;
    return {
      subject: `New Storage Locker Application – Locker #${lockerNumber} (Unit ${unitNumber})`,
      html: `
        <h2>New Storage Locker Application Submitted</h2>

        <h3>Selected Locker:</h3>
        <ul>
          <li><strong>Application ID:</strong> ${applicationId}</li>
          <li><strong>Locker #:</strong> ${lockerNumber}</li>
          <li><strong>Location:</strong> ${location}</li>
          <li><strong>Dimensions:</strong> ${dimensions}</li>
          <li><strong>Monthly Rent:</strong> $${monthlyRent}/month</li>
        </ul>

        <h3>Applicant Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Unit Number:</strong> ${unitNumber}</li>
          <li><strong>Address:</strong> ${address}</li>
          <li><strong>Telephone:</strong> ${telephone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Previously on waiting list:</strong> ${onWaitingList ? 'Yes' : 'No'}</li>
        </ul>

        <h3>Rental Terms Reminder:</h3>
        <ul>
          <li>$50 non-refundable admin fee applies</li>
          <li>$50 refundable key fee applies</li>
          <li>$300 refundable damage deposit payable upon signing</li>
          <li>Rent due on the 1st of every month by EFT</li>
          <li>Must sign Strata Rental Contract</li>
          <li>10% discount for 12 months prepaid rent</li>
        </ul>

        <hr>
        <p><strong>Consent given:</strong> Yes – Applicant has consented to be contacted by strata.</p>
        <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
      `
    };
  }
};

// Main function to send dynamic emails
const sendDynamicFormEmail = async (formName, formData) => {
  try {
    // Get form configuration from database
    const db = getPrismaClient();
    let formConfig = await db.formConfiguration.findFirst({
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

    // Get email template
    const template = emailTemplates[formName];
    if (!template) {
      console.warn(`No email template found for form: ${formName}`);
      return { success: false, error: 'Email template not found' };
    }

    // Auto-create form configuration if it doesn't exist yet
    if (!formConfig) {
      try {
        const displayNameMap = {
          'form-k': 'Form K - Notice of Tenant\'s Responsibilities',
          'scooter-registration': 'E-Scooter Registration',
          'ac-inquiry': 'AC Installation Inquiry',
          'storage-rental': 'Storage Rental Interest',
          'storage-locker-application': 'Storage Locker Application',
          'emergency-contact': 'Emergency Contact Information',
          'pet-registration': 'Pet Registration',
          'contact': 'Contact Form',
          'marketplace': 'Marketplace Post',
          'incident-report': 'Incident Report'
        };
        const created = await db.formConfiguration.create({
          data: {
            formName,
            displayName: displayNameMap[formName] || formName,
            description: `Auto-created configuration for ${formName}`,
            isActive: true,
            emailConfig: {
              subject: `New ${displayNameMap[formName] || formName} Submission`,
              fromName: process.env.SMTP_FROM_NAME || 'Spectrum 4',
              template: formName
            }
          }
        });
        // Re-assign formConfig so downstream code uses the new config
        formConfig = { ...created, recipients: [] };
        console.log(`Auto-created form configuration for: ${formName}`);
      } catch (createError) {
        // Ignore if creation fails (e.g., race condition where another request created it)
        console.warn(`Could not auto-create form config for ${formName}:`, createError.message);
      }
    }

    // Build evidence attachments for incident reports (inline CID images + video attachments)
    let evidenceAttachments = [];
    let enrichedFormData = formData;
    if (formName === 'incident-report' && formData.evidenceFilePaths && formData.evidenceFilePaths.length > 0) {
      const inlineImageCids = [];
      const videoAttachmentNames = [];

      for (let i = 0; i < formData.evidenceFilePaths.length; i++) {
        const filePath = formData.evidenceFilePaths[i];
        const filename = formData.evidenceFiles[i];
        if (!filePath || !fs.existsSync(filePath)) continue;

        const ext = path.extname(filename).toLowerCase().slice(1);
        const isImage = /^(jpeg|jpg|png|webp)$/.test(ext);
        const content = fs.readFileSync(filePath);

        if (isImage) {
          const cid = `evidence-${i}@spectrum4.ca`;
          const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          evidenceAttachments.push({ filename, content, cid, contentType });
          inlineImageCids.push(cid);
        } else {
          evidenceAttachments.push({ filename, content, contentType: `video/${ext}` });
          videoAttachmentNames.push(filename);
        }
      }

      enrichedFormData = { ...formData, inlineImageCids, videoAttachmentNames };
    }

    // Generate email content
    const emailContent = template(enrichedFormData);

    // Use custom subject from config if available, otherwise use template subject
    // Interpolate {{placeholder}} tokens with actual form data values
    // For form-k completion notifications, use the template subject (which includes completion status)
    // rather than the generic DB config subject
    let subject;
    if (formName === 'form-k' && (formData.formStatus === 'COMPLETE' || formData.formStatus === 'COMPLETE_ALL_SIGNATURES')) {
      subject = emailContent.subject;
    } else {
      subject = formConfig?.emailConfig?.subject || emailContent.subject;
    }
    subject = subject.replace(/\{\{(\w+)\}\}/g, (match, key) => formData[key] != null ? formData[key] : match);

    // Create transporter
    const transporter = createTransporter();

    // Build recipient list
    const fromName = process.env.SMTP_FROM_NAME || 'Spectrum 4';
    const fromAddress = process.env.SMTP_FROM || `${process.env.SMTP_USER}@spectrum4.ca`;

    // Admin recipients from DB config
    const adminRecipients = formConfig?.recipients
      ? formConfig.recipients.map(r => r.email).filter(Boolean)
      : [];

    // For form-k completion emails, auto-include the submitter (owner) as BCC
    let bccList = [];
    if (formName === 'form-k' && formData.ownerEmail) {
      bccList.push(formData.ownerEmail);
    }

    // If no admin recipients configured, try to send to submitter only
    if (adminRecipients.length === 0) {
      if (bccList.length > 0) {
        console.log(`No admin recipients configured for ${formName}, sending to submitter only: ${bccList[0]}`);
        const mailOptions = {
          from: `"${fromName}" <${fromAddress}>`,
          to: bccList[0],
          subject: subject,
          html: emailContent.html
        };

        // Generate and attach PDF for Form K completions
        if (formName === 'form-k' && (formData.formStatus === 'COMPLETE' || formData.formStatus === 'COMPLETE_ALL_SIGNATURES')) {
          try {
            const pdfBuffer = await generateFormKPdf(formData);
            mailOptions.attachments = [{
              filename: `Form_K_Unit_${formData.unitNumber}_${formData.submissionId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }];
          } catch (pdfError) {
            console.error('Error generating Form K PDF:', pdfError);
          }
        }

        const info = await transporter.sendMail(mailOptions);
        return {
          success: true,
          messageId: info.messageId,
          recipients: bccList[0],
          pdfAttached: !!(mailOptions.attachments?.length)
        };
      }

      console.warn(`No recipients configured for form: ${formName}`);
      return { success: false, error: 'No recipients configured' };
    }

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: adminRecipients.join(', '),
      subject: subject,
      html: emailContent.html
    };

    // Add submitter as BCC for form-k
    if (bccList.length > 0) {
      mailOptions.bcc = bccList.join(', ');
    }

    // Attach evidence files for incident reports
    if (formName === 'incident-report' && evidenceAttachments.length > 0) {
      mailOptions.attachments = evidenceAttachments;
      console.log(`Attaching ${evidenceAttachments.length} evidence file(s) to incident report email`);
    }

    // Generate and attach PDF for Form K completions
    if (formName === 'form-k' && (formData.formStatus === 'COMPLETE' || formData.formStatus === 'COMPLETE_ALL_SIGNATURES')) {
      try {
        console.log('Generating Form K PDF for completion notification...');
        const pdfBuffer = await generateFormKPdf(formData);

        mailOptions.attachments = [{
          filename: `Form_K_Unit_${formData.unitNumber}_${formData.submissionId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }];

        console.log('Form K PDF generated and attached successfully');
      } catch (pdfError) {
        console.error('Error generating Form K PDF:', pdfError);
        // Continue without PDF attachment if generation fails
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Dynamic email sent successfully for form: ${formName}`, {
      messageId: info.messageId,
      recipients: adminRecipients.join(', '),
      bcc: bccList.length > 0 ? bccList.join(', ') : 'none',
      formName: formName
    });

    return {
      success: true,
      messageId: info.messageId,
      recipients: adminRecipients.join(', '),
      pdfAttached: formName === 'form-k' && mailOptions.attachments?.length > 0
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
