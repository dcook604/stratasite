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
 * 6. Modal Context Issues: When reCAPTCHA is inside modals/dialogs, additional
 *    fixes are needed to prevent freezing and ensure proper touch handling.
 * 
 * Solutions implemented:
 * - Hardware acceleration via CSS transforms
 * - Proper touch-action and pointer-events settings
 * - Z-index adjustments for iOS-specific stacking contexts
 * - MutationObserver to detect dynamically added reCAPTCHA elements
 * - iOS-specific CSS media queries and feature detection
 * - Zoom prevention on reCAPTCHA elements
 * - Modal-specific overflow and positioning fixes
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
    // Main reCAPTCHA widget fixes
    const recaptchaFrames = document.querySelectorAll('iframe[src*="recaptcha"]');
    
    recaptchaFrames.forEach((iframe: Element) => {
      const frame = iframe as HTMLIFrameElement;
      
      // Apply iOS-specific styles with higher specificity
      frame.style.setProperty('-webkit-transform', 'translate3d(0,0,0)', 'important');
      frame.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
      frame.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');
      frame.style.setProperty('backface-visibility', 'hidden', 'important');
      frame.style.setProperty('position', 'relative', 'important');
      frame.style.setProperty('pointer-events', 'auto', 'important');
      frame.style.setProperty('-webkit-touch-callout', 'auto', 'important');
      frame.style.setProperty('-webkit-user-select', 'auto', 'important');
      frame.style.setProperty('touch-action', 'manipulation', 'important');
      frame.style.setProperty('isolation', 'isolate', 'important');
      frame.style.setProperty('will-change', 'transform', 'important');
      
      // Ensure proper sizing
      if (frame.style.width === '0px' || frame.style.height === '0px') {
        frame.style.width = '304px';
        frame.style.height = '78px';
      }

      // Add container fixes for modal context
      const container = frame.closest('.recaptcha-container, .ios-recaptcha-wrapper');
      if (container) {
        const containerEl = container as HTMLElement;
        containerEl.style.setProperty('-webkit-transform', 'translate3d(0,0,0)', 'important');
        containerEl.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
        containerEl.style.setProperty('overflow', 'visible', 'important');
        containerEl.style.setProperty('position', 'relative', 'important');
        containerEl.style.setProperty('z-index', '1', 'important');
        containerEl.style.setProperty('touch-action', 'manipulation', 'important');
      }

      // Fix parent modal/dialog if present
      const modal = frame.closest('[role="dialog"], .dialog-content, [data-state="open"]');
      if (modal) {
        const modalEl = modal as HTMLElement;
        modalEl.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        modalEl.style.setProperty('touch-action', 'manipulation', 'important');
        
        // Ensure modal doesn't interfere with reCAPTCHA
        const modalOverlay = document.querySelector('.dialog-overlay, [data-radix-dialog-overlay]');
        if (modalOverlay) {
          (modalOverlay as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
          setTimeout(() => {
            (modalOverlay as HTMLElement).style.setProperty('pointer-events', 'auto', 'important');
          }, 100);
        }
      }
    });

    // Apply fixes to reCAPTCHA challenge popup
    const challengeFrames = document.querySelectorAll('iframe[src*="bframe"]');
    challengeFrames.forEach((iframe: Element) => {
      const frame = iframe as HTMLIFrameElement;
      frame.style.setProperty('-webkit-transform', 'translate3d(0,0,0)', 'important');
      frame.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
      frame.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');
      frame.style.setProperty('backface-visibility', 'hidden', 'important');
      frame.style.setProperty('position', 'fixed', 'important');
      frame.style.setProperty('touch-action', 'manipulation', 'important');
      frame.style.setProperty('z-index', '999999', 'important');
      frame.style.setProperty('isolation', 'isolate', 'important');
      frame.style.setProperty('will-change', 'transform', 'important');
    });

    // Fix reCAPTCHA containers
    const recaptchaContainers = document.querySelectorAll('.g-recaptcha, .recaptcha-container');
    recaptchaContainers.forEach((container: Element) => {
      const containerEl = container as HTMLElement;
      containerEl.style.setProperty('touch-action', 'manipulation', 'important');
      containerEl.style.setProperty('overflow', 'visible', 'important');
      containerEl.style.setProperty('-webkit-transform', 'translate3d(0,0,0)', 'important');
      containerEl.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
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
    attributeFilter: ['src', 'style', 'class']
  });

  // Multiple delayed checks to catch all async loading scenarios
  setTimeout(checkForRecaptcha, 100);
  setTimeout(checkForRecaptcha, 500);
  setTimeout(checkForRecaptcha, 1000);
  setTimeout(checkForRecaptcha, 2000);
  setTimeout(checkForRecaptcha, 3000);
};

// Force focus on reCAPTCHA challenge elements for iOS
export const focusRecaptchaOnIOS = (): void => {
  if (!isIOS()) return;

  const focusRecaptchaElements = () => {
    // Focus the main reCAPTCHA checkbox
    const checkbox = document.querySelector('.rc-anchor-checkbox, .recaptcha-checkbox');
    if (checkbox) {
      try {
        (checkbox as HTMLElement).focus({ preventScroll: true });
        (checkbox as HTMLElement).click();
      } catch (e) {
        console.log('reCAPTCHA focus attempt failed:', e);
      }
    }

    // Focus challenge tiles if present
    const tiles = document.querySelectorAll('.rc-imageselect-tile, .rc-imageselect-dynamic-selected');
    tiles.forEach((tile, index) => {
      if (index === 0) {
        try {
          (tile as HTMLElement).focus({ preventScroll: true });
        } catch (e) {
          console.log('reCAPTCHA tile focus attempt failed:', e);
        }
      }
    });
  };

  // Apply focus after delays to ensure elements are ready
  setTimeout(focusRecaptchaElements, 300);
  setTimeout(focusRecaptchaElements, 1000);
};

// Enhanced modal handling for iOS
export const fixModalInteractionOnIOS = (): void => {
  if (!isIOS()) return;

  // Prevent modal backdrop from interfering with reCAPTCHA
  const handleModalClick = (e: Event) => {
    const target = e.target as Element;
    if (target && target.closest('.g-recaptcha, .recaptcha-container, iframe[src*="recaptcha"]')) {
      e.stopPropagation();
    }
  };

  // Add event listeners to prevent modal interference
  document.addEventListener('click', handleModalClick, { capture: true, passive: false });
  document.addEventListener('touchstart', handleModalClick, { capture: true, passive: false });
  document.addEventListener('touchend', handleModalClick, { capture: true, passive: false });
};

// Initialize iOS fixes when DOM is ready
export const initIOSRecaptchaFixes = (): void => {
  if (!isIOS()) return;

  const initFixes = () => {
    applyIOSRecaptchaFixes();
    focusRecaptchaOnIOS();
    fixModalInteractionOnIOS();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFixes);
  } else {
    initFixes();
  }

  // Also initialize on window load for additional safety
  window.addEventListener('load', () => {
    setTimeout(initFixes, 500);
  });
};

// Handle iOS viewport zoom issues
export const preventIOSZoomOnRecaptcha = (): void => {
  if (!isIOS()) return;

  // Prevent zoom on double tap for reCAPTCHA elements
  document.addEventListener('touchend', (e) => {
    const target = e.target as Element;
    if (target && target.closest('.recaptcha-container, .rc-anchor, .rc-imageselect, .g-recaptcha, iframe[src*="recaptcha"]')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent zoom on focus for input elements within reCAPTCHA
  document.addEventListener('focusin', (e) => {
    const target = e.target as Element;
    if (target && target.closest('.recaptcha-container, .g-recaptcha')) {
      // Add meta viewport tag temporarily to prevent zoom
      const existingViewport = document.querySelector('meta[name="viewport"]');
      if (existingViewport) {
        const originalContent = existingViewport.getAttribute('content');
        existingViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        
        // Restore after a delay
        setTimeout(() => {
          if (originalContent) {
            existingViewport.setAttribute('content', originalContent);
          }
        }, 2000);
      }
    }
  });
};

// Export default initialization function
export default {
  isIOS,
  isIOSSafari,
  applyIOSRecaptchaFixes,
  focusRecaptchaOnIOS,
  fixModalInteractionOnIOS,
  initIOSRecaptchaFixes,
  preventIOSZoomOnRecaptcha
};

/**
 * Applies specific fixes for reCAPTCHA when used inside a Radix UI Dialog on iOS.
 * This should be called from within the Dialog's onOpenChange handler.
 * It adds a class to the body when the dialog is open to apply targeted CSS fixes,
 * preventing the need for unreliable setTimeout calls.
 * @param {boolean} open - The current open state of the dialog.
 */
export const handleRadixDialogOnIOS = (open: boolean): void => {
  if (!isIOS()) return;

  if (open) {
    document.body.classList.add('recaptcha-dialog-open');
    // Re-apply fixes in case the iframe was slow to load
    setTimeout(applyIOSRecaptchaFixes, 100);
    setTimeout(applyIOSRecaptchaFixes, 300);
  } else {
    document.body.classList.remove('recaptcha-dialog-open');
  }
}; 