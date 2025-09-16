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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3331;

// Configure SMTP transporter for email sending
// Use proper hostname for certificate validation
const getSmtpConfig = () => {
  // Use hostname from environment or default to mail.spectrum4.ca
  const smtpHost = process.env.SMTP_HOST || 'mail.spectrum4.ca';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  
  console.log(`[SMTP] Host: ${smtpHost}, Port: ${smtpPort}`);
  
  return {
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: process.env.SMTP_USER || 'superbase',
      pass: process.env.SMTP_PASS || 'n2hm13i'
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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit for documents
  fileFilter: (req, file, cb) => {
    // Check if this is for image upload (marketplace or pet registration) or document upload
    const isImageUpload = req.path.includes('/image') || 
                         req.path.includes('/pet-registration') ||
                         file.fieldname === 'photos' ||
                         file.fieldname === 'image';
    
    // Debug logging to help troubleshoot
    logger.debug('File upload validation', {
      path: req.path,
      fieldname: file.fieldname,
      isImageUpload,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    
    if (isImageUpload) {
      // Image upload validation
      const allowedTypes = /jpeg|jpg|png|webp/;
      const mimetype = allowedTypes.test(file.mimetype);
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Error: Image upload only supports JPEG, JPG, PNG, and WebP filetypes'));
    } else {
      // Document upload validation
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      cb(new Error('Error: Document upload only supports PDF and Word document filetypes'));
    }
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

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.debug('Login attempt', { email });

    const admin = await prisma.adminUser.findUnique({
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
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      logger.warn('Registration failed - user already exists', { email });
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.adminUser.create({
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
    const announcements = await prisma.announcement.findMany({
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
    const announcement = await prisma.announcement.create({
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
    const announcement = await prisma.announcement.update({
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
    await prisma.announcement.update({
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
    const events = await prisma.event.findMany({
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
    const event = await prisma.event.create({
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
    const event = await prisma.event.update({
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
    await prisma.event.update({
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
    logger.debug('Fetching all active pages');
    const pages = await prisma.page.findMany({
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
    const page = await prisma.page.findUnique({
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
    const page = await prisma.page.create({
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
    const page = await prisma.page.update({
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
    await prisma.page.update({
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
    const documents = await prisma.document.findMany({
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
    const document = await prisma.document.findUnique({
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

app.post('/api/documents', upload.single('document'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF and Word documents are allowed' });
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
    const document = await prisma.document.create({
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

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;
    
    const document = await prisma.document.update({
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
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Soft delete in database
    await prisma.document.update({
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
    const users = await prisma.adminUser.findMany({
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
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await prisma.adminUser.create({
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
    const adminCount = await prisma.adminUser.count();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    await prisma.adminUser.delete({
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
    const admin = await prisma.adminUser.findUnique({ where: { id } });
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
    await prisma.adminUser.update({
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
    const admin = await prisma.adminUser.findUnique({ where: { id } });
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
    await prisma.adminUser.update({
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
    const posts = await prisma.marketplacePost.findMany({
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
    
    const post = await prisma.marketplacePost.create({
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
    const post = await prisma.marketplacePost.update({
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
    const post = await prisma.marketplacePost.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Allow admin to mark as sold (implement admin check if needed)
    // For now, only the author can mark as sold
    if (post.authorId !== authorId) {
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
    }

    const updatedPost = await prisma.marketplacePost.update({
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
    await prisma.marketplacePost.update({
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
  
  const reply = await prisma.marketplaceReply.create({
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
    await prisma.marketplaceReply.delete({
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
      const postsToDelete = await prisma.marketplacePost.findMany({
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
        await prisma.marketplacePost.deleteMany({
          where: postWhereConditions
        });

        // Delete associated images from filesystem
        if (deleteOrphanedImages && imagesToDelete.length > 0) {
          const fs = require('fs').promises;
          const path = require('path');
          
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
        const fs = require('fs').promises;
        const path = require('path');
        
        const uploadsDir = path.join(process.cwd(), 'data', 'uploads', 'marketplace');
        if (!fs.existsSync(uploadsDir)) {
           logger.info('Marketplace uploads directory does not exist, skipping orphaned image cleanup.');
        } else {
            const files = await fs.readdir(uploadsDir);
            
            // Get all image URLs currently in use
            const activePosts = await prisma.marketplacePost.findMany({
              where: { isActive: true },
              select: { images: true }
            });
            
            const activeReplies = await prisma.marketplaceReply.findMany({
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
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
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

    const eventRequest = await prisma.eventRequest.create({
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
    const requests = await prisma.eventRequest.findMany({
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
    const scooterRegistration = await prisma.scooterRegistration.create({
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
    await prisma.scooterRegistration.update({
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
    const registrations = await prisma.scooterRegistration.findMany({
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

    const updatedRegistration = await prisma.scooterRegistration.update({
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
    
    await prisma.scooterRegistration.update({
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
    const acInquiry = await prisma.aCInquiry.create({
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
    const inquiries = await prisma.aCInquiry.findMany({
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
    const storageRental = await prisma.storageRental.create({
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
    const rentals = await prisma.storageRental.findMany({
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
    const updatedRequest = await prisma.eventRequest.update({
      where: { id },
      data: { status },
    });

    // If approved, create a new event in the main calendar
    if (status === 'APPROVED') {
      await prisma.event.create({
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
    const emergencyContact = await prisma.emergencyContact.create({
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
app.post('/api/pet-registration', upload.array('photos', 3), async (req, res) => {
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
    const petRegistration = await prisma.petRegistration.create({
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
      await prisma.petRegistration.update({
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

// Get all pet registrations (admin only)
app.get('/api/pet-registrations', async (req, res) => {
  try {
    const petRegistrations = await prisma.petRegistration.findMany({
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

    const petRegistration = await prisma.petRegistration.update({
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
    const petRegistration = await prisma.petRegistration.findUnique({
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
    await prisma.petRegistration.update({
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
    const emergencyContacts = await prisma.emergencyContact.findMany({
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
    const acInquiries = await prisma.aCInquiry.findMany({
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
    const storageRentals = await prisma.storageRental.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(storageRentals);
  } catch (error) {
    logger.error('Error fetching storage rentals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Form Configuration API Routes ---
// Get all form configurations
app.get('/api/form-configurations', async (req, res) => {
  try {
    const formConfigs = await prisma.formConfiguration.findMany({
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
    const { formName } = req.params;
    const formConfig = await prisma.formConfiguration.findUnique({
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

// Update form configuration
app.put('/api/form-configurations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, isActive, emailConfig, recipients } = req.body;
    
    // Update form configuration
    const updatedConfig = await prisma.formConfiguration.update({
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
      await prisma.formEmailRecipient.deleteMany({
        where: { formConfigId: id }
      });
      
      // Create new recipients
      await prisma.formEmailRecipient.createMany({
        data: recipients.map(recipient => ({
          ...recipient,
          formConfigId: id
        }))
      });
    }
    
    // Return updated configuration with recipients
    const result = await prisma.formConfiguration.findUnique({
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
    const { formName, displayName, description, isActive, emailConfig, recipients } = req.body;
    
    // Validate required fields
    if (!formName || !displayName || !emailConfig) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if form name already exists
    const existingConfig = await prisma.formConfiguration.findUnique({
      where: { formName }
    });
    
    if (existingConfig) {
      return res.status(400).json({ error: 'Form configuration already exists' });
    }
    
    // Create form configuration
    const newConfig = await prisma.formConfiguration.create({
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
      await prisma.formEmailRecipient.createMany({
        data: recipients.map(recipient => ({
          ...recipient,
          formConfigId: newConfig.id
        }))
      });
    }
    
    // Return created configuration with recipients
    const result = await prisma.formConfiguration.findUnique({
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
    const { id } = req.params;
    
    // Delete recipients first (cascade should handle this, but being explicit)
    await prisma.formEmailRecipient.deleteMany({
      where: { formConfigId: id }
    });
    
    // Delete form configuration
    await prisma.formConfiguration.delete({
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
    const { formName } = req.params;
    const formConfig = await prisma.formConfiguration.findUnique({
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
const server = app.listen(PORT, '0.0.0.0', () => {
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
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    logger.info('Server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});