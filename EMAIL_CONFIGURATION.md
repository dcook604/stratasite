# Email Configuration Guide

## Current Issue Fixed

The email sending was failing due to a **TLS certificate hostname mismatch**:
- **Problem**: Using IP `10.0.0.1` to connect to a server with certificate for `mail.spectrum4.ca`
- **Solution**: Use proper hostname in SMTP configuration

## Recommended Environment Variables

Set these environment variables in your Coolify deployment:

```bash
# Use the proper hostname instead of IP address
SMTP_HOST=mail.spectrum4.ca
SMTP_PORT=587
SMTP_USER=your-email-username
SMTP_PASS=your-email-password
```

## Alternative Configurations

### Option 1: Use Hostname (Recommended)
```bash
SMTP_HOST=mail.spectrum4.ca
SMTP_PORT=587
# TLS will validate certificate properly
```

### Option 2: Use IP with Disabled TLS Validation (Less Secure)
```bash
SMTP_HOST=10.0.0.1
SMTP_PORT=587
# Code will automatically disable certificate validation for IP addresses
```

### Option 3: Different SMTP Provider
```bash
# Example with Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password

# Example with SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Code Changes Made

1. **server.js**: Updated SMTP configuration to use hostname by default
2. **dynamicEmailService.js**: Aligned with main server configuration
3. **test-smtp.js**: Updated test script with same logic

### Smart TLS Handling
The code now automatically:
- Uses proper certificate validation for hostnames
- Disables validation only for IP addresses (10.0.0.1, localhost)
- Sets correct `servername` for TLS SNI

## Testing Email Configuration

Run the test script to verify your settings:

```bash
node test-smtp.js
```

## Troubleshooting

### Common Issues

1. **Certificate Errors**
   - Solution: Use hostname instead of IP address
   - Alternative: Ensure your mail server has proper SSL certificates

2. **Authentication Failures**
   - Check SMTP_USER and SMTP_PASS values
   - Ensure the email account allows SMTP access
   - Some providers require app-specific passwords

3. **Connection Timeouts**
   - Verify SMTP_HOST and SMTP_PORT are correct
   - Check firewall settings
   - Ensure the mail server is accessible from your VPS

4. **Port Issues**
   - Port 587: STARTTLS (recommended)
   - Port 465: SSL/TLS (legacy but still used)
   - Port 25: Usually blocked by hosting providers

### Debug Steps

1. **Check Environment Variables**
   ```bash
   echo $SMTP_HOST
   echo $SMTP_PORT
   echo $SMTP_USER
   ```

2. **Test Connection**
   ```bash
   telnet mail.spectrum4.ca 587
   # Should connect successfully
   ```

3. **Check DNS Resolution**
   ```bash
   nslookup mail.spectrum4.ca
   # Should resolve to your mail server IP
   ```

## Deployment Instructions

1. **Update Coolify Environment Variables**
   - Go to your Coolify project settings
   - Update environment variables
   - Redeploy the application

2. **Verify Changes**
   - Check server logs for SMTP connection success
   - Test form submission (scooter registration)
   - Confirm email delivery

## Security Best Practices

1. **Use Environment Variables**: Never hardcode credentials
2. **App Passwords**: Use app-specific passwords when available
3. **TLS Encryption**: Always use encrypted connections (port 587 or 465)
4. **Monitor Logs**: Watch for authentication failures or security alerts

## Support

If email still doesn't work after these changes:
1. Check your mail server logs
2. Verify DNS records for mail.spectrum4.ca
3. Ensure firewall allows outbound SMTP connections
4. Consider using a third-party email service (SendGrid, Mailgun, etc.)
