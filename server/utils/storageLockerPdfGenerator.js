import puppeteer from 'puppeteer';

const generateStorageLockerPdf = async (applications) => {
  let browser;

  try {
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
    const htmlContent = generateReportHtml(applications);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.6in',
        right: '0.6in'
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating storage locker PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateReportHtml = (applications) => {
  const rows = applications.map((app, index) => {
    const lockerNumber = app.locker?.lockerNumber || '—';
    const lockerLocation = app.locker?.location || '—';
    const monthlyRent = app.locker?.monthlyRent ? `$${app.locker.monthlyRent.toFixed(2)}` : '—';
    const submittedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    return `
      <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
        <td>${escapeHtml(app.applicationId)}</td>
        <td>${escapeHtml(app.firstName)} ${escapeHtml(app.lastName)}</td>
        <td>${escapeHtml(app.unitNumber)}</td>
        <td>${escapeHtml(app.email)}</td>
        <td>${escapeHtml(app.telephone)}</td>
        <td>${lockerNumber}</td>
        <td>${lockerLocation}</td>
        <td>${monthlyRent}</td>
        <td><span class="status status-${app.status.toLowerCase()}">${app.status}</span></td>
        <td>${submittedDate}</td>
      </tr>
    `;
  }).join('');

  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 9pt;
          margin: 0;
          padding: 10px;
          color: #1a1a1a;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #7c3aed;
        }
        .header h1 {
          font-size: 16pt;
          color: #7c3aed;
          margin: 0 0 4px 0;
        }
        .header .subtitle {
          font-size: 10pt;
          color: #666;
          margin: 0;
        }
        .summary {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          justify-content: center;
        }
        .summary-item {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 9pt;
          text-align: center;
        }
        .summary-total {
          background: #f3f0ff;
          border: 1px solid #7c3aed;
        }
        .summary-pending {
          background: #fef9c3;
          border: 1px solid #eab308;
        }
        .summary-approved {
          background: #dcfce7;
          border: 1px solid #22c55e;
        }
        .summary-rejected {
          background: #fee2e2;
          border: 1px solid #ef4444;
        }
        .summary-item .count {
          font-size: 14pt;
          font-weight: bold;
          display: block;
        }
        .summary-item .label {
          font-size: 7.5pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        th {
          background: #7c3aed;
          color: white;
          padding: 6px 4px;
          text-align: left;
          font-weight: 600;
          white-space: nowrap;
        }
        td {
          padding: 5px 4px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr.even {
          background: #f9fafb;
        }
        .status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7.5pt;
          font-weight: 600;
        }
        .status-pending {
          background: #fef9c3;
          color: #854d0e;
        }
        .status-approved {
          background: #dcfce7;
          color: #166534;
        }
        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          font-size: 7.5pt;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Storage Locker Applications Report</h1>
        <p class="subtitle">Generated ${new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}</p>
      </div>

      <div class="summary">
        <div class="summary-item summary-total">
          <span class="count">${applications.length}</span>
          <span class="label">Total</span>
        </div>
        <div class="summary-item summary-pending">
          <span class="count">${pendingCount}</span>
          <span class="label">Pending</span>
        </div>
        <div class="summary-item summary-approved">
          <span class="count">${approvedCount}</span>
          <span class="label">Approved</span>
        </div>
        <div class="summary-item summary-rejected">
          <span class="count">${rejectedCount}</span>
          <span class="label">Rejected</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Applicant</th>
            <th>Unit</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Locker #</th>
            <th>Location</th>
            <th>Rent</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="10" style="text-align:center;padding:20px;color:#999;">No applications found</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Stratasite — Storage Locker Applications Report
      </div>
    </body>
    </html>
  `;
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export { generateStorageLockerPdf };
