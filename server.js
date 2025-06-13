import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3331;

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads', 'marketplace');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.memoryStorage(); // Use memory storage to process with sharp

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
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
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    logger[logLevel](`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

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

// Move request logger to be the first middleware to ensure all requests are logged
app.use(requestLogger);

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

// reCAPTCHA verification function
const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    logger.error('reCAPTCHA secret key is not set in environment variables.');
    // In a real-world scenario, you might want to fail open or closed depending on security needs.
    // For this app, we will fail open in dev but closed in prod.
    return process.env.NODE_ENV !== 'production';
  }

  if (!token) {
    logger.warn('reCAPTCHA token not provided by client.');
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    logger.info('reCAPTCHA verification response', { success: data.success });
    return data.success;
  } catch (error) {
    logger.error('Error verifying reCAPTCHA', error);
    return false;
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
    const { 
      title, 
      description, 
      category, 
      type, 
      price, 
      authorName, 
      authorEmail, 
      authorPhone,
      images,
      recaptchaToken 
    } = req.body;
    
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
    
    // reCAPTCHA verification
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
    }
    
    const post = await prisma.marketplacePost.create({
      data: {
        title,
        description,
        category,
        type,
        price: price ? parseFloat(price) : null,
        authorName,
        authorEmail,
        authorPhone,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        recaptchaToken
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
app.put('/api/marketplace/:id/sold', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.marketplacePost.update({
      where: { id },
      data: { isSold: true }
    });
    res.json(post);
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

app.post('/api/marketplace/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      content, 
      authorName, 
      authorEmail, 
      authorPhone,
      images,
      recaptchaToken 
    } = req.body;
    
    // Basic validation
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
    
    // reCAPTCHA verification
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
    }
    
    const reply = await prisma.marketplaceReply.create({
      data: {
        content,
        authorName,
        authorEmail,
        authorPhone,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        recaptchaToken,
        postId: id
      }
    });
    
    res.json({
      ...reply,
      images: reply.images ? JSON.parse(reply.images) : []
    });
  } catch (error) {
    console.error('Error creating marketplace reply:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
              const filepath = path.join(process.cwd(), 'public', 'uploads', 'marketplace', filename);
              await fs.unlink(filepath);
            } catch (error) {
              console.error('Error deleting image file:', error);
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
        
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'marketplace');
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
                const filename = img.split('/').pop();
                activeImages.add(filename);
              });
            } catch (e) {
              console.error('Error parsing images during cleanup:', e);
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
              console.error('Error deleting orphaned image:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error during orphaned images cleanup:', error);
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

    const imageUrl = `/uploads/marketplace/${filename}`;
    
    logger.info('Image uploaded successfully', { imageUrl });
    res.json({ success: true, imageUrl });

  } catch (error) {
    logger.error('Error processing image upload', error);
    res.status(500).json({ success: false, error: 'Failed to process image.' });
  }
});