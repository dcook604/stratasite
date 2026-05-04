import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Safely parse a date string into a Date object.
// Handles "YYYY-MM-DD", "M/D/YYYY", "D/M/YYYY", and other common formats.
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  // Try parsing ISO-like format without timezone
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  return null;
};

const generateFormKPdf = async (formData) => {
  let browser;
  
  try {
    // Launch browser in headless mode
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    
    // Create HTML content that exactly matches the Form K layout
    const htmlContent = generateFormKHtml(formData);
    
    // Set content and generate PDF
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper formatting
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.75in',
        right: '0.75in'
      }
    });

    return pdfBuffer;

  } catch (error) {
    console.error('Error generating Form K PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateFormKHtml = (data) => {
  const {
    strataPlan,
    address,
    unitNumber,
    strataLotNumber,
    lockerNumber,
    parkingStallNumbers,
    tenant1Name,
    tenant1HomePhone,
    tenant1OfficePhone,
    tenant1CellPhone,
    tenant1Email,
    tenant2Name,
    tenant2HomePhone,
    tenant2OfficePhone,
    tenant2CellPhone,
    tenant2Email,
    tenancyCommencingDay,
    tenancyCommencingDate,
    tenancyCommencingYear,
    landlordName,
    landlordAddress,
    landlordSignatureName,
    landlordSignatureDate,
    tenant1SignatureName,
    tenant1SignatureDate,
    tenant2SignatureName,
    tenant2SignatureDate,
    ownerMailingAddress,
    ownerHomePhone,
    ownerWorkPhone,
    ownerFax,
    ownerCellular,
    ownerEmail
  } = data;

  // Parse landlord signature date for the date-signature section
  const parsedSigDate = parseDate(landlordSignatureDate);
  const sigDay = parsedSigDate ? parsedSigDate.getDate() : '';
  const sigMonth = parsedSigDate ? parsedSigDate.toLocaleDateString('en-US', { month: 'long' }) : '';
  const sigYear = parsedSigDate ? parsedSigDate.getFullYear().toString().slice(-2) : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: "Times New Roman", serif;
          font-size: 12pt;
          line-height: 1.2;
          margin: 0;
          padding: 20px;
          color: black;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .form-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .form-subtitle {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .section-note {
          font-size: 10pt;
          font-style: italic;
          margin-bottom: 20px;
        }
        
        .form-row {
          margin-bottom: 15px;
          display: flex;
          align-items: baseline;
        }
        
        .form-row-block {
          margin-bottom: 20px;
        }
        
        .label {
          font-weight: bold;
          margin-right: 5px;
        }
        
        .field {
          border-bottom: 1px solid black;
          display: inline-block;
          min-width: 200px;
          padding-bottom: 1px;
          margin-right: 10px;
        }
        
        .field-long {
          min-width: 400px;
        }
        
        .field-medium {
          min-width: 150px;
        }
        
        .field-short {
          min-width: 100px;
        }
        
        .field-very-short {
          min-width: 50px;
        }
        
        .notice-section {
          margin: 30px 0;
        }
        
        .notice-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .notice-item {
          margin-bottom: 15px;
          text-align: justify;
        }
        
        .signature-section {
          margin-top: 40px;
          margin-bottom: 30px;
        }
        
        .signature-row {
          margin-bottom: 30px;
          position: relative;
        }
        
        .signature-line {
          border-bottom: 1px solid black;
          width: 300px;
          height: 40px;
          display: inline-block;
          margin-right: 50px;
          position: relative;
        }
        
        .signature-text {
          position: absolute;
          bottom: 10px;
          left: 5px;
          font-family: "Courier New", monospace;
          font-size: 14pt;
          font-weight: bold;
        }
        
        .signature-label {
          font-size: 10pt;
          margin-top: 5px;
        }
        
        .footer-section {
          margin-top: 40px;
        }
        
        .footer-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .footer-address {
          text-align: center;
          line-height: 1.3;
        }
        
        .date-signature {
          margin-top: 30px;
        }
        
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="form-title">Strata Property Act</div>
        <div class="form-subtitle">FORM K</div>
        <div class="form-subtitle">NOTICE OF TENANT'S RESPONSIBILITIES</div>
        <div class="section-note">(Section 146)</div>
      </div>

      <div class="form-row">
        <span class="label">Strata Plan</span>
        <span class="field field-medium">${strataPlan || ''}</span>
        <span class="label">Address</span>
        <span class="field field-long">${address || ''}</span>
      </div>

      <div class="form-row">
        <span class="label">Unit #</span>
        <span class="field field-medium">${unitNumber || ''}</span>
        <span class="label">Strata Lot #</span>
        <span class="field field-medium">${strataLotNumber || ''}</span>
        <span class="label">Locker #</span>
        <span class="field field-medium">${lockerNumber || ''}</span>
        <span class="label">Parking Stall(s) #</span>
        <span class="field field-medium">${parkingStallNumbers || ''}</span>
      </div>

      <div class="form-row-block">
        <div class="form-row">
          <span class="label">Name of tenant</span>
          <span class="field field-long">${tenant1Name || ''}</span>
        </div>
        
        <div class="form-row">
          <span class="label">Contact number: Home:</span>
          <span class="field field-medium">${tenant1HomePhone || ''}</span>
          <span class="label">Office:</span>
          <span class="field field-medium">${tenant1OfficePhone || ''}</span>
        </div>
        
        <div class="form-row">
          <span style="margin-left: 140px;">Cell:</span>
          <span class="field field-medium">${tenant1CellPhone || ''}</span>
          <span class="label">Email:</span>
          <span class="field field-medium">${tenant1Email || ''}</span>
        </div>
      </div>

      ${tenant2Name ? `
      <div class="form-row-block">
        <div class="form-row">
          <span class="label">Name of tenant</span>
          <span class="field field-long">${tenant2Name || ''}</span>
        </div>
        
        <div class="form-row">
          <span class="label">Contact number: Home:</span>
          <span class="field field-medium">${tenant2HomePhone || ''}</span>
          <span class="label">Office:</span>
          <span class="field field-medium">${tenant2OfficePhone || ''}</span>
        </div>
        
        <div class="form-row">
          <span style="margin-left: 140px;">Cell:</span>
          <span class="field field-medium">${tenant2CellPhone || ''}</span>
          <span class="label">Email:</span>
          <span class="field field-medium">${tenant2Email || ''}</span>
        </div>
      </div>
      ` : ''}

      <div class="form-row" style="margin-top: 30px;">
        <span class="label">Tenancy commencing this</span>
        <span class="field field-short">${tenancyCommencingDay || ''}</span>
        <span class="label">day of</span>
        <span class="field field-medium">${tenancyCommencingDate || ''}</span>
        <span>, 20</span>
        <span class="field field-very-short">${tenancyCommencingYear || ''}</span>
        <span>.</span>
      </div>

      <div class="notice-section">
        <div class="notice-title">IMPORTANT NOTICE TO TENANTS:</div>
        
        <div class="notice-item">
          <strong>1.</strong>&nbsp;&nbsp;&nbsp;&nbsp;Under the <em>Strata Property Act</em>, a tenant in a strata corporation <strong>must</strong> comply with the bylaws and rules of the strata corporation that are in force from time to time (current bylaws and rules attached).
        </div>
        
        <div class="notice-item">
          <strong>2.</strong>&nbsp;&nbsp;&nbsp;&nbsp;The current bylaws and rules may be changed by the strata corporation, and if they are changed, the tenant <strong>must</strong> comply with the changed bylaws and rules.
        </div>
        
        <div class="notice-item">
          <strong>3.</strong>&nbsp;&nbsp;&nbsp;&nbsp;If a tenant or occupant of the strata lot, or a person visiting the tenant or admitted by the tenant for any reason, contravenes a bylaw or rule, the tenant is responsible and may be subject to penalties, including fines, denial of access to recreational facilities, and if the strata corporation incurs costs for remedying a contravention, payment of those costs.
        </div>
      </div>

      <div class="date-signature">
        <div class="form-row">
          <span class="label">Dated this</span>
          <span class="field field-short">${sigDay}</span>
          <span class="label">day of</span>
          <span class="field field-medium">${sigMonth}</span>
          <span>, 20</span>
          <span class="field field-very-short">${sigYear}</span>
          <span>.</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-row">
          <div class="signature-line">
            ${landlordSignatureName ? `<div class="signature-text">${landlordSignatureName}</div>` : ''}
          </div>
        </div>
        <div class="signature-label">Name & Address of landlord, or agent of landlord:</div>
        <div style="margin-top: 10px; border-bottom: 1px solid black; min-height: 40px; padding: 5px;">
          ${landlordName || ''}<br/>
          ${landlordAddress || ''}
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-row">
          <div class="signature-line">
            ${landlordSignatureName ? `<div class="signature-text">${landlordSignatureName}</div>` : ''}
          </div>
        </div>
        <div class="signature-label">Signature of Landlord, or Agent of Landlord</div>
      </div>

      <div class="signature-section">
        <div style="display: flex; justify-content: space-between;">
          <div style="width: 45%;">
            <div class="signature-line">
              ${tenant1SignatureName ? `<div class="signature-text">${tenant1SignatureName}</div>` : ''}
            </div>
            <div class="signature-label">Signature of Tenant</div>
          </div>
          
          <div style="width: 45%;">
            <div class="signature-line">
              ${tenant2SignatureName ? `<div class="signature-text">${tenant2SignatureName}</div>` : ''}
            </div>
            <div class="signature-label">Signature of Tenant</div>
          </div>
        </div>
      </div>

      <div class="footer-section">
        <div class="footer-title">OWNER'S MAILING ADDRESS</div>
        <div class="field field-long" style="min-height: 30px; padding: 5px;">
          ${ownerMailingAddress || ''}
        </div>
      </div>

      <div class="form-row" style="margin-top: 20px;">
        <span class="label">Owner's telephone numbers:</span>
        <span class="label">Home:</span>
        <span class="field field-medium">${ownerHomePhone || ''}</span>
        <span class="label">Work:</span>
        <span class="field field-medium">${ownerWorkPhone || ''}</span>
      </div>

      <div class="form-row">
        <span class="label">Fax:</span>
        <span class="field field-medium">${ownerFax || ''}</span>
        <span class="label">Cellular:</span>
        <span class="field field-medium">${ownerCellular || ''}</span>
        <span class="label">E-mail:</span>
        <span class="field field-medium">${ownerEmail || ''}</span>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <div>Please remit original to:</div>
        <div class="footer-address" style="margin-top: 20px; font-weight: bold;">
          <div>ASCENT REAL ESTATE MANAGEMENT CORPORATION</div>
          <div>2176 WILLINGDON AVENUE</div>
          <div>BURNABY, BC V5C 5Z9</div>
          <div>FAX: (604) 431-1818</div>
        </div>
      </div>

      <div style="font-size: 8pt; margin-top: 30px;">
        J:\Forms\FormK (updated February 1, 2021)
      </div>
    </body>
    </html>
  `;
};

export { generateFormKPdf };
