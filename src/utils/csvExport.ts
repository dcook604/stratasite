// CSV Export Utilities for Form Data

export interface CSVExportOptions {
  filename?: string;
  includeHeaders?: boolean;
}

/**
 * Convert an array of objects to CSV format
 */
export function convertToCSV(data: any[], options: CSVExportOptions = {}): string {
  if (data.length === 0) return '';
  
  const { includeHeaders = true } = options;
  const headers = Object.keys(data[0]);
  
  let csv = '';
  
  // Add headers
  if (includeHeaders) {
    csv += headers.map(header => `"${header}"`).join(',') + '\n';
  }
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Download CSV data as a file
 */
export function downloadCSV(csvData: string, filename: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Format Emergency Contact data for CSV export
 */
export function formatEmergencyContactForCSV(data: any[]): any[] {
  return data.map(item => ({
    'Contact ID': item.contactId,
    'Unit Number': item.unitNumber,
    'Strata Lot Number': item.strataLotNumber,
    'Registered Owner Names': item.registeredOwnerNames,
    'Owner Email': item.ownerEmail || '',
    'Home Phone': item.phoneHome || '',
    'Business Phone': item.phoneBusiness || '',
    'Other Phone': item.phoneOther || '',
    'Other Phone Specify': item.phoneOtherSpecify || '',
    'Non-resident Address': item.nonResidentAddress || '',
    'Non-resident Phone': item.nonResidentPhone || '',
    'Emergency Contact Name': item.emergencyContactName || '',
    'Emergency Contact Address': item.emergencyContactAddress || '',
    'Emergency Contact Phone': item.emergencyContactPhone || '',
    'Emergency Contact Email': item.emergencyContactEmail || '',
    'Allow Management Access': item.allowManagementAccess,
    'Concierge Key Provided': item.conciergeKeyProvided,
    'Date Provided to Concierge': item.dateProvidedToConcierge || '',
    'Security Code Provided': item.securityCode ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString(),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}

/**
 * Format AC Inquiry data for CSV export
 */
export function formatACInquiryForCSV(data: any[]): any[] {
  return data.map(item => ({
    'Inquiry ID': item.inquiryId,
    'Owner Name': item.ownerName,
    'Unit Number': item.ownerUnit,
    'Phone Number': item.ownerPhone,
    'Email': item.email,
    'Installation Type': item.isMultiZone ? 'Multi-Zone' : 'Single-Zone',
    'Best Contact Method': item.bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone',
    'Installation Timing': item.installationTiming,
    'Notes': item.notes || '',
    'Consent Given': item.consentGiven ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString(),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}

/**
 * Format Storage Rental data for CSV export
 */
export function formatStorageRentalForCSV(data: any[]): any[] {
  return data.map(item => ({
    'Rental ID': item.rentalId,
    'First Name': item.firstName,
    'Last Name': item.lastName,
    'Full Name': `${item.firstName} ${item.lastName}`,
    'Phone Number': item.phoneNumber,
    'Email': item.email,
    'Unit Number': item.unitNumber,
    'Best Contact Method': item.bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone',
    'Interested in Information': item.interestedInInfo ? 'Yes' : 'No',
    'Consent Given': item.consentGiven ? 'Yes' : 'No',
    'Notes': item.notes || '',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString(),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}

/**
 * Format Pet Registration data for CSV export
 */
export function formatPetRegistrationForCSV(data: any[]): any[] {
  return data.map(item => ({
    'Registration ID': item.registrationId,
    'Owner Name': item.ownerName,
    'Suite Number': item.suiteNumber,
    'Phone Number': item.phoneNumber,
    'Email': item.email,
    'Occupancy Type': item.occupancyType === 'OWNER_OCCUPIED' ? 'Owner Occupied' : 'Tenant',
    'Pet Name': item.petName,
    'Pet Age': item.petAge,
    'Pet Height': item.petHeight,
    'Pet Color': item.petColor,
    'Pet Type': item.petType,
    'Pet Breed': item.petBreed,
    'Pet Weight': item.petWeight,
    'Distinguishing Marks': item.distinguishingMarks || '',
    'License Number': item.licenseNumber || '',
    'Status': item.status,
    'Admin Notes': item.notes || '',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString(),
    'Active': item.isActive ? 'Yes' : 'No'
  }));
}

/**
 * Format Scooter Registration data for CSV export
 */
export function formatScooterRegistrationForCSV(data: any[]): any[] {
  return data.map(item => ({
    'Registration ID': item.registrationId,
    'Registration Date': item.registrationDate,
    'Unit Number': item.unitNumber,
    'Number of Scooters': item.numberOfScooters,
    'Description': item.description,
    'Owner Names': item.ownerNames,
    'Email': item.email,
    'Phone': item.phone || '',
    'Status': item.status,
    'Key Number': item.keyNumber || '',
    'Deposit Paid': item.depositPaid ? 'Yes' : 'No',
    'Deposit Amount': item.depositAmount,
    'Notes': item.notes || '',
    'Email Sent': item.emailSent ? 'Yes' : 'No',
    'Active': item.isActive ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString(),
    'Last Updated': new Date(item.updatedAt).toLocaleDateString()
  }));
}

/**
 * Export form data as CSV
 */
export function exportFormData(
  data: any[], 
  formType: 'emergency-contact' | 'ac-inquiry' | 'storage-rental' | 'pet-registration' | 'scooter-registration',
  options: CSVExportOptions = {}
): void {
  let formattedData: any[];
  let defaultFilename: string;
  
  switch (formType) {
    case 'emergency-contact':
      formattedData = formatEmergencyContactForCSV(data);
      defaultFilename = `emergency-contacts-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'ac-inquiry':
      formattedData = formatACInquiryForCSV(data);
      defaultFilename = `ac-inquiries-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'storage-rental':
      formattedData = formatStorageRentalForCSV(data);
      defaultFilename = `storage-rentals-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'pet-registration':
      formattedData = formatPetRegistrationForCSV(data);
      defaultFilename = `pet-registrations-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'scooter-registration':
      formattedData = formatScooterRegistrationForCSV(data);
      defaultFilename = `scooter-registrations-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    default:
      throw new Error(`Unknown form type: ${formType}`);
  }
  
  const csvData = convertToCSV(formattedData, options);
  const filename = options.filename || defaultFilename;
  
  downloadCSV(csvData, filename);
} 