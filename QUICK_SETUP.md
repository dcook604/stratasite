# 🚀 Quick Coolify Setup

## Repository Details
- **URL**: `https://github.com/dcook604/stratasite`
- **Branch**: `main`
- **Build**: Dockerfile (auto-detected)

## Application Configuration
```
Name: stratasite
Port: 3331
Build Pack: dockerfile
```

## Environment Variables
```
NODE_ENV=production
DATABASE_URL=file:/app/data/database.db
```

## Volume Mount (Critical!)
```
Source: /app/data
Destination: /app/data
Type: volume
```

## After Deployment
- **Admin Login**: `your-domain.com/admin/login`
- **Email**: `admin@example.com`
- **Password**: `admin123`

## ✅ Your project includes:
- SQLite database (no external DB needed)
- Automatic admin user creation
- Docker configuration
- Persistent data storage