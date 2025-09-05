/**
 * Lazy-loaded components for code splitting
 * This reduces the initial bundle size significantly
 */
import { lazy } from 'react';
import { PageLoading } from '@/components/ui/loading-spinner';

// Heavy admin components - these are large and only needed for admin users
export const AdminDashboard = lazy(() => 
  import('@/pages/AdminDashboard').then(module => ({
    default: module.default
  }))
);

export const AdminLogin = lazy(() => 
  import('@/pages/AdminLogin').then(module => ({
    default: module.default
  }))
);

// PDF-heavy components - pdfjs-dist is very large
export const Bylaws = lazy(() => 
  import('@/pages/Bylaws').then(module => ({
    default: module.default
  }))
);

// Form components - can be loaded on demand
export const ScooterRegistration = lazy(() => 
  import('@/pages/information/ScooterRegistration').then(module => ({
    default: module.default
  }))
);

export const PetRegistration = lazy(() => 
  import('@/pages/information/PetRegistration').then(module => ({
    default: module.default
  }))
);

export const EmergencyContact = lazy(() => 
  import('@/pages/information/EmergencyContact').then(module => ({
    default: module.default
  }))
);

export const ACInquiry = lazy(() => 
  import('@/pages/information/ACInquiry').then(module => ({
    default: module.default
  }))
);

export const StorageRental = lazy(() => 
  import('@/pages/information/StorageRental').then(module => ({
    default: module.default
  }))
);

// Marketplace - rich feature set, can be lazy loaded
export const Marketplace = lazy(() => 
  import('@/pages/Marketplace').then(module => ({
    default: module.default
  }))
);

// Documents page with file handling
export const Documents = lazy(() => 
  import('@/pages/Documents').then(module => ({
    default: module.default
  }))
);

// Welcome package with potentially large content
export const WelcomePackage = lazy(() => 
  import('@/pages/WelcomePackage').then(module => ({
    default: module.default
  }))
);

// Calendar with date picker dependencies
export const Calendar = lazy(() => 
  import('@/pages/Calendar').then(module => ({
    default: module.default
  }))
);

// Loading fallback component
export const LazyLoadingFallback = () => (
  <PageLoading text="Loading..." />
);

// Preload functions for better UX
export const preloadAdminComponents = () => {
  // Preload admin components when user hovers over admin link
  AdminDashboard.preload?.();
  AdminLogin.preload?.();
};

export const preloadFormComponents = () => {
  // Preload form components when user navigates to forms section
  ScooterRegistration.preload?.();
  PetRegistration.preload?.();
  EmergencyContact.preload?.();
  ACInquiry.preload?.();
  StorageRental.preload?.();
};

export const preloadContentComponents = () => {
  // Preload content-heavy components
  Bylaws.preload?.();
  Documents.preload?.();
  WelcomePackage.preload?.();
  Marketplace.preload?.();
};
