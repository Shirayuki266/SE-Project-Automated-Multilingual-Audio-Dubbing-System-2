/**
 * Privacy-friendly, client-side browser fingerprinting algorithm.
 * Generates a stable device/browser signature to track unique daily visits
 * and eliminate duplicate spam clicks without storing sensitive personal data.
 */

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getBrowserFingerprint(): Promise<string> {
  try {
    const components: string[] = [];

    // Screen characteristics
    components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
    components.push(`${window.devicePixelRatio || 1}`);

    // Navigator attributes
    components.push(navigator.userAgent || 'unknown-ua');
    components.push(navigator.language || 'vi');
    components.push(`${navigator.hardwareConcurrency || 2}`);
    components.push(`${(navigator as any).deviceMemory || 4}`);

    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh');

    // Canvas fingerprinting (draw unique geometry and text)
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('VN Quốc Tự ☸️ 2026', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('VN Quốc Tự ☸️ 2026', 4, 17);
        components.push(canvas.toDataURL());
      }
    } catch {
      components.push('no-canvas');
    }

    // WebGL fingerprinting
    try {
      const glCanvas = document.createElement('canvas');
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          components.push(`${vendor}__${renderer}`);
        }
      }
    } catch {
      components.push('no-webgl');
    }

    const rawString = components.join('|||');
    return await sha256(rawString);
  } catch (e) {
    // Fallback: generate and cache a UUID in localStorage
    const fallbackKey = 'vnqt_visitor_fallback_fp';
    let stored = localStorage.getItem(fallbackKey);
    if (!stored) {
      stored = 'fp_fb_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(fallbackKey, stored);
    }
    return stored;
  }
}
