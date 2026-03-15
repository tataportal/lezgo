/**
 * Lightweight device fingerprinting for anti-abuse detection.
 *
 * Generates a hash based on browser characteristics that stay stable
 * across sessions. This is NOT a unique device identifier (like FingerprintJS Pro),
 * but provides enough signal to detect multi-account abuse.
 *
 * UPGRADE PATH: Replace with @fingerprintjs/fingerprintjs-pro for
 * production-grade identification with 99.5% accuracy.
 *
 * Current signals:
 * - User agent
 * - Screen resolution + color depth
 * - Timezone offset
 * - Language preferences
 * - Platform
 * - Hardware concurrency
 * - Device memory (if available)
 * - Canvas fingerprint (optional)
 */

let cachedFingerprint: string | null = null;

async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Browser & platform
  components.push(navigator.userAgent);
  components.push(navigator.platform);
  components.push(navigator.language);
  components.push(navigator.languages?.join(',') || '');

  // Hardware
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String((navigator as any).deviceMemory || 0));

  // Screen
  components.push(`${screen.width}x${screen.height}`);
  components.push(String(screen.colorDepth));
  components.push(String(screen.pixelDepth));

  // Timezone
  components.push(String(new Date().getTimezoneOffset()));
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');

  // Canvas fingerprint (fast, no visible element)
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('lezgo-fp-v1', 2, 15);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    // Canvas may be blocked; that's fine
  }

  // WebGL renderer (if available)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
    }
  } catch {
    // WebGL may be blocked; that's fine
  }

  // Hash the components using SubtleCrypto
  const raw = components.join('|||');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the device fingerprint (cached after first call).
 * Returns a SHA-256 hex string.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  cachedFingerprint = await generateFingerprint();
  return cachedFingerprint;
}
