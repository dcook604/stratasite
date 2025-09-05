# Form Management System - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Database Changes
- [x] Added `FormConfiguration` model to Prisma schema
- [x] Added `FormEmailRecipient` model to Prisma schema
- [x] Created migration script (`scripts/setup-form-management.js`)
- [x] Created seed script for initial form configurations

### ✅ Backend Changes
- [x] Added API endpoints for form configuration management
- [x] Created dynamic email service (`server/utils/dynamicEmailService.js`)
- [x] Updated all existing email functions to use dynamic service
- [x] Added fallback mechanism for email sending
- [x] Updated package.json with setup script

### ✅ Frontend Changes
- [x] Created FormManagement component
- [x] Added Form Management tab to Admin Dashboard
- [x] Added Settings icon import
- [x] Implemented form configuration UI

### ✅ Documentation
- [x] Created comprehensive README for form management
- [x] Added setup instructions
- [x] Documented API endpoints
- [x] Created troubleshooting guide

## Deployment Steps

### 1. Database Migration (Run on Server)

```bash
# SSH into your server or run via Coolify terminal
cd /path/to/your/project

# Run the setup script
npm run setup:forms
```

This will:
- Generate Prisma client
- Push schema to database
- Seed form configurations with current email addresses

### 2. Verify Database Changes

Check that the new tables were created:

```sql
-- Check if tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('form_configurations', 'form_email_recipients');

-- Check if data was seeded
SELECT COUNT(*) FROM form_configurations;
SELECT COUNT(*) FROM form_email_recipients;
```

### 3. Test API Endpoints

Test the new API endpoints:

```bash
# Test form configurations endpoint
curl -X GET http://your-domain.com/api/form-configurations

# Test specific form configuration
curl -X GET http://your-domain.com/api/form-configurations/scooter-registration
```

### 4. Test Admin Interface

1. Log in to admin dashboard
2. Navigate to "Form Management" tab
3. Verify all forms are displayed
4. Test editing a form configuration
5. Test adding/removing recipients

### 5. Test Form Submissions

Test each form to ensure emails are sent:

1. **E-Scooter Registration**: Submit a test registration
2. **AC Inquiry**: Submit a test inquiry
3. **Storage Rental**: Submit a test interest form
4. **Emergency Contact**: Submit a test contact form
5. **Pet Registration**: Submit a test pet registration

### 6. Verify Email Delivery

Check that emails are being sent to the configured recipients:
- Check email inboxes for test submissions
- Verify email content and formatting
- Confirm all recipients are receiving emails

## Post-Deployment Verification

### ✅ Functionality Tests
- [ ] All forms submit successfully
- [ ] Emails are sent to configured recipients
- [ ] Admin interface loads and functions correctly
- [ ] Form configurations can be edited
- [ ] Recipients can be added/removed
- [ ] Email subjects can be customized

### ✅ Performance Tests
- [ ] Form submissions complete within 5 seconds
- [ ] Admin interface loads within 3 seconds
- [ ] Database queries perform efficiently
- [ ] No memory leaks or performance issues

### ✅ Error Handling
- [ ] Graceful fallback when database is unavailable
- [ ] Proper error messages for invalid configurations
- [ ] Email sending continues even if one recipient fails
- [ ] Admin interface handles network errors gracefully

## Rollback Plan

If issues are encountered:

### 1. Immediate Rollback
```bash
# Revert to previous git commit
git reset --hard HEAD~1

# Restart server
pm2 restart your-app-name
```

### 2. Database Rollback
```sql
-- Remove new tables (if needed)
DROP TABLE IF EXISTS form_email_recipients;
DROP TABLE IF EXISTS form_configurations;
```

### 3. Verify Rollback
- Test form submissions work with original hardcoded emails
- Verify admin dashboard functions normally
- Check that no errors are present in logs

## Monitoring

### Key Metrics to Monitor

1. **Email Delivery Rate**: Track successful email sends
2. **Form Submission Rate**: Monitor form completion rates
3. **API Response Times**: Ensure endpoints respond quickly
4. **Error Rates**: Track failed form submissions
5. **Database Performance**: Monitor query execution times

### Log Monitoring

Watch for these log messages:
- `Dynamic email sent successfully for form: {formName}`
- `Dynamic email service failed, using fallback`
- `Form configuration updated successfully`
- `Failed to send {formName} email`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL environment variable
   - Verify database server is running
   - Check network connectivity

2. **Email Sending Failures**
   - Verify SMTP configuration
   - Check email server connectivity
   - Review email templates for syntax errors

3. **Admin Interface Issues**
   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible
   - Check network connectivity

4. **Form Submission Failures**
   - Check server logs for errors
   - Verify form validation
   - Test API endpoints directly

### Support Contacts

- **Development Team**: [Your contact info]
- **System Administrator**: [Admin contact info]
- **Emergency Contact**: [Emergency contact info]

## Success Criteria

The deployment is considered successful when:

1. ✅ All existing forms continue to work normally
2. ✅ Emails are sent to the correct recipients
3. ✅ Admin can manage form configurations through the interface
4. ✅ New forms can be added easily
5. ✅ System performance is maintained or improved
6. ✅ No critical errors in logs
7. ✅ All tests pass

---

**Deployment Date**: [To be filled]  
**Deployed By**: [To be filled]  
**Status**: Ready for Deployment ✅
