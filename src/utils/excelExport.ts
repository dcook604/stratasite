// Excel Export Utilities for Form Data
import * as XLSX from 'xlsx';
import { formatPetRegistrationForCSV, formatScooterRegistrationForCSV, formatEmergencyContactForCSV, formatACInquiryForCSV, formatStorageRentalForCSV } from './csvExport';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

/**
 * Download data as an Excel file
 */
export function downloadExcel(data: any[], filename: string, sheetName: string = 'Data'): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and download
  XLSX.writeFile(workbook, filename);
}

/**
 * Format Pet Registration data for Excel export with enhanced formatting
 */
export function formatPetRegistrationForExcel(data: any[]): any[] {
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
    'Submitted Date': new Date(item.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Last Updated': new Date(item.updatedAt).toLocaleDateString('en-US', {
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
export function formatScooterRegistrationForExcel(data: any[]): any[] {
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
    'Deposit Amount': `$${item.depositAmount.toFixed(2)}`,
    'Admin Notes': item.notes || 'N/A',
    'Email Sent': item.emailSent ? 'Yes' : 'No',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Last Updated': new Date(item.updatedAt).toLocaleDateString('en-US', {
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
export function formatEmergencyContactForExcel(data: any[]): any[] {
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
    'Submitted Date': new Date(item.createdAt).toLocaleDateString('en-US', {
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
export function formatACInquiryForExcel(data: any[]): any[] {
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
    'Submitted Date': new Date(item.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}

/**
 * Format Storage Rental data for Excel export
 */
export function formatStorageRentalForExcel(data: any[]): any[] {
  return data.map(item => ({
    'Rental ID': item.rentalId,
    'First Name': item.firstName,
    'Last Name': item.lastName,
    'Full Name': `${item.firstName} ${item.lastName}`,
    'Phone Number': item.phoneNumber,
    'Email Address': item.email,
    'Unit Number': item.unitNumber,
    'Best Contact Method': item.bestContactMethod === 'EMAIL' ? 'Email' : 'Telephone',
    'Interested in Information': item.interestedInInfo ? 'Yes' : 'No',
    'Consent Given': item.consentGiven ? 'Yes' : 'No',
    'Notes': item.notes || 'N/A',
    'Submitted Date': new Date(item.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Status': item.isActive ? 'Active' : 'Inactive'
  }));
}

/**
 * Export form data as Excel
 */
export function exportFormDataAsExcel(
  data: any[], 
  formType: 'emergency-contact' | 'ac-inquiry' | 'storage-rental' | 'pet-registration' | 'scooter-registration',
  options: ExcelExportOptions = {}
): void {
  let formattedData: any[];
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
    case 'storage-rental':
      formattedData = formatStorageRentalForExcel(data);
      defaultFilename = `storage-rentals-${new Date().toISOString().split('T')[0]}.xlsx`;
      defaultSheetName = 'Storage Rentals';
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
    default:
      throw new Error(`Unknown form type: ${formType}`);
  }
  
  const filename = options.filename || defaultFilename;
  const sheetName = options.sheetName || defaultSheetName;
  
  downloadExcel(formattedData, filename, sheetName);
}

/**
 * Export multiple form types as a single Excel file with multiple sheets
 */
export function exportMultipleFormsAsExcel(
  formsData: {
    type: 'emergency-contact' | 'ac-inquiry' | 'storage-rental' | 'pet-registration' | 'scooter-registration';
    data: any[];
    sheetName?: string;
  }[],
  filename: string = `form-data-export-${new Date().toISOString().split('T')[0]}.xlsx`
): void {
  const workbook = XLSX.utils.book_new();
  
  formsData.forEach(({ type, data, sheetName }) => {
    let formattedData: any[];
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
      case 'storage-rental':
        formattedData = formatStorageRentalForExcel(data);
        defaultSheetName = 'Storage Rentals';
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
        return; // Skip unknown types
    }
    
    if (formattedData.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || defaultSheetName);
    }
  });
  
  XLSX.writeFile(workbook, filename);
}
