// Shared API client helpers.
//
// Admin API calls are authenticated with an httpOnly session cookie that
// expires after 30 minutes. When it expires mid-session the server answers
// 401 and the UI would otherwise surface a raw error, so a lightweight fetch
// interceptor broadcasts a "session expired" event that the auth context
// listens for and turns into a redirect to the login page.

export const SESSION_EXPIRED_EVENT = 'admin-session-expired';

let installed = false;

function isApiRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    // Resolve relative URLs against the current origin.
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return false;
    return parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

function isAuthEndpoint(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    return new URL(url, window.location.origin).pathname.startsWith('/api/auth/');
  } catch {
    return false;
  }
}

/**
 * Installs a one-time fetch wrapper that emits `SESSION_EXPIRED_EVENT` when an
 * authenticated API request is rejected with 401. Login/me/logout calls are
 * excluded so a failed login does not trigger a spurious redirect.
 */
export function installApiFetchInterceptor(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    if (
      response.status === 401 &&
      isApiRequest(input) &&
      !isAuthEndpoint(input)
    ) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    return response;
  };
}
