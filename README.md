# Spectrum 4 Strata Council Website

A comprehensive web application for the Spectrum 4 strata council, providing residents with essential information, community features, and administrative tools.

## 🌐 Live Site

**Production**: [https://spectrum4.ca](https://spectrum4.ca)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: bcryptjs + session management
- **File Uploads**: Multer + Sharp image processing
- **Deployment**: Coolify with Docker

## ✨ Features

### Public Features
- **Homepage**: Dynamic content management with admin editing
- **Information Hub**: Recycling, organics, fees, and renovation guidelines
- **Marketplace**: Buy/sell platform with image uploads and reCAPTCHA protection
- **Events & Announcements**: Community calendar and news
- **Bylaws**: Document management and display
- **Contact**: Council information and building details
- **Gallery**: Photo sharing capabilities

### Admin Features
- **Dashboard**: Comprehensive content management system
- **WYSIWYG Editing**: Inline page editing with ReactQuill
- **User Management**: Admin account creation and management
- **Marketplace Moderation**: Content oversight and cleanup tools
- **Database Cleanup**: Automated maintenance with dry-run preview
- **Real-time Statistics**: Activity monitoring and reporting

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Image Optimization**: Automatic compression and format conversion
- **Security**: Input validation, CAPTCHA protection, and secure file uploads
- **Performance**: Optimized builds with asset organization
- **SEO**: Proper meta tags and canonical URLs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd strata-compass-web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other settings

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
./start-dev.sh       # Safe development startup script
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Navbar, Footer
│   ├── hoc/          # Higher-order components
│   └── widgets/      # Reusable widgets
├── pages/
│   ├── information/  # Information pages
│   ├── AdminDashboard.tsx
│   ├── Index.tsx     # Homepage
│   └── DynamicPage.tsx
├── context/          # React contexts
├── utils/            # Utility functions
└── hooks/            # Custom hooks

server/
├── api/              # API routes
└── uploads/          # File uploads

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

## 🗃️ Database Models

Key entities include:
- **Pages**: Content management for static pages
- **MarketplacePost**: Community marketplace items
- **MarketplaceReply**: Threaded conversations
- **AdminUser**: Administrative access
- **Announcement**: News and updates
- **Event**: Community calendar

See `prisma/schema.prisma` for complete schema definitions.

## 🔧 Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
NODE_ENV=production
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

### reCAPTCHA Setup

1. Get keys from [Google reCAPTCHA](https://www.google.com/recaptcha/)
2. Add site key to frontend components
3. Add secret key to environment variables

## 🚀 Deployment

### Using Coolify (Current)

The project auto-deploys via Git integration with Coolify:

1. Push changes to main branch
2. Coolify automatically builds and deploys
3. Environment variables managed in Coolify dashboard

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🔒 Admin Access

### Creating Admin Users

```bash
# Use the admin dashboard or direct database access
# Default admin (if seeded): admin@spectrum4.ca
```

### Admin Features

- Content management for all pages
- Marketplace moderation
- User management
- Database maintenance tools
- Real-time statistics

## 🛠️ Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Functional components with hooks
- Consistent error handling with toast notifications
- Mobile-first responsive design

### Component Patterns
- Use shadcn/ui components for consistency
- Implement proper loading states
- Follow established naming conventions
- Add proper TypeScript interfaces

### API Patterns
- RESTful endpoints in `/api` routes
- Consistent error responses
- Input validation with Zod
- Proper HTTP status codes

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
- Check import paths and component exports
- Verify TypeScript types are correct
- Ensure all dependencies are installed

**Database Issues**
- Verify DATABASE_URL is correct
- Run `npm run db:generate` after schema changes
- Check database connectivity

**Image Upload Problems**
- Verify upload directory permissions
- Check file size limits (5MB max)
- Ensure Sharp is properly installed

## 📚 Documentation

- `.cursorrules` - Comprehensive development guide
- `DEPLOYMENT.md` - Deployment procedures
- `PRODUCTION_FIX_SUMMARY.md` - Issue tracking
- `DOMAIN_SETUP.md` - Domain configuration

## 🤝 Contributing

1. Follow the patterns established in `.cursorrules`
2. Test all changes locally before pushing
3. Ensure responsive design works on mobile
4. Add proper error handling and loading states
5. Update documentation for significant changes

## 📄 License

This project is proprietary software for Spectrum 4 Strata Council.

## 📞 Support

For technical issues or questions:
- Check the troubleshooting section above
- Review existing documentation
- Contact the development team

---

**Building Information**  
**Spectrum 4 Council**  
602 Citadel Parade, Vancouver, BC V6B 1X2  
Council@spectrum4.ca
