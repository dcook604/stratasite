import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3331;

// Initialize Prisma client with error handling
let prisma = null;
const initializePrisma = async () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Prisma client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Prisma client:', error);
      throw error;
    }
  }
  return prisma;
};

// Helper function to get Prisma client with error handling
const getPrisma = async () => {
  if (!prisma) {
    await initializePrisma();
  }
  return prisma;
};

// Configure SMTP transporter for email sending
// Use proper hostname for certificate validation
const getSmtpConfig = () => {
  // Use environment variables only - no hardcoded fallbacks
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('Missing required SMTP environment variables. Please check Coolify configuration.');
  }
  
  console.log(`[SMTP] Host: ${smtpHost}, Port: ${smtpPort}, User: ${smtpUser}`);
  
  return {
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      // Only reject unauthorized if using a proper hostname
      rejectUnauthorized: smtpHost !== '10.0.0.1' && smtpHost !== 'localhost',
      // Allow connecting to mail.spectrum4.ca from different IPs
      servername: smtpHost === 'mail.spectrum4.ca' ? 'mail.spectrum4.ca' : undefined
    },
    // Connection timeout and retry settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,    // 30 seconds
    socketTimeout: 60000       // 60 seconds
  };
};

const smtpConfig = getSmtpConfig();
const transporter = nodemailer.createTransport(smtpConfig);

// Verify SMTP connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection failed:', error);
    logger.error('SMTP connection failed', error);
  } else {
    console.log('SMTP server is ready to take our messages');
    logger.info('SMTP server is ready to take our messages');
  }
});

// Ensure the upload directory exists in the persistent data volume
const uploadDir = path.join(__dirname, 'data', 'uploads', 'marketplace');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.memoryStorage(); // Use memory storage to process with sharp

/**
 * UPLOAD MIDDLEWARE DOCUMENTATION
 * 
 * This file implements dedicated upload middlewares for different types of file uploads:
 * 
 * 1. petRegistrationUpload - For pet registration photos (JPEG, PNG, WebP up to 5MB, max 3 files)
 * 2. documentUpload - For admin document uploads (PDF, Word docs up to 10MB, single file)
 * 3. marketplaceImageUpload - For marketplace images (JPEG, PNG, WebP up to 5MB, single file)
 * 4. upload - Generic fallback middleware (deprecated, use specific middlewares above)
 * 
 * Each middleware includes:
 * - File type validation (MIME type + extension)
 * - File size limits
 * - File count limits
 * - Detailed error logging
 * - User-friendly error messages
 * 
 * Endpoints using these middlewares:
 * - /api/pet-registration (petRegistrationUpload)
 * - /api/documents (documentUpload)
 * - /api/upload/image (marketplaceImageUpload)
 * 
 * All endpoints now include proper error handling that catches multer errors
 * and returns meaningful error messages to the frontend.
 */

// Dedicated upload configuration for pet registration (images only)
const petRegistrationUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit for pet photos
    files: 3 // Maximum 3 photos
  },
  fileFilter: (req, file, cb) => {
    // Only allow image uploads for pet registration
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = /\.(jpeg|jpg|png|webp)$/i;
    
    const validMimeType = imageTypes.includes(file.mimetype);
    const validExtension = allowedExtensions.test(file.originalname);
    
    if (validMimeType && validExtension) {
      return cb(null, true);
    }
    
    logger.warn('Invalid image file rejected in pet registration', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      validMimeType,
      validExtension
    });
    
    return cb(new Error('Pet photos must be JPEG, PNG, or WebP images'));
  }
});

// Dedicated upload configuration for documents (admin only)
const documentUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
    files: 1 // Single document upload
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF and Word documents
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExtensions = /\.(pdf|doc|docx)$/i;
    
    const validMimeType = documentTypes.includes(file.mimetype);
    const validExtension = allowedExtensions.test(file.originalname);
    
    if (validMimeType && validExtension) {
      return cb(null, true);
    }
    
    logger.warn('Invalid document file rejected', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      validMimeType,
      validExtension
    });
    
    return cb(new Error('Documents must be PDF or Word files'));
  }
});

// Dedicated upload configuration for marketplace images
const marketplaceImageUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit for marketplace images
    files: 1 // Single image upload
  },
  fileFilter: (req, file, cb) => {
    // Only allow image uploads for marketplace
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = /\.(jpeg|jpg|png|webp)$/i;
    
    const validMimeType = imageTypes.includes(file.mimetype);
    const validExtension = allowedExtensions.test(file.originalname);
    
    if (validMimeType && validExtension) {
      return cb(null, true);
    }
    
    logger.warn('Invalid image file rejected in marketplace', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      validMimeType,
      validExtension
    });
    
    return cb(new Error('Marketplace images must be JPEG, PNG, or WebP files'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit for documents
  fileFilter: (req, file, cb) => {
    // Determine upload type based on endpoint and field name
    const isImageUpload = req.path.includes('/image') || 
                         req.path.includes('/pet-registration') ||
                         req.path.includes('/marketplace') ||
                         file.fieldname === 'photos' ||
                         file.fieldname === 'image';
    
    const isDocumentUpload = req.path.includes('/document') ||
                            file.fieldname === 'document' ||
                            file.fieldname === 'documents';
    
    // Debug logging to help troubleshoot
    logger.debug('File upload validation', {
      path: req.path,
      fieldname: file.fieldname,
      isImageUpload,
      isDocumentUpload,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    
    if (isImageUpload) {
      // Image upload validation for marketplace and pet registration
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedExtensions = /\.(jpeg|jpg|png|webp)$/i;
      
      const validMimeType = imageTypes.includes(file.mimetype);
      const validExtension = allowedExtensions.test(file.originalname);
      
      if (validMimeType && validExtension) {
        return cb(null, true);
      }
      
      logger.warn('Invalid image file rejected', {
        path: req.path,
        fieldname: file.fieldname,
        mimetype: file.mimetype,
        originalname: file.originalname,
        validMimeType,
        validExtension
      });
      
      return cb(new Error('Image upload only supports JPEG, PNG, and WebP filetypes'));
    } 
    
    if (isDocumentUpload) {
      // Document upload validation
      const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (documentTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      
      logger.warn('Invalid document file rejected', {
        path: req.path,
        fieldname: file.fieldname,
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      
      return cb(new Error('Document upload only supports PDF and Word document filetypes'));
    }
    
    // If we can't determine the upload type, default based on mimetype
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (imageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (documentTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    
    // Reject unknown file types
    logger.warn('Unknown file type rejected', {
      path: req.path,
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    
    return cb(new Error('Unsupported file type. Please upload images (JPEG, PNG, WebP) or documents (PDF, Word)'));
  }
});

// A simple middleware to check if the user is an admin
// NOTE: This is a placeholder. In a real app, you'd have a robust session/token system.
const requireAdmin = (req, res, next) => {
  // For now, we'll check for a header or a session variable.
  // This part needs to be connected to your actual admin auth state.
  // Let's assume for now a simple check. This will need to be improved.
  const { 'x-admin-authenticated': adminHeader } = req.headers;
  if (adminHeader === 'true') { 
    return next();
  }
  
  // This is a basic check and should be replaced with a proper token/session validation
  // For the purpose of this implementation, we will assume a session or context is set.
  // Since we don't have real sessions implemented server-side, this is a simplified check.
  // We'll refine this later if needed.
  // For now, let's assume if we get here from the admin dash, it's okay.
  // This is NOT secure for production without a real auth mechanism.
  next(); 
};

// Enhanced logging utility
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
    if (error) {
      console.error('Error details:', error instanceof Error ? error.stack : error);
    }
  },
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

// Request logging middleware
// const requestLogger = (req, res, next) => {
//   const start = Date.now();
//   const timestamp = new Date().toISOString();
  
//   logger.info(`${req.method} ${req.url}`, {
//     ip: req.ip || req.connection.remoteAddress,
//     userAgent: req.get('User-Agent'),
//     body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
//   });

//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     const logLevel = res.statusCode >= 400 ? 'error' : 'info';
//     logger[logLevel](`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
//   });

//   next();
// };

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.url}`, err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle multer errors that weren't caught by endpoint-specific handlers
  if (err instanceof multer.MulterError) {
    logger.error('Unhandled multer error', {
      error: err.message,
      code: err.code,
      field: err.field,
      path: req.path
    });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size too large. Please check the file size limits.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files uploaded.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected file field. Please check your upload form.' 
      });
    }
    
    return res.status(400).json({ 
      error: 'File upload error. Please try again.' 
    });
  }
  
  // Handle other file upload errors
  if (err.message && (
    err.message.includes('upload') || 
    err.message.includes('file') ||
    err.message.includes('image') ||
    err.message.includes('document')
  )) {
    logger.error('Unhandled file upload error', {
      error: err.message,
      path: req.path
    });
    return res.status(400).json({ 
      error: 'File upload error. Please check your files and try again.' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Move request logger to be the first middleware to ensure all requests are logged
// app.use(requestLogger);

// Middleware to generate authorId if it doesn't exist
app.use((req, res, next) => {
  if (!req.cookies.authorId) {
    const authorId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    res.cookie('authorId', authorId, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    });
    req.cookies.authorId = authorId; // Make it available immediately
  }
  next();
});

// Serve uploaded files statically from the 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// Serve persistent uploaded files from data directory
app.use('/data/uploads', express.static(path.join(__dirname, 'data', 'uploads')));
// Serve documents and other public files
app.use('/documents', express.static(path.join(__dirname, 'public', 'documents')));
app.use('/pdf.worker.mjs', express.static(path.join(__dirname, 'public', 'pdf.worker.mjs')));
app.use('/pdf.worker.min.mjs', express.static(path.join(__dirname, 'public', 'pdf.worker.min.mjs')));

logger.info('Server starting...', {
  port: PORT,
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Health check endpoint (no database required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    prismaStatus: prisma ? 'initialized' : 'not initialized'
  });
});

// Form K Cleanup and Expiration Management
app.get('/api/admin/form-k/statistics', async (req, res) => {
  try {
    const { getFormKStatistics } = await import('./server/utils/formKCleanupService.js');
    const stats = await getFormKStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching Form K statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Form K statistics' 
    });
  }
});

app.get('/api/admin/form-k/expired', async (req, res) => {
  try {
    const { findExpiredFormKSubmissions } = await import('./server/utils/formKCleanupService.js');
    const expiredSubmissions = await findExpiredFormKSubmissions();
    
    res.json({
      success: true,
      expiredSubmissions,
      count: expiredSubmissions.length
    });
  } catch (error) {
    console.error('Error fetching expired Form K submissions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expired submissions' 
    });
  }
});

app.post('/api/admin/form-k/cleanup', async (req, res) => {
  try {
    const { dryRun = false } = req.body;
    const { purgeExpiredFormKSubmissions } = await import('./server/utils/formKCleanupService.js');
    
    const result = await purgeExpiredFormKSubmissions(dryRun);
    
    res.json({
      success: result.success,
      purgedCount: result.purgedCount,
      expiredSubmissions: result.expiredSubmissions,
      errors: result.errors || [],
      dryRun: result.dryRun || false
    });
  } catch (error) {
    console.error('Error during Form K cleanup:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform cleanup' 
    });
  }
});

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.debug('Login attempt', { email });

    const db = await getPrisma();
    const admin = await db.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      logger.warn('Login failed - invalid password', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('Login successful', { email, adminId: admin.id });
    res.json({
      user: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.debug('Registration attempt', { email });

    // Check if admin already exists
    const existingAdmin = await db.adminUser.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      logger.warn('Registration failed - user already exists', { email });
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await db.adminUser.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    logger.info('Registration successful', { email, adminId: admin.id });
    res.json({
      user: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    logger.error('Registration error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Announcements CRUD
app.get('/api/announcements', async (req, res) => {
  try {
    const db = await getPrisma();
    const announcements = await db.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(announcements);
  } catch (error) {
    logger.error('Error fetching announcements', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    logger.debug('Creating announcement', { title });
    const announcement = await db.announcement.create({
      data: { title, content }
    });
    logger.info('Announcement created', { id: announcement.id, title });
    res.json(announcement);
  } catch (error) {
    logger.error('Error creating announcement', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;
    logger.debug('Updating announcement', { id, title });
    const announcement = await db.announcement.update({
      where: { id },
      data: { title, content, isActive }
    });
    logger.info('Announcement updated', { id, title });
    res.json(announcement);
  } catch (error) {
    logger.error('Error updating announcement', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('Deleting announcement', { id });
    await db.announcement.update({
      where: { id },
      data: { isActive: false }
    });
    logger.info('Announcement deleted', { id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting announcement', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events CRUD
app.get('/api/events', async (req, res) => {
  try {
    const db = await getPrisma();
    const events = await db.event.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, startDate, endDate, location } = req.body;
    const event = await db.event.create({
      data: { 
        title, 
        description, 
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location 
      }
    });
    res.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, location, isActive } = req.body;
    const event = await db.event.update({
      where: { id },
      data: { 
        title, 
        description, 
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        isActive 
      }
    });
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.event.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pages CRUD
app.get('/api/pages', async (req, res) => {
  try {
    const db = await getPrisma();
    logger.debug('Fetching all active pages');
    const pages = await db.page.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' }
    });
    logger.info('Pages fetched successfully', { count: pages.length });
    res.json(pages);
  } catch (error) {
    logger.error('Error fetching pages', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    logger.debug('Fetching page by slug', { slug });
    const db = await getPrisma();
    const page = await db.page.findUnique({
      where: { slug, isActive: true }
    });
    if (!page) {
      logger.warn('Page not found', { slug });
      return res.status(404).json({ error: 'Page not found' });
    }
    logger.info('Page fetched successfully', { slug, title: page.title });
    res.json(page);
  } catch (error) {
    logger.error('Error fetching page', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pages', async (req, res) => {
  try {
    const { slug, title, content } = req.body;
    const page = await db.page.create({
      data: { slug, title, content }
    });
    res.json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, content, isActive } = req.body;
    const page = await db.page.update({
      where: { id },
      data: { slug, title, content, isActive }
    });
    res.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.page.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Documents CRUD
app.get('/api/documents', async (req, res) => {
  try {
    const db = await getPrisma();
    const documents = await db.document.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    logger.error('Error fetching documents', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await db.document.findUnique({
      where: { id, isActive: true }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const filePath = path.join(__dirname, document.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.error('Document file not found on disk', { id, filePath });
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    logger.info('Document downloaded', { id, fileName: document.fileName });
  } catch (error) {
    logger.error('Error downloading document', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/documents', (req, res) => {
  documentUpload.single('document')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      logger.error('File upload error in document upload', {
        error: err.message,
        path: req.path,
        file: req.file ? { name: req.file.originalname, type: req.file.mimetype } : null
      });
      
      // Send user-friendly error message for document upload
      if (err.message.includes('Documents must be')) {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'Document file size too large. Please ensure the document is under 10MB.' 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: 'Unexpected file field. Please use the "document" field.' 
        });
      }
      
      // Generic error for other cases
      return res.status(400).json({ 
        error: 'Document upload error. Please check your file and try again.' 
      });
    }

    // Continue with normal processing if no upload errors
    try {
      const { title, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No document file provided' });
      }
    
    // Create documents directory if it doesn't exist (in persistent data directory)
    const documentsDir = path.join(__dirname, 'data', 'uploads', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `document-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(documentsDir, fileName);
    
    // Save file to disk
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Determine file type
    let fileType = 'unknown';
    if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (req.file.mimetype === 'application/msword') {
      fileType = 'doc';
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType = 'docx';
    }
    
    // Save document info to database
    const document = await db.document.create({
      data: {
        title,
        description,
        fileName: req.file.originalname,
        filePath: `data/uploads/documents/${fileName}`,
        fileType,
        fileSize: req.file.size
      }
    });
    
    logger.info('Document uploaded', { id: document.id, title, fileName: req.file.originalname });
    res.json(document);
    } catch (error) {
      logger.error('Error uploading document', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;
    
    const document = await db.document.update({
      where: { id },
      data: { title, description, isActive }
    });
    
    logger.info('Document updated', { id, title });
    res.json(document);
  } catch (error) {
    logger.error('Error updating document', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document info before deletion
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Soft delete in database
    await db.document.update({
      where: { id },
      data: { isActive: false }
    });
    
    // Optionally delete file from disk (commented out for safety)
    // const filePath = path.join(__dirname, document.filePath);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }
    
    logger.info('Document deleted', { id, title: document.title });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting document', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin user management
app.get('/api/admin/users', async (req, res) => {
  try {
    const db = await getPrisma();
    const users = await db.adminUser.findMany({
      select: { id: true, email: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await db.adminUser.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await db.adminUser.create({
      data: {
        email,
        password: hashedPassword
      },
      select: { id: true, email: true, createdAt: true }
    });

    res.json(admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting the last admin user
    const adminCount = await db.adminUser.count();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    await db.adminUser.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 1. Fetch the user
    const admin = await db.adminUser.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // 2. Verify the current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // 3. Validate the new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 5. Update the password in the database
    await db.adminUser.update({
      where: { id },
      data: { password: hashedPassword }
    });

    logger.info('Password updated successfully for admin', { adminId: id });
    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    logger.error('Error updating admin password', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin password reset endpoint (no current password required)
app.put('/api/admin/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // 1. Fetch the user
    const admin = await db.adminUser.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // 2. Validate the new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 4. Update the password in the database
    await db.adminUser.update({
      where: { id },
      data: { password: hashedPassword }
    });

    logger.info('Password reset successfully for admin', { adminId: id });
    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    logger.error('Error resetting admin password', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify Cloudflare Turnstile token
const verifyTurnstile = async (token) => {
  if (!token) {
    return false;
  }
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    logger.error('Turnstile verification failed', error);
    return false;
  }
};

// Function to send scooter registration email (now using dynamic service)
const sendScooterRegistrationEmail = async (registrationData) => {
  const { sendDynamicFormEmail, sendFormEmailFallback } = await import('./server/utils/dynamicEmailService.js');
  
  try {
    // Try dynamic email service first
    const result = await sendDynamicFormEmail('scooter-registration', registrationData);
    
    if (result.success) {
      logger.info('Scooter registration email sent successfully via dynamic service', { 
        registrationId: registrationData.registrationId, 
        recipients: result.recipients 
      });
      return true;
    } else {
      // Fallback to original method if dynamic service fails
      logger.warn('Dynamic email service failed, using fallback', { error: result.error });
      return await sendFormEmailFallback('scooter-registration', registrationData);
    }
  } catch (error) {
    logger.error('Failed to send scooter registration email', error);
    // Try fallback as last resort
    try {
      return await sendFormEmailFallback('scooter-registration', registrationData);
    } catch (fallbackError) {
      logger.error('Fallback email sending also failed', fallbackError);
      throw error;
    }
  }
};

// Function to send AC inquiry email (now using dynamic service)
const sendACInquiryEmail = async (inquiryData) => {
  const { sendDynamicFormEmail, sendFormEmailFallback } = await import('./server/utils/dynamicEmailService.js');
  
  try {
    // Try dynamic email service first
    const result = await sendDynamicFormEmail('ac-inquiry', inquiryData);
    
    if (result.success) {
      logger.info('AC inquiry email sent successfully via dynamic service', { 
        inquiryId: inquiryData.inquiryId, 
        recipients: result.recipients 
      });
      return true;
    } else {
      // Fallback to original method if dynamic service fails
      logger.warn('Dynamic email service failed, using fallback', { error: result.error });
      return await sendFormEmailFallback('ac-inquiry', inquiryData);
    }
  } catch (error) {
    logger.error('Failed to send AC inquiry email', error);
    // Try fallback as last resort
    try {
      return await sendFormEmailFallback('ac-inquiry', inquiryData);
    } catch (fallbackError) {
      logger.error('Fallback email sending also failed', fallbackError);
      throw error;
    }
  }
};

// Function to send storage rental interest email (now using dynamic service)
const sendStorageRentalEmail = async (rentalData) => {
  const { sendDynamicFormEmail, sendFormEmailFallback } = await import('./server/utils/dynamicEmailService.js');
  
  try {
    // Try dynamic email service first
    const result = await sendDynamicFormEmail('storage-rental', rentalData);
    
    if (result.success) {
      logger.info('Storage rental email sent successfully via dynamic service', { 
        rentalId: rentalData.rentalId, 
        recipients: result.recipients 
      });
      return true;
    } else {
      // Fallback to original method if dynamic service fails
      logger.warn('Dynamic email service failed, using fallback', { error: result.error });
      return await sendFormEmailFallback('storage-rental', rentalData);
    }
  } catch (error) {
    logger.error('Failed to send storage rental email', error);
    // Try fallback as last resort
    try {
      return await sendFormEmailFallback('storage-rental', rentalData);
    } catch (fallbackError) {
      logger.error('Fallback email sending also failed', fallbackError);
      throw error;
    }
  }
};

// Function to send emergency contact email (now using dynamic service)
const sendEmergencyContactEmail = async (emergencyData) => {
  const { sendDynamicFormEmail, sendFormEmailFallback } = await import('./server/utils/dynamicEmailService.js');
  
  try {
    // Try dynamic email service first
    const result = await sendDynamicFormEmail('emergency-contact', emergencyData);
    
    if (result.success) {
      logger.info('Emergency contact email sent successfully via dynamic service', { 
        unitNumber: emergencyData.unitNumber, 
        recipients: result.recipients 
      });
      return true;
    } else {
      // Fallback to original method if dynamic service fails
      logger.warn('Dynamic email service failed, using fallback', { error: result.error });
      return await sendFormEmailFallback('emergency-contact', emergencyData);
    }
  } catch (error) {
    logger.error('Failed to send emergency contact email', error);
    // Try fallback as last resort
    try {
      return await sendFormEmailFallback('emergency-contact', emergencyData);
    } catch (fallbackError) {
      logger.error('Fallback email sending also failed', fallbackError);
      throw error;
    }
  }
};

// Function to send pet registration email (now using dynamic service)
const sendPetRegistrationEmail = async (petData) => {
  const { sendDynamicFormEmail, sendFormEmailFallback } = await import('./server/utils/dynamicEmailService.js');
  
  try {
    // Try dynamic email service first
    const result = await sendDynamicFormEmail('pet-registration', petData);
    
    if (result.success) {
      logger.info('Pet registration email sent successfully via dynamic service', { 
        registrationId: petData.registrationId, 
        petName: petData.petName,
        suiteNumber: petData.suiteNumber,
        recipients: result.recipients 
      });
      return true;
    } else {
      // Fallback to original method if dynamic service fails
      logger.warn('Dynamic email service failed, using fallback', { error: result.error });
      return await sendFormEmailFallback('pet-registration', petData);
    }
  } catch (error) {
    logger.error('Failed to send pet registration email', error);
    // Try fallback as last resort
    try {
      return await sendFormEmailFallback('pet-registration', petData);
    } catch (fallbackError) {
      logger.error('Fallback email sending also failed', fallbackError);
      throw error;
    }
  }
};

// Marketplace CRUD
app.get('/api/marketplace', async (req, res) => {
  try {
    const db = await getPrisma();
    const posts = await db.marketplacePost.findMany({
      where: { isActive: true },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            authorName: true,
            authorPhone: true,
            images: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON fields
    const postsWithParsedImages = posts.map(post => ({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      replies: post.replies.map(reply => ({
        ...reply,
        images: reply.images ? JSON.parse(reply.images) : []
      }))
    }));
    
    res.json(postsWithParsedImages);
  } catch (error) {
    console.error('Error fetching marketplace posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/marketplace', async (req, res) => {
  try {
    const { title, description, category, type, price, authorName, authorEmail, authorPhone, images, turnstileToken } = req.body;
    
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Generate a unique ID for non-admin users
    const authorId = req.cookies.authorId;

    if (!authorId) {
      return res.status(400).json({ error: 'Author ID is missing.' });
    }

    // Basic validation
    if (!title || !description || !authorName || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // Phone validation (optional)
    if (authorPhone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(authorPhone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number' });
      }
    }
    
    const post = await db.marketplacePost.create({
      data: {
        title,
        description,
        category,
        type,
        price: price ? parseFloat(price) : null,
        authorId,
        authorName,
        authorEmail,
        authorPhone,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
      }
    });
    
    res.json({
      ...post,
      images: post.images ? JSON.parse(post.images) : []
    });
  } catch (error) {
    console.error('Error creating marketplace post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/marketplace/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, type, price, isActive } = req.body;
    const post = await db.marketplacePost.update({
      where: { id },
      data: { 
        title, 
        description, 
        category, 
        type, 
        price: price ? parseFloat(price) : null,
        isActive 
      }
    });
    res.json(post);
  } catch (error) {
    console.error('Error updating marketplace post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint for marking posts as sold
app.put('/api/marketplace/:postId/sold', async (req, res) => {
  const { postId } = req.params;
  const { authorId } = req.cookies;

  try {
    const post = await db.marketplacePost.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Allow admin to mark as sold (implement admin check if needed)
    // For now, only the author can mark as sold
    if (post.authorId !== authorId) {
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
    }

    const updatedPost = await db.marketplacePost.update({
      where: { id: postId },
      data: { isSold: true },
    });
    res.json(updatedPost);
  } catch (error) {
    console.error('Error marking post as sold:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/marketplace/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.marketplacePost.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketplace post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/marketplace/:postId/replies', async (req, res) => {
  const { postId } = req.params;
  const { content, authorName, authorEmail, authorPhone, images, turnstileToken } = req.body;
  const { authorId } = req.cookies;

  if (!authorId) {
    return res.status(400).json({ error: 'Author ID is missing.' });
  }

  if (!content || !authorName || !authorEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(authorEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  
  // Phone validation (optional)
  if (authorPhone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(authorPhone.replace(/[\s\-\(\)]/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
  }
  
  // Turnstile verification
  const isTurnstileValid = await verifyTurnstile(turnstileToken);
  if (!isTurnstileValid) {
    return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
  }
  
  const reply = await db.marketplaceReply.create({
    data: {
      content,
      authorId,
      authorName,
      authorEmail,
      authorPhone,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      postId
    }
  });
  
  res.json({
    ...reply,
    images: reply.images ? JSON.parse(reply.images) : []
  });
});

app.delete('/api/marketplace/:postId/replies/:replyId', async (req, res) => {
  try {
    const { replyId } = req.params;
    await db.marketplaceReply.delete({
      where: { id: replyId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketplace reply:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin cleanup endpoint for marketplace data
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const {
      deleteOlderThanDays = 90,
      deleteSoldItems = false,
      deleteInactivePosts = true,
      deleteOrphanedImages = true,
      dryRun = false
    } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - deleteOlderThanDays);

    let stats = {
      postsDeleted: 0,
      repliesDeleted: 0,
      imagesDeleted: 0,
      spaceFreed: '0 MB'
    };

    // Build where conditions for posts to delete
    const postWhereConditions = {
      AND: []
    };

    if (deleteOlderThanDays > 0) {
      postWhereConditions.AND.push({
        createdAt: { lt: cutoffDate }
      });
    }

    if (deleteSoldItems) {
      postWhereConditions.AND.push({
        isSold: true
      });
    }

    if (deleteInactivePosts) {
      postWhereConditions.AND.push({
        isActive: false
      });
    }

    // Only proceed if we have conditions to avoid deleting everything
    if (postWhereConditions.AND.length > 0) {
      // Get posts to be deleted (for counting and image cleanup)
      const postsToDelete = await db.marketplacePost.findMany({
        where: postWhereConditions,
        include: {
          replies: {
            select: {
              id: true,
              images: true
            }
          }
        },
        select: {
          id: true,
          images: true,
          replies: true
        }
      });

      stats.postsDeleted = postsToDelete.length;

      // Count replies that will be deleted
      stats.repliesDeleted = postsToDelete.reduce((total, post) => total + post.replies.length, 0);

      // Collect image URLs for deletion
      const imagesToDelete = [];
      
      postsToDelete.forEach(post => {
        if (post.images) {
          try {
            const postImages = JSON.parse(post.images);
            imagesToDelete.push(...postImages);
          } catch (e) {
            console.error('Error parsing post images:', e);
          }
        }
        
        post.replies.forEach(reply => {
          if (reply.images) {
            try {
              const replyImages = JSON.parse(reply.images);
              imagesToDelete.push(...replyImages);
            } catch (e) {
              console.error('Error parsing reply images:', e);
            }
          }
        });
      });

      stats.imagesDeleted = imagesToDelete.length;

      if (!dryRun) {
        // Delete the posts (replies will be deleted due to cascade)
        await db.marketplacePost.deleteMany({
          where: postWhereConditions
        });

        // Delete associated images from filesystem
        if (deleteOrphanedImages && imagesToDelete.length > 0) {
          
          for (const imageUrl of imagesToDelete) {
            try {
              const filename = imageUrl.split('/').pop();
              if (!filename) continue;
              const filepath = path.join(process.cwd(), 'data', 'uploads', 'marketplace', filename);
              await fs.unlink(filepath);
            } catch (error) {
              // Log error but continue, as file might already be deleted
              logger.warn('Could not delete image file during cleanup (may already be gone)', { imageUrl, error: error.message });
            }
          }
        }
      }
    }

    // Handle orphaned images cleanup
    if (deleteOrphanedImages && !dryRun) {
      try {
        
        const uploadsDir = path.join(process.cwd(), 'data', 'uploads', 'marketplace');
        if (!fs.existsSync(uploadsDir)) {
           logger.info('Marketplace uploads directory does not exist, skipping orphaned image cleanup.');
        } else {
            const files = await fs.readdir(uploadsDir);
            
            // Get all image URLs currently in use
            const activePosts = await db.marketplacePost.findMany({
              where: { isActive: true },
              select: { images: true }
            });
            
            const activeReplies = await db.marketplaceReply.findMany({
              select: { images: true }
            });
            
            const activeImages = new Set();
            
            [...activePosts, ...activeReplies].forEach(item => {
              if (item.images) {
                try {
                  const images = JSON.parse(item.images);
                  images.forEach(img => {
                    if (typeof img === 'string') {
                      const filename = img.split('/').pop();
                      if (filename) activeImages.add(filename);
                    }
                  });
                } catch (e) {
                  logger.error('Error parsing images during cleanup:', e);
                }
              }
            });
            
            // Delete orphaned files
            for (const file of files) {
              if (!activeImages.has(file)) {
                try {
                  await fs.unlink(path.join(uploadsDir, file));
                  stats.imagesDeleted++;
                } catch (error) {
                  logger.warn('Error deleting orphaned image', { file, error: error.message });
                }
              }
            }
        }
      } catch (error) {
        logger.error('Error during orphaned images cleanup:', error);
      }
    }

    // Estimate space freed (rough calculation)
    if (stats.imagesDeleted > 0) {
      const avgImageSize = 0.2; // Assume 200KB average per image
      const mbFreed = (stats.imagesDeleted * avgImageSize).toFixed(1);
      stats.spaceFreed = `${mbFreed} MB`;
    }

    res.json({
      success: true,
      dryRun,
      ...stats,
      message: dryRun ? 'Cleanup preview completed' : 'Cleanup completed successfully'
    });

  } catch (error) {
    console.error('Error during marketplace cleanup:', error);
    res.status(500).json({ error: 'Cleanup operation failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
  logger.debug('Health check requested', healthData);
  res.json(healthData);
});

// --- Image Upload API Route ---
app.post('/api/upload/image', (req, res) => {
  marketplaceImageUpload.single('image')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      logger.error('File upload error in marketplace image upload', {
        error: err.message,
        path: req.path,
        file: req.file ? { name: req.file.originalname, type: req.file.mimetype } : null
      });
      
      // Send user-friendly error message for marketplace image upload
      if (err.message.includes('Marketplace images must be')) {
        return res.status(400).json({ success: false, error: err.message });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          error: 'Image file size too large. Please ensure the image is under 5MB.' 
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          success: false, 
          error: 'Unexpected file field. Please use the "image" field.' 
        });
      }
      
      // Generic error for other cases
      return res.status(400).json({ 
        success: false, 
        error: 'Image upload error. Please check your file and try again.' 
      });
    }

    // Continue with normal processing if no upload errors
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    try {
      const filename = `marketplace-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadDir, filename);

      // Process image with sharp
      await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true }) // Resize to max 800px width
        .webp({ quality: 80 }) // Convert to WebP with 80% quality
        .toFile(filepath);

      const imageUrl = `/data/uploads/marketplace/${filename}`;
      
      logger.info('Image uploaded successfully', { imageUrl });
      res.json({ success: true, imageUrl });

    } catch (error) {
      logger.error('Error processing image upload', error);
      res.status(500).json({ success: false, error: 'Failed to process image.' });
    }
  });
});

// --- Event Request API Routes ---
// Submit a new event request
app.post('/api/event-requests', async (req, res) => {
  try {
    const {
      firstName, lastName, unitNumber, email, phone, isOwner,
      eventTitle, eventDescription, requestedDateTime, turnstileToken
    } = req.body;

    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Basic validation
    if (!firstName || !lastName || !unitNumber || !email || !phone || !eventTitle || !requestedDateTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const eventRequest = await db.eventRequest.create({
      data: {
        firstName, lastName, unitNumber, email, phone,
        isOwner: Boolean(isOwner),
        eventTitle,
        eventDescription,
        requestedDateTime: new Date(requestedDateTime),
      },
    });
    res.status(201).json(eventRequest);
  } catch (error) {
    logger.error('Error creating event request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all event requests (for admin)
app.get('/api/event-requests', async (req, res) => {
  try {
    const db = await getPrisma();
    const requests = await db.eventRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    logger.error('Error fetching event requests', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Scooter Registration API Routes ---
// Submit a new scooter registration
app.post('/api/scooter-registration', async (req, res) => {
  try {
    const {
      date, unitNumber, numberOfScooters, description, ownerNames,
      email, phone, acceptTerms, turnstileToken
    } = req.body;

    // Verify Turnstile CAPTCHA
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Basic validation
    if (!date || !unitNumber || !numberOfScooters || !description || !ownerNames || !email || !acceptTerms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Phone validation (optional)
    if (phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number' });
      }
    }

    // Number validation
    const numScooters = parseInt(numberOfScooters);
    if (isNaN(numScooters) || numScooters < 1 || numScooters > 10) {
      return res.status(400).json({ error: 'Number of scooters must be between 1 and 10' });
    }

    // Terms acceptance validation
    if (!acceptTerms || acceptTerms !== true) {
      return res.status(400).json({ error: 'You must accept the terms and conditions' });
    }

    // Generate registration ID
    const registrationId = `SR-${Date.now()}`;

    // Save to database
    const scooterRegistration = await db.scooterRegistration.create({
      data: {
        registrationId,
        registrationDate: date,
        unitNumber,
        numberOfScooters: numScooters,
        description,
        ownerNames,
        email,
        phone,
        status: 'PENDING',
        emailSent: false
      }
    });

    // Prepare registration data for email
    const registrationData = {
      date,
      unitNumber,
      numberOfScooters: numScooters,
      description,
      ownerNames,
      email,
      phone,
      registrationId
    };

    // Send email notification
    let emailSent = false;
    try {
      await sendScooterRegistrationEmail(registrationData);
      emailSent = true;
      logger.info('Scooter registration email sent successfully', {
        registrationId,
        unitNumber,
        ownerNames,
        timestamp: new Date().toISOString()
      });
    } catch (emailError) {
      logger.error('Failed to send scooter registration email', emailError);
      // Continue with success response even if email fails
    }

    // Update email sent status
    await db.scooterRegistration.update({
      where: { id: scooterRegistration.id },
      data: { emailSent }
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: 'E-scooter registration submitted successfully',
      registrationId
    });

  } catch (error) {
    logger.error('Error processing scooter registration', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all scooter registrations (for admin)
app.get('/api/scooter-registrations', async (req, res) => {
  try {
    const db = await getPrisma();
    const registrations = await db.scooterRegistration.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(registrations);
  } catch (error) {
    logger.error('Error fetching scooter registrations', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update scooter registration status (for admin)
app.put('/api/scooter-registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keyNumber, depositPaid, depositAmount, notes } = req.body;

    const updatedRegistration = await db.scooterRegistration.update({
      where: { id },
      data: {
        status,
        keyNumber,
        depositPaid,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        notes
      }
    });

    logger.info('Scooter registration updated', { id, status });
    res.json(updatedRegistration);
  } catch (error) {
    logger.error('Error updating scooter registration', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete scooter registration (for admin)
app.delete('/api/scooter-registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.scooterRegistration.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info('Scooter registration deleted', { id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting scooter registration', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- AC Inquiry API Routes ---
// Submit a new AC inquiry
app.post('/api/ac-inquiry', async (req, res) => {
  try {
    const {
      ownerName, ownerUnit, ownerPhone, email, isMultiZone, bestContactMethod,
      installationTiming, notes, consentGiven, turnstileToken
    } = req.body;

    // Verify Turnstile CAPTCHA
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Basic validation
    if (!ownerName || !ownerUnit || !ownerPhone || !email || !bestContactMethod || !installationTiming || !consentGiven) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(ownerPhone.replace(/[\s\-\(\)]/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Contact method validation
    if (!['EMAIL', 'TELEPHONE'].includes(bestContactMethod)) {
      return res.status(400).json({ error: 'Invalid contact method' });
    }

    // Consent validation
    if (!consentGiven || consentGiven !== true) {
      return res.status(400).json({ error: 'You must consent to receiving information from Airlux' });
    }

    // Generate inquiry ID
    const inquiryId = `AC-${Date.now()}`;

    // Save to database
    const acInquiry = await db.aCInquiry.create({
      data: {
        inquiryId,
        ownerName,
        ownerUnit,
        ownerPhone,
        email,
        isMultiZone: isMultiZone || false,
        bestContactMethod,
        installationTiming,
        notes: notes || null,
        consentGiven
      }
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: 'AC inquiry submitted successfully',
      inquiryId
    });

  } catch (error) {
    logger.error('Error processing AC inquiry', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all AC inquiries (for admin)
app.get('/api/ac-inquiries', async (req, res) => {
  try {
    const db = await getPrisma();
    const inquiries = await db.aCInquiry.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inquiries);
  } catch (error) {
    logger.error('Error fetching AC inquiries', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Storage Rental API Routes ---
// Submit a new storage rental interest
app.post('/api/storage-rental', async (req, res) => {
  try {
    const {
      firstName, lastName, phoneNumber, email, unitNumber, bestContactMethod,
      interestedInInfo, consentGiven, notes, turnstileToken
    } = req.body;

    // Verify Turnstile CAPTCHA
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Basic validation
    if (!firstName || !lastName || !phoneNumber || !email || !unitNumber || !bestContactMethod || !interestedInInfo || !consentGiven) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Contact method validation
    if (!['EMAIL', 'TELEPHONE'].includes(bestContactMethod)) {
      return res.status(400).json({ error: 'Invalid contact method' });
    }

    // Interest validation
    if (!interestedInInfo || interestedInInfo !== true) {
      return res.status(400).json({ error: 'You must indicate interest to obtain more information' });
    }

    // Consent validation
    if (!consentGiven || consentGiven !== true) {
      return res.status(400).json({ error: 'You must consent to receiving information from Spectrum 4 BCS2611' });
    }

    // Generate rental ID
    const rentalId = `SR-${Date.now()}`;

    // Save to database
    const storageRental = await db.storageRental.create({
      data: {
        rentalId,
        firstName,
        lastName,
        phoneNumber,
        email,
        unitNumber,
        bestContactMethod,
        interestedInInfo,
        consentGiven,
        notes: notes || null
      }
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Storage rental interest submitted successfully',
      rentalId
    });

  } catch (error) {
    logger.error('Error processing storage rental interest', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all storage rental interests (for admin)
app.get('/api/storage-rentals', async (req, res) => {
  try {
    const db = await getPrisma();
    const rentals = await db.storageRental.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rentals);
  } catch (error) {
    logger.error('Error fetching storage rental interests', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an event request status (for admin)
app.put('/api/event-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expecting 'APPROVED' or 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided.' });
  }

  try {
    const updatedRequest = await db.eventRequest.update({
      where: { id },
      data: { status },
    });

    // If approved, create a new event in the main calendar
    if (status === 'APPROVED') {
      await db.event.create({
        data: {
          title: updatedRequest.eventTitle,
          description: updatedRequest.eventDescription || `Event requested by ${updatedRequest.firstName} ${updatedRequest.lastName} (Unit ${updatedRequest.unitNumber}). Contact: ${updatedRequest.email}, ${updatedRequest.phone}.`,
          startDate: updatedRequest.requestedDateTime,
          // You might want to set a default duration here, e.g., 2 hours
          endDate: new Date(new Date(updatedRequest.requestedDateTime).getTime() + 2 * 60 * 60 * 1000), 
          location: 'As requested',
        },
      });
      logger.info('Event created from approved request', { requestId: id });
    }

    res.json(updatedRequest);
  } catch (error) {
    logger.error('Error updating event request', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit emergency contact information
app.post('/api/emergency-contact', async (req, res) => {
  try {
    const {
      unitNumber, strataLotNumber, registeredOwnerNames, ownerEmail, phoneHome, phoneBusiness,
      phoneOther, phoneOtherSpecify, nonResidentAddress, emergencyContactName, emergencyContactEmail,
      allowManagementAccess, conciergeKeyProvided, dateProvidedToConcierge, securityCode, turnstileToken
    } = req.body;

    // Verify Turnstile CAPTCHA
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Basic validation
    if (!unitNumber || !strataLotNumber || !registeredOwnerNames || !allowManagementAccess || !conciergeKeyProvided) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate management access choice
    if (!['YES', 'NO'].includes(allowManagementAccess)) {
      return res.status(400).json({ error: 'Invalid emergency contact key access selection' });
    }

    // Validate concierge key provided choice
    if (!['YES', 'NO'].includes(conciergeKeyProvided)) {
      return res.status(400).json({ error: 'Invalid concierge key provided selection' });
    }

    // Generate contact ID
    const contactId = `EC-${Date.now()}`;

    // Save to database
    const emergencyContact = await db.emergencyContact.create({
      data: {
        contactId,
        unitNumber,
        strataLotNumber,
        registeredOwnerNames,
        ownerEmail: ownerEmail || null,
        phoneHome: phoneHome || null,
        phoneBusiness: phoneBusiness || null,
        phoneOther: phoneOther || null,
        phoneOtherSpecify: phoneOtherSpecify || null,
        nonResidentAddress: nonResidentAddress || null,
        nonResidentPhone: null, // Not in current form
        emergencyContactName: emergencyContactName || null,
        emergencyContactAddress: null, // Not in current form
        emergencyContactPhone: null, // Not in current form
        emergencyContactEmail: emergencyContactEmail || null,
        allowManagementAccess,
        conciergeKeyProvided,
        dateProvidedToConcierge: dateProvidedToConcierge || null,
        securityCode: securityCode || null
      }
    });

    // Send email notification
    try {
      await sendEmergencyContactEmail({
        unitNumber,
        strataLotNumber,
        registeredOwnerNames,
        ownerEmail,
        phoneHome,
        phoneBusiness,
        phoneOther,
        phoneOtherSpecify,
        nonResidentAddress,
        emergencyContactName,
        emergencyContactEmail,
        allowManagementAccess,
        conciergeKeyProvided,
        dateProvidedToConcierge,
        securityCode
      });
      
      logger.info('Emergency contact email sent successfully', {
        contactId,
        unitNumber,
        timestamp: new Date().toISOString()
      });
    } catch (emailError) {
      logger.error('Failed to send emergency contact email', emailError);
      // Continue with success response even if email fails
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Emergency contact information submitted successfully and saved to database',
      contactId
    });

  } catch (error) {
    logger.error('Error processing emergency contact submission', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit pet registration
app.post('/api/pet-registration', (req, res) => {
  petRegistrationUpload.array('photos', 3)(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      logger.error('File upload error in pet registration', {
        error: err.message,
        path: req.path,
        files: req.files ? req.files.map(f => ({ name: f.originalname, type: f.mimetype })) : []
      });
      
      // Send user-friendly error message for pet registration
      if (err.message.includes('Pet photos must be')) {
        return res.status(400).json({ 
          error: err.message 
        });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'Photo file size too large. Please ensure each photo is under 5MB.' 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: 'Too many photos. You can upload a maximum of 3 photos.' 
        });
      }
      
      // Generic error for other cases
      return res.status(400).json({ 
        error: 'Photo upload error. Please check your image files and try again.' 
      });
    }

    // Continue with normal processing if no upload errors
    try {
      const {
        ownerName, suiteNumber, phoneNumber, email, occupancyType,
        petName, petAge, petHeight, petColor, petType, petBreed, petWeight,
        distinguishingMarks, licenseNumber, turnstileToken
      } = req.body;

    // Verify Turnstile CAPTCHA
    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Basic validation
    if (!ownerName || !suiteNumber || !phoneNumber || !email || !occupancyType ||
        !petName || !petAge || !petHeight || !petColor || !petType || !petBreed || !petWeight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate occupancy type
    if (!['TENANT', 'OWNER_OCCUPIED'].includes(occupancyType)) {
      return res.status(400).json({ error: 'Invalid occupancy type' });
    }

    // Generate unique registration ID
    const timestamp = Date.now();
    const registrationId = `PR-${timestamp}`;

    // Process uploaded photos
    let photoFilenames = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Generate unique filename
          const fileExtension = path.extname(file.originalname).toLowerCase();
          const filename = `pet-${registrationId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
          const outputPath = path.join(__dirname, 'public', 'uploads', filename);

          // Process and compress the image
          await sharp(file.buffer)
            .resize(800, 800, { 
              fit: 'inside', 
              withoutEnlargement: true 
            })
            .jpeg({ 
              quality: 85,
              progressive: true 
            })
            .toFile(outputPath);

          photoFilenames.push(filename);
          logger.info('Pet photo processed successfully', { filename, originalName: file.originalname });
        } catch (photoError) {
          logger.error('Failed to process pet photo', photoError);
          // Continue with other photos if one fails
        }
      }
    }

    // Save to database
    const petRegistration = await db.petRegistration.create({
      data: {
        registrationId,
        ownerName,
        suiteNumber,
        phoneNumber,
        email,
        occupancyType,
        petName,
        petAge,
        petHeight,
        petColor,
        petType,
        petBreed,
        petWeight,
        distinguishingMarks: distinguishingMarks || null,
        licenseNumber: licenseNumber || null,
        photos: photoFilenames.length > 0 ? JSON.stringify(photoFilenames) : null,
        emailSent: false
      }
    });

    // Prepare pet data for email
    const petData = {
      registrationId,
      ownerName,
      suiteNumber,
      phoneNumber,
      email,
      occupancyType,
      petName,
      petAge,
      petHeight,
      petColor,
      petType,
      petBreed,
      petWeight,
      distinguishingMarks,
      licenseNumber,
      photos: photoFilenames
    };

    // Send email notification
    try {
      await sendPetRegistrationEmail(petData);
      
      // Update database to mark email as sent
      await db.petRegistration.update({
        where: { id: petRegistration.id },
        data: { emailSent: true }
      });

      logger.info('Pet registration email sent successfully', {
        registrationId,
        petName,
        suiteNumber,
        photoCount: photoFilenames.length,
        timestamp: new Date().toISOString()
      });
    } catch (emailError) {
      logger.error('Failed to send pet registration email', emailError);
      // Continue with success response even if email fails
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Pet registration submitted successfully',
      registrationId
    });

    } catch (error) {
      logger.error('Error processing pet registration submission', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Get all pet registrations (admin only)
app.get('/api/pet-registrations', async (req, res) => {
  try {
    const db = await getPrisma();
    const petRegistrations = await db.petRegistration.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // Parse photos JSON for each registration
    const petRegistrationsWithPhotos = petRegistrations.map(registration => ({
      ...registration,
      photos: registration.photos ? JSON.parse(registration.photos) : []
    }));

    res.json(petRegistrationsWithPhotos);
  } catch (error) {
    logger.error('Error fetching pet registrations', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update pet registration status (admin only)
app.patch('/api/pet-registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const petRegistration = await db.petRegistration.update({
      where: { id },
      data: {
        status,
        notes: notes || null,
        updatedAt: new Date()
      }
    });

    logger.info('Pet registration status updated', { 
      id, 
      status, 
      registrationId: petRegistration.registrationId 
    });

    res.json(petRegistration);
  } catch (error) {
    logger.error('Error updating pet registration status', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pet registration (admin only)
app.delete('/api/pet-registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the registration to access photos before deletion
    const petRegistration = await db.petRegistration.findUnique({
      where: { id }
    });

    if (!petRegistration) {
      return res.status(404).json({ error: 'Pet registration not found' });
    }

    // Delete associated photos
    if (petRegistration.photos) {
      try {
        const photos = JSON.parse(petRegistration.photos);
        for (const photo of photos) {
          const photoPath = path.join(__dirname, 'public', 'uploads', photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
            logger.info('Pet photo deleted', { filename: photo });
          }
        }
      } catch (photoError) {
        logger.error('Error deleting pet photos', photoError);
        // Continue with registration deletion even if photo deletion fails
      }
    }

    // Mark as inactive instead of hard delete
    await db.petRegistration.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info('Pet registration deleted', { 
      id, 
      registrationId: petRegistration.registrationId 
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting pet registration', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all emergency contacts (admin only)
app.get('/api/emergency-contacts', async (req, res) => {
  try {
    const db = await getPrisma();
    const emergencyContacts = await db.emergencyContact.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(emergencyContacts);
  } catch (error) {
    logger.error('Error fetching emergency contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all AC inquiries (admin only)
app.get('/api/ac-inquiries', async (req, res) => {
  try {
    const db = await getPrisma();
    const acInquiries = await db.aCInquiry.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(acInquiries);
  } catch (error) {
    logger.error('Error fetching AC inquiries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all storage rentals (admin only)
app.get('/api/storage-rentals', async (req, res) => {
  try {
    const db = await getPrisma();
    const storageRentals = await db.storageRental.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(storageRentals);
  } catch (error) {
    logger.error('Error fetching storage rentals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit Form K - Notice of Tenant's Responsibilities
app.post('/api/form-k-submission', async (req, res) => {
  try {
    const {
      strataPlan, address, unitNumber, strataLotNumber, lockerNumber, parkingStallNumbers,
      tenant1Name, tenant1HomePhone, tenant1OfficePhone, tenant1CellPhone, tenant1Email,
      tenant2Name, tenant2HomePhone, tenant2OfficePhone, tenant2CellPhone, tenant2Email,
      tenancyCommencingDay, tenancyCommencingDate, tenancyCommencingYear,
      landlordName, landlordAddress, landlordSignatureName, landlordSignatureDate,
      tenantSigningMethod, tenant1SignatureName, tenant1SignatureDate,
      tenant2SignatureName, tenant2SignatureDate,
      ownerMailingAddress, ownerHomePhone, ownerWorkPhone, ownerFax, ownerCellular, ownerEmail,
      submissionDate, captchaToken,
      requiresTenantSignatures, landlordSignatureCompleted, tenant1SignatureCompleted, tenant2SignatureCompleted
    } = req.body;

    // Verify Turnstile CAPTCHA
    const isTurnstileValid = await verifyTurnstile(captchaToken);
    if (!isTurnstileValid) {
      return res.status(400).json({ error: 'Invalid CAPTCHA. Please try again.' });
    }

    // Validate required fields
    if (!strataPlan || !address || !unitNumber || !strataLotNumber || !tenant1Name || 
        !tenancyCommencingDay || !tenancyCommencingDate || !tenancyCommencingYear ||
        !landlordName || !landlordAddress || !ownerMailingAddress || !submissionDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Validate landlord signature
    if (!landlordSignatureName) {
      return res.status(400).json({ error: 'Landlord signature is required' });
    }

    // Validate tenant signatures based on method
    if (tenantSigningMethod === 'present' && !tenant1SignatureName) {
      return res.status(400).json({ error: 'Tenant signature is required when tenants are present' });
    }

    if (tenantSigningMethod === 'email' && !tenant1Email) {
      return res.status(400).json({ error: 'Tenant email is required for email signature method' });
    }

    // Generate signature tokens for email method
    let tenant1Token = null;
    let tenant2Token = null;
    let tenant1Expiry = null;
    let tenant2Expiry = null;

    if (tenantSigningMethod === 'email') {
      tenant1Token = crypto.randomBytes(32).toString('hex');
      tenant1Expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      if (tenant2Name && tenant2Email) {
        tenant2Token = crypto.randomBytes(32).toString('hex');
        tenant2Expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
    }

    // Create Form K submission record
    const db = await getPrisma();
    const formKSubmission = await db.formKSubmission.create({
      data: {
        strataPlan,
        address,
        unitNumber,
        strataLotNumber,
        lockerNumber: lockerNumber || null,
        parkingStallNumbers: parkingStallNumbers || null,
        tenant1Name,
        tenant1HomePhone: tenant1HomePhone || null,
        tenant1OfficePhone: tenant1OfficePhone || null,
        tenant1CellPhone: tenant1CellPhone || null,
        tenant1Email: tenant1Email || null,
        tenant2Name: tenant2Name || null,
        tenant2HomePhone: tenant2HomePhone || null,
        tenant2OfficePhone: tenant2OfficePhone || null,
        tenant2CellPhone: tenant2CellPhone || null,
        tenant2Email: tenant2Email || null,
        tenancyCommencingDay,
        tenancyCommencingDate,
        tenancyCommencingYear,
        landlordName,
        landlordAddress,
        landlordSignatureName,
        landlordSignatureDate,
        tenantSigningMethod,
        tenant1SignatureName: tenant1SignatureName || null,
        tenant1SignatureDate: tenant1SignatureDate || null,
        tenant2SignatureName: tenant2SignatureName || null,
        tenant2SignatureDate: tenant2SignatureDate || null,
        landlordSignatureCompleted: true,
        tenant1SignatureCompleted: tenantSigningMethod === 'present' && !!tenant1SignatureName,
        tenant2SignatureCompleted: tenantSigningMethod === 'present' && !!tenant2SignatureName,
        requiresTenantSignatures: tenantSigningMethod === 'email',
        tenant1SignatureToken: tenant1Token,
        tenant2SignatureToken: tenant2Token,
        tenant1TokenExpiry: tenant1Expiry,
        tenant2TokenExpiry: tenant2Expiry,
        ownerMailingAddress,
        ownerHomePhone: ownerHomePhone || null,
        ownerWorkPhone: ownerWorkPhone || null,
        ownerFax: ownerFax || null,
        ownerCellular: ownerCellular || null,
        ownerEmail: ownerEmail || null,
        submissionDate,
        isSubmitted: true
      }
    });

    logger.info('Form K submission created', { 
      id: formKSubmission.id,
      unitNumber,
      tenant1Name,
      strataPlan
    });

    // Only send admin notification if form is complete (all signatures collected)
    const isFormComplete = landlordSignatureCompleted && 
                          tenant1SignatureCompleted && 
                          (!tenant2Name || tenant2SignatureCompleted);

    if (isFormComplete) {
      try {
        const emailData = {
          strataPlan,
          address,
          unitNumber,
          strataLotNumber,
          tenant1Name,
          tenant2Name: tenant2Name || 'N/A',
          tenancyCommencingDay,
          tenancyCommencingDate,
          tenancyCommencingYear,
          landlordName,
          landlordAddress,
          ownerMailingAddress,
          submissionDate,
          submissionId: formKSubmission.id,
          formStatus: 'COMPLETE'
        };

        const { sendDynamicFormEmail } = await import('./server/utils/dynamicEmailService.js');
        await sendDynamicFormEmail('form-k', emailData);
        
        // Update email sent status
        await db.formKSubmission.update({
          where: { id: formKSubmission.id },
          data: { emailSent: true }
        });

        logger.info('Form K completion notification email sent', { 
          submissionId: formKSubmission.id,
          unitNumber,
          tenant1Name,
          allSignaturesComplete: true
        });
      } catch (emailError) {
        logger.error('Failed to send Form K completion notification email', emailError);
        // Continue with success response even if email fails
      }
    } else {
      logger.info('Form K submitted but pending tenant signatures', { 
        submissionId: formKSubmission.id,
        unitNumber,
        tenant1Name,
        requiresTenantSignatures: tenantSigningMethod === 'email'
      });
    }

    // Send tenant signature request emails if needed
    if (tenantSigningMethod === 'email') {
      try {
        const { sendTenantSignatureRequest } = await import('./server/utils/tenantSignatureService.js');
        
        // Send to primary tenant
        if (tenant1Email && tenant1Token) {
          await sendTenantSignatureRequest({
            tenantName: tenant1Name,
            tenantEmail: tenant1Email,
            submissionId: formKSubmission.id,
            signatureToken: tenant1Token,
            unitNumber,
            landlordName,
            tenantType: 'primary'
          });
          
          logger.info('Tenant 1 signature request sent', { 
            submissionId: formKSubmission.id,
            tenantEmail: tenant1Email 
          });
        }
        
        // Send to second tenant if applicable
        if (tenant2Name && tenant2Email && tenant2Token) {
          await sendTenantSignatureRequest({
            tenantName: tenant2Name,
            tenantEmail: tenant2Email,
            submissionId: formKSubmission.id,
            signatureToken: tenant2Token,
            unitNumber,
            landlordName,
            tenantType: 'secondary'
          });
          
          logger.info('Tenant 2 signature request sent', { 
            submissionId: formKSubmission.id,
            tenantEmail: tenant2Email 
          });
        }
      } catch (tenantEmailError) {
        logger.error('Failed to send tenant signature request emails', tenantEmailError);
        // Continue with success response even if tenant emails fail
      }
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Form K submitted successfully',
      submissionId: formKSubmission.id
    });

  } catch (error) {
    logger.error('Error processing Form K submission', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all Form K submissions (admin only)
app.get('/api/form-k-submissions', async (req, res) => {
  try {
    const db = await getPrisma();
    const formKSubmissions = await db.formKSubmission.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Remove signature data from the list view for performance
    const submissionsWithoutSignatures = formKSubmissions.map(submission => ({
      ...submission,
      landlordSignature: submission.landlordSignature ? '[Signature Present]' : null,
      tenant1Signature: submission.tenant1Signature ? '[Signature Present]' : null,
      tenant2Signature: submission.tenant2Signature ? '[Signature Present]' : null
    }));

    res.json(submissionsWithoutSignatures);
  } catch (error) {
    logger.error('Error fetching Form K submissions', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single Form K submission with signatures (admin only)
app.get('/api/form-k-submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const formKSubmission = await db.formKSubmission.findUnique({
      where: { id }
    });

    if (!formKSubmission) {
      return res.status(404).json({ error: 'Form K submission not found' });
    }

    res.json(formKSubmission);
  } catch (error) {
    logger.error('Error fetching Form K submission', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant signature form data
app.get('/api/tenant-signature/:submissionId/:token', async (req, res) => {
  try {
    const { submissionId, token } = req.params;

    // Find the submission with the matching token
    const db = await getPrisma();
    const submission = await db.formKSubmission.findFirst({
      where: {
        id: submissionId,
        OR: [
          { tenant1SignatureToken: token },
          { tenant2SignatureToken: token }
        ]
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Invalid signature link or form not found' });
    }

    // Check if token has expired
    const now = new Date();
    const isTenant1 = submission.tenant1SignatureToken === token;
    const isTenant2 = submission.tenant2SignatureToken === token;
    
    const tokenExpiry = isTenant1 ? submission.tenant1TokenExpiry : submission.tenant2TokenExpiry;
    
    if (!tokenExpiry || now > tokenExpiry) {
      return res.status(404).json({ error: 'Signature link has expired' });
    }

    // Check if already signed
    if ((isTenant1 && submission.tenant1SignatureCompleted) || 
        (isTenant2 && submission.tenant2SignatureCompleted)) {
      return res.status(410).json({ error: 'Form has already been signed' });
    }

    // Return submission data and tenant info
    const tenantInfo = {
      name: isTenant1 ? submission.tenant1Name : submission.tenant2Name,
      email: isTenant1 ? submission.tenant1Email : submission.tenant2Email,
      type: isTenant1 ? 'primary' : 'secondary'
    };

    res.json({
      submission: {
        id: submission.id,
        strataPlan: submission.strataPlan,
        address: submission.address,
        unitNumber: submission.unitNumber,
        landlordName: submission.landlordName,
        tenancyCommencingDay: submission.tenancyCommencingDay,
        tenancyCommencingDate: submission.tenancyCommencingDate,
        tenancyCommencingYear: submission.tenancyCommencingYear
      },
      tenantInfo
    });

  } catch (error) {
    logger.error('Error fetching tenant signature data', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit tenant signature
app.post('/api/tenant-signature/:submissionId/:token', async (req, res) => {
  try {
    const { submissionId, token } = req.params;
    const { signatureName, signatureDate, acknowledgment } = req.body;

    // Validate required fields
    if (!signatureName || !signatureDate || !acknowledgment) {
      return res.status(400).json({ error: 'All signature fields are required' });
    }

    // Find the submission with the matching token
    const db = await getPrisma();
    const submission = await db.formKSubmission.findFirst({
      where: {
        id: submissionId,
        OR: [
          { tenant1SignatureToken: token },
          { tenant2SignatureToken: token }
        ]
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Invalid signature link or form not found' });
    }

    // Check if token has expired
    const now = new Date();
    const isTenant1 = submission.tenant1SignatureToken === token;
    const isTenant2 = submission.tenant2SignatureToken === token;
    
    const tokenExpiry = isTenant1 ? submission.tenant1TokenExpiry : submission.tenant2TokenExpiry;
    
    if (!tokenExpiry || now > tokenExpiry) {
      return res.status(404).json({ error: 'Signature link has expired' });
    }

    // Check if already signed
    if ((isTenant1 && submission.tenant1SignatureCompleted) || 
        (isTenant2 && submission.tenant2SignatureCompleted)) {
      return res.status(410).json({ error: 'Form has already been signed' });
    }

    // Update the appropriate tenant signature
    const updateData = {};
    if (isTenant1) {
      updateData.tenant1SignatureName = signatureName;
      updateData.tenant1SignatureDate = signatureDate;
      updateData.tenant1SignatureCompleted = true;
      updateData.tenant1SignatureToken = null; // Invalidate token after use
      updateData.tenant1TokenExpiry = null;
    } else {
      updateData.tenant2SignatureName = signatureName;
      updateData.tenant2SignatureDate = signatureDate;
      updateData.tenant2SignatureCompleted = true;
      updateData.tenant2SignatureToken = null; // Invalidate token after use
      updateData.tenant2TokenExpiry = null;
    }

    const updatedSubmission = await db.formKSubmission.update({
      where: { id: submissionId },
      data: updateData
    });

    logger.info('Tenant signature completed', {
      submissionId,
      tenantType: isTenant1 ? 'primary' : 'secondary',
      tenantName: signatureName
    });

    // Check if form is now complete and send completion notification
    const isNowComplete = updatedSubmission.landlordSignatureCompleted && 
                         updatedSubmission.tenant1SignatureCompleted && 
                         (!updatedSubmission.tenant2Name || updatedSubmission.tenant2SignatureCompleted);

    if (isNowComplete && !updatedSubmission.emailSent) {
      try {
        const emailData = {
          strataPlan: updatedSubmission.strataPlan,
          address: updatedSubmission.address,
          unitNumber: updatedSubmission.unitNumber,
          strataLotNumber: updatedSubmission.strataLotNumber,
          tenant1Name: updatedSubmission.tenant1Name,
          tenant2Name: updatedSubmission.tenant2Name || 'N/A',
          tenancyCommencingDay: updatedSubmission.tenancyCommencingDay,
          tenancyCommencingDate: updatedSubmission.tenancyCommencingDate,
          tenancyCommencingYear: updatedSubmission.tenancyCommencingYear,
          landlordName: updatedSubmission.landlordName,
          landlordAddress: updatedSubmission.landlordAddress,
          ownerMailingAddress: updatedSubmission.ownerMailingAddress,
          submissionDate: updatedSubmission.submissionDate,
          submissionId: updatedSubmission.id,
          formStatus: 'COMPLETE_ALL_SIGNATURES'
        };

        const { sendDynamicFormEmail } = await import('./server/utils/dynamicEmailService.js');
        await sendDynamicFormEmail('form-k', emailData);
        
        // Update email sent status
        await db.formKSubmission.update({
          where: { id: submissionId },
          data: { emailSent: true }
        });

        logger.info('Form K completion notification sent after final signature', {
          submissionId,
          unitNumber: updatedSubmission.unitNumber
        });
      } catch (emailError) {
        logger.error('Failed to send Form K completion notification', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Signature submitted successfully',
      formComplete: isNowComplete
    });

  } catch (error) {
    logger.error('Error processing tenant signature', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Form Configuration API Routes ---
// Get all form configurations
app.get('/api/form-configurations', async (req, res) => {
  try {
    const db = await getPrisma();
    const formConfigs = await db.formConfiguration.findMany({
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      },
      orderBy: { displayName: 'asc' }
    });
    res.json(formConfigs);
  } catch (error) {
    logger.error('Error fetching form configurations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific form configuration
app.get('/api/form-configurations/:formName', async (req, res) => {
  try {
    const db = await getPrisma();
    const { formName } = req.params;
    const formConfig = await db.formConfiguration.findUnique({
      where: { formName },
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });
    
    if (!formConfig) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    
    res.json(formConfig);
  } catch (error) {
    logger.error('Error fetching form configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get form configuration by ID
app.get('/api/form-configurations/:id', async (req, res) => {
  try {
    const db = await getPrisma();
    const { id } = req.params;
    
    const formConfig = await db.formConfiguration.findUnique({
      where: { id },
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });
    
    if (!formConfig) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    
    res.json(formConfig);
  } catch (error) {
    logger.error('Error fetching form configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update form configuration
app.put('/api/form-configurations/:id', async (req, res) => {
  try {
    const db = await getPrisma();
    const { id } = req.params;
    const { displayName, description, isActive, emailConfig, recipients } = req.body;
    
    // Update form configuration
    const updatedConfig = await db.formConfiguration.update({
      where: { id },
      data: {
        displayName,
        description,
        isActive,
        emailConfig
      }
    });
    
    // Update recipients if provided
    if (recipients) {
      // Delete existing recipients
      await db.formEmailRecipient.deleteMany({
        where: { formConfigId: id }
      });
      
      // Create new recipients
      await db.formEmailRecipient.createMany({
        data: recipients.map(recipient => ({
          ...recipient,
          formConfigId: id
        }))
      });
    }
    
    // Return updated configuration with recipients
    const result = await db.formConfiguration.findUnique({
      where: { id },
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });
    
    logger.info('Form configuration updated', { id, formName: updatedConfig.formName });
    res.json(result);
  } catch (error) {
    logger.error('Error updating form configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new form configuration
app.post('/api/form-configurations', async (req, res) => {
  try {
    const db = await getPrisma();
    const { formName, displayName, description, isActive, emailConfig, recipients } = req.body;
    
    // Validate required fields
    if (!formName || !displayName || !emailConfig) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if form name already exists
    const existingConfig = await db.formConfiguration.findUnique({
      where: { formName }
    });
    
    if (existingConfig) {
      return res.status(400).json({ error: 'Form configuration already exists' });
    }
    
    // Create form configuration
    const newConfig = await db.formConfiguration.create({
      data: {
        formName,
        displayName,
        description,
        isActive: isActive !== false,
        emailConfig
      }
    });
    
    // Create recipients if provided
    if (recipients && recipients.length > 0) {
      await db.formEmailRecipient.createMany({
        data: recipients.map(recipient => ({
          ...recipient,
          formConfigId: newConfig.id
        }))
      });
    }
    
    // Return created configuration with recipients
    const result = await db.formConfiguration.findUnique({
      where: { id: newConfig.id },
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });
    
    logger.info('Form configuration created', { id: newConfig.id, formName });
    res.json(result);
  } catch (error) {
    logger.error('Error creating form configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete form configuration
app.delete('/api/form-configurations/:id', async (req, res) => {
  try {
    const db = await getPrisma();
    const { id } = req.params;
    
    // Delete recipients first (cascade should handle this, but being explicit)
    await db.formEmailRecipient.deleteMany({
      where: { formConfigId: id }
    });
    
    // Delete form configuration
    await db.formConfiguration.delete({
      where: { id }
    });
    
    logger.info('Form configuration deleted', { id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting form configuration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get form configuration by form name (for dynamic email sending)
app.get('/api/form-configurations/by-name/:formName', async (req, res) => {
  try {
    const db = await getPrisma();
    const { formName } = req.params;
    const formConfig = await db.formConfiguration.findUnique({
      where: { 
        formName,
        isActive: true
      },
      include: {
        recipients: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' }
        }
      }
    });
    
    if (!formConfig) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    
    res.json(formConfig);
  } catch (error) {
    logger.error('Error fetching form configuration by name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files (must be after API routes, before error handler)
app.use(express.static(path.join(__dirname, 'dist'), {
  // Better caching for static assets
  setHeaders: (res, path, stat) => {
    // Cache static assets for better performance
    if (path.includes('/assets/')) {
      // Cache JS/CSS assets for 1 year (they have hashes in names)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Cache other files for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Error handling middleware (must be after API routes, before catch-all)
app.use(errorHandler);

// Serve React app for all other routes (must be last)
app.get('*', (req, res) => {
  logger.debug('Serving React app for route', { path: req.path });
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  // Initialize Prisma client on server start
  try {
    await initializePrisma();
  } catch (error) {
    console.error('Failed to initialize Prisma on server start:', error);
  }
  
  logger.info('Server started successfully', {
    port: PORT,
    host: '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('Server closed');
    if (prisma) await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    logger.info('Server closed');
    if (prisma) await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});