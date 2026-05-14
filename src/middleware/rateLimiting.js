/**
 * Rate limiting middleware for API endpoints
 * Prevents abuse and DDoS attacks
 */

import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Form submission rate limiting
export const formSubmissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 form submissions per 5 minutes
  message: {
    error: 'Too many form submissions. Please wait before submitting again.',
    retryAfter: '5 minutes'
  },
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 file uploads per 15 minutes
  message: {
    error: 'Too many file uploads. Please wait before uploading again.',
    retryAfter: '15 minutes'
  },
});

// Admin endpoint rate limiting (more restrictive)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per 15 minutes
  message: {
    error: 'Too many admin requests. Please try again later.',
    retryAfter: '15 minutes'
  },
});

// Email sending rate limiting
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 emails per hour
  message: {
    error: 'Email sending limit reached. Please try again later.',
    retryAfter: '1 hour'
  },
});

// Create custom rate limiter with Redis support (for scaling)
export const createCustomLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      error: 'Rate limit exceeded',
      retryAfter: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Add Redis store for distributed rate limiting (future enhancement)
    // store: new RedisStore({
    //   client: redisClient,
    //   prefix: 'rl:',
    // }),
    ...options
  });
};
