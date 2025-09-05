/**
 * Security utilities for input validation and sanitization
 */

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Phone number validation (flexible for various formats)
export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
  return phoneRegex.test(cleanPhone);
};

// Unit number validation
export const isValidUnitNumber = (unit: string): boolean => {
  const unitRegex = /^[a-zA-Z0-9\-\s]{1,10}$/;
  return unitRegex.test(unit.trim());
};

// File upload validation
export const isValidImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  return { valid: true };
};

// SQL injection prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/['";\\]/g, '') // Remove potential SQL injection characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .trim();
};

// Rate limiting helpers
export const createRateLimitKey = (ip: string, endpoint: string): string => {
  return `rate_limit:${ip}:${endpoint}`;
};

// Content Security Policy helpers
export const getCSPDirectives = () => {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // For Google Analytics and Turnstile
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://challenges.cloudflare.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://www.google-analytics.com',
      'https://challenges.cloudflare.com',
    ],
    'frame-src': [
      'https://challenges.cloudflare.com',
    ],
  };
};

// Password strength validation
export const validatePasswordStrength = (password: string): { 
  valid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// XSS prevention
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
