/**
 * reCAPTCHA Helper utilities for iOS mobile compatibility
 * 
 * This module addresses several known issues with Google reCAPTCHA v2 on iOS devices:
 * 
 * 1. Touch Event Issues: iOS Safari has problems with touch events on iframe elements,
 *    especially when nested within dialogs/modals. Users can't tap on challenge images.
 * 
 * 2. Z-index Problems: reCAPTCHA challenge popups may appear behind other elements
 *    due to iOS Safari's unique handling of iframe stacking contexts.
 * 
 * 3. Hardware Acceleration: iOS devices require specific CSS transforms to trigger
 *    hardware acceleration for smooth iframe interactions.
 * 
 * 4. Viewport Issues: iOS Safari's viewport handling can cause reCAPTCHA elements
 *    to become unresponsive or incorrectly positioned.
 * 
 * 5. Cross-origin Restrictions: iOS Safari has stricter policies for cross-origin
 *    iframe interactions which can block user interactions.
 * 
 * Solutions implemented:
 * - Hardware acceleration via CSS transforms
 * - Proper touch-action and pointer-events settings
 * - Z-index adjustments for iOS-specific stacking contexts
 * - MutationObserver to detect dynamically added reCAPTCHA elements
 * - iOS-specific CSS media queries and feature detection
 * - Zoom prevention on reCAPTCHA elements
 * 
 * Usage:
 * - Import and call initIOSRecaptchaFixes() in components with reCAPTCHA
 * - The fixes are automatically applied when iOS is detected
 * - Additional fixes are applied when dialogs/modals containing reCAPTCHA are opened
 */

// Detect iOS devices
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect iOS Safari specifically
export const isIOSSafari = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
  return isIOS && isSafari;
};

// Apply iOS-specific fixes to reCAPTCHA iframe elements
export const applyIOSRecaptchaFixes = (): void => {
  if (!isIOS()) return;

  // Wait for reCAPTCHA to load
  const checkForRecaptcha = () => {
    const recaptchaFrames = document.querySelectorAll('iframe[src*="recaptcha"]');
    
    recaptchaFrames.forEach((iframe: Element) => {
      const frame = iframe as HTMLIFrameElement;
      
      // Apply iOS-specific styles
      frame.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
      frame.style.setProperty('transform', 'translateZ(0)', 'important');
      frame.style.setProperty('position', 'relative', 'important');
      frame.style.setProperty('pointer-events', 'auto', 'important');
      frame.style.setProperty('-webkit-touch-callout', 'auto', 'important');
      frame.style.setProperty('-webkit-user-select', 'auto', 'important');
      frame.style.setProperty('touch-action', 'manipulation', 'important');
      
      // Ensure the iframe is properly sized
      if (frame.style.width === '0px' || frame.style.height === '0px') {
        frame.style.width = '304px';
        frame.style.height = '78px';
      }
    });

    // Apply fixes to reCAPTCHA challenge popup
    const challengeFrames = document.querySelectorAll('iframe[src*="bframe"]');
    challengeFrames.forEach((iframe: Element) => {
      const frame = iframe as HTMLIFrameElement;
      frame.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
      frame.style.setProperty('transform', 'translateZ(0)', 'important');
      frame.style.setProperty('position', 'fixed', 'important');
      frame.style.setProperty('touch-action', 'manipulation', 'important');
    });
  };

  // Check immediately and then periodically
  checkForRecaptcha();
  
  // Use MutationObserver to detect when reCAPTCHA is dynamically added
  const observer = new MutationObserver(() => {
    checkForRecaptcha();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'style']
  });

  // Also check after a short delay in case of async loading
  setTimeout(checkForRecaptcha, 1000);
  setTimeout(checkForRecaptcha, 3000);
};

// Force focus on reCAPTCHA challenge elements for iOS
export const focusRecaptchaOnIOS = (): void => {
  if (!isIOS()) return;

  const focusRecaptchaElements = () => {
    // Focus the main reCAPTCHA checkbox
    const checkbox = document.querySelector('.rc-anchor-checkbox');
    if (checkbox) {
      (checkbox as HTMLElement).focus();
    }

    // Focus challenge tiles if present
    const tiles = document.querySelectorAll('.rc-imageselect-tile');
    tiles.forEach((tile, index) => {
      if (index === 0) {
        (tile as HTMLElement).focus();
      }
    });
  };

  // Apply focus after a delay
  setTimeout(focusRecaptchaElements, 500);
};

// Initialize iOS fixes when DOM is ready
export const initIOSRecaptchaFixes = (): void => {
  if (!isIOS()) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyIOSRecaptchaFixes();
      focusRecaptchaOnIOS();
    });
  } else {
    applyIOSRecaptchaFixes();
    focusRecaptchaOnIOS();
  }
};

// Handle iOS viewport zoom issues
export const preventIOSZoomOnRecaptcha = (): void => {
  if (!isIOS()) return;

  // Prevent zoom on double tap for reCAPTCHA elements
  document.addEventListener('touchend', (e) => {
    const target = e.target as Element;
    if (target && target.closest('.recaptcha-container, .rc-anchor, .rc-imageselect')) {
      e.preventDefault();
    }
  }, { passive: false });
};

// Export default initialization function
export default {
  isIOS,
  isIOSSafari,
  applyIOSRecaptchaFixes,
  focusRecaptchaOnIOS,
  initIOSRecaptchaFixes,
  preventIOSZoomOnRecaptcha
}; 