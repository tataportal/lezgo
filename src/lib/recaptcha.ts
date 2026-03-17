/**
 * reCAPTCHA v3 integration for bot detection (Security Layer 2).
 *
 * HOW IT WORKS:
 * - reCAPTCHA v3 runs invisibly (no challenge popup)
 * - Returns a score from 0.0 (likely bot) to 1.0 (likely human)
 * - Score is sent to the server with purchase requests
 * - Server verifies the token with Google's API
 *
 * SETUP:
 * 1. Get reCAPTCHA v3 keys from https://www.google.com/recaptcha/admin
 * 2. Set VITE_RECAPTCHA_SITE_KEY in .env
 * 3. Set RECAPTCHA_SECRET_KEY in Vercel env vars (server-side)
 * 4. Add recaptcha script to index.html (done by loadRecaptcha below)
 *
 * MARCHA BLANCA:
 * When VITE_RECAPTCHA_SITE_KEY is not set, all functions return
 * null/true, allowing the system to work without reCAPTCHA.
 */

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

let recaptchaLoaded = false;

/**
 * Load the reCAPTCHA v3 script dynamically.
 * Call this once, e.g. in App.tsx or before first purchase.
 */
export async function loadRecaptcha(): Promise<void> {
  if (!SITE_KEY || recaptchaLoaded) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      recaptchaLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA v3 and get a token for the given action.
 * Returns null if reCAPTCHA is not configured (marcha blanca).
 *
 * @param action - The action name (e.g., 'purchase', 'resale')
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null; // reCAPTCHA not configured

  try {
    await loadRecaptcha();
    const grecaptcha = (window as any).grecaptcha;
    if (!grecaptcha) return null;

    return new Promise((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(SITE_KEY, { action })
          .then((token: string) => resolve(token))
          .catch(() => resolve(null));
      });
    });
  } catch {
    return null; // Gracefully degrade
  }
}

/**
 * Check if reCAPTCHA is configured and available.
 */
export function isRecaptchaEnabled(): boolean {
  return !!SITE_KEY;
}
