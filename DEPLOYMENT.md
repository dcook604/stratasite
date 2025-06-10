# Deployment Guide for Coolify

This project has been successfully migrated from Supabase to SQLite and is ready for deployment on Coolify.

## Migration Summary

- ✅ **Database**: Migrated from Supabase to SQLite with Prisma ORM
- ✅ **Authentication**: Updated admin login to use SQLite
- ✅ **Dependencies**: Removed Supabase, added Prisma + SQLite
- ✅ **Containerization**: Added Dockerfile for easy deployment

## Database Setup

The project now uses:
- **SQLite** database (file-based, no separate database server needed)
- **Prisma ORM** for database operations
- **bcryptjs** for password hashing

## Default Admin Credentials

```
Email: admin@example.com
Password: admin123
```

## Deployment on Coolify

1. **Create New Project** in Coolify
2. **Connect Git Repository** (this repository)
3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: `3331`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=file:/app/data/database.db
   ```
5. **Deploy**: Coolify will automatically build and deploy using the Dockerfile

## Manual Deployment Commands

If deploying manually:

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Create database and tables
npm run db:push

# Seed with default admin user
npm run db:seed

# Build application
npm run build

# Start production server
npm start
```

## Database Management

- **View Database**: `npm run db:studio` (opens Prisma Studio on port 5555)
- **Create Admin User**: `npm run db:seed`
- **Update Schema**: `npm run db:push`

## File Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── lib/
│   │   ├── database.ts        # Prisma client setup
│   │   └── auth.ts           # Authentication functions
│   └── context/
│       └── AdminAuthContext.tsx  # Updated auth context
├── scripts/
│   └── seed.ts               # Database seeding script
├── Dockerfile                # Container configuration
└── DEPLOYMENT.md            # This file
```

## Features

- **Admin Authentication**: Secure login system with hashed passwords
- **Responsive Design**: Works on all devices
- **Production Ready**: Optimized build with proper error handling
- **Database Persistence**: SQLite database survives container restarts when properly mounted

## Next Steps

After deployment, you can:
1. Access the admin dashboard at `/admin/login`
2. Login with the default credentials
3. Change the admin password through database management
4. Add more admin users via Prisma Studio or custom scripts