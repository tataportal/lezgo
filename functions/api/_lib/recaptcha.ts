/**
 * Server-side reCAPTCHA v3 token verification (Security Layer 2).
 */

const SCORE_THRESHOLD = 0.3;

interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
  error?: string;
}

export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction: string,
  secretKey?: string
): Promise<RecaptchaResult> {
  // If reCAPTCHA is not configured, allow everything (marcha blanca)
  if (!secretKey) {
    return { success: true, score: 1.0, action: expectedAction };
  }

  if (!token) {
    return { success: false, score: 0, action: '', error: 'Missing reCAPTCHA token' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data: any = await response.json();

    if (!data.success) {
      return {
        success: false,
        score: 0,
        action: data.action || '',
        error: `reCAPTCHA verification failed: ${(data['error-codes'] || []).join(', ')}`,
      };
    }

    if (data.action !== expectedAction) {
      return {
        success: false,
        score: data.score || 0,
        action: data.action || '',
        error: `Action mismatch: expected ${expectedAction}, got ${data.action}`,
      };
    }

    const score = data.score || 0;
    if (score < SCORE_THRESHOLD) {
      return {
        success: false,
        score,
        action: data.action,
        error: 'Request blocked: suspected bot activity',
      };
    }

    return { success: true, score, action: data.action };
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    return { success: true, score: 0.5, action: expectedAction };
  }
}
