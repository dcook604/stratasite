# 🌐 Domain Setup for www.spectrum4.ca

## Current Status
- ✅ DNS configured: `www.spectrum4.ca` → `38.102.125.145`
- ✅ Application created in Coolify: `sgwoo8koso8cgsgskkc8k4os`
- ✅ Repository connected: `https://github.com/dcook604/stratasite`

## Configuration Steps

### 1. In Coolify Dashboard
Navigate to: `http://localhost:8000` → Website → stratasite

### 2. Domain Configuration
```
Domains: www.spectrum4.ca
Port: 3331
SSL: Enable Let's Encrypt
```

### 3. Environment Variables
```
NODE_ENV=production
DATABASE_URL=file:/app/data/database.db
```

### 4. Volume Mount
```
Source: /app/data
Destination: /app/data
Type: volume
```

### 5. Deploy
Click "Deploy" button

## Expected Result
- **Main Site**: https://www.spectrum4.ca
- **Admin Panel**: https://www.spectrum4.ca/admin/login
- **Credentials**: admin@example.com / admin123

## Troubleshooting
- **502 Error**: Check if application is running and port 3331 is correct
- **SSL Issues**: Wait 2-3 minutes for Let's Encrypt certificate generation
- **Build Fails**: Check build logs in Coolify dashboard

## Monitoring
- Check deployment logs in Coolify dashboard
- Monitor application health at the configured domain
- SSL certificate will auto-renew