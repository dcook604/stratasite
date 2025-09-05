/**
 * Health monitoring system for Spectrum 4 application
 * Monitors database, email, and application health
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { config } from '../config/environment.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Health check status levels
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy'
};

// Individual health checks
export const healthChecks = {
  // Database connectivity check
  database: async () => {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return {
        status: HealthStatus.HEALTHY,
        responseTime,
        message: 'Database connection successful',
        details: {
          responseTimeMs: responseTime,
          connectionPool: 'active'
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'Database connection failed',
        error: error.message,
        details: {
          errorCode: error.code,
          errorType: error.constructor.name
        }
      };
    }
  },

  // SMTP server connectivity check
  smtp: async () => {
    try {
      const transporter = nodemailer.createTransporter({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        },
        tls: {
          rejectUnauthorized: config.smtp.host !== '10.0.0.1' && config.smtp.host !== 'localhost',
          servername: config.smtp.host === 'mail.spectrum4.ca' ? 'mail.spectrum4.ca' : undefined
        }
      });

      const start = Date.now();
      await transporter.verify();
      const responseTime = Date.now() - start;

      return {
        status: HealthStatus.HEALTHY,
        responseTime,
        message: 'SMTP server connection successful',
        details: {
          host: config.smtp.host,
          port: config.smtp.port,
          responseTimeMs: responseTime
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'SMTP server connection failed',
        error: error.message,
        details: {
          host: config.smtp.host,
          port: config.smtp.port,
          errorCode: error.code
        }
      };
    }
  },

  // File system and uploads check
  fileSystem: async () => {
    try {
      const uploadDir = path.join(process.cwd(), config.uploads.uploadDir);
      
      // Check if upload directory exists and is writable
      await fs.promises.access(uploadDir, fs.constants.W_OK);
      
      // Check disk space (simplified)
      const stats = await fs.promises.stat(uploadDir);
      
      return {
        status: HealthStatus.HEALTHY,
        message: 'File system accessible',
        details: {
          uploadDir: config.uploads.uploadDir,
          writable: true,
          lastAccessed: stats.atime
        }
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'File system access failed',
        error: error.message,
        details: {
          uploadDir: config.uploads.uploadDir
        }
      };
    }
  },

  // Memory usage check
  memory: async () => {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const usagePercent = Math.round((usedMB / totalMB) * 100);

    let status = HealthStatus.HEALTHY;
    if (usagePercent > 90) {
      status = HealthStatus.UNHEALTHY;
    } else if (usagePercent > 80) {
      status = HealthStatus.DEGRADED;
    }

    return {
      status,
      message: `Memory usage: ${usagePercent}%`,
      details: {
        totalMB,
        usedMB,
        usagePercent,
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      }
    };
  },

  // Application uptime check
  uptime: async () => {
    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    return {
      status: HealthStatus.HEALTHY,
      message: `Uptime: ${uptimeHours}h ${uptimeMinutes}m`,
      details: {
        uptimeSeconds,
        uptimeHours,
        uptimeMinutes,
        startTime: new Date(Date.now() - uptimeSeconds * 1000)
      }
    };
  },

  // Environment configuration check
  environment: async () => {
    const criticalVars = [
      'DATABASE_URL',
      'SMTP_HOST',
      'SMTP_USER',
      'TURNSTILE_SECRET_KEY'
    ];

    const missing = criticalVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      return {
        status: HealthStatus.DEGRADED,
        message: `Missing environment variables: ${missing.join(', ')}`,
        details: {
          missing,
          nodeEnv: process.env.NODE_ENV,
          isProduction: config.isProduction
        }
      };
    }

    return {
      status: HealthStatus.HEALTHY,
      message: 'Environment configuration complete',
      details: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: config.isProduction,
        configuredVars: criticalVars.length
      }
    };
  }
};

// Run all health checks
export const runHealthChecks = async () => {
  const startTime = Date.now();
  const results = {};
  
  // Run all checks in parallel for better performance
  const checkPromises = Object.entries(healthChecks).map(async ([name, checkFn]) => {
    try {
      const result = await checkFn();
      return [name, result];
    } catch (error) {
      return [name, {
        status: HealthStatus.UNHEALTHY,
        message: `Health check failed: ${error.message}`,
        error: error.message
      }];
    }
  });

  const checkResults = await Promise.all(checkPromises);
  checkResults.forEach(([name, result]) => {
    results[name] = result;
  });

  // Determine overall health status
  const statuses = Object.values(results).map(result => result.status);
  let overallStatus = HealthStatus.HEALTHY;
  
  if (statuses.includes(HealthStatus.UNHEALTHY)) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (statuses.includes(HealthStatus.DEGRADED)) {
    overallStatus = HealthStatus.DEGRADED;
  }

  const totalTime = Date.now() - startTime;

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: totalTime,
    checks: results,
    summary: {
      total: Object.keys(results).length,
      healthy: statuses.filter(s => s === HealthStatus.HEALTHY).length,
      degraded: statuses.filter(s => s === HealthStatus.DEGRADED).length,
      unhealthy: statuses.filter(s => s === HealthStatus.UNHEALTHY).length
    }
  };
};

// Express route handler for health endpoint
export const healthCheckHandler = async (req, res) => {
  try {
    const healthData = await runHealthChecks();
    
    // Set appropriate HTTP status code
    let httpStatus = 200;
    if (healthData.status === HealthStatus.DEGRADED) {
      httpStatus = 503; // Service Unavailable
    } else if (healthData.status === HealthStatus.UNHEALTHY) {
      httpStatus = 503; // Service Unavailable
    }

    res.status(httpStatus).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date().toISOString(),
      error: 'Health check system failed',
      details: error.message
    });
  }
};

// Lightweight readiness check for load balancers
export const readinessCheckHandler = async (req, res) => {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Liveness check for container orchestration
export const livenessCheckHandler = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

// Periodic health monitoring
export const startHealthMonitoring = (intervalMs = 30000) => {
  if (!config.monitoring.enableHealthChecks) {
    console.log('Health monitoring disabled');
    return;
  }

  console.log(`Starting health monitoring every ${intervalMs / 1000} seconds`);
  
  setInterval(async () => {
    try {
      const health = await runHealthChecks();
      
      if (health.status === HealthStatus.UNHEALTHY) {
        console.error('🚨 UNHEALTHY:', health.summary);
        // Here you could send alerts, notifications, etc.
      } else if (health.status === HealthStatus.DEGRADED) {
        console.warn('⚠️ DEGRADED:', health.summary);
      } else {
        console.log('✅ HEALTHY:', health.summary);
      }
    } catch (error) {
      console.error('Health monitoring error:', error);
    }
  }, intervalMs);
};
