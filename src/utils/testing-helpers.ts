/**
 * Testing utilities and helpers for the Spectrum 4 application
 * These can be used for manual testing and future automated tests
 */

// Mock data generators for testing
export const generateMockScooterRegistration = (overrides = {}) => ({
  id: `test-${Date.now()}`,
  registrationId: `SR-${Date.now()}`,
  unitNumber: '1001',
  ownerNames: 'John Doe',
  email: 'john.doe@test.com',
  phone: '604-555-0123',
  numberOfScooters: 1,
  description: 'Red electric scooter',
  registrationDate: new Date().toISOString().split('T')[0],
  status: 'PENDING',
  emailSent: false,
  keyNumber: null,
  depositPaid: false,
  depositAmount: 50.0,
  notes: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const generateMockPetRegistration = (overrides = {}) => ({
  id: `test-${Date.now()}`,
  registrationId: `PR-${Date.now()}`,
  unitNumber: '1001',
  ownerName: 'Jane Smith',
  ownerEmail: 'jane.smith@test.com',
  ownerPhone: '604-555-0456',
  petName: 'Fluffy',
  petType: 'Cat',
  petBreed: 'Persian',
  petAge: '3',
  petWeight: '4.5',
  petColor: 'White',
  emergencyContact: 'John Smith - 604-555-0789',
  veterinarianName: 'Dr. Wilson',
  veterinarianPhone: '604-555-0321',
  petPhotoUrl: null,
  status: 'PENDING',
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const generateMockMarketplacePost = (overrides = {}) => ({
  id: `test-${Date.now()}`,
  title: 'Test Item for Sale',
  description: 'This is a test marketplace item.',
  price: 25.50,
  authorName: 'Test User',
  authorEmail: 'test@example.com',
  authorPhone: '604-555-0000',
  images: [],
  isSold: false,
  createdAt: new Date().toISOString(),
  replies: [],
  ...overrides
});

// API testing helpers
export const apiTestHelpers = {
  // Test if API endpoint is responsive
  async testEndpoint(endpoint: string, method = 'GET', body?: any) {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => null)
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Test admin authentication
  async testAdminAuth(email = 'admin@spectrum4.ca', password = 'admin123') {
    return this.testEndpoint('admin/login', 'POST', { email, password });
  },

  // Test form submissions
  async testScooterRegistration() {
    const mockData = generateMockScooterRegistration();
    return this.testEndpoint('scooter-registration', 'POST', mockData);
  },

  async testPetRegistration() {
    const mockData = generateMockPetRegistration();
    return this.testEndpoint('pet-registration', 'POST', mockData);
  },

  // Test marketplace functionality
  async testMarketplacePost() {
    const mockData = generateMockMarketplacePost();
    return this.testEndpoint('marketplace/posts', 'POST', mockData);
  }
};

// UI testing helpers
export const uiTestHelpers = {
  // Test form validation
  testFormValidation: (formElement: HTMLFormElement) => {
    const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
    const errors: string[] = [];
    
    inputs.forEach((input) => {
      const element = input as HTMLInputElement;
      if (!element.value.trim()) {
        errors.push(`Required field "${element.name || element.id}" is empty`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Test accessibility
  testAccessibility: () => {
    const issues: string[] = [];
    
    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt) {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });
    
    // Check for missing labels on form inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement;
      const hasLabel = element.labels && element.labels.length > 0;
      const hasAriaLabel = element.getAttribute('aria-label');
      const hasAriaLabelledBy = element.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push(`Form input ${index + 1} missing accessible label`);
      }
    });
    
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (index === 0 && level !== 1) {
        issues.push('Page should start with h1');
      }
      if (level > previousLevel + 1) {
        issues.push(`Heading level jumps from h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });
    
    return {
      accessible: issues.length === 0,
      issues
    };
  },

  // Test responsive design
  testResponsive: () => {
    const breakpoints = [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'large', width: 1440 }
    ];
    
    const results = breakpoints.map(({ name, width }) => {
      // This would need to be run in a browser environment with proper viewport control
      return {
        breakpoint: name,
        width,
        // Mock results - in real testing, you'd check layout integrity
        layoutIntact: true,
        navigationWorking: true,
        contentReadable: true
      };
    });
    
    return results;
  }
};

// Performance testing helpers
export const performanceTestHelpers = {
  // Measure component render time
  measureRenderTime: (componentName: string, renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    console.log(`${componentName} render time: ${endTime - startTime}ms`);
    return endTime - startTime;
  },

  // Test image loading performance
  testImageLoading: async (imageUrl: string) => {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        resolve({
          success: true,
          loadTime,
          size: { width: img.width, height: img.height }
        });
      };
      img.onerror = () => {
        resolve({
          success: false,
          loadTime: performance.now() - startTime,
          error: 'Failed to load image'
        });
      };
      img.src = imageUrl;
    });
  },

  // Test bundle size impact
  measureBundleSize: () => {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const resourceEntries = performance.getEntriesByType('resource');
      const jsFiles = resourceEntries.filter(entry => 
        entry.name.includes('.js') && !entry.name.includes('analytics')
      );
      
      const totalSize = jsFiles.reduce((acc, entry) => 
        acc + (entry as any).transferSize || 0, 0
      );
      
      return {
        jsFiles: jsFiles.length,
        totalSize: totalSize,
        formattedSize: `${(totalSize / 1024).toFixed(2)} KB`
      };
    }
    
    return { error: 'Performance API not available' };
  }
};

// Console helpers for manual testing
export const testingSuite = {
  api: apiTestHelpers,
  ui: uiTestHelpers,
  performance: performanceTestHelpers,
  mock: {
    scooterRegistration: generateMockScooterRegistration,
    petRegistration: generateMockPetRegistration,
    marketplacePost: generateMockMarketplacePost
  },
  
  // Run all basic tests
  async runBasicTests() {
    console.log('🧪 Running basic test suite...');
    
    // Test API endpoints
    const apiTests = await Promise.allSettled([
      this.api.testEndpoint('health'),
      this.api.testEndpoint('scooter-registrations'),
      this.api.testEndpoint('pet-registrations'),
      this.api.testEndpoint('marketplace/posts')
    ]);
    
    console.log('📡 API Tests:', apiTests);
    
    // Test UI accessibility
    const accessibilityResults = this.ui.testAccessibility();
    console.log('♿ Accessibility Test:', accessibilityResults);
    
    // Test performance
    const bundleSize = this.performance.measureBundleSize();
    console.log('⚡ Bundle Size:', bundleSize);
    
    return {
      api: apiTests,
      accessibility: accessibilityResults,
      performance: bundleSize
    };
  }
};

// Make available globally for manual testing
if (typeof window !== 'undefined') {
  (window as any).spectrumTests = testingSuite;
}
