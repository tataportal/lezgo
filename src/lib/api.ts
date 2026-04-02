import { auth } from '../firebase';
import { getDeviceFingerprint } from './fingerprint';

const API_BASE = '/api';

/**
 * Authenticated fetch wrapper for API routes.
 * Automatically attaches:
 * - Firebase ID token as Bearer token
 * - Device fingerprint for anti-abuse detection (Layer 4)
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get auth token and fingerprint in parallel
  const [idToken, fingerprint] = await Promise.all([
    user.getIdToken(),
    getDeviceFingerprint().catch(() => 'unknown'),
  ]);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${path}`, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        'X-Device-Fingerprint': fingerprint,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      throw new Error('Local API unavailable. Run npm run cf:dev to enable Cloudflare Functions in localhost.');
    }
    throw error;
  }

  if (!res.ok) {
    if (
      res.status === 404 &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      throw new Error('Local API unavailable. Run npm run cf:dev to enable Cloudflare Functions in localhost.');
    }
    let errorMessage = `API error: ${res.status}`;
    try {
      const data = await res.json();
      errorMessage = data.error || errorMessage;
    } catch { /* non-JSON response (e.g. 502 HTML page) */ }
    throw new Error(errorMessage);
  }

  return (await res.json()) as T;
}
