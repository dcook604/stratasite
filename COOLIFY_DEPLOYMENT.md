# 🚀 Coolify Deployment Guide

Since you have Coolify running, here's the step-by-step guide to deploy your Strata site:

## 📋 Quick Deployment Steps

### 1. Access Coolify Dashboard
Open: `http://localhost:8000` (or your Coolify domain)

### 2. Create New Application
1. Click **"+ New Resource"** or **"Add Resource"**
2. Select **"Application"**
3. Choose **"Public Repository"**

### 3. Repository Configuration
```
Repository URL: https://github.com/dcook604/stratasite
Branch: main
Build Pack: dockerfile (auto-detected)
```

### 4. Application Settings
```
Name: stratasite
Port: 3331
Dockerfile Path: ./Dockerfile
```

### 5. Environment Variables
Add these in the Environment section:
```
NODE_ENV=production
DATABASE_URL=file:/app/data/database.db
```

### 6. Volume Configuration (IMPORTANT!)
To persist your SQLite database:
```
Source: /app/data
Destination: /app/data
Type: volume
```

### 7. Deploy
Click **"Deploy"** - Coolify will:
- Clone your repository
- Build the Docker image
- Create the database
- Seed the admin user
- Start the application

## 🔑 After Deployment

Once deployed, you'll be able to access:
- **Main Site**: `https://your-coolify-domain.com`
- **Admin Login**: `https://your-coolify-domain.com/admin/login`
- **Credentials**: `admin@example.com` / `admin123`

## 🐛 Troubleshooting

If deployment fails:
1. Check build logs in Coolify dashboard
2. Ensure port 3331 is configured
3. Verify environment variables are set
4. Check that volume is properly mounted for database persistence

## 📦 What's Included

Your repository now contains:
- ✅ SQLite database (no external DB needed)
- ✅ Dockerfile for containerization
- ✅ Automatic database seeding
- ✅ Admin authentication system
- ✅ Persistent data storage

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Trigger redeploy in Coolify dashboard
3. Or set up automatic deployments on git push