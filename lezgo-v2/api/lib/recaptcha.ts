/**
 * Server-side reCAPTCHA v3 token verification (Security Layer 2).
 *
 * Verifies the token with Google's API and returns the score.
 * When RECAPTCHA_SECRET_KEY is not set, verification is skipped
 * (marcha blanca mode).
 *
 * Score thresholds:
 * - >= 0.7: Likely human (allow)
 * - 0.3 - 0.7: Suspicious (allow but flag)
 * - < 0.3: Likely bot (block)
 */

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const SCORE_THRESHOLD = 0.3;

interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
  error?: string;
}

/**
 * Verify a reCAPTCHA v3 token server-side.
 *
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action name
 * @returns RecaptchaResult with score and success flag
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction: string
): Promise<RecaptchaResult> {
  // If reCAPTCHA is not configured, allow everything (marcha blanca)
  if (!SECRET_KEY) {
    return { success: true, score: 1.0, action: expectedAction };
  }

  // If no token was provided, block
  if (!token) {
    return { success: false, score: 0, action: '', error: 'Missing reCAPTCHA token' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(SECRET_KEY)}&response=${encodeURIComponent(token)}`,
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        score: 0,
        action: data.action || '',
        error: `reCAPTCHA verification failed: ${(data['error-codes'] || []).join(', ')}`,
      };
    }

    // Check action matches
    if (data.action !== expectedAction) {
      return {
        success: false,
        score: data.score || 0,
        action: data.action || '',
        error: `Action mismatch: expected ${expectedAction}, got ${data.action}`,
      };
    }

    // Check score threshold
    const score = data.score || 0;
    if (score < SCORE_THRESHOLD) {
      return {
        success: false,
        score,
        action: data.action,
        error: 'Request blocked: suspected bot activity',
      };
    }

    return {
      success: true,
      score,
      action: data.action,
    };
  } catch (err) {
    // On verification failure, allow (fail open for marcha blanca)
    console.error('reCAPTCHA verification error:', err);
    return { success: true, score: 0.5, action: expectedAction };
  }
}

/**
 * Check if reCAPTCHA is configured on the server.
 */
export function isRecaptchaConfigured(): boolean {
  return !!SECRET_KEY;
}
