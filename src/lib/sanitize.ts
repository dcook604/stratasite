import DOMPurify from 'dompurify';

/**
 * Sanitize HTML before rendering it via dangerouslySetInnerHTML.
 *
 * Page/homepage content is stored as HTML from the WYSIWYG editor and injected
 * raw, so it is an XSS sink: pasted markup or a compromised admin account could
 * inject <script>, event handlers, or javascript: URLs. DOMPurify strips
 * anything executable while preserving normal formatting.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
