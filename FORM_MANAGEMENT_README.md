# Form Management System

## Overview

The Form Management System provides centralized control over email recipients and templates for all forms on the Spectrum 4 website. This system allows administrators to:

- Manage email recipients for each form
- Update email templates and subjects
- Enable/disable forms
- Add new forms dynamically
- View form submission statistics

## Features

### ✅ Implemented Features

1. **Database Schema**
   - `FormConfiguration` table for form settings
   - `FormEmailRecipient` table for email recipients
   - Support for multiple recipients per form
   - Primary recipient designation

2. **API Endpoints**
   - `GET /api/form-configurations` - List all form configurations
   - `GET /api/form-configurations/:formName` - Get specific form config
   - `PUT /api/form-configurations/:id` - Update form configuration
   - `POST /api/form-configurations` - Create new form configuration
   - `DELETE /api/form-configurations/:id` - Delete form configuration

3. **Dynamic Email Service**
   - Centralized email sending using database configuration
   - Fallback to original hardcoded emails if database fails
   - Template-based email generation
   - Support for all existing forms

4. **Admin Interface**
   - Form Management tab in admin dashboard
   - Visual form configuration editor
   - Recipient management with add/remove/edit
   - Real-time updates without server restart

### 🔄 Current Forms Supported

1. **E-Scooter Registration** (`scooter-registration`)
   - Current recipients: dcook@spectrum4.ca, jen.danczak@gmail.com
   - Subject: "New E-Scooter Registration - Unit {unitNumber}"

2. **AC Installation Inquiry** (`ac-inquiry`)
   - Current recipients: dcook@spectrum4.ca, info@airlux.ca
   - Subject: "New AC Installation Inquiry - Unit {ownerUnit}"

3. **Storage Rental Interest** (`storage-rental`)
   - Current recipients: dcook@spectrum4.ca, jennifer.danczak@spectrum4.ca
   - Subject: "New Storage Rental Interest - Unit {unitNumber}"

4. **Emergency Contact Information** (`emergency-contact`)
   - Current recipients: dcook@spectrum4.ca, abrajlovic@ascentpm.com, jennifer.danczak@spectrum4.ca, hercules@spectrum4.ca
   - Subject: "Emergency Contact Information - Unit {unitNumber}"

5. **Pet Registration** (`pet-registration`)
   - Current recipients: dcook@spectrum4.ca, abrajlovic@ascentpm.com, jennifer.danczak@spectrum4.ca, hercules@spectrum4.ca
   - Subject: "New Pet Registration - {petName} (Unit {suiteNumber})"

## Setup Instructions

### 1. Database Migration

Run the setup script to create the database schema and seed initial data:

```bash
npm run setup:forms
```

This will:
- Generate Prisma client
- Push schema to database
- Seed form configurations with current email addresses

### 2. Server Restart

Restart your server to load the new API endpoints:

```bash
# For development
npm run dev

# For production
npm run build
npm start
```

### 3. Access Admin Interface

1. Log in to the admin dashboard
2. Navigate to "Form Management" tab
3. Configure email recipients for each form
4. Test form submissions to verify email delivery

## Usage

### Managing Form Configurations

1. **View Forms**: All configured forms are displayed in the Form Management tab
2. **Edit Configuration**: Click "Edit" on any form to modify settings
3. **Add Recipients**: Use the "Add Recipient" section to add new email addresses
4. **Set Primary Recipient**: Mark one recipient as primary (will be listed first)
5. **Update Email Subject**: Customize the email subject line for each form
6. **Enable/Disable**: Toggle form active status

### Adding New Forms

To add a new form to the system:

1. **Create Form Configuration**:
   ```javascript
   // Add to scripts/seed-form-configurations.js
   {
     formName: 'new-form-name',
     displayName: 'New Form Display Name',
     description: 'Description of the form',
     isActive: true,
     emailConfig: {
       subject: 'New Form Subject - {variable}',
       fromName: 'Spectrum 4 New Form',
       template: 'new-form'
     },
     recipients: [
       { email: 'admin@spectrum4.ca', name: 'Admin', isPrimary: true, isActive: true }
     ]
   }
   ```

2. **Add Email Template**:
   ```javascript
   // Add to server/utils/dynamicEmailService.js
   'new-form-name': (data) => {
     return {
       subject: `New Form Subject - ${data.variable}`,
       html: `<h2>New Form Submission</h2>...`
     };
   }
   ```

3. **Update Form Submission**:
   ```javascript
   // In your form submission handler
   const { sendDynamicFormEmail } = require('./utils/dynamicEmailService');
   await sendDynamicFormEmail('new-form-name', formData);
   ```

## Technical Details

### Database Schema

```prisma
model FormConfiguration {
  id          String   @id @default(cuid())
  formName    String   @unique
  displayName String
  description String?
  isActive    Boolean  @default(true)
  emailConfig Json     // { subject, fromName, template }
  recipients  FormEmailRecipient[]
}

model FormEmailRecipient {
  id                String   @id @default(cuid())
  formConfigId      String
  email             String
  name              String?
  isActive          Boolean  @default(true)
  isPrimary         Boolean  @default(false)
  formConfiguration FormConfiguration @relation(fields: [formConfigId], references: [id], onDelete: Cascade)
}
```

### Email Service Architecture

The system uses a layered approach for email sending:

1. **Dynamic Service**: Primary method using database configuration
2. **Fallback Service**: Backup method using hardcoded emails
3. **Template Engine**: Centralized email template management

### API Response Format

```json
{
  "id": "form-config-id",
  "formName": "scooter-registration",
  "displayName": "E-Scooter Registration",
  "description": "Registration form for e-scooter storage",
  "isActive": true,
  "emailConfig": {
    "subject": "New E-Scooter Registration - Unit {unitNumber}",
    "fromName": "Spectrum 4 E-Scooter Registration",
    "template": "scooter-registration"
  },
  "recipients": [
    {
      "id": "recipient-id",
      "email": "dcook@spectrum4.ca",
      "name": "David Cook",
      "isActive": true,
      "isPrimary": true
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check SMTP configuration and database connectivity
2. **Form not found**: Ensure form name matches exactly in database
3. **Recipients not updating**: Verify database connection and API response
4. **Template errors**: Check email template syntax in dynamicEmailService.js

### Debug Steps

1. Check server logs for email sending errors
2. Verify form configuration in database
3. Test API endpoints directly
4. Check SMTP configuration

### Fallback Behavior

If the dynamic email service fails, the system will:
1. Log the error
2. Attempt to use the fallback service
3. Continue form processing even if email fails
4. Notify administrators of email failures

## Future Enhancements

### Planned Features

1. **Email Templates Editor**: Visual template editor in admin interface
2. **Email Testing**: Send test emails from admin interface
3. **Email History**: Track sent emails and delivery status
4. **Bulk Operations**: Update multiple forms at once
5. **Form Analytics**: Track form submission statistics
6. **Custom Variables**: Support for dynamic email content variables

### Technical Improvements

1. **Email Queue**: Background job processing for email sending
2. **Email Validation**: Real-time email address validation
3. **Template Variables**: Dynamic content substitution
4. **Email Scheduling**: Delayed email sending
5. **Multi-language Support**: Internationalized email templates

## Support

For issues or questions about the Form Management System:

1. Check the server logs for error messages
2. Verify database connectivity
3. Test API endpoints manually
4. Review email template syntax
5. Contact the development team

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
