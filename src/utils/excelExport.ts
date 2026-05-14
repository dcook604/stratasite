// Excel Export Utilities for Form Data
import ExcelJS from 'exceljs';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

/**
 * Download data as an Excel file
 */
export async function downloadExcel(data: Record<string, unknown>[], filename: string, sheetName: string = 'Data'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
    data.forEach(row => worksheet.addRow(row));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Format Pet Registration data for Excel export with enhanced formatting
 */
export function formatPetRegistrationForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map(item => ({
    'Registration ID': item.registrationId,
    'Owner Name': item.ownerName,
    'Suite Number': item.suiteNumber,
    'Phone Number': item.phoneNumber,
    'Email Address': item.email,
    'Occupancy Type': item.occupancyType === 'OWNER_OCCUPIED' ? 'Owner Occupied' : 'Tenant',
    'Pet Name': item.petName,
    'Pet Age': item.petAge,
    'Pet Height': item.petHeight,
    'Pet Color': item.petColor,
    'Pet Type': item.petType,
    'Pet Breed': item.petBreed,
    'Pet Weight': item.petWeight,
    'Distinguishing Marks': item.distinguishingMarks || 'N/A',
    'License Number': item.licenseNumber || 'N/A',
    'Status': item.status,
    'Admin Notes': item.notes || 'N/A',
    'Email Sent': item.emailSent ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Last Updated': new Date(item.updatedAt as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Active': item.isActive ? 'Yes' : 'No'
  }));
}

/**
 * Format Scooter Registration data for Excel export
 */
export function formatScooterRegistrationForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map(item => ({
    'Registration ID': item.registrationId,
    'Registration Date': item.registrationDate,
    'Unit Number': item.unitNumber,
    'Number of Scooters': item.numberOfScooters,
    'Description': item.description,
    'Owner Names': item.ownerNames,
    'Email Address': item.email,
    'Phone Number': item.phone || 'N/A',
    'Status': item.status,
    'Key Number': item.keyNumber || 'N/A',
    'Deposit Paid': item.depositPaid ? 'Yes' : 'No',
    'Deposit Amount': `$${(item.depositAmount as number).toFixed(2)}`,
    'Admin Notes': item.notes || 'N/A',
    'Email Sent': item.emailSent ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Last Updated': new Date(item.updatedAt as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Active': item.isActive ? 'Yes' : 'No'
  }));
}

/**
 * Format Emergency Contact data for Excel export
 */
export function formatEmergencyContactForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map(item => ({
    'Contact ID': item.contactId,
    'Unit Number': item.unitNumber,
    'Strata Lot Number': item.strataLotNumber,
    'Registered Owner Names': item.registeredOwnerNames,
    'Owner Email': item.ownerEmail || 'N/A',
    'Home Phone': item.phoneHome || 'N/A',
    'Business Phone': item.phoneBusiness || 'N/A',
    'Other Phone': item.phoneOther || 'N/A',
    'Other Phone Specify': item.phoneOtherSpecify || 'N/A',
    'Non-resident Address': item.nonResidentAddress || 'N/A',
    'Non-resident Phone': item.nonResidentPhone || 'N/A',
    'Emergency Contact Name': item.emergencyContactName || 'N/A',
    'Emergency Contact Address': item.emergencyContactAddress || 'N/A',
    'Emergency Contact Phone': item.emergencyContactPhone || 'N/A',
    'Emergency Contact Email': item.emergencyContactEmail || 'N/A',
    'Allow Management Access': item.allowManagementAccess ? 'Yes' : 'No',
    'Concierge Key Provided': item.conciergeKeyProvided ? 'Yes' : 'No',
    'Date Provided to Concierge': item.dateProvidedToConcierge || 'N/A',
    'Security Code Provided': item.securityCode ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}

/**
 * Format AC Inquiry data for Excel export
 */
export function formatACInquiryForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map(item => ({
    'Inquiry ID': item.inquiryId,
    'Owner Name': item.ownerName,
    'Unit Number': item.ownerUnit,
    'Phone Number': item.ownerPhone,
    'Email Address': item.email,
    'Installation Type': item.isMultiZone ? 'Multi-Zone' : 'Single-Zone',
    'Best Contact Method': item.bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone',
    'Installation Timing': item.installationTiming,
    'Notes': item.notes || 'N/A',
    'Consent Given': item.consentGiven ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt as string).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}


/**
 * Format Storage Locker Application data for Excel export
 */
export function formatStorageLockerForExcel(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((app: any) => ({
    'Application ID': app.applicationId,
    'First Name': app.firstName,
    'Last Name': app.lastName,
    'Unit Number': app.unitNumber,
    'Address': app.address,
    'Telephone': app.telephone,
    'Email': app.email,
    'Status': app.status,
    'On Waiting List': app.onWaitingList ? 'Yes' : 'No',
    'Prepay 12 Months': app.prepayYear ? 'Yes' : 'No',
    'Locker Number': app.locker?.lockerNumber || '',
    'Locker Location': app.locker?.location || '',
    'Monthly Rent': app.locker?.monthlyRent ? `$${app.locker.monthlyRent}` : '',
    'Consent Given': app.consentGiven ? 'Yes' : 'No',
    'Admin Notes': app.adminNotes || '',
    'Email Sent': app.emailSent ? 'Yes' : 'No',
    'Submitted Date': new Date(app.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }));
}


/**
 * Export form data as Excel
 */
export async function exportFormDataAsExcel(
  data: Record<string, unknown>[],
  formType: 'emergency-contact' | 'ac-inquiry' | 'pet-registration' | 'scooter-registration' | 'storage-locker-application',
  options: ExcelExportOptions = {}
): Promise<void> {
  let formattedData: Record<string, unknown>[];
  let defaultFilename: string;
  let defaultSheetName: string;

  switch (formType) {
    case 'emergency-contact':
      formattedData = formatEmergencyContactForExcel(data);
      defaultFilename = `emergency-contacts-${new Date().toISOString().split('T')[0]}.xlsx`;
      defaultSheetName = 'Emergency Contacts';
      break;
    case 'ac-inquiry':
      formattedData = formatACInquiryForExcel(data);
      defaultFilename = `ac-inquiries-${new Date().toISOString().split('T')[0]}.xlsx`;
      defaultSheetName = 'AC Inquiries';
      break;
    case 'pet-registration':
      formattedData = formatPetRegistrationForExcel(data);
      defaultFilename = `pet-registrations-${new Date().toISOString().split('T')[0]}.xlsx`;
      defaultSheetName = 'Pet Registrations';
      break;
    case 'scooter-registration':
      formattedData = formatScooterRegistrationForExcel(data);
      defaultFilename = `scooter-registrations-${new Date().toISOString().split('T')[0]}.xlsx`;
      defaultSheetName = 'Scooter Registrations';
      break;
    case 'storage-locker-application':
      formattedData = formatStorageLockerForExcel(data);
      defaultFilename = `storage-locker-applications-${new Date().toISOString().split('T')[0]}.xlsx`;
      defaultSheetName = 'Storage Lockers';
      break;
    default:
      throw new Error(`Unknown form type: ${formType}`);
  }

  await downloadExcel(formattedData, options.filename || defaultFilename, options.sheetName || defaultSheetName);
}

/**
 * Export multiple form types as a single Excel file with multiple sheets
 */
export async function exportMultipleFormsAsExcel(
  formsData: {
    type: 'emergency-contact' | 'ac-inquiry' | 'pet-registration' | 'scooter-registration';
    data: Record<string, unknown>[];
    sheetName?: string;
  }[],
  filename: string = `form-data-export-${new Date().toISOString().split('T')[0]}.xlsx`
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  formsData.forEach(({ type, data, sheetName }) => {
    let formattedData: Record<string, unknown>[];
    let defaultSheetName: string;

    switch (type) {
      case 'emergency-contact':
        formattedData = formatEmergencyContactForExcel(data);
        defaultSheetName = 'Emergency Contacts';
        break;
      case 'ac-inquiry':
        formattedData = formatACInquiryForExcel(data);
        defaultSheetName = 'AC Inquiries';
        break;
      case 'pet-registration':
        formattedData = formatPetRegistrationForExcel(data);
        defaultSheetName = 'Pet Registrations';
        break;
      case 'scooter-registration':
        formattedData = formatScooterRegistrationForExcel(data);
        defaultSheetName = 'Scooter Registrations';
        break;
      default:
        return;
    }

    if (formattedData.length > 0) {
      const worksheet = workbook.addWorksheet(sheetName || defaultSheetName);
      worksheet.columns = Object.keys(formattedData[0]).map(key => ({ header: key, key }));
      formattedData.forEach(row => worksheet.addRow(row));
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
