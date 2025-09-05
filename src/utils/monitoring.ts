/**
 * Frontend monitoring and performance utilities
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  domContentLoaded: number;
  userAgent: string;
  timestamp: string;
  route: string;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
}

class MonitoringService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || '/api';
  }

  // Performance monitoring
  reportPageLoad(route: string) {
    if (typeof window === 'undefined') return;

    // Wait for load event
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: this.getFirstContentfulPaint(),
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        route
      };

      this.sendMetrics(metrics);
    });
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private async sendMetrics(metrics: PerformanceMetrics) {
    try {
      // Only send metrics in production and if performance is poor
      if (process.env.NODE_ENV === 'production' && metrics.pageLoadTime > 3000) {
        await fetch(`${this.apiUrl}/monitoring/performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics)
        });
      }
    } catch (error) {
      console.debug('Failed to send performance metrics:', error);
    }
  }

  // Error monitoring
  reportError(error: Error, context?: any) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context
    };

    this.sendErrorReport(errorReport);
  }

  private async sendErrorReport(report: ErrorReport) {
    try {
      await fetch(`${this.apiUrl}/monitoring/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.debug('Failed to send error report:', error);
    }
  }

  // User action tracking
  trackUserAction(action: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('User action:', action, data);
    }

    // Send to analytics in production
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        custom_parameter: data,
        page_path: window.location.pathname
      });
    }
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, context?: any) {
    this.trackUserAction('feature_used', { feature, ...context });
  }

  // Form submission tracking
  trackFormSubmission(formType: string, success: boolean, errors?: string[]) {
    this.trackUserAction('form_submission', {
      form_type: formType,
      success,
      errors: errors?.join(', ')
    });
  }
}

// Global error handler
export const setupGlobalErrorHandling = () => {
  const monitor = new MonitoringService();

  window.addEventListener('error', (event) => {
    monitor.reportError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    monitor.reportError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
  });
};

export const monitoring = new MonitoringService();

// React hook for component-level monitoring
export const useMonitoring = () => {
  return {
    trackPageLoad: monitoring.reportPageLoad.bind(monitoring),
    trackError: monitoring.reportError.bind(monitoring),
    trackAction: monitoring.trackUserAction.bind(monitoring),
    trackFeature: monitoring.trackFeatureUsage.bind(monitoring),
    trackForm: monitoring.trackFormSubmission.bind(monitoring),
  };
};
