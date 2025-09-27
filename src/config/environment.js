/**
 * Environment configuration management
 * Centralized configuration with validation
 */

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NODE_ENV'
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Development environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Server configuration
export const server = {
  port: parseInt(process.env.PORT) || 3331,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Database configuration
export const database = {
  url: process.env.DATABASE_URL,
  // Add connection pooling settings
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
};

// SMTP configuration (fully environment-based)
export const smtp = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  secure: process.env.SMTP_SECURE === 'true' || false,
};

// Security configuration
export const security = {
  jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-change-in-production',
  sessionSecret: process.env.ADMIN_SESSION_SECRET || 'your-session-secret',
  turnstile: {
    siteKey: process.env.VITE_TURNSTILE_SITE_KEY,
    secretKey: process.env.TURNSTILE_SECRET_KEY,
  },
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8080'],
};

// File upload configuration
export const uploads = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Rate limiting configuration
export const rateLimiting = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  authMaxAttempts: parseInt(process.env.AUTH_MAX_ATTEMPTS) || 5,
  formSubmissionMax: parseInt(process.env.FORM_SUBMISSION_MAX) || 3,
};

// Application URLs
export const urls = {
  app: process.env.VITE_APP_URL || 'http://localhost:8080',
  api: process.env.VITE_API_URL || 'http://localhost:3331',
  frontend: process.env.FRONTEND_URL || 'http://localhost:8080',
};

// Analytics configuration
export const analytics = {
  googleAnalyticsId: process.env.VITE_GA_ID,
  enableAnalytics: isProduction && process.env.VITE_GA_ID,
};

// Feature flags
export const features = {
  enableMonitoring: process.env.ENABLE_MONITORING !== 'false',
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  enableFileUploads: process.env.ENABLE_FILE_UPLOADS !== 'false',
  enableMarketplace: process.env.ENABLE_MARKETPLACE !== 'false',
  enableRegistrations: process.env.ENABLE_REGISTRATIONS !== 'false',
};

// Logging configuration
export const logging = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  logDir: process.env.LOG_DIR || 'logs',
};

// Cache configuration
export const cache = {
  enableRedis: process.env.ENABLE_REDIS === 'true',
  redisUrl: process.env.REDIS_URL,
  defaultTtl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
};

// Monitoring configuration
export const monitoring = {
  enableSentry: process.env.ENABLE_SENTRY === 'true',
  sentryDsn: process.env.SENTRY_DSN,
  enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
};

// Export environment validation function
export const validateConfig = () => {
  try {
    validateEnvironment();
    
    // Additional validations
    if (isProduction) {
      if (security.jwtSecret === 'your-fallback-secret-change-in-production') {
        console.warn('WARNING: Using default JWT secret in production!');
      }
      
      if (!smtp.host || !smtp.user || !smtp.pass) {
        console.warn('WARNING: SMTP configuration incomplete in production!');
      }
      
      if (!security.turnstile.siteKey || !security.turnstile.secretKey) {
        console.warn('WARNING: Turnstile CAPTCHA not configured in production!');
      }
    }
    
    console.log('✅ Environment configuration validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error.message);
    return false;
  }
};

// Export all configuration
export const config = {
  server,
  database,
  smtp,
  security,
  uploads,
  rateLimiting,
  urls,
  analytics,
  features,
  logging,
  cache,
  monitoring,
  isDevelopment,
  isProduction,
  isTest,
};

export default config;
