export type AdminUser = {
  id: string;
  email: string;
};

/**
 * Log in with email + password. On success the server sets an httpOnly session
 * cookie; the returned user object is only for UI display, not for authorization.
 */
export async function validateAdminCredentials(
  email: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error validating admin credentials:', error);
    return null;
  }
}

/**
 * Verify the current session against the server. Returns the admin user if the
 * session cookie is valid, otherwise null. This is the source of truth — the
 * client must not treat localStorage as proof of authentication.
 */
export async function checkAdminSession(): Promise<AdminUser | null> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}

/** Clear the server-side session. */
export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}
