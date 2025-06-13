/**
 * Frontend logging utility for structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    
    if (data) {
      console[level === 'debug' ? 'log' : level](prefix, message, data);
    } else {
      console[level === 'debug' ? 'log' : level](prefix, message);
    }
  }

  debug(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      this.formatMessage('debug', message, data);
    }
  }

  info(message: string, data?: LogData): void {
    this.formatMessage('info', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.formatMessage('warn', message, data);
  }

  error(message: string, error?: Error | any, data?: LogData): void {
    this.formatMessage('error', message, { error: error?.message || error, ...data });
    if (error?.stack && this.isDevelopment) {
      console.error('Stack trace:', error.stack);
    }
  }

  // API request logging
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data ? { body: data } : undefined);
  }

  apiResponse(method: string, url: string, status: number, duration?: number): void {
    const logLevel = status >= 400 ? 'error' : 'debug';
    this[logLevel](`API Response: ${method} ${url} - ${status}${duration ? ` (${duration}ms)` : ''}`);
  }

  apiError(method: string, url: string, error: Error): void {
    this.error(`API Error: ${method} ${url}`, error);
  }

  // Page navigation logging
  pageView(path: string, data?: LogData): void {
    this.info(`Page view: ${path}`, data);
  }

  // User action logging
  userAction(action: string, data?: LogData): void {
    this.debug(`User action: ${action}`, data);
  }
}

export const logger = new Logger(); 