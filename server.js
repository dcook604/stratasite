import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3331;

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
app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'dist')));

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
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching marketplace posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/marketplace', async (req, res) => {
  try {
    const { title, description, category, type, price, authorName, authorEmail } = req.body;
    
    // Basic validation
    if (!title || !description || !authorName || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    const post = await prisma.marketplacePost.create({
      data: {
        title,
        description,
        category,
        type,
        price: price ? parseFloat(price) : null,
        authorName,
        authorEmail
      }
    });
    res.json(post);
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
    const { content, authorName, authorEmail } = req.body;
    
    // Basic validation
    if (!content || !authorName || !authorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    const reply = await prisma.marketplaceReply.create({
      data: {
        content,
        authorName,
        authorEmail,
        postId: id
      }
    });
    res.json(reply);
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